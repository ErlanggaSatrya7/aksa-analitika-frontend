import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const uploadedBy = formData.get('uploadedBy') as string || 'Admin';

        if (!file) {
            return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const totalRows = rawData.length;
        const fileSizeKB = (file.size / 1024).toFixed(1) + ' KB';

        if (totalRows === 0) {
            return NextResponse.json({ error: "File kosong atau format tidak sesuai" }, { status: 400 });
        }

        const uploadRecord = await prisma.dataset_uploads.create({
            data: {
                fileName: file.name,
                fileSize: fileSizeKB,
                totalRows: totalRows,
                uploadedBy: uploadedBy
            }
        });
        // CATAT KE HISTORY BAHWA FILE BARU DIUPLOAD
        await prisma.audit_logs.create({
            data: { action: 'UPLOAD', fileName: file.name, totalRows: totalRows }
        });

        // =======================================================
        // PERBAIKAN: MEMBUAT ID CABANG UNIK (RETAILER + STATE + CITY)
        // =======================================================
        const uniqueRetailersMap = new Map();

        rawData.forEach((row: any) => {
            const rawRetailerId = String(row['Retailer ID'] || 'UNKNOWN');
            const state = String(row['State'] || '-');
            const city = String(row['City'] || '-');

            // Contoh ID Baru: "1185732_ACEH_BANDA_ACEH"
            const branchId = `${rawRetailerId}_${state}_${city}`.replace(/\s+/g, '_').toUpperCase();

            if (!uniqueRetailersMap.has(branchId)) {
                uniqueRetailersMap.set(branchId, {
                    id: branchId,
                    name: String(row['Retailer'] || '-'),
                    region: String(row['Region'] || '-'),
                    state: state,
                    city: city
                });
            }
        });

        const retailersArray = Array.from(uniqueRetailersMap.values());

        for (const r of retailersArray) {
            await prisma.retailers.upsert({
                where: { id: r.id },
                update: { name: r.name, region: r.region, state: r.state, city: r.city },
                create: { id: r.id, name: r.name, region: r.region, state: r.state, city: r.city }
            });
        }

        // =======================================================
        // BULK INSERT SALES DATA
        // =======================================================
        const salesDataToInsert = rawData.map((row: any) => {

            let parsedDate = new Date();
            let rawDate = row['Invoice Date'];

            if (rawDate) {
                if (typeof rawDate === 'number') {
                    parsedDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
                } else {
                    parsedDate = new Date(rawDate);
                }
                parsedDate.setUTCHours(12, 0, 0, 0);
            }

            // Ganti ID yang akan dimasukkan dengan Branch ID yang baru
            const rawRetailerId = String(row['Retailer ID'] || 'UNKNOWN');
            const state = String(row['State'] || '-');
            const city = String(row['City'] || '-');
            const branchId = `${rawRetailerId}_${state}_${city}`.replace(/\s+/g, '_').toUpperCase();

            return {
                retailerId: branchId, // <-- ID Unik yang aman
                uploadId: uploadRecord.id,
                invoiceDate: parsedDate,
                product: String(row['Product'] || '-'),
                pricePerUnit: Number(row['Price per Unit'] || 0),
                unitsSold: Number(row['Units Sold'] || 0),
                totalSales: Number(row['Total Sales'] || 0),
                operatingProfit: Number(row['Operating Profit'] || 0),
                operatingMargin: Number(row['Operating Margin'] || 0),
                salesMethod: String(row['Sales Method'] || '-')
            };
        });

        await prisma.sales_data.createMany({
            data: salesDataToInsert
        });

        const previewData = salesDataToInsert.slice(0, 10).map((row) => ({
            ...row,
            retailer: retailersArray.find(r => r.id === row.retailerId)
        }));

        return NextResponse.json({
            message: "Upload sukses",
            totalRowsInserted: totalRows,
            previewData
        }, { status: 200 });

    } catch (error) {
        console.error("Upload error detail:", error);
        return NextResponse.json({ error: "Gagal memproses file di server." }, { status: 500 });
    }
}