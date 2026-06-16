"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const user = session?.user as any;

    const email = user?.email || 'Memuat...';
    // Menyesuaikan role agar rapi saat ditampilkan
    const roleFormat = user?.role === 'SUPER_ADMIN' ? 'Super Admin Nasional' : 'Data Engineer';
    const avatarSeed = user?.email || 'admin-seed';

    const [toast, setToast] = useState<{ message: string, type: 'success' | 'warning' } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // State untuk form edit nama
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (user?.name) setNewName(user.name);
    }, [user?.name]);

    const handleSave = async () => {
        if (email === 'Memuat...') return;
        setIsSaving(true);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                // Mengirim password kosong karena kita hilangkan form password agar lebih aman & rapi
                body: JSON.stringify({ email, fullName: newName, currentPassword: '', newPassword: '' })
            });

            const data = await res.json();

            if (res.ok) {
                setToast({ message: data.message || "Profil berhasil diperbarui.", type: 'success' });
                // Memperbarui session lokal agar nama langsung berubah tanpa perlu logout
                await update({ name: newName });
                router.refresh();
            } else {
                setToast({ message: data.error || "Gagal memperbarui profil.", type: 'warning' });
            }
        } catch (error) {
            setToast({ message: "Terjadi kesalahan jaringan", type: 'warning' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setToast(null), 4000);
        }
    };

    return (
        <div className="pb-10 max-w-4xl mx-auto animate-in fade-in duration-500 relative">

            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-[40px] shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-top-5 duration-300 font-bold border text-sm w-[90%] max-w-sm ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertTriangle size={20} className="shrink-0" />}
                    <p className="leading-tight">{toast.message}</p>
                </div>
            )}

            {/* HEADER */}
            <div className="mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Profil Pengguna</h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">Kelola informasi dasar akun eksekutif pusat Anda.</p>
            </div>

            {/* KARTU PROFIL */}
            <div className="bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 lg:p-10 flex flex-col justify-between">
                <div>

                    {/* BAGIAN FOTO PROFIL */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 md:mb-10 pb-8 md:pb-10 border-b border-slate-100">
                        <img
                            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}`}
                            alt="Profile"
                            className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover shadow-md border-4 border-[#EDF2FE] bg-slate-50"
                        />
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            <button className="text-xs md:text-sm font-bold text-white bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] px-5 md:px-6 py-2.5 md:py-3 rounded-full transition-all shadow-md active:scale-95 hover:shadow-lg">
                                Ganti Foto
                            </button>
                        </div>
                    </div>

                    {/* FORMULIR DATA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Nama Lengkap</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Email Perusahaan</label>
                            <input
                                type="email"
                                value={email}
                                readOnly
                                disabled
                                className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-400 cursor-not-allowed"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Jabatan (Role Otorisasi)</label>
                            <input
                                type="text"
                                value={roleFormat}
                                readOnly
                                disabled
                                className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-400 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* TOMBOL SIMPAN */}
                <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full md:w-auto px-8 md:px-10 py-3.5 md:py-4 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white font-bold text-sm rounded-[40px] shadow-xl shadow-[#4f46e5]/20 hover:shadow-[#4f46e5]/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {isSaving ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
                    </button>
                </div>
            </div>
        </div>
    );
}