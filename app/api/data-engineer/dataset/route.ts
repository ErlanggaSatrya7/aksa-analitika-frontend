import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const files = await prisma.dataset_uploads.findMany({
            // Pastikan field ini sesuai schema. Jika error, ubah ke 'created_at'
            orderBy: { uploadedAt: 'desc' }
        });
        return NextResponse.json({ files }, { status: 200 });
    } catch (error) {
        console.error("Get Dataset Error:", error);
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

        // 2. [PENTING] Hapus baris data di sales_data terlebih dahulu (Manual Cascade Delete)
        // Ini menjamin tidak ada error Foreign Key Constraint saat file dihapus
        await prisma.sales_data.deleteMany({
            where: { uploadId: { in: ids } }
        });

        // 3. CATAT KE SYSTEM HISTORY (Agar muncul di halaman History MLOps)
        const logsToCreate = filesToDelete.map(file => ({
            action: 'DELETE',
            fileName: file.fileName,
            totalRows: file.totalRows,
            status: 'SUCCESS',
            notes: 'File dan seluruh baris data terkait telah dihapus permanen.'
        }));

        if (logsToCreate.length > 0) {
            await prisma.system_history.createMany({ data: logsToCreate });
        }

        // 4. Hapus file aslinya dari tabel dataset_uploads
        await prisma.dataset_uploads.deleteMany({ where: { id: { in: ids } } });

        return NextResponse.json({ message: "Berhasil dihapus" }, { status: 200 });
    } catch (error) {
        console.error("Delete Dataset Error:", error);
        return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
    }
}