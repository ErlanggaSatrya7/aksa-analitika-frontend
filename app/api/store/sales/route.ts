import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const retailerId = searchParams.get('retailerId');
        const category = searchParams.get('category');

        if (!retailerId) return NextResponse.json({ error: "retailerId wajib diisi" }, { status: 400 });

        // 1. Tentukan filter
        let whereClause: any = { retailerId: retailerId };
        if (category && category !== 'Semua Kategori') {
            whereClause.product = category;
        }

        // 2. Tarik data penjualan dari database
        const sales = await prisma.sales_data.findMany({
            where: whereClause,
            orderBy: { invoiceDate: 'asc' }
        });

        // 3. Tarik semua kategori unik untuk Dropdown
        const allSales = await prisma.sales_data.findMany({
            where: { retailerId },
            select: { product: true },
            distinct: ['product']
        });
        const availableCategories = ['Semua Kategori', ...allSales.map(s => s.product)];

        // 4. Proses Kalkulasi
        let totalVolume = 0;
        let totalRevenue = 0;
        const methodsCount: Record<string, number> = {};
        const dailyVolume: Record<string, number> = { 'Sen': 0, 'Sel': 0, 'Rab': 0, 'Kam': 0, 'Jum': 0, 'Sab': 0, 'Min': 0 };
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

        sales.forEach(sale => {
            totalVolume += sale.unitsSold;
            totalRevenue += sale.totalSales;

            // Hitung Metode Penjualan (Pie Chart)
            const method = sale.salesMethod || 'Lainnya';
            methodsCount[method] = (methodsCount[method] || 0) + sale.unitsSold;

            // Hitung Tren Harian (Line Chart)
            const date = new Date(sale.invoiceDate);
            const dayName = dayNames[date.getDay()];
            dailyVolume[dayName] += sale.unitsSold;
        });

        // Rata-rata transaksi
        const avgTicket = sales.length > 0 ? (totalRevenue / sales.length) : 0;

        // Tentukan hari dengan penjualan terbanyak
        let topDayKey = '-';
        let maxVol = -1;
        Object.keys(dailyVolume).forEach(day => {
            if (dailyVolume[day] > maxVol) {
                maxVol = dailyVolume[day];
                topDayKey = day;
            }
        });

        const dayMap: any = { 'Min': 'Minggu', 'Sen': 'Senin', 'Sel': 'Selasa', 'Rab': 'Rabu', 'Kam': 'Kamis', 'Jum': 'Jumat', 'Sab': 'Sabtu' };
        const topDay = maxVol > 0 ? dayMap[topDayKey] : '-';

        // Format data untuk Pie Chart
        const pieChart = Object.keys(methodsCount).map(method => ({
            name: method,
            value: methodsCount[method]
        }));

        return NextResponse.json({
            kpi: { volume: totalVolume, avgTicket: avgTicket, topDay: topDay },
            dailyTrend: [dailyVolume['Sen'], dailyVolume['Sel'], dailyVolume['Rab'], dailyVolume['Kam'], dailyVolume['Jum'], dailyVolume['Sab'], dailyVolume['Min']],
            pieChart: pieChart,
            availableCategories
        }, { status: 200 });

    } catch (error) {
        console.error("Sales API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}