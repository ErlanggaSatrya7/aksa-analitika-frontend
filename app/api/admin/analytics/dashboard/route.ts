import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // ============================================================================
        // TAHAP 1: AGREGASI DI LEVEL DATABASE
        // ============================================================================

        const [
            summaryAgg,
            stateAgg,
            productAgg,
            methodAgg,
            rawRetailerShare
        ] = await Promise.all([
            prisma.sales_data.aggregate({
                _sum: { unitsSold: true, totalSales: true },
                _avg: { operatingMargin: true }
            }),
            prisma.sales_data.groupBy({
                by: ['state'],
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } }
            }),
            prisma.sales_data.groupBy({
                by: ['product'],
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } },
                take: 5
            }),
            prisma.sales_data.groupBy({
                by: ['salesMethod'],
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } }
            }),
            prisma.sales_data.groupBy({
                by: ['retailerId'],
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } }
            })
        ]);

        // ============================================================================
        // TAHAP 2: GROUPING RETAILER (MENGGABUNGKAN CABANG & ID JADI 6 BRAND UTAMA)
        // ============================================================================

        const retailerIds = rawRetailerShare.map(r => r.retailerId);
        const retailersMaster = await prisma.retailers.findMany({
            where: { id: { in: retailerIds } },
            select: { id: true, name: true }
        });

        const consolidatedMap = new Map<string, number>();

        rawRetailerShare.forEach(item => {
            const detail = retailersMaster.find(r => r.id === item.retailerId);

            // Ambil data mentah (bisa berupa "MATAHARI - BALI" atau "1000002")
            const rawName = (detail?.name || item.retailerId).toUpperCase();

            let finalName = "Lainnya";

            // LOGIKA FILTERING KETAT: Apapun cabangnya, kumpulkan ke Brand Utamanya
            if (rawName.includes("ADIDAS") || rawName.includes("1000001")) {
                finalName = "ADIDAS OFFICIAL STORE";
            } else if (rawName.includes("MATAHARI") || rawName.includes("1000002")) {
                finalName = "MATAHARI";
            } else if (rawName.includes("PLANET SPORTS") || rawName.includes("PLANETSPORT") || rawName.includes("1000003")) {
                finalName = "PLANET SPORTS";
            } else if (rawName.includes("RAMAYANA") || rawName.includes("1000004")) {
                finalName = "RAMAYANA";
            } else if (rawName.includes("SPORTS STATION") || rawName.includes("SPORTSTATION") || rawName.includes("1000005")) {
                finalName = "SPORTS STATION";
            } else if (rawName.includes("TRANSMART") || rawName.includes("1000006")) {
                finalName = "TRANSMART";
            } else {
                finalName = rawName; // Fallback untuk berjaga-jaga
            }

            // Jumlahkan total unit terjualnya
            const currentTotal = consolidatedMap.get(finalName) || 0;
            consolidatedMap.set(finalName, currentTotal + Number(item._sum.unitsSold || 0));
        });

        // Hasil akhir pasti akan mengelompok rapi maksimal 6-7 item
        const retailerShare = Array.from(consolidatedMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // ============================================================================
        // TAHAP 3: TREND BULANAN (PAKSA TAMPIL 12 BULAN Penuh)
        // ============================================================================

        const datesData = await prisma.sales_data.findMany({
            select: { invoiceDate: true, unitsSold: true }
        });

        const trendMap = new Map<string, number>();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

        datesData.forEach(row => {
            if (row.invoiceDate) {
                const date = new Date(row.invoiceDate);
                const monthKey = monthNames[date.getMonth()];
                trendMap.set(monthKey, (trendMap.get(monthKey) || 0) + row.unitsSold);
            }
        });

        // Pastikan array selalu berisi 12 bulan berurutan
        const labels = monthNames;
        const values = monthNames.map(month => trendMap.get(month) || 0);

        // ============================================================================
        // TAHAP 4: FORMATTING DATA UNTUK ECHARTS FRONTEND
        // ============================================================================

        const maxStateValue = stateAgg.length > 0 ? Number(stateAgg[0]._sum.unitsSold || 1) : 1;

        const mapDistribution = stateAgg.map(s => ({
            name: s.state,
            value: Number(s._sum.unitsSold || 0)
        }));

        const topProvinces = stateAgg.slice(0, 7).map(s => {
            const val = Number(s._sum.unitsSold || 0);
            return {
                name: s.state,
                val: val,
                pct: `${Math.min(100, Math.round((val / maxStateValue) * 100))}%`
            };
        });

        return NextResponse.json({
            summary: {
                totalUnits: Number(summaryAgg._sum.unitsSold || 0),
                totalSales: Number(summaryAgg._sum.totalSales || 0),
                avgMargin: Number(summaryAgg._avg.operatingMargin || 0) * 100
            },
            mapDistribution,
            topProvinces,
            trendLine: { labels, values },
            salesMethod: methodAgg.map(m => ({ name: m.salesMethod, value: Number(m._sum.unitsSold || 0) })),
            topProducts: productAgg.map(p => ({ name: p.product, value: Number(p._sum.unitsSold || 0) })),
            retailerShare
        }, { status: 200 });

    } catch (error) {
        console.error("Dashboard Analytics API Error:", error);
        return NextResponse.json({ error: "Gagal memuat analitik" }, { status: 500 });
    }
}