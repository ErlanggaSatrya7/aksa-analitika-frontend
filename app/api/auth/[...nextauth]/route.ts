import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // 1. Cek apakah email dan password diisi
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    // 2. Cari user di database
                    const user = await prisma.users.findUnique({
                        where: { email: credentials.email },
                    });

                    // 3. Jika user tidak ditemukan atau statusnya tidak aktif, tolak login
                    if (!user || user.status !== 'ACTIVE' || !user.password) {
                        return null;
                    }

                    // 4. Validasi Password
                    // Asumsi: Password di database dienkripsi menggunakan bcrypt
                    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                    /* 🔥 PENTING:
                     Jika password di database kamu BUKAN hash acak (misal di DB tertulis '123' polos),
                     matikan (comment) baris bcrypt di atas, dan nyalakan baris di bawah ini:
                     
                     const isPasswordValid = credentials.password === user.password;
                    */

                    // Jika password salah, tolak login
                    if (!isPasswordValid) {
                        return null;
                    }

                    // 5. Jika sukses, kembalikan data user untuk disimpan di JWT & Session
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.fullName,
                        role: user.role,
                        assignedState: user.assignedState,
                        assignedCity: user.assignedCity,
                        retailerId: user.retailerId
                    };
                } catch (error) {
                    // Tangkap error jika database tiba-tiba putus
                    console.error("🔥 PRISMA ERROR SAAT LOGIN:", error);
                    return null;
                }
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    debug: process.env.NODE_ENV === "development", // Otomatis log error hanya saat mode 'npm run dev'
    callbacks: {
        // Pindahkan data tambahan dari User ke Token
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.assignedState = (user as any).assignedState;
                token.assignedCity = (user as any).assignedCity;
                token.retailerId = (user as any).retailerId;
            }
            return token;
        },
        // Pindahkan data dari Token ke Session agar bisa dibaca di komponen Frontend
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).assignedState = token.assignedState;
                (session.user as any).assignedCity = token.assignedCity;
                (session.user as any).retailerId = token.retailerId;
            }
            return session;
        },
    },
    pages: {
        signIn: "/", // Redirect ke halaman utama jika belum login
        error: "/",  // Redirect ke halaman utama jika error login
    },
});

export { handler as GET, handler as POST };