"use client";
import React, { useState } from 'react';
import { User, BellRing, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DataEngineerProfilePage() {
    const [activeTab, setActiveTab] = useState('profil');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'warning' } | null>(null);

    const handleSave = () => {
        setToast({ message: "Profil berhasil diperbarui", type: 'success' });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <div className="pb-10 max-w-6xl mx-auto animate-in fade-in duration-500 relative">

            {toast && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-[40px] shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-top-5 duration-300 font-bold border text-sm ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                    {toast.message}
                </div>
            )}

            <div className="mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Manajemen Akun</h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola kredensial dan preferensi notifikasi sistem pipeline Anda.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8">

                {/* KIRI: SIDEBAR NAVIGASI TAB (Grid di Mobile) */}
                <div className="w-full md:w-[280px] shrink-0">
                    <div className="bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] p-2 md:p-4 grid grid-cols-3 md:flex md:flex-col gap-2 shadow-sm md:shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
                        <button onClick={() => setActiveTab('profil')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 py-3 md:px-4 md:py-3.5 rounded-xl md:rounded-2xl transition-all ${activeTab === 'profil' ? 'bg-[#EDF2FE] text-[#6A7BFA] shadow-sm md:shadow-none border border-[#6A7BFA]/10 md:border-transparent' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                            <User size={18} className="mb-0.5 md:mb-0" />
                            <span className="text-[11px] md:text-sm font-bold">Profil</span>
                        </button>
                        <button onClick={() => setActiveTab('notifikasi')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 py-3 md:px-4 md:py-3.5 rounded-xl md:rounded-2xl transition-all ${activeTab === 'notifikasi' ? 'bg-[#EDF2FE] text-[#6A7BFA] shadow-sm md:shadow-none border border-[#6A7BFA]/10 md:border-transparent' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                            <BellRing size={18} className="mb-0.5 md:mb-0" />
                            <span className="text-[11px] md:text-sm font-bold">Notifikasi</span>
                        </button>
                        <button onClick={() => setActiveTab('keamanan')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 py-3 md:px-4 md:py-3.5 rounded-xl md:rounded-2xl transition-all ${activeTab === 'keamanan' ? 'bg-[#EDF2FE] text-[#6A7BFA] shadow-sm md:shadow-none border border-[#6A7BFA]/10 md:border-transparent' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                            <ShieldCheck size={18} className="mb-0.5 md:mb-0" />
                            <span className="text-[11px] md:text-sm font-bold">Keamanan</span>
                        </button>
                    </div>
                </div>

                {/* KANAN: AREA KONTEN */}
                <div className="flex-1 bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 lg:p-10 min-h-[500px]">

                    {activeTab === 'profil' && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <h4 className="font-bold text-xl md:text-2xl text-slate-900 mb-6 md:mb-8">Informasi Dasar</h4>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 md:mb-10 pb-8 md:pb-10 border-b border-slate-100">
                                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2.5&w=256&h=256&q=80" alt="Profile" className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover shadow-md border-4 border-[#EDF2FE]" />
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                    <button className="text-xs md:text-sm font-bold text-white bg-[#6A7BFA] hover:bg-[#5869E8] px-5 md:px-6 py-2.5 md:py-3 rounded-full transition-colors shadow-md active:scale-95">Ganti Foto</button>
                                    <button className="text-xs md:text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 px-5 md:px-6 py-2.5 md:py-3 rounded-full transition-colors border border-slate-200">Hapus</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                                <div>
                                    <label className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Nama Lengkap</label>
                                    <input type="text" defaultValue="Nadya Maharani" className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6A7BFA]/20 focus:border-[#6A7BFA]" />
                                </div>
                                <div>
                                    <label className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Email Perusahaan</label>
                                    <input type="email" defaultValue="nadya@aksa.com" disabled className="w-full mt-2 bg-slate-100 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-400 cursor-not-allowed" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Jabatan / Spesialisasi</label>
                                    <input type="text" defaultValue="Lead Data Engineer" disabled className="w-full mt-2 bg-slate-100 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-400 cursor-not-allowed" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifikasi' && (
                        <div className="animate-in fade-in slide-in-from-right-4 max-w-3xl">
                            <h4 className="font-bold text-xl md:text-2xl text-slate-900 mb-6 md:mb-8">Preferensi Alert</h4>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-slate-50 border border-slate-200 rounded-3xl gap-4">
                                    <div className="flex gap-4 items-center">
                                        <div className="p-3.5 bg-red-100 text-red-600 rounded-2xl hidden sm:block"><AlertTriangle size={24} /></div>
                                        <div>
                                            <p className="font-bold text-sm md:text-base text-slate-900">Pipeline Error Alert</p>
                                            <p className="text-xs md:text-sm text-slate-500 mt-1">Kirim email jika proses ETL harian gagal ditarik ke server.</p>
                                        </div>
                                    </div>
                                    <div className="w-14 h-8 bg-[#6A7BFA] rounded-full relative cursor-pointer shadow-inner shrink-0">
                                        <div className="w-6 h-6 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'keamanan' && (
                        <div className="animate-in fade-in slide-in-from-right-4 max-w-3xl">
                            <h4 className="font-bold text-xl md:text-2xl text-slate-900 mb-6 md:mb-8">Keamanan Akun</h4>
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
                        </div>
                    )}

                    <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-slate-100 flex justify-end">
                        <button onClick={handleSave} className="w-full md:w-auto px-8 md:px-10 py-3.5 md:py-4 bg-[#6A7BFA] text-white font-bold text-sm rounded-[40px] shadow-xl shadow-[#6A7BFA]/20 hover:bg-[#5869E8] hover:shadow-[#6A7BFA]/40 hover:-translate-y-0.5 transition-all active:scale-95">
                            Simpan Perubahan
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}