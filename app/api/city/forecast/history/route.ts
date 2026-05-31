import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const city = searchParams.get('city');

        // Mengambil riwayat eskalasi berdasarkan judul spesifik untuk kota ini
        const history = await prisma.notifications.findMany({
            where: { title: `Eskalasi AI: ${city}` },
            orderBy: { createdAt: 'desc' }
        });

        // Format datanya agar sesuai dengan kebutuhan tampilan tabel di Frontend
        const formatted = history.map(h => ({
            id: `ESC-${h.id.substring(0, 4).toUpperCase()}`,
            date: new Date(h.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
            target: 'Manajer Provinsi (State Admin)',
            insight: h.description
        }));

        return NextResponse.json(formatted, { status: 200 });
    } catch (e) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { city, insight } = body;

        // Cari siapa State Admin-nya (Manajer Provinsi)
        const stateAdmin = await prisma.users.findFirst({
            where: { role: 'STATE_ADMIN' }
        });

        if (!stateAdmin) return NextResponse.json({ error: "State Admin tidak ditemukan di database" }, { status: 404 });

        // Simpan permohonan ke tabel notifications untuk dibaca oleh State Admin
        const newNotif = await prisma.notifications.create({
            data: {
                userId: stateAdmin.id,
                title: `Eskalasi AI: ${city}`,
                description: insight,
                isRead: false
            }
        });

        return NextResponse.json({
            id: `ESC-${newNotif.id.substring(0, 4).toUpperCase()}`,
            date: new Date(newNotif.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
            target: stateAdmin.fullName,
            insight: newNotif.description
        }, { status: 201 });

    } catch (e) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}