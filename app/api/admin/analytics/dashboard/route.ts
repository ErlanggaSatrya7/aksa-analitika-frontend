import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Fungsi bantuan untuk mengubah "JAWA BARAT" menjadi "Jawa Barat" (Sesuai format Map Echarts)
const formatStateName = (state: string) => {
    const specialCases: Record<string, string> = {
        "DKI JAKARTA": "DKI Jakarta", "DI YOGYAKARTA": "DI Yogyakarta",
        "NAD ACEH": "NAD Aceh", "NTB": "NTB", "NTT": "NTT"
    };
    if (specialCases[state]) return specialCases[state];
    return state.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

export async function GET() {
    try {
        // 1. Tarik semua data penjualan beserta relasi lokasi tokonya
        const allSales = await prisma.sales_data.findMany({
            select: {
                unitsSold: true,
                totalSales: true,
                operatingMargin: true,
                salesMethod: true,
                product: true,
                retailer: {
                    select: { name: true, state: true }
                }
            }
        });

        // Jika database masih kosong, kirim data default agar UI tidak error
        if (allSales.length === 0) {
            return NextResponse.json({
                summary: { totalUnits: 0, avgMargin: 0, totalSales: 0 },
                mapDistribution: [], trendLine: { labels: ['Jan'], values: [0] },
                salesMethod: [], topProducts: [], retailerShare: [], topProvinces: []
            }, { status: 200 });
        }

        // 2. Agregasi Summary Atas
        let totalUnits = 0; let totalSales = 0; let totalMargin = 0;
        const stateMap = new Map<string, number>();
        const methodMap = new Map<string, number>();
        const productMap = new Map<string, number>();
        const brandMap = new Map<string, number>();

        allSales.forEach(sale => {
            totalUnits += sale.unitsSold;
            totalSales += sale.totalSales;
            totalMargin += sale.operatingMargin;

            // Group by Wilayah (Untuk Map)
            if (sale.retailer?.state) {
                const formattedState = formatStateName(sale.retailer.state);
                stateMap.set(formattedState, (stateMap.get(formattedState) || 0) + sale.unitsSold);
            }

            // Group by Jalur Penjualan (Sales Method)
            methodMap.set(sale.salesMethod, (methodMap.get(sale.salesMethod) || 0) + sale.unitsSold);

            // Group by Product
            productMap.set(sale.product, (productMap.get(sale.product) || 0) + sale.unitsSold);

            // Group by Brand Retailer (Hapus nama kota di belakangnya)
            if (sale.retailer?.name) {
                const brand = sale.retailer.name.split(' - ')[0]; // Mengambil "MATAHARI" dari "MATAHARI - BANDUNG"
                brandMap.set(brand, (brandMap.get(brand) || 0) + sale.unitsSold);
            }
        });

        // 3. Format Data untuk Echarts Frontend
        const mapDistribution = Array.from(stateMap, ([name, value]) => ({ name, value }));

        const topProvinces = mapDistribution
            .sort((a, b) => b.value - a.value)
            .slice(0, 7)
            .map(p => ({
                name: p.name,
                val: p.value,
                pct: `${((p.value / totalUnits) * 100).toFixed(1)}%`
            }));

        const salesMethod = Array.from(methodMap, ([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const topProducts = Array.from(productMap, ([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value).slice(0, 5);

        const retailerShare = Array.from(brandMap, ([name, value]) => ({ name, value }));

        return NextResponse.json({
            summary: {
                totalUnits,
                totalSales,
                avgMargin: totalMargin / allSales.length // Rata-rata margin
            },
            mapDistribution,
            topProvinces,
            salesMethod,
            topProducts,
            retailerShare,
            // (Mocking TrendLine karena data kamu belum punya urutan bulan penuh, ini contoh data statis bulanan)
            trendLine: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei'],
                values: [1200, 1500, 1300, 2100, 2800]
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: "Gagal memuat analitik." }, { status: 500 });
    }
}