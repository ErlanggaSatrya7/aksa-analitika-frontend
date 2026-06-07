import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// MENGAMBIL HISTORY DARI TABEL UTAMA MLOPS
export async function GET() {
    try {
        const logs = await prisma.system_history.findMany({
            orderBy: { created_at: 'desc' } // Pastikan schema kamu menggunakan created_at
        });
        return NextResponse.json({ logs }, { status: 200 });
    } catch (error) {
        console.error("Gagal get history:", error);
        return NextResponse.json({ error: "Gagal memuat history" }, { status: 500 });
    }
}

// MENGHAPUS HISTORY
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { ids } = body;

        if (ids && ids.length > 0) {
            await prisma.system_history.deleteMany({ where: { id: { in: ids } } });
        } else {
            await prisma.system_history.deleteMany({}); // Hapus semua jika array kosong
        }
        return NextResponse.json({ message: "History dihapus" }, { status: 200 });
    } catch (error) {
        console.error("Gagal delete history:", error);
        return NextResponse.json({ error: "Gagal menghapus history" }, { status: 500 });
    }
}