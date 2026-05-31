import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const city = searchParams.get('city');

        if (!city) {
            return NextResponse.json({ error: "Parameter kota wajib diisi" }, { status: 400 });
        }

        // 1. QUERY DATABASE
        // Sesuai schema: tabel 'retailers' berelasi dengan 'sales_data'
        const stores = await prisma.retailers.findMany({
            where: {
                city: city
            },
            include: {
                sales_data: true // <-- Ini nama relasi yang benar di schema.prisma kamu
            }
        });

        if (!stores || stores.length === 0) {
            return NextResponse.json({
                summary: { revenue: 0, margin: 0, traffic: 0 },
                chartData: { categories: [], targets: [], realized: [] },
                brief: { topStore: '-', bottomStore: '-', message: `Belum ada data toko untuk kota ${city}.` }
            }, { status: 200 });
        }

        // 2. KALKULASI DATA SESUAI SCHEMA
        let totalRevenue = 0;
        let totalUnitsSold = 0; // Menggunakan unitsSold karena tidak ada kolom traffic
        let totalMarginSum = 0;
        let marginCount = 0;

        const categories: string[] = [];
        const targets: number[] = [];
        const realized: number[] = [];

        let highestRev = -1;
        let lowestRev = Infinity;
        let topStore = '-';
        let bottomStore = '-';

        stores.forEach((store: any) => {
            let storeRevenue = 0;
            let storeUnits = 0;

            // Pastikan relasi sales_data ada dan tidak kosong
            if (store.sales_data && store.sales_data.length > 0) {
                // Sesuai schema: kita gunakan field 'totalSales', 'unitsSold', dan 'operatingMargin'
                storeRevenue = store.sales_data.reduce((sum: number, sale: any) => sum + (sale.totalSales || 0), 0);
                storeUnits = store.sales_data.reduce((sum: number, sale: any) => sum + (sale.unitsSold || 0), 0);

                const avgMargin = store.sales_data.reduce((sum: number, sale: any) => sum + (sale.operatingMargin || 0), 0) / store.sales_data.length;
                totalMarginSum += avgMargin;
                marginCount++;
            }

            totalRevenue += storeRevenue;
            totalUnitsSold += storeUnits;

            categories.push(store.name);
            // Sesuai schema tidak ada 'targetRevenue', jadi kita asumsikan targetnya adalah 120% (1.2) dari revenue saat ini, 
            // atau batas default jika revenue 0 agar grafik tetap rapi.
            targets.push(storeRevenue > 0 ? storeRevenue * 1.2 : 100000000);
            realized.push(storeRevenue);

            if (storeRevenue > highestRev) {
                highestRev = storeRevenue;
                topStore = store.name;
            }
            if (storeRevenue < lowestRev && storeRevenue > 0) {
                lowestRev = storeRevenue;
                bottomStore = store.name;
            }
        });

        // 3. RATA-RATA MARGIN
        // Jika data operatingMargin di DB bentuknya desimal (misal 0.25), maka kalikan 100 agar jadi 25%.
        // Kalau di DB sudah puluhan (misal 25), hapus * 100 nya. Saya asumsikan desimal.
        let finalMargin = marginCount > 0 ? (totalMarginSum / marginCount) : 0;
        if (finalMargin < 1) finalMargin = finalMargin * 100;

        // 4. SUSUN BRIEF
        const briefMessage = topStore !== '-'
            ? `Unit ${topStore} menunjukkan efisiensi tertinggi minggu ini. Sementara sektor ${bottomStore} butuh suntikan promo untuk mengejar defisit target.`
            : `Belum ada transaksi yang tercatat untuk dianalisis di wilayah ini.`;

        // 5. KIRIM DATA
        const data = {
            summary: {
                revenue: totalRevenue,
                margin: finalMargin,
                traffic: totalUnitsSold // Ditampilkan di UI sebagai 'Pengunjung'
            },
            chartData: {
                categories: categories,
                targets: targets,
                realized: realized
            },
            brief: {
                topStore: topStore,
                bottomStore: bottomStore,
                message: briefMessage
            }
        };

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("City Dashboard API Database Error:", error);
        return NextResponse.json({ error: "Gagal mengambil data dari database" }, { status: 500 });
    }
}