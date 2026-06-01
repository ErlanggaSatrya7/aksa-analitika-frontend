// aksa-frontend/app/api/data-engineer/dashboard/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // 1. Ambil 10 data terbaru/historis
        const recentData = await prisma.sales_data.findMany({
            take: 10,
            orderBy: { invoiceDate: 'desc' }, // Mengambil 10 data teratas
            include: { retailer: true } // Tarik sekalian nama dan kota tokonya
        });

        // 2. Hitung total seluruh baris yang ada di database
        const totalRows = await prisma.sales_data.count();

        return NextResponse.json({ recentData, totalRows }, { status: 200 });
    } catch (error) {
        console.error("Gagal mengambil data engineer dashboard:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}