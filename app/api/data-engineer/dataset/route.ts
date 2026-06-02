import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const files = await prisma.dataset_uploads.findMany({
            orderBy: { uploadedAt: 'desc' }
        });
        return NextResponse.json({ files }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Gagal memuat dataset" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

        // 1. Ambil info file yang mau dihapus untuk dicatat
        const filesToDelete = await prisma.dataset_uploads.findMany({ where: { id: { in: ids } } });

        // 2. CATAT KE HISTORY (AUDIT LOG) BAHWA FILE INI DIHAPUS
        const logsToCreate = filesToDelete.map(file => ({
            action: 'DELETE',
            fileName: file.fileName,
            totalRows: file.totalRows
        }));
        if (logsToCreate.length > 0) await prisma.audit_logs.createMany({ data: logsToCreate });

        // 3. Hapus file aslinya dari database
        await prisma.dataset_uploads.deleteMany({ where: { id: { in: ids } } });

        return NextResponse.json({ message: "Berhasil dihapus" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
    }
}