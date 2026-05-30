    import { withAuth } from "next-auth/middleware";
    import { NextResponse } from "next/server";

    export default withAuth(
        function middleware(req) {
            const token = req.nextauth.token;
            const path = req.nextUrl.pathname;
            const role = token?.role as string | undefined;

            // PROTEKSI 1: Rute Admin HANYA untuk SUPER_ADMIN (Boss)
            if (path.startsWith("/dashboard/admin") && role !== "SUPER_ADMIN") {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }

            // PROTEKSI 2: Rute Cabang untuk CITY_ADMIN (dan Boss bisa akses jika perlu)
            if (path.startsWith("/dashboard/cabang") && role !== "CITY_ADMIN" && role !== "SUPER_ADMIN") {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }

            // PROTEKSI 3: Rute Retailer untuk RETAILER_ADMIN (dan Boss bisa akses)
            if (path.startsWith("/dashboard/retailer") && role !== "RETAILER_ADMIN" && role !== "SUPER_ADMIN") {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }

            // PROTEKSI 4: Rute Provinsi untuk STATE_ADMIN (dan Boss bisa akses)
            if (path.startsWith("/dashboard/provinsi") && role !== "STATE_ADMIN" && role !== "SUPER_ADMIN") {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }

            return NextResponse.next();
        },
        {
            callbacks: {
                authorized: ({ token }) => !!token, // Hanya izinkan jika user sudah login
            },
        }
    );

    export const config = {
        matcher: ["/dashboard/:path*"], // Melindungi semua rute di dalam dashboard
    };