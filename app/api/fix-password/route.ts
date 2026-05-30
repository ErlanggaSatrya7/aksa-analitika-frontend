import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    const email = 'boss@aksa.com'; // Sesuaikan email akun kamu
    const rawPassword = '123'; // Password yang sekarang kamu pakai di DB

    // 1. Hash password yang sekarang jadi versi enkripsi yang benar
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 2. Update di database
    await prisma.users.update({
        where: { email: email },
        data: { password: hashedPassword }
    });

    return NextResponse.json({ message: "Password berhasil di-hash dengan aman!" });
}