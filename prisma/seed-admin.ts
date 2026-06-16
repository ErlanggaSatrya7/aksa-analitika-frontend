import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('123', 10); // Ini yang membuat 123 jadi aman
    await prisma.users.create({
        data: {
            email: 'boss@aksa.com',
            fullName: 'Jurgen Klop',
            role: 'SUPER_ADMIN',
            password: hashedPassword, // Simpan hasil enkripsi
            status: 'ACTIVE'
        }
    });
    console.log('User Admin berhasil dibuat!');
}

main().catch(console.error).finally(() => prisma.$disconnect());