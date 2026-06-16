import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mencegah cache agresif dari Next.js agar data regional selalu real-time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const stateParam = searchParams.get('state') || '';

        if (!stateParam) {
            return NextResponse.json({ error: "Parameter state (provinsi) wajib diisi." }, { status: 400 });
        }

        // 1. FILTER LANGSUNG DI TABEL SALES_DATA (KOLOM 'STATE')
        // Ini adalah perbaikan utama dari error Prisma sebelumnya
        const whereClause: any = {
            state: {
                equals: stateParam,
                mode: 'insensitive' // Case-insensitive agar "DKI JAKARTA" dan "DKI Jakarta" tetap terbaca
            }
        };

        // 2. PARALLEL AGGREGATION MENGGUNAKAN POSTGRESQL
        // Jauh lebih ringan di RAM server dibandingkan menggunakan findMany()
        const [
            summaryAgg,
            productAgg,
            methodAgg,
            rawRetailerShare,
            datesData
        ] = await Promise.all([
            prisma.sales_data.aggregate({
                where: whereClause,
                _sum: { unitsSold: true, totalSales: true },
                _avg: { operatingMargin: true }
            }),
            prisma.sales_data.groupBy({
                by: ['product'],
                where: whereClause,
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } },
                take: 6
            }),
            prisma.sales_data.groupBy({
                by: ['salesMethod'],
                where: whereClause,
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } }
            }),
            prisma.sales_data.groupBy({
                by: ['retailerId'],
                where: whereClause,
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } }
            }),
            prisma.sales_data.groupBy({
                by: ['invoiceDate'],
                where: whereClause,
                _sum: { unitsSold: true },
                orderBy: { invoiceDate: 'asc' }
            })
        ]);

        // 3. PEMETAAN RETAILER YANG BENAR (Sinkron dengan MLOps)
        const retailerIds = rawRetailerShare.map((r: any) => r.retailerId);
        const retailersMaster = await prisma.retailers.findMany({
            where: { id: { in: retailerIds } },
            select: { id: true, name: true }
        });

        const consolidatedMap = new Map<string, number>();
        const retailerMap: Record<string, string> = {
            "1000001": "RAMAYANA",
            "1000002": "ADIDAS OFFICIAL STORE",
            "1000003": "SPORTS STATION",
            "1000004": "PLANET SPORTS",
            "1000005": "TRANSMART",
            "1000006": "MATAHARI"
        };

        rawRetailerShare.forEach((item: any) => {
            const rawId = item.retailerId.split('_')[0];
            const detail = retailersMaster.find(r => r.id === rawId);
            const finalBrandName = retailerMap[rawId] || detail?.name || `Mitra Retailer ${rawId}`;

            const currentTotal = consolidatedMap.get(finalBrandName) || 0;
            consolidatedMap.set(finalBrandName, currentTotal + Number(item._sum.unitsSold || 0));
        });

        const retailerShare = Array.from(consolidatedMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // 4. MAPPING TREN WAKTU BULANAN
        const labels: string[] = [];
        const values: number[] = [];
        const trendMap = new Map<string, number>();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

        datesData.forEach((row: any) => {
            if (row.invoiceDate) {
                const date = new Date(row.invoiceDate);
                const monthKey = `${monthNames[date.getMonth()]} '${date.getFullYear().toString().slice(-2)}`;

                if (!labels.includes(monthKey)) labels.push(monthKey);

                trendMap.set(monthKey, (trendMap.get(monthKey) || 0) + Number(row._sum.unitsSold || 0));
            }
        });

        labels.forEach(label => {
            values.push(trendMap.get(label) || 0);
        });

        // 5. MENGIRIM RESPONSE KE FRONTEND
        return NextResponse.json({
            summary: {
                totalUnits: Number(summaryAgg._sum.unitsSold || 0),
                totalSales: Number(summaryAgg._sum.totalSales || 0),
                avgMargin: Number(summaryAgg._avg.operatingMargin || 0) * 100
            },
            mapDistribution: [
                { name: stateParam.toUpperCase(), value: Number(summaryAgg._sum.unitsSold || 0) }
            ],
            trendLine: { labels, values },
            salesMethod: (methodAgg as any[]).map(m => ({
                name: m.salesMethod || "Unknown",
                value: Number(m._sum.unitsSold || 0)
            })),
            topProducts: productAgg.map((p: any) => ({
                name: p.product || "Unknown",
                value: Number(p._sum.unitsSold || 0)
            })),
            retailerShare
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });

    } catch (error) {
        console.error("Regional Dashboard API Error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan internal saat memuat data." }, { status: 500 });
    }
}