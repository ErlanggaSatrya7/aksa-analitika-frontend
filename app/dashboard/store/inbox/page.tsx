"use client";
import React, { useState } from 'react';
import { Inbox, Send, AlertTriangle, Clock, Plus, CheckCircle2, MessageSquare, XCircle } from 'lucide-react';

export default function StoreInboxPage() {
    const [activeTab, setActiveTab] = useState('masuk');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Dummy Data untuk Store Supervisor
    const [inboxItems, setInboxItems] = useState([
        {
            id: 1,
            sender: "Citra Lestari (Manager Kota)",
            title: "Memo: Persiapan Diskon Akhir Bulan",
            desc: "Pusat telah mengaktifkan mode Flash Sale. Harap pindahkan stok baju anak dan sneakers kategori diskon ke display depan mulai besok pagi.",
            time: "1 Jam yang lalu",
            type: "memo"
        }
    ]);

    return (
        <div className="pb-10 max-w-6xl mx-auto animate-in fade-in duration-500 relative">

            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-[40px] shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-top-5 duration-300 font-bold border text-sm ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    {toast.message}
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Kotak Masuk</h2>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Terima memo dari Manajer Kota dan ajukan permintaan suplai barang.</p>
                </div>
                <button
                    onClick={() => showToast("Fitur pembuatan permohonan sedang disiapkan", "success")}
                    className="flex items-center justify-center gap-2 bg-[#6A7BFA] hover:bg-[#5869E8] text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-[0_8px_20px_rgba(106,123,250,0.3)] transition-all active:scale-95"
                >
                    <Plus size={18} /> Buat Permohonan
                </button>
            </div>

            {/* KONTEN UTAMA */}
            <div className="bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden min-h-[500px] flex flex-col">

                {/* TAB NAVIGASI */}
                <div className="flex border-b border-slate-100 px-6 md:px-8 pt-6 gap-6">
                    <button
                        onClick={() => setActiveTab('masuk')}
                        className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'masuk' ? 'border-[#6A7BFA] text-[#6A7BFA]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Inbox size={18} /> Memo Diterima
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full leading-none">{inboxItems.length}</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('terkirim')}
                        className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'terkirim' ? 'border-[#6A7BFA] text-[#6A7BFA]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Send size={18} /> Permohonan Saya
                        </div>
                    </button>
                </div>

                {/* KONTEN BERDASARKAN TAB */}
                <div className="p-6 md:p-8 flex-1 bg-slate-50/50">
                    {activeTab === 'masuk' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                            {inboxItems.map((item) => (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex gap-4">
                                        <div className="mt-1 shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-[#6A7BFA]">
                                            <MessageSquare size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-base mb-1">{item.title}</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Dari: {item.sender}</p>
                                            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{item.desc}</p>
                                            <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-slate-400">
                                                <Clock size={14} /> {item.time}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ILUSTRASI EMPTY STATE - PERMOHONAN SAYA */}
                    {activeTab === 'terkirim' && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[350px] animate-in fade-in slide-in-from-bottom-4">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-[#EDF2FE] rounded-full blur-[40px] scale-150"></div>
                                <div className="w-24 h-24 bg-white border border-slate-100 shadow-xl rounded-full flex items-center justify-center relative z-10 text-[#6A7BFA]">
                                    <CheckCircle2 size={40} className="animate-float" />
                                </div>
                            </div>
                            <h4 className="text-xl font-bold text-slate-800 mb-2">Semua Transaksi Normal</h4>
                            <p className="text-sm text-slate-500 max-w-sm text-center leading-relaxed">
                                Anda belum membuat permohonan darurat (seperti restock akibat AI) ke Manajer Kota.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}