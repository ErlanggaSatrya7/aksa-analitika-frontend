import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        if (!email) return NextResponse.json({ error: "Email dibutuhkan" }, { status: 400 });

        // Cari user berdasarkan email
        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) return NextResponse.json([]);

        // Ambil notifikasi dari database untuk user ini
        const notifs = await prisma.notifications.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 10 // Ambil 10 notifikasi terbaru
        });

        return NextResponse.json(notifs, { status: 200 });
    } catch (e) {
        console.error("Notifications API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}