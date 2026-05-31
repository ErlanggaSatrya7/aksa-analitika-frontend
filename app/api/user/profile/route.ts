import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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

            // 🔥 PERBAIKAN TYPESCRIPT: Pastikan password di DB tidak null
            if (!user.password) {
                return NextResponse.json({ error: "Akun ini tidak memiliki kata sandi sebelumnya." }, { status: 400 });
            }

            // Cek apakah password lama yang dimasukkan benar (sekarang Typescript tahu user.password pasti string)
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