import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const formatStateName = (state: string) => {
    const specialCases: Record<string, string> = {
        "DKI JAKARTA": "DKI Jakarta", "DI YOGYAKARTA": "DI Yogyakarta",
        "NAD ACEH": "NAD Aceh", "NTB": "NTB", "NTT": "NTT"
    };
    if (specialCases[state]) return specialCases[state];
    return state.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const provinceFilter = searchParams.get('province') || 'Nasional';

        // 1. Ambil Data Penjualan Terkait
        const allSales = await prisma.sales_data.findMany({
            select: {
                unitsSold: true,
                product: true,
                retailer: { select: { state: true, city: true, name: true } }
            }
        });

        let totalVolume = 0;
        const stateMap = new Map<string, number>();
        const cityMap = new Map<string, number>();
        const brandMap = new Map<string, number>();
        const productMap = new Map<string, number>();

        // Daftar Provinsi Unik yang ada di DB
        const availableProvinces = Array.from(new Set(allSales.map(s => s.retailer?.state ? formatStateName(s.retailer.state) : '')));

        allSales.forEach(sale => {
            if (!sale.retailer?.state) return;
            const stateName = formatStateName(sale.retailer.state);

            // Filter Logic (Apakah Nasional atau Provinsi Tertentu?)
            if (provinceFilter !== 'Nasional' && stateName.toUpperCase() !== provinceFilter.toUpperCase()) return;

            totalVolume += sale.unitsSold;

            // Agregasi Map Wilayah
            stateMap.set(stateName, (stateMap.get(stateName) || 0) + sale.unitsSold);

            // Agregasi Kota (Top 5)
            if (sale.retailer.city) {
                cityMap.set(sale.retailer.city, (cityMap.get(sale.retailer.city) || 0) + sale.unitsSold);
            }

            // =========================================================
            // PERBAIKAN: Agregasi Retailer Brand (Konversi ID ke Nama)
            // =========================================================
            const rawName = (sale.retailer.name || '').toUpperCase();
            let finalBrandName = "Lainnya";

            if (rawName.includes("ADIDAS") || rawName.includes("1000001")) {
                finalBrandName = "ADIDAS OFFICIAL STORE";
            } else if (rawName.includes("MATAHARI") || rawName.includes("1000002")) {
                finalBrandName = "MATAHARI";
            } else if (rawName.includes("PLANET SPORTS") || rawName.includes("PLANETSPORT") || rawName.includes("1000003")) {
                finalBrandName = "PLANET SPORTS";
            } else if (rawName.includes("RAMAYANA") || rawName.includes("1000004")) {
                finalBrandName = "RAMAYANA";
            } else if (rawName.includes("SPORTS STATION") || rawName.includes("SPORTSTATION") || rawName.includes("1000005")) {
                finalBrandName = "SPORTS STATION";
            } else if (rawName.includes("TRANSMART") || rawName.includes("1000006")) {
                finalBrandName = "TRANSMART";
            } else {
                finalBrandName = rawName.split(' - ')[0] || rawName; // Fallback
            }

            brandMap.set(finalBrandName, (brandMap.get(finalBrandName) || 0) + sale.unitsSold);

            // Agregasi Produk
            productMap.set(sale.product, (productMap.get(sale.product) || 0) + sale.unitsSold);
        });

        // 2. Formatting Hasil (Semua dipotong menjadi Top 5 agar seragam)
        const provinceDistribution = Array.from(stateMap, ([name, value]) => ({ name, value }));
        const topCities = Array.from(cityMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
        const topRetailers = Array.from(brandMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
        const topProducts = Array.from(productMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

        return NextResponse.json({
            totalVolume,
            trend: 12.5, // Mock tren karena butuh data time-series
            availableProvinces: availableProvinces.filter(p => p !== ''),
            provinceDistribution,
            topCities,
            topRetailers,
            topProducts
        }, { status: 200 });

    } catch (error) {
        console.error("Map Analytics API Error:", error);
        return NextResponse.json({ error: "Gagal memuat analitik peta." }, { status: 500 });
    }
}