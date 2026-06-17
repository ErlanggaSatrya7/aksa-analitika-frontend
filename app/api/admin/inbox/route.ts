import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1. GET: Menampilkan daftar permintaan logistik
export async function GET() {
    try {
        const requests = await prisma.logistic_requests.findMany({
            include: {
                retailer: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' } // Yang terbaru di atas
        });

        return NextResponse.json(requests, { status: 200 });
    } catch (error) {
        console.error("Gagal mengambil data inbox:", error);
        return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
    }
}

// 2. PATCH: Update status (Approve / Reject)
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });

        await prisma.logistic_requests.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ success: true, message: `Status diupdate ke ${status}` });
    } catch (error) {
        console.error("Gagal update inbox:", error);
        return NextResponse.json({ error: "Gagal merubah status." }, { status: 500 });
    }
}