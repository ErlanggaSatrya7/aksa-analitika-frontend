"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<{ type: 'error' | 'success' | null, message: string }>({ type: null, message: '' });
    const [isLoading, setIsLoading] = useState(false);

    // Jika tidak ada token di URL, langsung tolak
    if (!token) {
        return (
            <div className="text-center text-red-600 font-medium">
                Akses ditolak. Link undangan tidak lengkap.
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: null, message: '' });

        if (password !== confirmPassword) {
            setStatus({ type: 'error', message: 'Password tidak cocok. Silakan periksa kembali.' });
            return;
        }

        if (password.length < 6) {
            setStatus({ type: 'error', message: 'Password harus terdiri dari minimal 6 karakter.' });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/set-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setStatus({ type: 'error', message: data.error });
            } else {
                setStatus({ type: 'success', message: 'Akun berhasil diaktifkan! Mengarahkan ke halaman masuk...' });
                // Tunggu 2 detik agar user sempat membaca pesan sukses, lalu arahkan ke login
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Koneksi terputus. Silakan coba lagi.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Aktivasi Akun</h1>
                <p className="text-gray-600">Buat password untuk mengamankan akun Anda.</p>
            </div>

            {status.message && (
                <div className={`p-4 mb-6 rounded-md border ${status.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    {status.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password Baru</label>
                    <input
                        type="password"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Masukkan password..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ulangi Password Baru</label>
                    <input
                        type="password"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Ketik ulang password..."
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full p-3 rounded-lg font-bold text-white transition-colors ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {isLoading ? 'Menyimpan...' : 'Simpan dan Aktifkan Akun'}
                </button>
            </form>
        </div>
    );
}

export default function SetPasswordPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Suspense fallback={<div className="text-center text-gray-600">Memuat formulir...</div>}>
                <SetPasswordForm />
            </Suspense>
        </div>
    );
}