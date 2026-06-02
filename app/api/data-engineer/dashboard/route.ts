import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const totalRows = await prisma.sales_data.count();

        // 1. Tarik 10 baris paling terakhir dari database
        const rawRecentData = await prisma.sales_data.findMany({
            take: 10,
            orderBy: {
                rowId: 'desc'
            },
            include: {
                retailer: true
            }
        });

        // 2. Balikkan urutan array-nya agar tampil persis seperti di Excel
        const recentData = rawRecentData.reverse();

        // PERBAIKAN: Ubah menjadi null karena FastAPI belum terhubung!
        const accuracy = null;
        const growth = null;

        return NextResponse.json({
            totalRows,
            recentData,
            accuracy,
            growth
        }, { status: 200 });

    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: "Gagal memuat data dashboard" }, { status: 500 });
    }
}