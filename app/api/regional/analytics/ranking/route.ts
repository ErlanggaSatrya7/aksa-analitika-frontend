import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const state = searchParams.get('state');
        const product = searchParams.get('product');

        if (!state) return NextResponse.json({ error: "State diperlukan" }, { status: 400 });

        // Filter berdasarkan provinsi dengan toleransi huruf kapital (Case-Insensitive)
        const whereClause: any = {
            state: { equals: state, mode: 'insensitive' }
        };

        if (product && product !== 'Semua Kategori') {
            whereClause.product = product;
        }

        // Jalankan Query Agregasi secara paralel agar cepat
        const [retailerAgg, availableProductsAgg] = await Promise.all([
            prisma.sales_data.groupBy({
                by: ['retailerId'],
                where: whereClause,
                _sum: { unitsSold: true }
            }),
            prisma.sales_data.groupBy({
                by: ['product'],
                where: { state: { equals: state, mode: 'insensitive' } }
            })
        ]);

        // Ambil nama asli Retailer dari tabel Master
        const retailerIds = retailerAgg.map(r => r.retailerId).filter(Boolean);
        const retailersMaster = await prisma.retailers.findMany({
            where: { id: { in: retailerIds } },
            select: { id: true, name: true }
        });

        const consolidatedMap = new Map<string, number>();

        retailerAgg.forEach(item => {
            if (!item.retailerId) return;
            const rawId = item.retailerId.split('_')[0];
            const detail = retailersMaster.find(r => r.id === rawId);

            // Prioritaskan nama dari database master
            const finalBrandName = detail?.name || `Mitra Retailer ${rawId}`;

            const currentTotal = consolidatedMap.get(finalBrandName) || 0;
            consolidatedMap.set(finalBrandName, currentTotal + Number(item._sum.unitsSold || 0));
        });

        // Urutkan dari tertinggi ke terendah (Tanpa Slice, tampilkan semua)
        const rankings = Array.from(consolidatedMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const products = availableProductsAgg
            .map(p => p.product)
            .filter(Boolean);

        return NextResponse.json({
            rankings,
            products
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });

    } catch (error) {
        console.error("Ranking Analytics API Error:", error);
        return NextResponse.json({ error: "Gagal memuat ranking" }, { status: 500 });
    }
}