import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, fullName, role, state, city, retailer } = body;

        // 1. Cek User
        const existingUser = await prisma.users.findUnique({ where: { email } });
        if (existingUser) return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });

        // 2. Logika Pencarian Pintar Berdasarkan Brand + Provinsi
        let retailerIdToSave = null;
        if (role === 'RETAILER_ADMIN' && retailer) {
            // Ubah "Jawa Barat" menjadi "JAWA_BARAT" agar cocok dengan format ID Supabase Anda
            const stateUpper = state.toUpperCase().replace(/\s+/g, '_');

            // Cari baris yang kodenya cocok DAN ID-nya mengandung nama provinsi yang dipilih
            const foundRetailer = await prisma.retailers.findFirst({
                where: {
                    name: retailer, // Contoh: "1000001"
                    id: {
                        contains: stateUpper // Contoh: "JAWA_BARAT"
                    }
                }
            });

            if (foundRetailer) {
                retailerIdToSave = foundRetailer.id; // Menyimpan ID lengkap (ex: 1000001_JAWA_BARAT_-)
            } else {
                // Fallback jika cabang spesifik provinsi tidak ketemu, ambil baris brand apa saja agar tidak error
                const fallbackRetailer = await prisma.retailers.findFirst({
                    where: { name: retailer }
                });
                if (fallbackRetailer) {
                    retailerIdToSave = fallbackRetailer.id;
                } else {
                    return NextResponse.json({ error: "Data Retailer tidak ditemukan di database." }, { status: 400 });
                }
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
                retailerId: retailerIdToSave,
            },
        });

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error: any) {
        console.error("DEBUG ERROR API:", error);
        return NextResponse.json({ error: error.message || "Gagal menyimpan data." }, { status: 500 });
    }
}