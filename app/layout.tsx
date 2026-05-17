import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Konfigurasi Font Inter (Untuk Body/Data)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Konfigurasi Font Plus Jakarta Sans (Untuk Heading/Branding)
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "AKSA Analitika | Painkiller BI",
  description: "Advanced Business Intelligence with Gemma 4 AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        // antialiased akan membuat font jauh lebih tajam (crisp) di semua layar
        className={`${inter.variable} ${jakarta.variable} font-sans bg-canvas text-body antialiased selection:bg-primary/20 selection:text-primary`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}