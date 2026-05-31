import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const retailerId = searchParams.get('retailerId');

        if (!retailerId) {
            return NextResponse.json({ error: "Parameter retailerId wajib diisi" }, { status: 400 });
        }

        // 1. QUERY DATABASE (Termasuk menarik data logistik terakhir)
        const store = await prisma.retailers.findUnique({
            where: { id: retailerId },
            include: {
                sales_data: true,
                logistic_requests: {
                    orderBy: { createdAt: 'desc' },
                    take: 1 // Hanya ambil 1 pengajuan logistik paling baru
                }
            }
        });

        // Ekstrak data logistik terakhir (jika ada)
        const latestLogistic = store?.logistic_requests && store.logistic_requests.length > 0
            ? store.logistic_requests[0]
            : null;

        if (!store || !store.sales_data || store.sales_data.length === 0) {
            return NextResponse.json({
                kpi: { revenue: 0, targetPct: 0, marginPct: 0 },
                chartData: { categories: [], revenue: [], profit: [] },
                topCategories: [],
                logisticStatus: latestLogistic // Kirim status logistik meskipun belum ada sales
            }, { status: 200 });
        }

        // 2. PROSES KALKULASI DATA SALES
        let totalRevenue = 0;
        let totalProfit = 0;
        let marginSum = 0;

        const categoryStats: Record<string, { revenue: number, profit: number, units: number }> = {};

        store.sales_data.forEach(sale => {
            totalRevenue += sale.totalSales;
            totalProfit += sale.operatingProfit;
            marginSum += sale.operatingMargin;

            if (!categoryStats[sale.product]) {
                categoryStats[sale.product] = { revenue: 0, profit: 0, units: 0 };
            }
            categoryStats[sale.product].revenue += sale.totalSales;
            categoryStats[sale.product].profit += sale.operatingProfit;
            categoryStats[sale.product].units += sale.unitsSold;
        });

        let marginPct = store.sales_data.length > 0 ? (marginSum / store.sales_data.length) : 0;
        if (marginPct < 1) marginPct = marginPct * 100;

        const calculatedTargetPct = totalRevenue > 0 ? (totalRevenue / (totalRevenue * 1.2)) * 100 : 0;

        const sortedCategories = Object.keys(categoryStats).map(cat => ({
            name: cat,
            ...categoryStats[cat]
        })).sort((a, b) => b.revenue - a.revenue);

        const top5 = sortedCategories.slice(0, 5);
        const chartCategories = top5.map(c => c.name);
        const chartRevenue = top5.map(c => c.revenue);
        const chartProfit = top5.map(c => c.profit);

        const colors = ["bg-[#312E81]", "bg-[#4338CA]", "bg-[#4f46e5]", "bg-[#6A7BFA]", "bg-[#818CF8]"];
        const maxRev = top5.length > 0 ? top5[0].revenue : 1;

        const formatRupiah = (val: number) => {
            if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(2)} Miliar`;
            if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(0)} Juta`;
            return `Rp ${val.toLocaleString('id-ID')}`;
        };

        const topCategoriesFormat = top5.map((c, index) => ({
            name: c.name,
            revenue: formatRupiah(c.revenue),
            color: colors[index % colors.length],
            pct: `${Math.round((c.revenue / maxRev) * 100)}%`
        }));

        // 3. FORMAT RESPON FINAL
        return NextResponse.json({
            kpi: { revenue: totalRevenue, targetPct: calculatedTargetPct, marginPct: marginPct },
            chartData: { categories: chartCategories, revenue: chartRevenue, profit: chartProfit },
            topCategories: topCategoriesFormat,
            logisticStatus: latestLogistic // <--- Sisipkan data logistik di sini
        }, { status: 200 });

    } catch (error) {
        console.error("Store API Error:", error);
        return NextResponse.json({ error: "Gagal memuat data dari database" }, { status: 500 });
    }
}