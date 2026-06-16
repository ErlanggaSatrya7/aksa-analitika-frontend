"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, AlertTriangle, CheckCircle2, Loader2, Store } from 'lucide-react';

export default function StoreProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const user = session?.user as any;

    const email = user?.email || '';
    const storeId = user?.retailerId || 'Menunggu ID...';
    const avatarSeed = user?.email || 'store-spv';

    const [realStoreName, setRealStoreName] = useState('Memuat nama toko...');
    const [storeLocation, setStoreLocation] = useState('Memuat Lokasi...');

    const [toast, setToast] = useState<{ message: string, type: 'success' | 'warning' } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (email) {
            fetch(`/api/user/profile?email=${email}`)
                .then(res => res.json())
                .then(data => {
                    // Set Nama Toko
                    if (data?.retailer?.name) {
                        setRealStoreName(data.retailer.name);
                    } else {
                        setRealStoreName('Nama Toko Belum Disetel');
                    }

                    // Set Lokasi (HANYA PROVINSI)
                    const state = data?.assignedState || user?.assignedState || '...';
                    setStoreLocation(`Provinsi ${state}`);
                })
                .catch(err => console.error("Gagal mengambil data profil:", err));
        }
    }, [email, user?.assignedState]);

    useEffect(() => {
        if (user?.name) setNewName(user.name);
    }, [user?.name]);

    const showToast = (message: string, type: 'success' | 'warning') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async () => {
        if (!email) return;
        setIsSaving(true);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, fullName: newName, currentPassword: '', newPassword: '' })
            });

            const data = await res.json();

            if (res.ok) {
                showToast(data.message || "Profil berhasil diperbarui", 'success');
                await update({ name: newName });
                router.refresh();
            } else {
                showToast(data.error || "Gagal menyimpan perubahan", 'warning');
            }
        } catch (error) {
            showToast("Terjadi kesalahan jaringan", 'warning');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="pb-12 max-w-4xl mx-auto animate-in fade-in duration-700 relative">
            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-[40px] shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-top-5 duration-300 font-bold border text-sm w-[90%] max-w-sm ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertTriangle size={20} className="shrink-0" />}
                    <p className="leading-tight">{toast.message}</p>
                </div>
            )}

            <div className="mb-8 text-center md:text-left">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Profil Supervisor</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">Kelola informasi dasar akun operasional {realStoreName}.</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-8 lg:p-12">
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}`} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-[#EDF2FE]" />
                    <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                        <button className="text-sm font-bold text-white bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] px-6 py-3 rounded-full transition-all shadow-md active:scale-95">Ganti Foto</button>
                        <button className="text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 px-6 py-3 rounded-full transition-colors border border-slate-200">Hapus</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-2">Nama Supervisor</label>
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-[24px] px-5 py-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] transition-all" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-2">Email Akses</label>
                        <input type="email" value={email} disabled className="w-full mt-2 bg-slate-100/50 border border-slate-200 rounded-[24px] px-5 py-4 text-sm font-semibold text-slate-400 cursor-not-allowed" />
                    </div>

                    {/* KOTAK KHUSUS NAMA TOKO */}
                    <div className="md:col-span-2">
                        <label className="text-[11px] font-bold text-[#4f46e5] uppercase tracking-widest ml-2">Nama Retailer / Cabang</label>
                        <div className="relative mt-2">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Store size={18} className="text-[#4f46e5]" />
                            </div>
                            <input type="text" value={realStoreName} disabled className="w-full bg-[#EDF2FE]/50 border border-[#C7D2FE] rounded-[24px] pl-12 pr-5 py-4 text-base font-black text-[#4f46e5] cursor-not-allowed shadow-inner" />
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-2">ID Database Cabang</label>
                        <input type="text" value={storeId} disabled className="w-full mt-2 bg-slate-100/50 border border-slate-200 rounded-[24px] px-5 py-4 text-sm font-bold font-mono text-slate-400 cursor-not-allowed" />
                    </div>

                    {/* LOKASI PENUGASAN (HANYA PROVINSI) */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-2">Lokasi Penugasan</label>
                        <input type="text" value={storeLocation} disabled className="w-full mt-2 bg-slate-100/50 border border-slate-200 rounded-[24px] px-5 py-4 text-sm font-bold text-slate-600 cursor-not-allowed" />
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white font-bold text-sm rounded-[40px] shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_25px_rgba(79,70,229,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70">
                        {isSaving ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</> : "Simpan Perubahan Profil"}
                    </button>
                </div>
            </div>
        </div>
    );
}