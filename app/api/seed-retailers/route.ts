import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // 1. Bersihkan database dari data lama agar tidak dobel/bentrok
        await prisma.retailers.deleteMany({});

        // 2. Daftar 6 Brand Retailer Resmi (Tanpa region, state, atau city)
        // Kita wajib menambahkan 'id' secara manual karena di schema tidak pakai @default(uuid())
        const seedData = [
            { id: "RTL-001", name: "ADIDAS OFFICIAL STORE" },
            { id: "RTL-002", name: "MATAHARI" },
            { id: "RTL-003", name: "PLANET SPORTS" },
            { id: "RTL-004", name: "RAMAYANA" },
            { id: "RTL-005", name: "SPORTS STATION" },
            { id: "RTL-006", name: "TRANSMART" }
        ];

        // 3. Tembakkan ke Database Supabase
        await prisma.retailers.createMany({
            data: seedData
        });

        return NextResponse.json({
            message: "BERHASIL! 6 Brand Retailer Nasional berhasil disinkronisasi ke Supabase.",
            total_inserted_retailers: seedData.length
        }, { status: 200 });

    } catch (error) {
        console.error("Gagal melakukan seeding:", error);
        return NextResponse.json({ error: "Gagal memasukkan data ke database." }, { status: 500 });
    }
}