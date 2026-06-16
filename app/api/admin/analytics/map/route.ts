import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mencegah Next.js melakukan caching statis pada API ini
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const formatStateName = (state: string) => {
    if (!state) return '';
    const specialCases: Record<string, string> = {
        "DKI JAKARTA": "DKI Jakarta", "DI YOGYAKARTA": "DI Yogyakarta",
        "NAD ACEH": "NAD Aceh", "NTB": "NTB", "NTT": "NTT"
    };
    const upper = state.toUpperCase();
    if (specialCases[upper]) return specialCases[upper];
    return state.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const provinceFilter = searchParams.get('province') || 'Nasional';

        // 1. DYNAMIC WHERE CLAUSE
        const whereClause: any = {};
        if (provinceFilter.toUpperCase() !== 'NASIONAL') {
            whereClause.state = {
                equals: provinceFilter,
                mode: 'insensitive' // Mengamankan jika ada perbedaan huruf kapital
            };
        }

        // 2. PARALLEL AGGREGATION MENGGUNAKAN POSTGRESQL (Sangat Cepat & Hemat RAM)
        const [
            summaryAgg,
            productAgg,
            rawRetailerShare,
            availableStateAgg
        ] = await Promise.all([
            // Hitung Total Volume
            prisma.sales_data.aggregate({
                where: whereClause,
                _sum: { unitsSold: true }
            }),
            // Top Produk
            prisma.sales_data.groupBy({
                by: ['product'],
                where: whereClause,
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } },
                take: 6
            }),
            // Top Retailer
            prisma.sales_data.groupBy({
                by: ['retailerId'],
                where: whereClause,
                _sum: { unitsSold: true },
                orderBy: { _sum: { unitsSold: 'desc' } }
            }),
            // Ambil List Semua Provinsi yang Tersedia (tanpa filter where)
            prisma.sales_data.groupBy({
                by: ['state']
            })
        ]);

        const totalVolume = Number(summaryAgg._sum.unitsSold || 0);

        // 3. PETA DISTRIBUSI PROVINSI
        let provinceDistribution: any[] = [];
        if (provinceFilter.toUpperCase() === 'NASIONAL') {
            const stateAgg = await prisma.sales_data.groupBy({
                by: ['state'],
                _sum: { unitsSold: true }
            });
            provinceDistribution = stateAgg
                .filter(s => s.state && s.state !== '-')
                .map(s => ({
                    name: formatStateName(s.state),
                    value: Number(s._sum.unitsSold || 0)
                }));
        } else {
            provinceDistribution = [{
                name: formatStateName(provinceFilter),
                value: totalVolume
            }];
        }

        // 4. PEMETAAN RETAILER YANG BENAR (Sinkron dengan MLOps)
        const retailerIds = rawRetailerShare.map(r => r.retailerId);
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

        rawRetailerShare.forEach(item => {
            const rawId = item.retailerId.split('_')[0];
            const detail = retailersMaster.find(r => r.id === rawId);
            const finalBrandName = retailerMap[rawId] || detail?.name || `Mitra Retailer ${rawId}`;

            const currentTotal = consolidatedMap.get(finalBrandName) || 0;
            consolidatedMap.set(finalBrandName, currentTotal + Number(item._sum.unitsSold || 0));
        });

        const topRetailers = Array.from(consolidatedMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        const topProducts = productAgg.map(p => ({
            name: p.product,
            value: Number(p._sum.unitsSold || 0)
        }));

        const availableProvinces = availableStateAgg
            .map(s => s.state)
            .filter(s => s && s !== '-')
            .map(s => formatStateName(s));

        // 5. RESPONSE DENGAN PENGHANCUR CACHE (Agar Chatbot AI selalu dapat data terbaru)
        return NextResponse.json({
            totalVolume,
            availableProvinces: Array.from(new Set(availableProvinces)),
            provinceDistribution,
            topRetailers,
            topProducts
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });

    } catch (error) {
        console.error("Map Analytics API Error:", error);
        return NextResponse.json({ error: "Gagal memuat analitik peta." }, { status: 500 });
    }
}