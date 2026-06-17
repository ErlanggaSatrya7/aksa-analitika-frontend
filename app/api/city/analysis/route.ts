import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const city = searchParams.get('city');
        const storeFilter = searchParams.get('store');

        if (!city) return NextResponse.json({ error: "Parameter kota wajib diisi" }, { status: 400 });

        // Query Toko di Kota Tersebut
        let retailerQuery: any = { city: city };
        if (storeFilter && storeFilter !== 'Semua Toko') {
            retailerQuery.name = storeFilter;
        }

        const retailers = await prisma.retailers.findMany({
            where: retailerQuery,
            include: { sales_data: true }
        });

        // Dapatkan list semua toko untuk dropdown
        // const allStoresInCity = await prisma.retailers.findMany({ where: { city: city }, select: { name: true } });
        const allStoresInCity = await prisma.retailers.findMany({ select: { name: true } });
        const availableStores = ['Semua Toko', ...allStoresInCity.map(s => s.name)];

        let totalRevenue = 0;
        let totalProfit = 0;
        let totalMarginSum = 0;
        let totalUnits = 0;
        let salesCount = 0;

        // Grouping data berdasarkan Produk
        const productStats: Record<string, { units: number, revenue: number, profit: number }> = {};

        retailers.forEach(retailer => {
            retailer.sales_data.forEach(sale => {
                totalRevenue += sale.totalSales;
                totalProfit += sale.operatingProfit;
                totalUnits += sale.unitsSold;
                totalMarginSum += sale.operatingMargin;
                salesCount++;

                if (!productStats[sale.product]) {
                    productStats[sale.product] = { units: 0, revenue: 0, profit: 0 };
                }
                productStats[sale.product].units += sale.unitsSold;
                productStats[sale.product].revenue += sale.totalSales;
                productStats[sale.product].profit += sale.operatingProfit;
            });
        });

        // Rata-rata margin
        let finalMargin = salesCount > 0 ? (totalMarginSum / salesCount) : 0;
        if (finalMargin < 1) finalMargin = finalMargin * 100;

        // Susun data untuk Pie Chart (Volume Produk)
        const pieChart = Object.keys(productStats).map(product => ({
            name: product,
            value: productStats[product].units
        })).sort((a, b) => b.value - a.value).slice(0, 5); // Ambil Top 5

        // Susun data untuk Bar Chart (Revenue vs Profit per Produk)
        const categories = Object.keys(productStats).slice(0, 5);
        const revenueData = categories.map(c => productStats[c].revenue);
        const profitData = categories.map(c => productStats[c].profit);

        return NextResponse.json({
            kpi: { revenue: totalRevenue, margin: finalMargin, units: totalUnits },
            pieChart: pieChart,
            barChart: { categories, revenue: revenueData, profit: profitData },
            availableStores
        }, { status: 200 });

    } catch (error) {
        console.error("Analysis API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}