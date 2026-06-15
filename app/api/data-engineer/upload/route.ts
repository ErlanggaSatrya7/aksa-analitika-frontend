import { NextResponse } from 'next/server';

export async function POST() {
    // Ambil URL dari environment, jika kosong (fallback) gunakan localhost

    // running lokal and deployment in railway 
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // API ini sengaja dimatikan (Deprecated).
    // Proses upload dataset yang berat dan Retraining AI (Scikit-Learn) 
    // sekarang diproses sepenuhnya oleh MLOps Engine di Python (FastAPI).
    return NextResponse.json(
        {
            error: `Endpoint ini telah dinonaktifkan. Silakan arahkan request form upload langsung ke port FastAPI (${apiUrl}/api/dataset/upload).`
        },
        { status: 410 } // 410 Gone
    );
}