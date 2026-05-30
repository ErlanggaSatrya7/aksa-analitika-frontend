import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1. GET: Mengambil Riwayat Broadcast dari Tabel Notifications
export async function GET() {
    try {
        // Ambil notifikasi terbaru yang berawalan 'Memo Target:' (Penanda bahwa ini adalah Broadcast AI)
        const allNotifs = await prisma.notifications.findMany({
            where: { title: { startsWith: 'Memo Target:' } },
            orderBy: { createdAt: 'desc' },
            take: 100 // Ambil sampel secukupnya untuk di-deduplicate
        });

        const uniqueBroadcasts: any[] = [];
        const seenDesc = new Set();

        // Karena 1 kali klik broadcast bisa mengirim ke puluhan user, kita hilangkan duplikatnya di log riwayat
        allNotifs.forEach(n => {
            if (!seenDesc.has(n.description)) {
                seenDesc.add(n.description);
                uniqueBroadcasts.push({
                    id: `BRD-${n.id.substring(0, 8).toUpperCase()}`,
                    date: new Date(n.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
                    target: n.title.replace('Memo Target: ', ''),
                    insight: n.description
                });
            }
        });

        return NextResponse.json(uniqueBroadcasts, { status: 200 });
    } catch (error) {
        console.error("Error fetching broadcast history:", error);
        return NextResponse.json({ error: "Gagal mengambil riwayat broadcast." }, { status: 500 });
    }
}

// 2. POST: Mengirim Broadcast Massal ke Database
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { target, insight } = body;

        let usersToNotify = [];

        // Cek apakah broadcast ditujukan untuk Nasional atau Provinsi Tertentu
        if (target.includes('Seluruh')) {
            // Targetkan semua user
            usersToNotify = await prisma.users.findMany({ select: { id: true } });
        } else {
            // Ekstrak nama provinsi (Misal: "Manajer Provinsi JAWA TIMUR" -> "JAWA TIMUR")
            const provName = target.replace('Manajer Provinsi ', '').trim();
            usersToNotify = await prisma.users.findMany({
                where: { assignedState: provName },
                select: { id: true }
            });
        }

        // Jika tidak ada user aktif di provinsi tersebut (DB masih kosong)
        if (usersToNotify.length === 0) {
            return NextResponse.json({ success: true, message: "Tidak ada user di area tersebut. Log tersimpan sebagai Draft." });
        }

        // Susun data massal untuk di-insert ke tabel notifications
        const notifData = usersToNotify.map(u => ({
            userId: u.id,
            title: `Memo Target: ${target}`,
            description: insight,
            isRead: false
        }));

        await prisma.notifications.createMany({
            data: notifData
        });

        return NextResponse.json({ success: true, message: "Broadcast massal berhasil masuk database." }, { status: 201 });
    } catch (error) {
        console.error("Gagal broadcast:", error);
        return NextResponse.json({ error: "Gagal mengirim broadcast." }, { status: 500 });
    }
}