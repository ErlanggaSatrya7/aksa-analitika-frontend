import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1. FUNGSI GET (Membaca / Menampilkan Data User di Tabel)
export async function GET() {
    try {
        // Mengambil semua data pengguna dari database Supabase
        const users = await prisma.users.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                // PENTING: Tiga baris di bawah ini ditambahkan agar tabel membaca wilayahnya
                assignedState: true,
                assignedCity: true,
                retailerId: true,
            },
            orderBy: {
                id: 'desc' // Menampilkan akun yang paling baru dibuat di urutan teratas
            }
        });

        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data pengguna." },
            { status: 500 }
        );
    }
}

// 2. FUNGSI PUT (Mengubah Akses Wilayah / Role User)
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, role, state, city, retailer } = body;

        if (!id) return NextResponse.json({ error: "ID pengguna diperlukan." }, { status: 400 });

        // Update database berdasarkan logika Role yang baru
        // Jika rolenya turun/naik, area yang tidak relevan akan otomatis di-null-kan
        await prisma.users.update({
            where: { id },
            data: {
                role: role,
                assignedState: (role !== 'SUPER_ADMIN' && role !== 'DATA_ENGINEER') ? state : null,
                assignedCity: (role === 'CITY_ADMIN' || role === 'RETAILER_ADMIN') ? city : null,
                retailerId: (role === 'RETAILER_ADMIN') ? retailer : null,
            }
        });

        return NextResponse.json({ success: true, message: "Akses berhasil diperbarui." });
    } catch (error: any) {
        console.error("Gagal update akses user:", error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem saat update akses." }, { status: 500 });
    }
}

// 3. FUNGSI PATCH (Suspend atau Mengaktifkan Kembali Akun User)
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });

        // Update status menjadi 'ACTIVE' atau 'SUSPENDED'
        await prisma.users.update({
            where: { id },
            data: { status: status }
        });

        return NextResponse.json({ success: true, message: `Status akun berhasil menjadi ${status}` });
    } catch (error: any) {
        console.error("Gagal suspend user:", error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem saat ubah status." }, { status: 500 });
    }
}