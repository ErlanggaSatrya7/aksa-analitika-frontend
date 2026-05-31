import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const stateFilter = searchParams.get('state') || '';

        if (!stateFilter) {
            return NextResponse.json({ error: "State parameter is required" }, { status: 400 });
        }

        // Ambil data penjualan yang HANYA untuk Provinsi yang diminta
        const regionSales = await prisma.sales_data.findMany({
            where: {
                retailer: { state: stateFilter }
            },
            select: {
                unitsSold: true,
                totalSales: true,
                operatingMargin: true,
                salesMethod: true,
                product: true,
                retailer: {
                    select: { name: true, city: true }
                }
            }
        });

        // 🔥 PERBAIKAN: Jika data kosong, TETAP kirimkan nama provinsinya dengan value 0 agar peta muncul!
        if (regionSales.length === 0) {
            return NextResponse.json({
                summary: { totalUnits: 0, avgMargin: 0, totalSales: 0 },
                mapDistribution: [{ name: stateFilter.toUpperCase(), value: 0 }],
                salesMethod: [], topProducts: [], retailerShare: [],
                cities: [], cityProducts: {},
                trendLine: { labels: ['Jan', 'Feb', 'Mar'], values: [0, 0, 0] }
            }, { status: 200 });
        }

        // Agregasi Data
        let totalUnits = 0; let totalSales = 0; let totalMargin = 0;
        const methodMap = new Map<string, number>();
        const productMap = new Map<string, number>();
        const brandMap = new Map<string, number>();
        const cityMap = new Set<string>();

        // Objek untuk menampung top product per Kota
        const cityProductsMap: Record<string, Map<string, number>> = {};

        regionSales.forEach(sale => {
            totalUnits += sale.unitsSold;
            totalSales += sale.totalSales;
            totalMargin += sale.operatingMargin;

            methodMap.set(sale.salesMethod, (methodMap.get(sale.salesMethod) || 0) + sale.unitsSold);
            productMap.set(sale.product, (productMap.get(sale.product) || 0) + sale.unitsSold);

            if (sale.retailer?.name) {
                const brand = sale.retailer.name.split(' - ')[0];
                brandMap.set(brand, (brandMap.get(brand) || 0) + sale.unitsSold);
            }

            if (sale.retailer?.city) {
                const city = sale.retailer.city;
                cityMap.add(city);

                if (!cityProductsMap[city]) cityProductsMap[city] = new Map();
                cityProductsMap[city].set(sale.product, (cityProductsMap[city].get(sale.product) || 0) + sale.unitsSold);
            }
        });

        const salesMethod = Array.from(methodMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        const topProducts = Array.from(productMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7);
        const retailerShare = Array.from(brandMap, ([name, value]) => ({ name, value }));

        // Format City Products Map
        const formattedCityProducts: Record<string, { name: string, value: number }[]> = {};
        for (const [city, prodMap] of Object.entries(cityProductsMap)) {
            formattedCityProducts[city] = Array.from(prodMap, ([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value).slice(0, 7);
        }

        return NextResponse.json({
            summary: {
                totalUnits,
                totalSales,
                avgMargin: totalMargin / regionSales.length
            },
            mapDistribution: [{ name: stateFilter.toUpperCase(), value: totalUnits }],
            salesMethod,
            topProducts,
            retailerShare,
            cities: Array.from(cityMap),
            cityProducts: formattedCityProducts,
            trendLine: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei'], values: [120, 145, 130, 175, 190] }
        }, { status: 200 });

    } catch (error) {
        console.error("Regional Dashboard API Error:", error);
        return NextResponse.json({ error: "Gagal memuat analitik." }, { status: 500 });
    }
}