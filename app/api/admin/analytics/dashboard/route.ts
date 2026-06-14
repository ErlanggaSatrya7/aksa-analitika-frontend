import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [
            summaryAgg,
            stateAgg,
            productAgg,
            methodAgg, // Prisma otomatis mengenali ini sebagai array
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
            // TAMBAHKAN 'as any' ATAU 'as unknown as ...' JIKA TS MASIH KOMPLAIN
            prisma.sales_data.groupBy({
                by: ['salesMethod'],
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } }
            }) as any,
            prisma.sales_data.groupBy({
                by: ['retailerId'],
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } }
            })
        ]);

        const retailerIds = rawRetailerShare.map(r => r.retailerId);
        const retailersMaster = await prisma.retailers.findMany({
            where: { id: { in: retailerIds } },
            select: { id: true, name: true }
        });

        const consolidatedMap = new Map<string, number>();

        // Tambahkan Kamus ini di dalam fungsi GET sebelum melakukan forEach
        const retailerMap: Record<string, string> = {
            "1000001": "Adidas Official Store",
            "1000002": "Matahari",
            "1000003": "Planet Sports",
            "1000004": "Ramayana",
            "1000005": "Sports Station",
            "1000006": "Transmart"
        };

        rawRetailerShare.forEach(item => {
            // 1. Ambil ID mentah (jika ada format "1000001_BANTEN_...")
            const rawId = item.retailerId.split('_')[0];

            // 2. Tentukan nama: Cek di Kamus > Cek DB > Default ke ID
            const detail = retailersMaster.find(r => r.id === rawId);
            const finalBrandName = retailerMap[rawId] || detail?.name || `Retailer ${rawId}`;

            // 3. Masukkan ke map
            const currentTotal = consolidatedMap.get(finalBrandName) || 0;
            consolidatedMap.set(finalBrandName, currentTotal + Number(item._sum.unitsSold || 0));
        });


        const retailerShare = Array.from(consolidatedMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const dateRange = await prisma.sales_data.aggregate({
            _min: { invoiceDate: true },
            _max: { invoiceDate: true }
        });

        const datesData = await prisma.sales_data.findMany({
            select: { invoiceDate: true, unitsSold: true }
        });

        const labels: string[] = [];
        const values: number[] = [];
        const trendMap = new Map<string, number>();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

        if (dateRange._min.invoiceDate && dateRange._max.invoiceDate) {
            let currentDate = new Date(dateRange._min.invoiceDate);
            currentDate.setDate(1);

            const endDate = new Date(dateRange._max.invoiceDate);
            endDate.setDate(1);

            while (currentDate <= endDate) {
                const monthKey = `${monthNames[currentDate.getMonth()]} '${currentDate.getFullYear().toString().slice(-2)}`;
                labels.push(monthKey);
                trendMap.set(monthKey, 0);
                currentDate.setMonth(currentDate.getMonth() + 1);
            }

            datesData.forEach(row => {
                if (row.invoiceDate) {
                    const date = new Date(row.invoiceDate);
                    const monthKey = `${monthNames[date.getMonth()]} '${date.getFullYear().toString().slice(-2)}`;
                    if (trendMap.has(monthKey)) {
                        trendMap.set(monthKey, trendMap.get(monthKey)! + Number(row.unitsSold || 0));
                    }
                }
            });

            labels.forEach(label => {
                values.push(trendMap.get(label) || 0);
            });
        }

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
            // salesMethod: methodAgg.map(m => ({ name: m.salesMethod, value: Number(m._sum.unitsSold || 0) })),
            salesMethod: methodAgg.map((m: any) => ({
                name: m.salesMethod,
                value: Number(m._sum.unitsSold || 0)
            })),
            topProducts: productAgg.map(p => ({ name: p.product, value: Number(p._sum.unitsSold || 0) })),
            retailerShare
        }, { status: 200 });

    } catch (error) {
        console.error("Dashboard Analytics API Error:", error);
        return NextResponse.json({ error: "Gagal memuat analitik" }, { status: 500 });
    }
}