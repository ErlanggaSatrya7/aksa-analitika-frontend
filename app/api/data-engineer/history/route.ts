import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// MENGAMBIL HISTORY
export async function GET() {
    try {
        const logs = await prisma.audit_logs.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ logs }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Gagal memuat history" }, { status: 500 });
    }
}

// MENGHAPUS HISTORY
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { ids } = body;

        if (ids && ids.length > 0) {
            await prisma.audit_logs.deleteMany({ where: { id: { in: ids } } });
        } else {
            await prisma.audit_logs.deleteMany({}); // Hapus semua jika array kosong
        }
        return NextResponse.json({ message: "History dihapus" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Gagal menghapus history" }, { status: 500 });
    }
}