import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.sales_data.count();
        console.log("Koneksi Berhasil! Jumlah data:", count);
    } catch (e) {
        console.error("Gagal koneksi:", e);
    }
}
main();