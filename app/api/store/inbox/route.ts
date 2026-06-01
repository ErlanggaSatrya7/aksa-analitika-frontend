import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const retailerId = searchParams.get('retailerId');
        const userId = searchParams.get('userId');

        if (!retailerId || !userId) {
            return NextResponse.json({ error: "retailerId dan userId wajib diisi" }, { status: 400 });
        }

        // 1. Ambil Memo / Notifikasi yang ditujukan ke SPV Toko ini
        const memos = await prisma.notifications.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' }
        });

        // 2. Ambil Riwayat Permohonan Logistik dari Toko ini
        const requests = await prisma.logistic_requests.findMany({
            where: { retailerId: retailerId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ memos, requests }, { status: 200 });

    } catch (error) {
        console.error("Store Inbox API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}