import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // 1. DATA STATE (PROVINSI)
        const states = [
            "Bali", "Bangka Belitung", "Banten", "Bengkulu", "DI Yogyakarta", "DKI Jakarta",
            "Gorontalo", "Jambi", "Jawa Barat", "Jawa Tengah", "Jawa Timur", "Kalimantan Barat",
            "Kalimantan Selatan", "Kalimantan Tengah", "Kalimantan Timur", "Kalimantan Utara",
            "Kepulauan Riau", "Lampung", "Maluku", "Maluku Utara", "NAD Aceh", "NTB", "NTT",
            "Papua", "Riau", "Sulawesi Barat", "Sulawesi Selatan", "Sulawesi Tengah",
            "Sulawesi Tenggara", "Sulawesi Utara", "Sumatera Barat", "Sumatera Selatan", "Sumatera Utara"
        ];

        // 2. DATA CITY (KOTA)
        const cities = [
            { name: "Denpasar", provinceName: "Bali" },
            { name: "Pangkal Pinang", provinceName: "Bangka Belitung" },
            { name: "Cilegon", provinceName: "Banten" }, { name: "Serang", provinceName: "Banten" }, { name: "Tangerang", provinceName: "Banten" }, { name: "Tangerang Selatan", provinceName: "Banten" },
            { name: "Bengkulu", provinceName: "Bengkulu" },
            { name: "Yogyakarta", provinceName: "DI Yogyakarta" },
            { name: "Kota Administrasi Jakarta Barat", provinceName: "DKI Jakarta" }, { name: "Kota Administrasi Jakarta Pusat", provinceName: "DKI Jakarta" }, { name: "Kota Administrasi Jakarta Selatan", provinceName: "DKI Jakarta" }, { name: "Kota Administrasi Jakarta Timur", provinceName: "DKI Jakarta" }, { name: "Kota Administrasi Jakarta Utara", provinceName: "DKI Jakarta" },
            { name: "Gorontalo", provinceName: "Gorontalo" },
            { name: "Jambi", provinceName: "Jambi" }, { name: "Sungai Penuh", provinceName: "Jambi" },
            { name: "Bandung", provinceName: "Jawa Barat" }, { name: "Banjar", provinceName: "Jawa Barat" }, { name: "Bekasi", provinceName: "Jawa Barat" }, { name: "Bogor", provinceName: "Jawa Barat" }, { name: "Cimahi", provinceName: "Jawa Barat" }, { name: "Cirebon", provinceName: "Jawa Barat" }, { name: "Depok", provinceName: "Jawa Barat" }, { name: "Sukabumi", provinceName: "Jawa Barat" }, { name: "Tasikmalaya", provinceName: "Jawa Barat" },
            { name: "Magelang", provinceName: "Jawa Tengah" }, { name: "Pekalongan", provinceName: "Jawa Tengah" }, { name: "Salatiga", provinceName: "Jawa Tengah" }, { name: "Semarang", provinceName: "Jawa Tengah" }, { name: "Surakarta", provinceName: "Jawa Tengah" }, { name: "Tegal", provinceName: "Jawa Tengah" },
            { name: "Batu", provinceName: "Jawa Timur" }, { name: "Blitar", provinceName: "Jawa Timur" }, { name: "Kediri", provinceName: "Jawa Timur" }, { name: "Madiun", provinceName: "Jawa Timur" }, { name: "Malang", provinceName: "Jawa Timur" }, { name: "Mojokerto", provinceName: "Jawa Timur" }, { name: "Pasuruan", provinceName: "Jawa Timur" }, { name: "Probolinggo", provinceName: "Jawa Timur" }, { name: "Surabaya", provinceName: "Jawa Timur" },
            { name: "Pontianak", provinceName: "Kalimantan Barat" }, { name: "Singkawang", provinceName: "Kalimantan Barat" },
            { name: "Banjarbaru", provinceName: "Kalimantan Selatan" }, { name: "Banjarmasin", provinceName: "Kalimantan Selatan" },
            { name: "Palangka Raya", provinceName: "Kalimantan Tengah" },
            { name: "Balikpapan", provinceName: "Kalimantan Timur" }, { name: "Bontang", provinceName: "Kalimantan Timur" }, { name: "Samarinda", provinceName: "Kalimantan Timur" },
            { name: "Tarakan", provinceName: "Kalimantan Utara" },
            { name: "Batam", provinceName: "Kepulauan Riau" }, { name: "Tanjung Pinang", provinceName: "Kepulauan Riau" },
            { name: "Bandar Lampung", provinceName: "Lampung" }, { name: "Metro", provinceName: "Lampung" },
            { name: "Ambon", provinceName: "Maluku" }, { name: "Tual", provinceName: "Maluku" },
            { name: "Ternate", provinceName: "Maluku Utara" }, { name: "Tidore Kepulauan", provinceName: "Maluku Utara" },
            { name: "Banda Aceh", provinceName: "NAD Aceh" }, { name: "Langsa", provinceName: "NAD Aceh" }, { name: "Lhokseumawe", provinceName: "NAD Aceh" }, { name: "Sabang", provinceName: "NAD Aceh" }, { name: "Subulussalam", provinceName: "NAD Aceh" },
            { name: "Bima", provinceName: "NTB" }, { name: "Mataram", provinceName: "NTB" },
            { name: "Kupang", provinceName: "NTT" },
            { name: "Jayapura", provinceName: "Papua" },
            { name: "Dumai", provinceName: "Riau" }, { name: "Pekanbaru", provinceName: "Riau" },
            { name: "Mamuju", provinceName: "Sulawesi Barat" },
            { name: "Makassar", provinceName: "Sulawesi Selatan" }, { name: "Palopo", provinceName: "Sulawesi Selatan" }, { name: "Parepare", provinceName: "Sulawesi Selatan" },
            { name: "Palu", provinceName: "Sulawesi Tengah" },
            { name: "Bau-Bau", provinceName: "Sulawesi Tenggara" }, { name: "Kendari", provinceName: "Sulawesi Tenggara" },
            { name: "Bitung", provinceName: "Sulawesi Utara" }, { name: "Kotamobagu", provinceName: "Sulawesi Utara" }, { name: "Manado", provinceName: "Sulawesi Utara" }, { name: "Tomohon", provinceName: "Sulawesi Utara" },
            { name: "Bukittinggi", provinceName: "Sumatera Barat" }, { name: "Padang", provinceName: "Sumatera Barat" }, { name: "Padangpanjang", provinceName: "Sumatera Barat" }, { name: "Pariaman", provinceName: "Sumatera Barat" }, { name: "Payakumbuh", provinceName: "Sumatera Barat" }, { name: "Sawahlunto", provinceName: "Sumatera Barat" }, { name: "Solok", provinceName: "Sumatera Barat" },
            { name: "Lubuklinggau", provinceName: "Sumatera Selatan" }, { name: "Pagar Alam", provinceName: "Sumatera Selatan" }, { name: "Palembang", provinceName: "Sumatera Selatan" }, { name: "Prabumulih", provinceName: "Sumatera Selatan" },
            { name: "Binjai", provinceName: "Sumatera Utara" }, { name: "Gunungsitoli", provinceName: "Sumatera Utara" }, { name: "Medan", provinceName: "Sumatera Utara" }, { name: "Padangsidempuan", provinceName: "Sumatera Utara" }, { name: "Pematangsiantar", provinceName: "Sumatera Utara" }, { name: "Sibolga", provinceName: "Sumatera Utara" }, { name: "Tanjungbalai", provinceName: "Sumatera Utara" }, { name: "Tebing Tinggi", provinceName: "Sumatera Utara" }
        ];

        // 3. Ambil data asli dari database
        const retailersData = await prisma.retailers.findMany({
            select: {
                id: true,
                name: true,
                city: true
            }
        });

        // 4. Mapping data agar sesuai dengan frontend (nama field harus konsisten)
        const retailers = retailersData.map(r => ({
            id: r.id,
            name: r.name,
            cityName: r.city
        }));

        return NextResponse.json({
            states: states,
            cities: cities,
            retailers: retailers
        }, { status: 200 });

    } catch (error) {
        console.error("Gagal memuat data lokasi:", error);
        return NextResponse.json({ error: "Gagal mengambil data master wilayah." }, { status: 500 });
    }
}