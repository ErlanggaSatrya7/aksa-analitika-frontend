import { NextResponse } from 'next/server';

export async function POST() {
    // API ini sengaja dimatikan (Deprecated).
    // Proses upload dataset yang berat dan Retraining AI (Scikit-Learn) 
    // sekarang diproses sepenuhnya oleh MLOps Engine di Python (FastAPI).
    return NextResponse.json(
        {
            error: "Endpoint ini telah dinonaktifkan. Silakan arahkan request form upload langsung ke port FastAPI (http://localhost:8000/api/dataset/upload)."
        },
        { status: 410 } // 410 Gone
    );
}