// middleware.ts di root project
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('aksa_token')?.value
    const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')

    // Jika mencoba masuk dashboard tapi tidak ada token, tendang ke login
    if (isDashboardPage && !token) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    // Pastikan matcher mencakup semua halaman kecuali file statis (image, favicon, dll)
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}