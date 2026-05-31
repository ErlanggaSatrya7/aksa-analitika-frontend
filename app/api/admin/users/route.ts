import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1. FUNGSI GET (Membaca / Menampilkan Data User di Tabel)
export async function GET() {
    try {
        const users = await prisma.users.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                assignedState: true,
                assignedCity: true,
                retailerId: true,
            },
            orderBy: { id: 'desc' }
        });

        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Gagal mengambil data pengguna." }, { status: 500 });
    }
}

// 2. FUNGSI PUT (Mengubah Data Diri & Akses Wilayah / Role User)
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        // Sekarang backend kita menerima parameter fullName dan email
        const { id, fullName, email, role, state, city, retailer } = body;

        if (!id) return NextResponse.json({ error: "ID pengguna diperlukan." }, { status: 400 });

        // Update database secara komprehensif
        await prisma.users.update({
            where: { id },
            data: {
                fullName: fullName,
                email: email,
                role: role,
                assignedState: (role !== 'SUPER_ADMIN' && role !== 'DATA_ENGINEER') ? state : null,
                assignedCity: (role === 'CITY_ADMIN' || role === 'RETAILER_ADMIN') ? city : null,
                retailerId: (role === 'RETAILER_ADMIN') ? retailer : null,
            }
        });

        return NextResponse.json({ success: true, message: "Data dan akses berhasil diperbarui." });
    } catch (error: any) {
        console.error("Gagal update data user:", error);
        // Tangkap error jika email sudah dipakai orang lain
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Email sudah digunakan oleh akun lain." }, { status: 400 });
        }
        return NextResponse.json({ error: "Terjadi kesalahan sistem saat update data." }, { status: 500 });
    }
}

// 3. FUNGSI PATCH (Suspend atau Mengaktifkan Kembali Akun User)
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });

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

// 4. FUNGSI DELETE (Menghapus Akun Permanen)
export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) return NextResponse.json({ error: "ID pengguna diperlukan." }, { status: 400 });

        // PENTING: Jika User punya notifikasi, kita harus hapus notifikasinya dulu sebelum menghapus akunnya (Menghindari foreign key error)
        await prisma.notifications.deleteMany({
            where: { userId: id }
        });

        // Menghapus akun user secara permanen
        await prisma.users.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Akun berhasil dihapus permanen." });
    } catch (error: any) {
        console.error("Gagal menghapus user:", error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem saat menghapus akun." }, { status: 500 });
    }
}