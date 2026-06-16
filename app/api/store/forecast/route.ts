import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================================================
// GET: Mengambil Daftar Produk (Dropdown) & Riwayat Pengajuan Restock (History)
// ============================================================================
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const retailerId = searchParams.get('retailerId');

        if (!retailerId) {
            return NextResponse.json({ error: "Retailer ID diperlukan" }, { status: 400 });
        }

        // 1. Ambil Riwayat Pengajuan (History) dari tabel logistic_requests
        const historyRaw = await prisma.logistic_requests.findMany({
            where: { retailerId: retailerId },
            orderBy: { createdAt: 'desc' }
        });

        // Format history agar sesuai dengan kebutuhan UI Frontend
        const history = historyRaw.map((req) => {
            const dateObj = new Date(req.createdAt);
            const formattedDate = dateObj.toLocaleDateString('id-ID', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }) + ' WIB';

            return {
                id: `REQ-${req.id.substring(0, 4).toUpperCase()}`,
                date: formattedDate,
                target: 'Manajer Regional / Pusat',
                insight: `Pengajuan kuota tambahan ${req.productCategory} sebanyak ${req.qtyRequested} Pcs berdasarkan proyeksi AI.`
            };
        });

        // 2. Ambil Kategori Produk yang Tersedia untuk Retailer ini (Dropdown)
        const sales = await prisma.sales_data.findMany({
            where: { retailerId: retailerId },
            select: { product: true },
            distinct: ['product']
        });

        // Format dropdown list produk
        const availableProducts = ['Semua Kategori', ...sales.map(s => s.product)];

        return NextResponse.json({ history, availableProducts }, { status: 200 });

    } catch (error: any) {
        console.error("GET Store Forecast Error:", error);
        return NextResponse.json({ error: "Gagal mengambil data forecast store." }, { status: 500 });
    }
}


// ============================================================================
// POST: Membuat Pengajuan Restock Baru ke Tabel logistic_requests
// ============================================================================
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { retailerId, productCategory, qtyRequested } = body;

        if (!retailerId || !productCategory || !qtyRequested) {
            return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        }

        // Simpan ke database dengan status awal 'PENDING_CITY' (Menunggu Admin Regional)
        const newRequest = await prisma.logistic_requests.create({
            data: {
                retailerId: retailerId,
                productCategory: productCategory === 'Semua Kategori' ? 'Campuran (General)' : productCategory,
                qtyRequested: parseInt(qtyRequested),
                status: 'PENDING_CITY'
            }
        });

        return NextResponse.json(newRequest, { status: 201 });

    } catch (error: any) {
        console.error("POST Store Forecast Error:", error);
        return NextResponse.json({ error: "Gagal membuat permohonan restock." }, { status: 500 });
    }
}