import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. TARIK SEMUA DATA YANG DIBUTUHKAN (Sangat cepat karena hanya memilih kolom tertentu)
        const rawSales = await prisma.sales_data.findMany({
            select: {
                unitsSold: true,
                totalSales: true,
                operatingMargin: true,
                product: true,
                salesMethod: true,
                invoiceDate: true,
                retailer: {
                    select: {
                        state: true,
                        name: true
                    }
                }
            }
        });

        if (rawSales.length === 0) {
            return NextResponse.json({ error: "Data kosong" }, { status: 404 });
        }

        // 2. VARIABEL UNTUK MENAMPUNG HASIL AGREGASI
        let totalUnits = 0;
        let totalSales = 0;
        let totalMargin = 0;

        const stateMap = new Map<string, number>();
        const productMap = new Map<string, number>();
        const methodMap = new Map<string, number>();
        const retailerMap = new Map<string, number>();
        const trendMap = new Map<string, number>();

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

        // 3. LOOPING UNTUK MENGHITUNG (AGREGASI) SELURUH 9600+ DATA
        rawSales.forEach(row => {
            // A. Summary (Total Keseluruhan)
            totalUnits += row.unitsSold;
            totalSales += row.totalSales;
            totalMargin += row.operatingMargin;

            // B. Distribusi Provinsi (Berdasarkan Units Sold)
            const state = row.retailer?.state || 'Tidak Diketahui';
            stateMap.set(state, (stateMap.get(state) || 0) + row.unitsSold);

            // C. Top Produk
            productMap.set(row.product, (productMap.get(row.product) || 0) + row.unitsSold);

            // D. Sales Method
            methodMap.set(row.salesMethod, (methodMap.get(row.salesMethod) || 0) + row.unitsSold);

            // E. Retailer Share
            const retailerName = row.retailer?.name || 'Unknown Retailer';
            retailerMap.set(retailerName, (retailerMap.get(retailerName) || 0) + row.unitsSold);

            // F. Trend Bulanan
            const date = new Date(row.invoiceDate);
            const monthKey = monthNames[date.getMonth()]; // Misal: "Jan", "Feb"
            trendMap.set(monthKey, (trendMap.get(monthKey) || 0) + row.unitsSold);
        });

        // 4. FORMATTING DATA SESUAI PERMINTAAN FRONTEND

        // -- Provinsi --
        const sortedProvinces = Array.from(stateMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Ambil nilai tertinggi untuk menghitung persentase bar (Progress Bar di Top 7)
        const maxStateValue = sortedProvinces.length > 0 ? sortedProvinces[0].value : 1;
        const topProvinces = sortedProvinces.slice(0, 7).map(p => ({
            name: p.name,
            val: p.value,
            pct: `${Math.min(100, Math.round((p.value / maxStateValue) * 100))}%`
        }));

        // -- Produk (Top 5) --
        const topProducts = Array.from(productMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // -- Sales Method --
        const salesMethod = Array.from(methodMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // -- Retailer Share --
        const retailerShare = Array.from(retailerMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // -- Trend Bulanan (Pastikan urut dari Jan -> Des) --
        const labels: string[] = [];
        const values: number[] = [];
        monthNames.forEach(month => {
            if (trendMap.has(month)) {
                labels.push(month);
                values.push(trendMap.get(month) || 0);
            }
        });

        // 5. KIRIM RESPONSE KE FRONTEND
        return NextResponse.json({
            summary: {
                totalUnits: totalUnits,
                totalSales: totalSales,
                avgMargin: (totalMargin / rawSales.length) * 100 // Rata-rata margin dalam persentase
            },
            mapDistribution: sortedProvinces, // Semua provinsi akan masuk ke peta!
            topProvinces: topProvinces, // Hanya 7 teratas untuk list di sebelah peta
            trendLine: { labels, values },
            salesMethod,
            topProducts,
            retailerShare
        }, { status: 200 });

    } catch (error) {
        console.error("Dashboard Analytics API Error:", error);
        return NextResponse.json({ error: "Gagal memuat analitik" }, { status: 500 });
    }
}