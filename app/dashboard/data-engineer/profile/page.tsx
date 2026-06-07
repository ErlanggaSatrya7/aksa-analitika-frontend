"use client";
import React, { useState } from 'react';
import { User, BellRing, ShieldCheck, AlertTriangle, CheckCircle2, Loader2, Key, Database, Activity, Fingerprint } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function DataEngineerProfilePage() {
    const { data: session, status } = useSession();
    const user = session?.user as any;

    const [activeTab, setActiveTab] = useState('profil');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'warning' } | null>(null);

    // Dummy state untuk toggle
    const [notifState, setNotifState] = useState({
        pipelineError: true,
        retrainingSuccess: true,
        dataAnomaly: false,
    });

    const handleSave = () => {
        setToast({ message: "Konfigurasi akun berhasil diperbarui dan disinkronisasi.", type: 'success' });
        setTimeout(() => setToast(null), 3000);
    };

    // Ekstrak data user dari session NextAuth
    const fullName = user?.name || 'Data Engineer';
    const email = user?.email || 'admin@aksa-analitika.com';
    const role = user?.role || 'DATA_ENGINEER';

    const avatarSeed = user?.email || 'data-engineer';
    const avatarUrl = user?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}`;

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 size={48} className="text-[#4f46e5] animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Memverifikasi kredensial...</p>
            </div>
        );
    }

    return (
        <div className="pb-10 max-w-6xl mx-auto animate-in fade-in duration-500 relative">

            {toast && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] flex items-center gap-3 z-[100] animate-in slide-in-from-top-5 duration-300 font-bold border text-sm ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <AlertTriangle size={20} className="text-amber-500" />}
                    {toast.message}
                </div>
            )}

            <div className="mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Manajemen Akun & Akses</h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola kredensial, kunci API, dan preferensi notifikasi sistem pipeline Anda.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8">

                {/* KIRI: SIDEBAR NAVIGASI TAB */}
                <div className="w-full md:w-[280px] shrink-0">
                    <div className="bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] p-2 md:p-4 grid grid-cols-3 md:flex md:flex-col gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
                        <button onClick={() => setActiveTab('profil')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 py-3 md:px-4 md:py-3.5 rounded-xl md:rounded-2xl transition-all ${activeTab === 'profil' ? 'bg-[#EDF2FE] text-[#6A7BFA] shadow-sm border border-[#6A7BFA]/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                            <User size={18} className="mb-0.5 md:mb-0" />
                            <span className="text-[11px] md:text-sm font-bold">Profil Inti</span>
                        </button>
                        <button onClick={() => setActiveTab('notifikasi')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 py-3 md:px-4 md:py-3.5 rounded-xl md:rounded-2xl transition-all ${activeTab === 'notifikasi' ? 'bg-[#EDF2FE] text-[#6A7BFA] shadow-sm border border-[#6A7BFA]/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                            <BellRing size={18} className="mb-0.5 md:mb-0" />
                            <span className="text-[11px] md:text-sm font-bold">Alert MLOps</span>
                        </button>
                        <button onClick={() => setActiveTab('keamanan')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 py-3 md:px-4 md:py-3.5 rounded-xl md:rounded-2xl transition-all ${activeTab === 'keamanan' ? 'bg-[#EDF2FE] text-[#6A7BFA] shadow-sm border border-[#6A7BFA]/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                            <ShieldCheck size={18} className="mb-0.5 md:mb-0" />
                            <span className="text-[11px] md:text-sm font-bold">Keamanan & API</span>
                        </button>
                    </div>
                </div>

                {/* KANAN: AREA KONTEN */}
                <div className="flex-1 bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 lg:p-10 min-h-[500px]">

                    {activeTab === 'profil' && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center justify-between mb-8">
                                <h4 className="font-bold text-xl md:text-2xl text-slate-900">Informasi Dasar</h4>
                                <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                                    <CheckCircle2 size={14} /> Kredensial Valid
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                                <div className="relative">
                                    <img src={avatarUrl} alt="Profile" className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover shadow-md border-4 border-white bg-slate-100" />
                                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{fullName}</h3>
                                        <p className="text-sm text-slate-500 font-mono text-xs mt-0.5">ID: DTE-8829-XJ</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button className="text-xs font-bold text-white bg-[#4f46e5] hover:bg-[#4338ca] px-5 py-2.5 rounded-full transition-colors shadow-sm active:scale-95">Ubah Avatar</button>
                                        <button className="text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 px-5 py-2.5 rounded-full transition-colors border border-slate-200">Hapus</button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                                <div>
                                    <label className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Nama Lengkap</label>
                                    <input type="text" defaultValue={fullName} className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6A7BFA]/20 focus:border-[#6A7BFA]" />
                                </div>
                                <div>
                                    <label className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Email Perusahaan</label>
                                    <input type="email" defaultValue={email} disabled className="w-full mt-2 bg-slate-100/70 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-400 cursor-not-allowed" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Level Otoritas Sistem</label>
                                    <input type="text" defaultValue={role.replace(/_/g, ' ')} disabled className="w-full mt-2 bg-slate-100/70 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-400 cursor-not-allowed uppercase" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifikasi' && (
                        <div className="animate-in fade-in slide-in-from-right-4 max-w-3xl">
                            <h4 className="font-bold text-xl md:text-2xl text-slate-900 mb-2">Preferensi Alert MLOps</h4>
                            <p className="text-sm text-slate-500 mb-8">Atur pemberitahuan untuk aktivitas pipeline dan model Machine Learning.</p>

                            <div className="space-y-4">
                                {/* Error Pipeline */}
                                <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 border rounded-3xl gap-4 transition-colors ${notifState.pipelineError ? 'bg-[#EDF2FE]/40 border-[#6A7BFA]/30' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex gap-4 items-center">
                                        <div className={`p-3.5 rounded-2xl hidden sm:flex items-center justify-center ${notifState.pipelineError ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-400'}`}>
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm md:text-base ${notifState.pipelineError ? 'text-slate-900' : 'text-slate-500'}`}>Kegagalan Pipeline & ETL</p>
                                            <p className="text-xs md:text-sm text-slate-500 mt-1">Kirim peringatan instan jika injeksi data ke PostgreSQL gagal.</p>
                                        </div>
                                    </div>
                                    <div onClick={() => setNotifState(s => ({ ...s, pipelineError: !s.pipelineError }))} className={`w-14 h-8 rounded-full relative cursor-pointer shadow-inner shrink-0 transition-colors ${notifState.pipelineError ? 'bg-[#4f46e5]' : 'bg-slate-300'}`}>
                                        <div className={`w-6 h-6 bg-white rounded-full absolute top-1 shadow-sm transition-all ${notifState.pipelineError ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </div>

                                {/* Retraining Success */}
                                <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 border rounded-3xl gap-4 transition-colors ${notifState.retrainingSuccess ? 'bg-[#EDF2FE]/40 border-[#6A7BFA]/30' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex gap-4 items-center">
                                        <div className={`p-3.5 rounded-2xl hidden sm:flex items-center justify-center ${notifState.retrainingSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                            <Activity size={24} />
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm md:text-base ${notifState.retrainingSuccess ? 'text-slate-900' : 'text-slate-500'}`}>Pembaruan Model AI (Champion)</p>
                                            <p className="text-xs md:text-sm text-slate-500 mt-1">Notifikasi jika model Challenger berhasil mengalahkan model lama.</p>
                                        </div>
                                    </div>
                                    <div onClick={() => setNotifState(s => ({ ...s, retrainingSuccess: !s.retrainingSuccess }))} className={`w-14 h-8 rounded-full relative cursor-pointer shadow-inner shrink-0 transition-colors ${notifState.retrainingSuccess ? 'bg-[#4f46e5]' : 'bg-slate-300'}`}>
                                        <div className={`w-6 h-6 bg-white rounded-full absolute top-1 shadow-sm transition-all ${notifState.retrainingSuccess ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </div>

                                {/* Data Anomaly */}
                                <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 border rounded-3xl gap-4 transition-colors ${notifState.dataAnomaly ? 'bg-[#EDF2FE]/40 border-[#6A7BFA]/30' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex gap-4 items-center">
                                        <div className={`p-3.5 rounded-2xl hidden sm:flex items-center justify-center ${notifState.dataAnomaly ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'}`}>
                                            <Database size={24} />
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm md:text-base ${notifState.dataAnomaly ? 'text-slate-900' : 'text-slate-500'}`}>Deteksi Anomali Data Baru</p>
                                            <p className="text-xs md:text-sm text-slate-500 mt-1">Kirim email jika dataset yang diunggah memiliki banyak Missing Values.</p>
                                        </div>
                                    </div>
                                    <div onClick={() => setNotifState(s => ({ ...s, dataAnomaly: !s.dataAnomaly }))} className={`w-14 h-8 rounded-full relative cursor-pointer shadow-inner shrink-0 transition-colors ${notifState.dataAnomaly ? 'bg-[#4f46e5]' : 'bg-slate-300'}`}>
                                        <div className={`w-6 h-6 bg-white rounded-full absolute top-1 shadow-sm transition-all ${notifState.dataAnomaly ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'keamanan' && (
                        <div className="animate-in fade-in slide-in-from-right-4 max-w-3xl">
                            <h4 className="font-bold text-xl md:text-2xl text-slate-900 mb-6 md:mb-8">Autentikasi & Akses Pihak Ketiga</h4>

                            <div className="space-y-8">
                                {/* Ganti Password */}
                                <div className="space-y-5 md:space-y-6">
                                    <div>
                                        <label className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Kata Sandi Saat Ini</label>
                                        <input type="password" placeholder="••••••••" className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6A7BFA]/20 focus:border-[#6A7BFA]" />
                                    </div>
                                    <div>
                                        <label className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Kata Sandi Baru</label>
                                        <input type="password" placeholder="Minimal 8 karakter" className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6A7BFA]/20 focus:border-[#6A7BFA]" />
                                    </div>
                                </div>

                                {/* API Key Section */}
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h5 className="font-bold text-slate-900 flex items-center gap-2">
                                                <Key size={18} className="text-[#4f46e5]" /> Aksa FastAPI Token
                                            </h5>
                                            <p className="text-sm text-slate-500 mt-1 mb-4">Gunakan token ini untuk mengakses endpoint ML prediksi di luar dashboard.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <input type="password" disabled defaultValue="aksa_sec_99823bx8y1293h812" className="flex-1 bg-slate-100 border border-slate-200 rounded-[20px] px-5 py-3 text-sm font-mono text-slate-600" />
                                        <button className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 font-bold text-sm text-slate-700 rounded-[20px] transition-colors shadow-sm active:scale-95">Regenerate</button>
                                    </div>
                                </div>

                                {/* 2FA Section */}
                                <div className="p-5 md:p-6 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex gap-4 items-center">
                                        <div className="p-3 bg-slate-200 text-slate-500 rounded-2xl hidden sm:block"><Fingerprint size={24} /></div>
                                        <div>
                                            <h5 className="font-bold text-slate-900">Autentikasi Dua Faktor (2FA)</h5>
                                            <p className="text-xs md:text-sm text-slate-500 mt-1">Lapisan keamanan tambahan belum diaktifkan.</p>
                                        </div>
                                    </div>
                                    <button className="px-5 py-2.5 bg-white border-2 border-slate-200 hover:border-[#6A7BFA] hover:text-[#4f46e5] font-bold text-sm text-slate-600 rounded-full transition-all shadow-sm w-full sm:w-auto">Aktifkan</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-100 flex justify-end">
                        <button onClick={handleSave} className="w-full md:w-auto px-8 md:px-10 py-3.5 md:py-4 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white font-bold text-sm rounded-[40px] shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95">
                            Simpan Perubahan
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}