import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1. GET: Ambil riwayat eskalasi (Broadcast ke Super Admin)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        if (!email) return NextResponse.json({ error: "Email diperlukan" }, { status: 400 });

        const user = await prisma.users.findUnique({ where: { email } });

        // Cari Notifikasi yang dikirim oleh user ini ke Pusat
        const logs = await prisma.notifications.findMany({
            where: { title: { startsWith: `Eskalasi dari ${user?.assignedState}` } },
            orderBy: { createdAt: 'desc' }
        });

        const history = logs.map(n => ({
            id: `ESC-REG-${n.id.substring(0, 6).toUpperCase()}`,
            date: new Date(n.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
            target: 'Pusat (Super Admin)',
            insight: n.description
        }));

        return NextResponse.json(history, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Gagal memuat riwayat." }, { status: 500 });
    }
}

// 2. POST: Kirim Eskalasi ke Super Admin
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { state, email, insight } = body;

        // Cari semua user dengan role SUPER_ADMIN
        const superAdmins = await prisma.users.findMany({ where: { role: 'SUPER_ADMIN' } });

        // Kirim Notifikasi ke semua Super Admin
        const notifData = superAdmins.map(admin => ({
            userId: admin.id,
            title: `Eskalasi dari ${state}`,
            description: insight,
            isRead: false
        }));

        await prisma.notifications.createMany({ data: notifData });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Gagal mengirim eskalasi." }, { status: 500 });
    }
}