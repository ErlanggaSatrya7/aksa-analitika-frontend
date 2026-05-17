"use client";
import React, { useState } from 'react';
import { X, User, BellRing, ShieldCheck, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: {
        name: string;
        email: string;
        role: string;
        avatar: string;
    };
}

export default function SettingsModal({ isOpen, onClose, userData }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState('profil');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-end md:items-center justify-center sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-t-[32px] md:rounded-[32px] w-full max-w-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full md:zoom-in-95 md:slide-in-from-bottom-4 flex flex-col md:flex-row h-[90vh] md:h-auto md:min-h-[500px]">

                {/* Header Mobile & Tombol Close (Khusus HP) */}
                <div className="flex md:hidden items-center justify-between p-6 pb-4 border-b border-slate-100 shrink-0">
                    <h3 className="font-bold text-xl text-slate-900 tracking-tight">Pengaturan</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tombol Close Absolute (Khusus Laptop/Desktop) */}
                <button onClick={onClose} className="hidden md:flex absolute top-6 right-6 z-10 p-2.5 bg-slate-50 border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-full transition-colors">
                    <X size={20} />
                </button>

                {/* NAVIGASI TAB */}
                <div className="w-full md:w-[280px] bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-4 md:p-6 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto custom-scrollbar hide-scrollbar-on-mobile">
                    <h3 className="font-bold text-lg text-slate-900 mb-4 px-2 hidden md:block">Pengaturan</h3>

                    <button onClick={() => setActiveTab('profil')} className={`shrink-0 flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-sm font-semibold transition-all ${activeTab === 'profil' ? 'bg-white text-[#6A7BFA] shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}>
                        <User size={18} className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" /> Profil Saya
                    </button>
                    <button onClick={() => setActiveTab('notifikasi')} className={`shrink-0 flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-sm font-semibold transition-all ${activeTab === 'notifikasi' ? 'bg-white text-[#6A7BFA] shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}>
                        <BellRing size={18} className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" /> Notifikasi Sistem
                    </button>
                    <button onClick={() => setActiveTab('keamanan')} className={`shrink-0 flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-sm font-semibold transition-all ${activeTab === 'keamanan' ? 'bg-white text-[#6A7BFA] shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}>
                        <ShieldCheck size={18} className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" /> Keamanan
                    </button>
                </div>

                {/* KONTEN AKTIF */}
                <div className="w-full p-6 md:p-8 flex flex-col relative flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-8">

                    {activeTab === 'profil' && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <h4 className="font-bold text-xl text-slate-900 mb-6 hidden md:block">Informasi Dasar</h4>
                            <div className="flex items-center gap-5 mb-8">
                                <img src={userData.avatar} alt="Profile" className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-md border-4 border-[#EDF2FE]" />
                                <button className="text-xs md:text-sm font-bold text-[#6A7BFA] bg-[#EDF2FE] hover:bg-[#D2DCFC] px-4 py-2.5 rounded-full transition-colors">Ubah Foto</button>
                            </div>
                            <div className="space-y-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Nama Lengkap</label><input type="text" defaultValue={userData.name} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-[20px] px-4 py-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6A7BFA]/20" /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Email Perusahaan</label><input type="email" defaultValue={userData.email} disabled className="w-full mt-1 bg-slate-100 border border-slate-200 rounded-[20px] px-4 py-3.5 text-sm font-semibold text-slate-400 cursor-not-allowed" /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Otorisasi Akun</label><input type="text" defaultValue={userData.role} disabled className="w-full mt-1 bg-slate-100 border border-slate-200 rounded-[20px] px-4 py-3.5 text-sm font-semibold text-slate-400 cursor-not-allowed" /></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifikasi' && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <h4 className="font-bold text-xl text-slate-900 mb-6 hidden md:block">Preferensi Alert</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 md:p-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
                                    <div className="flex gap-4 items-center">
                                        <div className="p-3 bg-red-50 text-red-500 rounded-xl hidden sm:block"><AlertTriangle size={20} /></div>
                                        <div><p className="font-bold text-sm text-slate-800">System Error Alert</p><p className="text-xs text-slate-500 mt-0.5">Kirim email jika performa drop.</p></div>
                                    </div>
                                    <div className="w-12 h-7 bg-[#6A7BFA] rounded-full relative cursor-pointer shadow-inner shrink-0"><div className="w-5 h-5 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'keamanan' && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <h4 className="font-bold text-xl text-slate-900 mb-6 hidden md:block">Keamanan Akun</h4>
                            <div className="space-y-4 mb-8">
                                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Kata Sandi Saat Ini</label><input type="password" placeholder="••••••••" className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-[20px] px-4 py-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6A7BFA]/20" /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Kata Sandi Baru</label><input type="password" placeholder="Minimal 8 karakter" className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-[20px] px-4 py-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6A7BFA]/20" /></div>
                            </div>
                        </div>
                    )}

                    <div className="mt-auto pt-8 flex justify-end">
                        <button onClick={onClose} className="w-full md:w-auto px-8 py-3.5 bg-[#6A7BFA] text-white font-bold text-sm rounded-[40px] shadow-lg hover:bg-[#5869E8] transition-all active:scale-95">
                            Simpan Perubahan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}