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

        const allSales = await prisma.sales_data.findMany({
            select: {
                unitsSold: true,
                product: true,
                retailer: { select: { state: true, name: true } }
            }
        });

        let totalVolume = 0;
        const stateMap = new Map<string, number>();
        const brandMap = new Map<string, number>();
        const productMap = new Map<string, number>();

        const availableProvinces = Array.from(new Set(allSales.map(s => s.retailer?.state ? formatStateName(s.retailer.state) : '')));

        allSales.forEach(sale => {
            if (!sale.retailer?.state) return;
            const stateName = formatStateName(sale.retailer.state);

            if (provinceFilter !== 'Nasional' && stateName.toUpperCase() !== provinceFilter.toUpperCase()) return;

            totalVolume += Number(sale.unitsSold || 0);

            if (provinceFilter === 'Nasional') {
                stateMap.set(stateName, (stateMap.get(stateName) || 0) + Number(sale.unitsSold || 0));
            }

            // Gunakan NAMA ASLI DARI DATABASE
            const finalBrandName = sale.retailer.name || 'Lainnya';

            brandMap.set(finalBrandName, (brandMap.get(finalBrandName) || 0) + Number(sale.unitsSold || 0));
            productMap.set(sale.product, (productMap.get(sale.product) || 0) + Number(sale.unitsSold || 0));
        });

        const provinceDistribution = Array.from(stateMap, ([name, value]) => ({ name, value }));
        const topRetailers = Array.from(brandMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
        const topProducts = Array.from(productMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

        return NextResponse.json({
            totalVolume,
            availableProvinces: availableProvinces.filter(p => p !== ''),
            provinceDistribution,
            topRetailers,
            topProducts
        }, { status: 200 });

    } catch (error) {
        console.error("Map Analytics API Error:", error);
        return NextResponse.json({ error: "Gagal memuat analitik peta." }, { status: 500 });
    }
}