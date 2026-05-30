import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        // Cek apakah admin boss sudah ada biar tidak dobel
        const existingAdmin = await prisma.users.findUnique({
            where: { email: 'boss@aksa.com' }
        });

        if (existingAdmin) {
            return NextResponse.json({ message: "Akun Boss sudah ada di database!" });
        }

        // Hash password "123" agar aman di database
        const hashedPassword = await bcrypt.hash('123', 10);

        // Bikin SATU akun Super Admin (Akar dari semua user)
        await prisma.users.create({
            data: {
                email: 'boss@aksa.com',
                fullName: 'Super Admin (Boss)',
                role: 'SUPER_ADMIN',
                status: 'ACTIVE',
                password: hashedPassword
            }
        });

        return NextResponse.json({
            success: true,
            message: "Akun Boss berhasil dibuat! Silakan login dengan Email: boss@aksa.com | Password: 123"
        });
    } catch (error) {
        console.error("Setup Error:", error);
        return NextResponse.json({ error: "Gagal membuat akun boss." }, { status: 500 });
    }
}