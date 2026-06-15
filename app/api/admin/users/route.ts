import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mengaktifkan force-dynamic agar pool koneksi Prisma selalu segar saat Hot Reload / Refresh halaman
export const dynamic = 'force-dynamic';

// =====================================================================
// 1. FUNGSI GET (Membaca / Menampilkan Data User di Tabel)
// =====================================================================
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

// =====================================================================
// 2. FUNGSI PUT (Mengubah Data Diri & Akses Wilayah / Role User)
// =====================================================================
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, fullName, email, role, state, city, retailer } = body;

        if (!id) return NextResponse.json({ error: "ID pengguna diperlukan." }, { status: 400 });

        // Logika Akal Pintar untuk Menyelaraskan ID Retailer (Sama seperti di fungsi invite)
        let retailerIdToSave = null;
        if (role === 'RETAILER_ADMIN' && retailer) {
            // Ambil kode angka bersih dari variabel retailer (misal mengekstrak "1000002" dari "1000002_DKI_JAKARTA")
            const brandCode = retailer.split('_')[0];
            const stateUpper = state ? state.toUpperCase().replace(/\s+/g, '_') : '';

            // Cari toko yang kodenya sesuai DAN kolom ID-nya mengandung nama Provinsi yang dipilih user
            const foundRetailer = await prisma.retailers.findFirst({
                where: {
                    name: brandCode,
                    id: {
                        contains: stateUpper
                    }
                }
            });

            if (foundRetailer) {
                retailerIdToSave = foundRetailer.id; // Menyimpan ID valid (ex: 1000002_DKI_JAKARTA_-)
            } else {
                // Fallback darurat jika tidak ketemu yang spesifik provinsi, gunakan ID asal agar tidak break foreign key
                const fallbackRetailer = await prisma.retailers.findFirst({
                    where: {
                        OR: [
                            { id: retailer },
                            { name: brandCode }
                        ]
                    }
                });
                if (fallbackRetailer) retailerIdToSave = fallbackRetailer.id;
            }
        }

        // Jalankan update database secara komprehensif ke Supabase
        await prisma.users.update({
            where: { id },
            data: {
                fullName: fullName,
                email: email,
                role: role,
                assignedState: (role !== 'SUPER_ADMIN' && role !== 'DATA_ENGINEER') ? state : null,
                assignedCity: (role === 'CITY_ADMIN' || role === 'RETAILER_ADMIN') ? city : null,
                retailerId: retailerIdToSave,
            }
        });

        return NextResponse.json({ success: true, message: "Data dan akses berhasil diperbarui." });
    } catch (error: any) {
        console.error("Gagal update data user:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Email sudah digunakan oleh akun lain." }, { status: 400 });
        }
        return NextResponse.json({ error: "Terjadi kesalahan sistem saat update data." }, { status: 500 });
    }
}

// =====================================================================
// 3. FUNGSI PATCH (Suspend atau Mengaktifkan Kembali Akun User)
// =====================================================================
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

// =====================================================================
// 4. FUNGSI DELETE (Menghapus Akun Permanen)
// =====================================================================
export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) return NextResponse.json({ error: "ID pengguna diperlukan." }, { status: 400 });

        // Hapus child-data (notifikasi) terlebih dahulu untuk menghindari Foreign Key Constraint error
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