import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const retailerId = searchParams.get('retailerId');

    if (!retailerId) {
        return NextResponse.json({ error: "Retailer ID tidak ditemukan di sesi Anda." }, { status: 400 });
    }

    try {
        // 1. CARI DATA RETAILER UNTUK MENDAPATKAN KODE BRAND DAN PROVINSI
        const retailerData = await prisma.retailers.findFirst({
            where: { id: retailerId }
        });

        if (!retailerData) {
            return NextResponse.json({ error: "Data toko tidak ditemukan di tabel retailers." }, { status: 404 });
        }

        const brandCode = retailerData.name; // Contoh: "1000001"
        const state = retailerData.state; // Contoh: "DKI Jakarta"

        // 2. TARIK DATA PENJUALAN MENGABAIKAN PERBEDAAN ID KOTA (Menggunakan Kode Brand + State)
        const sales = await prisma.sales_data.findMany({
            where: {
                retailerId: {
                    startsWith: brandCode // Tarik yang berawalan "1000001"
                },
                state: state // Dan pastikan provinsinya adalah "DKI Jakarta"
            },
            orderBy: {
                invoiceDate: 'asc'
            }
        });

        if (!sales || sales.length === 0) {
            return NextResponse.json({
                summary: { totalUnits: 0, avgMargin: 0, totalSales: 0 },
                topProducts: [],
                trendLine: { labels: [], values: [] },
                salesMethod: []
            });
        }

        // --- VARIABEL AGREGASI ---
        let totalUnits = 0;
        let totalSales = 0;
        let totalMargin = 0;
        let marginCount = 0;

        const productMap = new Map<string, number>();
        const methodMap = new Map<string, number>();
        const trendMap = new Map<string, number>();

        // --- PROSES KALKULASI ---
        sales.forEach((s) => {
            const units = Number(s.unitsSold || 0);
            const salesAmt = Number(s.totalSales || 0);

            let margin = Number(s.operatingMargin || 0);
            if (margin > 0 && margin < 1) margin = margin * 100;

            totalUnits += units;
            totalSales += salesAmt;

            if (margin > 0) {
                totalMargin += margin;
                marginCount++;
            }

            const prodName = s.product || 'Produk Lainnya';
            productMap.set(prodName, (productMap.get(prodName) || 0) + units);

            const method = s.salesMethod || 'In-store';
            methodMap.set(method, (methodMap.get(method) || 0) + units);

            if (s.invoiceDate) {
                const date = new Date(s.invoiceDate);
                const monthLabel = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
                trendMap.set(monthLabel, (trendMap.get(monthLabel) || 0) + units);
            }
        });

        // --- FORMATTING HASIL ---
        const avgMargin = marginCount > 0 ? (totalMargin / marginCount) : 0;

        const topProducts = Array.from(productMap, ([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        const salesMethod = Array.from(methodMap, ([name, value]) => ({ name, value }));
        const trendLabels = Array.from(trendMap.keys());
        const trendValues = Array.from(trendMap.values());

        return NextResponse.json({
            summary: { totalUnits, totalSales, avgMargin },
            topProducts,
            trendLine: { labels: trendLabels, values: trendValues },
            salesMethod
        });

    } catch (error: any) {
        console.error("Gagal menarik data Store Dashboard:", error);
        return NextResponse.json({ error: "Terjadi kesalahan internal pada server database." }, { status: 500 });
    }
}