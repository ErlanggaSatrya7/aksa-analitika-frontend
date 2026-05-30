import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // 1. Bersihkan database dari data lama agar tidak dobel/bentrok
        await prisma.retailers.deleteMany({});

        // 2. Daftar 6 Brand Retailer Resmi
        const brandNames = [
            "ADIDAS OFFICIAL STORE", "MATAHARI", "PLANET SPORTS",
            "RAMAYANA", "SPORTS STATION", "TRANSMART"
        ];

        // 3. Mapping Lengkap 98 Kota, 33 Provinsi, 6 Region sesuai Dataset Aksa
        const locationData = [
            // === SUMATERA ===
            { region: "SUMATERA", state: "NAD ACEH", cities: ["BANDA ACEH", "LANGSA", "LHOKSEUMAWE", "SABANG", "SUBULUSSALAM"] },
            { region: "SUMATERA", state: "SUMATERA UTARA", cities: ["BINJAI", "GUNUNGSITOLI", "MEDAN", "PADANGSIDEMPUAN", "PEMATANGSIANTAR", "SIBOLGA", "TANJUNGBALAI", "TEBING TINGGI"] },
            { region: "SUMATERA", state: "SUMATERA BARAT", cities: ["BUKITTINGGI", "PADANG", "PADANGPANJANG", "PARIAMAN", "PAYAKUMBUH", "SAWAHLUNTO", "SOLOK"] },
            { region: "SUMATERA", state: "RIAU", cities: ["DUMAI", "PEKANBARU"] },
            { region: "SUMATERA", state: "KEPULAUAN RIAU", cities: ["BATAM", "TANJUNG PINANG"] },
            { region: "SUMATERA", state: "JAMBI", cities: ["JAMBI", "SUNGAI PENUH"] },
            { region: "SUMATERA", state: "BENGKULU", cities: ["BENGKULU"] },
            { region: "SUMATERA", state: "SUMATERA SELATAN", cities: ["LUBUKLINGGAU", "PAGAR ALAM", "PALEMBANG", "PRABUMULIH"] },
            { region: "SUMATERA", state: "BANGKA BELITUNG", cities: ["PANGKAL PINANG"] },
            { region: "SUMATERA", state: "LAMPUNG", cities: ["BANDAR LAMPUNG", "METRO"] },

            // === JAWA ===
            { region: "JAWA", state: "BANTEN", cities: ["CILEGON", "SERANG", "TANGERANG", "TANGERANG SELATAN"] },
            { region: "JAWA", state: "DKI JAKARTA", cities: ["KOTA ADMINISTRASI JAKARTA BARAT", "KOTA ADMINISTRASI JAKARTA PUSAT", "KOTA ADMINISTRASI JAKARTA SELATAN", "KOTA ADMINISTRASI JAKARTA TIMUR", "KOTA ADMINISTRASI JAKARTA UTARA"] },
            { region: "JAWA", state: "JAWA BARAT", cities: ["BANDUNG", "BANJAR", "BEKASI", "BOGOR", "CIMAHI", "CIREBON", "DEPOK", "SUKABUMI", "TASIKMALAYA"] },
            { region: "JAWA", state: "JAWA TENGAH", cities: ["MAGELANG", "PEKALONGAN", "SALATIGA", "SEMARANG", "SURAKARTA", "TEGAL"] },
            { region: "JAWA", state: "DI YOGYAKARTA", cities: ["YOGYAKARTA"] },
            { region: "JAWA", state: "JAWA TIMUR", cities: ["BATU", "BLITAR", "KEDIRI", "MADIUN", "MALANG", "MOJOKERTO", "PASURUAN", "PROBOLINGGO", "SURABAYA"] },

            // === BALI NUSRA ===
            { region: "BALI NUSRA", state: "BALI", cities: ["DENPASAR"] },
            { region: "BALI NUSRA", state: "NTB", cities: ["BIMA", "MATARAM"] },
            { region: "BALI NUSRA", state: "NTT", cities: ["KUPANG"] },

            // === KALIMANTAN ===
            { region: "KALIMANTAN", state: "KALIMANTAN BARAT", cities: ["PONTIANAK", "SINGKAWANG"] },
            { region: "KALIMANTAN", state: "KALIMANTAN TENGAH", cities: ["PALANGKA RAYA"] },
            { region: "KALIMANTAN", state: "KALIMANTAN SELATAN", cities: ["BANJARBARU", "BANJARMASIN"] },
            { region: "KALIMANTAN", state: "KALIMANTAN TIMUR", cities: ["BALIKPAPAN", "BONTANG", "SAMARINDA"] },
            { region: "KALIMANTAN", state: "KALIMANTAN UTARA", cities: ["TARAKAN"] },

            // === SULAWESI ===
            { region: "SULAWESI", state: "SULAWESI UTARA", cities: ["BITUNG", "KOTAMOBAGU", "MANADO", "TOMOHON"] },
            { region: "SULAWESI", state: "GORONTALO", cities: ["GORONTALO"] },
            { region: "SULAWESI", state: "SULAWESI TENGAH", cities: ["PALU"] },
            { region: "SULAWESI", state: "SULAWESI BARAT", cities: ["MAMUJU"] },
            { region: "SULAWESI", state: "SULAWESI SELATAN", cities: ["MAKASSAR", "PALOPO", "PAREPARE"] },
            { region: "SULAWESI", state: "SULAWESI TENGGARA", cities: ["BAU-BAU", "KENDARI"] },

            // === MALUKU PAPUA ===
            { region: "MALUKU PAPUA", state: "MALUKU", cities: ["AMBON", "TUAL"] },
            { region: "MALUKU PAPUA", state: "MALUKU UTARA", cities: ["TERNATE", "TIDORE KEPULAUAN"] },
            { region: "MALUKU PAPUA", state: "PAPUA", cities: ["JAYAPURA"] }
        ];

        // 4. Proses Merakit 588 Data Toko
        const seedData: { name: string; region: string; state: string; city: string }[] = [];

        locationData.forEach((loc) => {
            loc.cities.forEach((city) => {
                brandNames.forEach((brand) => {
                    seedData.push({
                        name: `${brand} - ${city}`,
                        region: loc.region,
                        state: loc.state,
                        city: city
                    });
                });
            });
        });

        // 5. Tembakkan ke Database Supabase
        await prisma.retailers.createMany({
            data: seedData
        });

        return NextResponse.json({
            message: "BERHASIL MAKSIMAL! 588 Data Toko Resmi berhasil disinkronisasi ke Supabase.",
            total_cities: 98,
            total_inserted_retailers: seedData.length
        }, { status: 200 });

    } catch (error) {
        console.error("Gagal melakukan seeding:", error);
        return NextResponse.json({ error: "Gagal memasukkan data ke database." }, { status: 500 });
    }
}