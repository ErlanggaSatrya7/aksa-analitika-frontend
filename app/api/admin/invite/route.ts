import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Pastikan nama variabel sesuai dengan data yang dikirim frontend
        const { email, fullName, role, state, city, retailer } = body;

        // 1. Cek User
        const existingUser = await prisma.users.findUnique({ where: { email } });
        if (existingUser) return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });

        // 2. Logika Pencarian Retailer yang Sesuai dengan Tabel Anda
        let retailerIdToSave = null;
        if (role === 'RETAILER_ADMIN' && retailer) {
            // Kita cari berdasarkan nama retailer (misal: "MATAHARI")
            // atau berdasarkan ID (misal: "1000006")
            const foundRetailer = await prisma.retailers.findFirst({
                where: {
                    OR: [
                        { id: retailer },      // Jika frontend kirim ID "1000006"
                        { name: retailer }     // Jika frontend kirim Nama "MATAHARI"
                    ]
                }
            });

            if (foundRetailer) {
                retailerIdToSave = foundRetailer.id;
            } else {
                return NextResponse.json({ error: "Data Retailer tidak ditemukan di database." }, { status: 400 });
            }
        }

        // 3. Hash Password
        const hashedPassword = await bcrypt.hash('123', 10);

        // 4. Create User (Menggunakan tabel 'users' jamak)
        const newUser = await prisma.users.create({
            data: {
                email,
                fullName,
                role: role as any,
                password: hashedPassword,
                // Pastikan status ada di schema (default 'INVITED' atau 'ACTIVE')
                status: 'ACTIVE',
                assignedState: (role !== 'SUPER_ADMIN' && role !== 'DATA_ENGINEER') ? state : null,
                assignedCity: (role === 'CITY_ADMIN' || role === 'RETAILER_ADMIN') ? city : null,
                retailerId: retailerIdToSave,
            },
        });

        return NextResponse.json({ success: true, user: newUser }, { status: 201 });

    } catch (error: any) {
        console.error("DEBUG ERROR API:", error);
        return NextResponse.json({ error: error.message || "Gagal menyimpan data." }, { status: 500 });
    }
}