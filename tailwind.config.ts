import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Palet Warna AKSA Analitika (Light Mode Fokus)
                primary: "#312E81",     // Deep Indigo (Warna Sakral)
                secondary: "#06B6D4",    // Electric Cyan
                success: "#10B981",     // Emerald 500
                warning: "#F59E0B",     // Amber 500
                error: "#EF4444",       // Red 500
                canvas: "#F8FAFC",      // Slate 50 (Background Web)
                card: "#FFFFFF",        // White (Background Kotak Bento)

                // Teks
                heading: "#0F172A",     // Slate 900
                body: "#475569",        // Slate 600
            },
            fontFamily: {
                // Kita siapkan variabel font-nya di sini
                sans: ['var(--font-inter)', 'sans-serif'],
                heading: ['var(--font-jakarta)', 'sans-serif'],
            },
            borderRadius: {
                // Request Khusus Angga: Corner Radius 40px
                'bento': '40px',
            }
        },
    },
    plugins: [],
};

export default config;