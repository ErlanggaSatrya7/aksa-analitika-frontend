import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const retailerId = searchParams.get('retailerId');
        const category = searchParams.get('category');

        if (!retailerId) return NextResponse.json({ error: "retailerId wajib" }, { status: 400 });

        // 1. Ambil opsi kategori yang tersedia di toko ini
        const sales = await prisma.sales_data.findMany({
            where: { retailerId },
            select: { product: true },
            distinct: ['product']
        });
        const availableProducts = ['Semua Kategori', ...sales.map(s => s.product)];

        // 2. Kalkulasi Data (Mock Algoritma Forecast berdasarkan volume penjualan)
        let totalSales = 0;
        let whereClause: any = { retailerId };
        if (category && category !== 'Semua Kategori') {
            whereClause.product = category;
        }

        const filteredSales = await prisma.sales_data.findMany({ where: whereClause });
        filteredSales.forEach(sale => totalSales += sale.unitsSold);

        // Algoritma sederhana untuk simulasi AI
        const baseActual = totalSales > 0 ? Math.floor(totalSales / 30) : 100;
        const actualData = [baseActual + 20, baseActual + 15, baseActual - 10, baseActual - 30, baseActual - 45, null, null];
        const optimisData = [null, null, null, null, baseActual - 45, baseActual + 80, baseActual + 110];
        const prediksiData = [null, null, null, null, baseActual - 45, baseActual + 40, baseActual + 60];
        const pesimisData = [null, null, null, null, baseActual - 45, baseActual - 10, baseActual];

        // 3. Ambil data riwayat logistik yang pernah dikirim dari toko ini
        const history = await prisma.logistic_requests.findMany({
            where: { retailerId },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        const formattedHistory = history.map(h => ({
            id: `REQ-${h.id.substring(0, 4).toUpperCase()}`,
            date: new Date(h.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' WIB',
            target: 'Manajer Kota / Cabang',
            insight: `Pengajuan kuota tambahan ${h.productCategory} sebanyak ${h.qtyRequested} Pcs.`
        }));

        const insightText = `Berdasarkan data mesin kasir (POS) saat ini, sisa stok untuk ${category || 'Semua Kategori'} diprediksi kritis (Out-of-Stock) di akhir pekan. Segera ajukan permohonan restock ke Manajer Kota minimal sebanyak ${Math.floor(baseActual * 2.5)} Pcs.`;

        return NextResponse.json({
            availableProducts,
            chartData: { actual: actualData, optimis: optimisData, prediksi: prediksiData, pesimis: pesimisData },
            insightText,
            history: formattedHistory
        }, { status: 200 });

    } catch (error) {
        console.error("Forecast API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { retailerId, productCategory, qtyRequested } = body;

        // Simpan request ke tabel logistic_requests
        const newRequest = await prisma.logistic_requests.create({
            data: {
                retailerId,
                productCategory,
                qtyRequested: Number(qtyRequested),
                status: 'PENDING_CITY'
            }
        });

        return NextResponse.json(newRequest, { status: 201 });
    } catch (error) {
        console.error("POST Logistic Request Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}