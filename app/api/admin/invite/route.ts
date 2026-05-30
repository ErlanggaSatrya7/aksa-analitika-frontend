import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Catatan: 'retailer' di sini sekarang berisi ID (UUID), bukan nama toko!
        const { email, fullName, role, state, city, retailer } = body;

        // 1. Cek User
        const existingUser = await prisma.users.findUnique({ where: { email } });
        if (existingUser) return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });

        // 2. Validasi ID Retailer jika role adalah RETAILER_ADMIN
        let retailerIdToSave = null;
        if (role === 'RETAILER_ADMIN' && retailer) {
            // PERBAIKAN DI SINI: Cari berdasarkan "id", bukan "name"
            const foundRetailer = await prisma.retailers.findUnique({
                where: { id: retailer } // <--- KUNCI PENYELESAIAN MASALAH
            });

            // Jika ID-nya memang ada di database, simpan ID tersebut
            if (foundRetailer) {
                retailerIdToSave = foundRetailer.id;
            } else {
                return NextResponse.json({ error: "Data Retailer tidak ditemukan di database." }, { status: 400 });
            }
        }

        // 3. Hash Password
        const hashedPassword = await bcrypt.hash('123', 10);

        // 4. Create User
        const newUser = await prisma.users.create({
            data: {
                email,
                fullName,
                role: role as any,
                status: 'ACTIVE' as any,
                password: hashedPassword,
                assignedState: (role !== 'SUPER_ADMIN' && role !== 'DATA_ENGINEER') ? state : null,
                assignedCity: (role === 'CITY_ADMIN' || role === 'RETAILER_ADMIN') ? city : null,
                retailerId: retailerIdToSave, // Masukkan ID ke kolom relasi
            },
        });

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error: any) {
        console.error("DEBUG ERROR API:", error);
        return NextResponse.json({ error: error.message || "Gagal menyimpan data." }, { status: 500 });
    }
}