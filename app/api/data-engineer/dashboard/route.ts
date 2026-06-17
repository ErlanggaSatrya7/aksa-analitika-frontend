import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const totalRows = await prisma.sales_data.count();

        // 1. Tarik 10 baris paling terakhir
        const rawRecentData = await prisma.sales_data.findMany({
            take: 10,
            orderBy: { rowId: 'desc' },
            include: { retailer: true }
        });
        const recentData = rawRecentData.reverse();

        // 2. [DYNAMIS] Ambil metrik dari log "TERIMA" terakhir
        const lastSuccessLog = await prisma.system_history.findFirst({
            where: {
                status: {
                    contains: 'TERIMA' // Mencari log terakhir yang modelnya diterima
                }
            },
            orderBy: {
                created_at: 'desc' // DIPERBAIKI: Menggunakan created_at sesuai schema Prisma-mu
            }
        });

        

        // 3. Ekstrak angka dari string notes menggunakan Regex
        let championMetrics = { r2: '0.00', mape: '0.00', mae: '0.0' };

        if (lastSuccessLog && lastSuccessLog.notes) {
            const notes = lastSuccessLog.notes;

            // Regex untuk mencari pola "R2: ... ➡️ X.XX" dan "MAE: ... ➡️ XX.X" dan "MAPE: ... ➡️ XX.XX%"
            // Disesuaikan dengan format log baru di main.py: "R2: 0.83 ➡️ 0.86 | MAE: 214.5 ➡️ 184.9 | RMSE: 250.1 ➡️ 210.5 | MAPE: 5.12% ➡️ 4.76%"
            const r2Match = notes.match(/R2:.*?➡️\s*([\d.]+)/);
            const maeMatch = notes.match(/MAE:.*?➡️\s*([\d.]+)/);
            const mapeMatch = notes.match(/MAPE:.*?➡️\s*([\d.]+)%/);

            championMetrics = {
                r2: r2Match ? r2Match[1] : '0.00',
                mae: maeMatch ? maeMatch[1] : '0.0',
                mape: mapeMatch ? mapeMatch[1] : '0.00'
            };
        }

        return NextResponse.json({
            totalRows,
            recentData,
            championMetrics // Sekarang ini sudah angka asli dari log!
        }, { status: 200 });

    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: "Gagal memuat data dashboard" }, { status: 500 });
    }
}