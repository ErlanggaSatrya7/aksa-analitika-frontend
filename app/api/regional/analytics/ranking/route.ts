import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const state = searchParams.get('state');
        const retailer = searchParams.get('retailer');
        const product = searchParams.get('product');

        if (!state) return NextResponse.json({ error: "State diperlukan" }, { status: 400 });

        // Filter dinamis
        const whereClause: any = { retailer: { state: state } };
        if (retailer && retailer !== 'Semua Retailer') {
            whereClause.retailer.name = { startsWith: retailer };
        }
        if (product && product !== 'Semua Kategori') {
            whereClause.product = product;
        }

        const salesData = await prisma.sales_data.findMany({
            where: whereClause,
            include: { retailer: true }
        });

        // Agregasi (Group By) berdasarkan Kota
        const citySales = new Map<string, number>();
        const retailerSet = new Set<string>();
        const productSet = new Set<string>();

        salesData.forEach(sale => {
            const city = sale.retailer?.city || 'Unknown';
            citySales.set(city, (citySales.get(city) || 0) + sale.unitsSold);

            if (sale.retailer?.name) retailerSet.add(sale.retailer.name.split(' - ')[0]);
            productSet.add(sale.product);
        });

        // Urutkan dari yang terbesar ke terkecil
        const rankings = Array.from(citySales, ([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return NextResponse.json({
            rankings,
            retailers: Array.from(retailerSet),
            products: Array.from(productSet)
        });

    } catch (error) {
        return NextResponse.json({ error: "Gagal memuat ranking" }, { status: 500 });
    }
}