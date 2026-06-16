import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // 1. TANGKAP PARAMETER DARI URL (Untuk Dinamisasi Filter Wilayah)
        const { searchParams } = new URL(request.url);
        const stateParam = searchParams.get('state') || 'Nasional';

        // 2. BUAT KONDISI FILTER BERDASARKAN PROVINSI
        // Jika login sebagai Admin Provinsi, data yang ditarik HANYA milik provinsi tersebut.
        const whereClause: any = {};
        if (stateParam.toUpperCase() !== 'NASIONAL') {
            whereClause.state = {
                equals: stateParam,
                mode: 'insensitive' // Memastikan pencarian tetap aman walaupun huruf besar/kecil beda
            };
        }

        // 3. TARIK DATA DARI DATABASE MENGGUNAKAN KONDISI WHERE
        const [
            summaryAgg,
            stateAgg,
            productAgg,
            methodAgg,
            rawRetailerShare
        ] = await Promise.all([
            prisma.sales_data.aggregate({
                where: whereClause,
                _sum: { unitsSold: true, totalSales: true },
                _avg: { operatingMargin: true }
            }),
            prisma.sales_data.groupBy({
                by: ['state'],
                where: whereClause,
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } }
            }),
            prisma.sales_data.groupBy({
                by: ['product'],
                where: whereClause,
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } },
                take: 6 // Tampilkan top 6 agar UI proporsional
            }),
            prisma.sales_data.groupBy({
                by: ['salesMethod'],
                where: whereClause,
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } }
            }) as any,
            prisma.sales_data.groupBy({
                by: ['retailerId'],
                where: whereClause,
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } }
            })
        ]);

        // 4. PERBAIKAN FATAL PEMETAAN RETAILER (Diselaraskan dengan Backend Python)
        const retailerIds = rawRetailerShare.map(r => r.retailerId);
        const retailersMaster = await prisma.retailers.findMany({
            where: { id: { in: retailerIds } },
            select: { id: true, name: true }
        });

        const consolidatedMap = new Map<string, number>();

        // Peta ID ini SEKARANG SAMA PERSIS dengan RETAILER_MAP di Python MLOps Anda
        const retailerMap: Record<string, string> = {
            "1000001": "RAMAYANA",
            "1000002": "ADIDAS OFFICIAL STORE",
            "1000003": "SPORTS STATION",
            "1000004": "PLANET SPORTS",
            "1000005": "TRANSMART",
            "1000006": "MATAHARI"
        };

        rawRetailerShare.forEach(item => {
            const rawId = item.retailerId.split('_')[0];
            const detail = retailersMaster.find(r => r.id === rawId);
            const finalBrandName = retailerMap[rawId] || detail?.name || `Mitra Retailer ${rawId}`;

            const currentTotal = consolidatedMap.get(finalBrandName) || 0;
            consolidatedMap.set(finalBrandName, currentTotal + Number(item._sum.unitsSold || 0));
        });

        const retailerShare = Array.from(consolidatedMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // 5. TREN BULANAN BERDASARKAN WILAYAH
        const dateRange = await prisma.sales_data.aggregate({
            where: whereClause,
            _min: { invoiceDate: true },
            _max: { invoiceDate: true }
        });

        const datesData = await prisma.sales_data.groupBy({
            by: ['invoiceDate'],
            where: whereClause,
            _sum: { unitsSold: true }
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
                        trendMap.set(monthKey, trendMap.get(monthKey)! + Number(row._sum.unitsSold || 0));
                    }
                }
            });

            labels.forEach(label => {
                values.push(trendMap.get(label) || 0);
            });
        }

        // Peta Distribusi Wilayah
        const mapDistribution = stateAgg.map(s => ({
            name: s.state,
            value: Number(s._sum.unitsSold || 0)
        }));

        // OUTPUT JSON YANG DIKIRIM KE DASHBOARD UI
        return NextResponse.json({
            summary: {
                totalUnits: Number(summaryAgg._sum.unitsSold || 0),
                totalSales: Number(summaryAgg._sum.totalSales || 0),
                avgMargin: Number(summaryAgg._avg.operatingMargin || 0) * 100
            },
            mapDistribution,
            trendLine: { labels, values },
            salesMethod: methodAgg.map((m: any) => ({
                name: m.salesMethod || "Unknown",
                value: Number(m._sum.unitsSold || 0)
            })),
            topProducts: productAgg.map((p: any) => ({
                name: p.product || "Unknown",
                value: Number(p._sum.unitsSold || 0)
            })),
            retailerShare
        }, { status: 200 });

    } catch (error) {
        console.error("Dashboard Analytics API Error:", error);
        return NextResponse.json({ error: "Gagal memuat analitik" }, { status: 500 });
    }
}