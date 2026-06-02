import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        // Ambil ID File (Upload ID) dari URL URL
        const { searchParams } = new URL(req.url);
        const uploadId = searchParams.get('uploadId');

        if (!uploadId) {
            return NextResponse.json({ error: "Upload ID tidak ditemukan" }, { status: 400 });
        }

        // Tarik 10 data pertama khusus untuk file yang diklik
        const previewData = await prisma.sales_data.findMany({
            where: {
                uploadId: uploadId
            },
            take: 10,
            orderBy: {
                rowId: 'asc' // <-- KUNCI UTAMA: Urutkan dari baris pertama (terkecil) ke bawah
            },
            include: {
                retailer: true // Sertakan relasi data toko
            }
        });

        return NextResponse.json({ previewData }, { status: 200 });

    } catch (error) {
        console.error("Preview API Error:", error);
        return NextResponse.json({ error: "Gagal mengambil preview data dari database." }, { status: 500 });
    }
}