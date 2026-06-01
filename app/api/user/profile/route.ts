import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// ==================================================================
// 1. FUNGSI GET: Untuk mengambil data profil dan relasi Toko (Retailer)
// ==================================================================
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
        }

        // Cari user berdasarkan email dan TARIK JUGA data tokonya (retailer)
        const user = await prisma.users.findUnique({
            where: { email },
            include: { retailer: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error("Profile GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


// ==================================================================
// 2. FUNGSI PATCH: Untuk menyimpan perubahan Nama dan Password
// ==================================================================
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { email, fullName, currentPassword, newPassword } = body;

        if (!email) {
            return NextResponse.json({ error: "Email pengguna tidak ditemukan" }, { status: 400 });
        }

        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
        }

        let updatedData: any = { fullName };

        // Jika form password diisi, lakukan validasi ganti password
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: "Kata sandi saat ini wajib diisi untuk mengganti kata sandi" }, { status: 400 });
            }

            // Pastikan password di DB tidak null
            if (!user.password) {
                return NextResponse.json({ error: "Akun ini tidak memiliki kata sandi sebelumnya." }, { status: 400 });
            }

            // Cek apakah password lama yang dimasukkan benar
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ error: "Kata sandi saat ini salah" }, { status: 401 });
            }

            // Enkripsi password baru
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updatedData.password = hashedPassword;
        }

        // Update ke database
        await prisma.users.update({
            where: { email },
            data: updatedData
        });

        return NextResponse.json({ success: true, message: "Profil berhasil diperbarui!" }, { status: 200 });

    } catch (error) {
        console.error("Update Profile Error:", error);
        return NextResponse.json({ error: "Gagal memperbarui profil karena kesalahan sistem." }, { status: 500 });
    }
}