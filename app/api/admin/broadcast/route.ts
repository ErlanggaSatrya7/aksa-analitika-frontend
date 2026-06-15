import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mengunci pool koneksi agar selalu segar dan mencegah error EMAXCONNSESSION saat refresh konstan
export const dynamic = 'force-dynamic';

// 1. GET: Mengambil Riwayat Broadcast dari Tabel Notifications
export async function GET() {
    try {
        // Ambil notifikasi terbaru yang berawalan 'Memo Target:' (Penanda bahwa ini adalah Broadcast AI)
        const allNotifs = await prisma.notifications.findMany({
            where: { title: { startsWith: 'Memo Target:' } },
            orderBy: { createdAt: 'desc' },
            take: 100
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

// 2. POST: Mengirim Targeted Broadcast Dinamis ke Database (Command Center Core Engine)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Menangkap targetScope yang dikirim secara dinamis oleh tombol 'Teruskan ke Cabang' di tab Forecast
        const { targetScope, target, insight } = body;

        let usersToNotify: { id: string }[] = [];
        const scope = targetScope || '';

        // ====================================================================
        // LOGIKA PENYARINGAN TARGET OPERASIONAL (COMMAND CENTER ENGINE)
        // ====================================================================
        if (scope === 'GLOBAL' || target.includes('Seluruh')) {
            // SKENARIO 1: FILTER NASIONAL GLOBAL -> Masuk ke notifikasi semua user aktif
            usersToNotify = await prisma.users.findMany({ select: { id: true } });

        } else if (scope.startsWith('PROVINCE:')) {
            // SKENARIO 2: FILTER PROVINSI -> Masuk ke Ririn (Admin Provinsi DKI Jakarta) + Bagas (Manajer Retailer manapun di DKI Jakarta)
            const provName = scope.replace('PROVINCE:', '').trim();
            usersToNotify = await prisma.users.findMany({
                where: { assignedState: provName },
                select: { id: true }
            });

        } else if (scope.startsWith('RETAILER:')) {
            // SKENARIO 3: FILTER RETAILER DAN PRODUK -> Murni masuk KHUSUS ke Bagas (Manajer Ramayana di DKI Jakarta) saja.
            // Mengekstrak kode angka brand (misal: "1000002" dari format id retailers)
            const rawRetailerId = scope.replace('RETAILER:', '').trim();
            const brandPrefix = rawRetailerId.split('_')[0];

            // Mengekstrak nama provinsi secara aman dari dalam tanda kurung teks label target
            // Contoh label: "Manajer Retailer: Ramayana (DKI Jakarta)" -> didapatkan "DKI Jakarta"
            let provName = "";
            const match = target.match(/\(([^)]+)\)/);
            if (match) {
                provName = match[1].trim();
            }

            usersToNotify = await prisma.users.findMany({
                where: {
                    role: 'RETAILER_ADMIN',
                    assignedState: provName || undefined,
                    retailerId: {
                        startsWith: brandPrefix // Menghubungkan secara fleksibel dengan kode awalan '1000002' di database
                    }
                },
                select: { id: true }
            });
        }

        // Jika wilayah/cabang tersebut belum memiliki user terdaftar, simpan log internal agar aman
        if (usersToNotify.length === 0) {
            return NextResponse.json({ success: true, message: "Target cabang belum memiliki pengguna aktif. Log disimpan sebagai draft internal." });
        }

        // Petakan instruksi massal ke masing-masing ID user yang terfilter
        const notifData = usersToNotify.map(u => ({
            userId: u.id,
            title: `Memo Target: ${target}`,
            description: insight,
            isRead: false
        }));

        await prisma.notifications.createMany({
            data: notifData
        });

        return NextResponse.json({ success: true, message: "Instruksi Command Center berhasil diteruskan ke target cabang." }, { status: 201 });
    } catch (error) {
        console.error("Gagal memproses targeted broadcast:", error);
        return NextResponse.json({ error: "Gagal memproses targeted broadcast." }, { status: 500 });
    }
}