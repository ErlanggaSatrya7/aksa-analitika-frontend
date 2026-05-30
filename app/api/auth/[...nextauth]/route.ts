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
                // TAMBAHKAN INI: Lihat apa yang diterima server
                console.log("Data diterima dari form:", credentials);

                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.users.findUnique({
                    where: { email: credentials.email },
                });

                // TAMBAHKAN INI: Lihat apakah user ditemukan
                console.log("User ditemukan di DB:", user ? user.email : "TIDAK DITEMUKAN");

                if (!user || user.status !== 'ACTIVE' || !user.password) return null;

                // Ganti baris bcrypt.compare dengan ini:
                // Pastikan kodenya kembali ke sini:
                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                // TAMBAHKAN INI: Lihat hasil verifikasi password
                console.log("Password valid:", isPasswordValid);

                if (!isPasswordValid) return null;

                return { id: user.id, email: user.email, name: user.fullName, role: user.role };
            },

        }),
    ],
    // TAMBAHKAN INI: Agar sesi terenkripsi dengan aman
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: "/",
        error: "/",
    },
});

export { handler as GET, handler as POST };