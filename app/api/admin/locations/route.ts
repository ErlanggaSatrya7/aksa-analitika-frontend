import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const activeSales = await prisma.sales_data.findMany({
            select: { state: true, product: true, retailerId: true }
        });

        const states = Array.from(new Set(activeSales.map(s => s.state)))
            .filter(s => s && s.trim() !== '-' && !s.toUpperCase().includes('UNKNOWN'))
            .sort();

        const products = Array.from(new Set(activeSales.map(s => s.product)))
            .filter(Boolean)
            .sort();

        const retailersMaster = await prisma.retailers.findMany({
            select: { id: true, name: true }
        });

        // Kamus Mapping (Tinggal tambahkan ID baru di sini jika perlu)
        // 1. KAMUS NAMA (Master Data kamu)
        const retailerMap: Record<string, string> = {
            "1000001": "Adidas Official Store",
            "1000002": "Matahari",
            "1000003": "Planet Sports",
            "1000004": "Ramayana",
            "1000005": "Sports Station",
            "1000006": "Transmart"
        };

        const uniqueRetailersMap = new Map();

        activeSales.forEach(sale => {
            if (!sale.retailerId) return;

            // 2. EKSTRAKSI ID ASLI
            // Jika ID di database bentuknya "1000001_BANTEN_CILEGON", 
            // kita ambil bagian pertamanya saja: "1000001"
            const rawId = sale.retailerId.split('_')[0];

            // 3. CEK KAMUS
            // Kita gunakan rawId untuk mencari nama di kamus
            const finalName = retailerMap[rawId] || `Retailer ${rawId}`;

            // 4. SIMPAN KE MAP (Kuncinya pakai rawId agar tidak duplikat)
            if (!uniqueRetailersMap.has(rawId)) {
                uniqueRetailersMap.set(rawId, {
                    id: rawId, // Kirim ID bersih ke frontend
                    name: finalName, // Kirim Nama Cantik ke frontend
                    states: new Set([sale.state])
                });
            } else {
                uniqueRetailersMap.get(rawId).states.add(sale.state);
            }
        });

        // Ubah Set provinsi kembali menjadi Array untuk dikirim ke JSON
        const retailers = Array.from(uniqueRetailersMap.values())
            .map(r => ({
                ...r,
                states: Array.from(r.states).filter(Boolean)
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({ states, retailers, products }, { status: 200 });

    } catch (error) {
        console.error("Gagal memuat data:", error);
        return NextResponse.json({ error: "Gagal mengambil data master." }, { status: 500 });
    }
}