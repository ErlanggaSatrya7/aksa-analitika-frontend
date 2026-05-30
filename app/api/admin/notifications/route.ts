import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1. GET: Ambil notifikasi milik user yang sedang login
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) return NextResponse.json({ error: "Email diperlukan." }, { status: 400 });

        // Cari User ID berdasarkan Email
        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

        // Ambil notifikasi miliknya (Maksimal 15 terbaru)
        const userNotifs = await prisma.notifications.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 15
        });

        return NextResponse.json(userNotifs, { status: 200 });
    } catch (error) {
        console.error("Gagal mengambil notifikasi:", error);
        return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
    }
}

// 2. PATCH: Tandai semua notifikasi menjadi sudah dibaca (isRead = true)
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) return NextResponse.json({ error: "Email diperlukan." }, { status: 400 });

        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

        // Update semua notifikasi yang masih belum terbaca menjadi terbaca
        await prisma.notifications.updateMany({
            where: {
                userId: user.id,
                isRead: false
            },
            data: { isRead: true }
        });

        return NextResponse.json({ success: true, message: "Semua notifikasi telah ditandai dibaca." }, { status: 200 });
    } catch (error) {
        console.error("Gagal update notifikasi:", error);
        return NextResponse.json({ error: "Gagal merubah status notifikasi." }, { status: 500 });
    }
}