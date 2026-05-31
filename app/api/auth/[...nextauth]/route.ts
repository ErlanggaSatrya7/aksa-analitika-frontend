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
                console.log("Data diterima dari form:", credentials);

                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.users.findUnique({
                    where: { email: credentials.email },
                });

                console.log("User ditemukan di DB:", user ? user.email : "TIDAK DITEMUKAN");

                if (!user || user.status !== 'ACTIVE' || !user.password) return null;

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                console.log("Password valid:", isPasswordValid);

                if (!isPasswordValid) return null;

                // 🔥 PERBAIKAN: Masukkan data wilayah tugas agar terbawa ke sesi
                return {
                    id: user.id,
                    email: user.email,
                    name: user.fullName,
                    role: user.role,
                    assignedState: user.assignedState,
                    assignedCity: user.assignedCity,
                    retailerId: user.retailerId
                };
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, user }) {
            // 🔥 PERBAIKAN: Saat pertama login, pindahkan data User ke Token
            if (user) {
                token.role = (user as any).role;
                token.assignedState = (user as any).assignedState;
                token.assignedCity = (user as any).assignedCity;
                token.retailerId = (user as any).retailerId;
            }
            return token;
        },
        async session({ session, token }) {
            // 🔥 PERBAIKAN: Teruskan data dari Token ke Session agar bisa dibaca di Frontend
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
        signIn: "/",
        error: "/",
    },
});

export { handler as GET, handler as POST };