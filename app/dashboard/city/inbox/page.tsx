"use client";
import React, { useState } from 'react';
import { Inbox, CheckCircle2, XCircle, Send, PackagePlus, AlertTriangle, Clock, Check, Plus, Rocket } from 'lucide-react';

export default function CityInboxPage() {
    const [activeTab, setActiveTab] = useState('masuk');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const [inboxItems, setInboxItems] = useState([
        {
            id: 1,
            sender: "Eka Saputra (Supervisor Ramayana Plaza)",
            title: "Pengajuan Restock Urgent: Men's Street Footwear",
            desc: "Berdasarkan laporan AI Toko, sepatu kets pria ukuran 40-42 diprediksi habis besok sore. Mengajukan suplai darurat 100 pasang.",
            time: "30 Menit yang lalu",
            status: "pending",
            type: "request"
        },
        {
            id: 2,
            sender: "Sistem AI Forecasting (Auto-Generated)",
            title: "Peringatan Traffic Rendah - Marelan",
            desc: "Cabang Ramayana Marelan tidak mencapai target pengunjung harian selama 3 hari berturut-turut. Segera eksekusi intervensi promosi.",
            time: "2 Jam yang lalu",
            status: "pending",
            type: "alert"
        }
    ]);

    const handleApprove = (id: number) => {
        setInboxItems(items => items.map(item => item.id === id ? { ...item, status: 'approved' } : item));
        showToast("Permohonan diteruskan ke Manajer Provinsi (Regional).", "success");
    };

    const handleReject = (id: number) => {
        setInboxItems(items => items.map(item => item.id === id ? { ...item, status: 'rejected' } : item));
        showToast("Permohonan toko ditolak.", "error");
    };

    return (
        <div className="pb-10 max-w-6xl mx-auto animate-in fade-in duration-500 relative">

            {toast && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-[40px] shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-top-5 duration-300 font-bold border text-sm ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    {toast.message}
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Command Center</h2>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Evaluasi laporan supervisor toko dan eskalasi permohonan ke Provinsi.</p>
                </div>
                {/* UPDATE: Tombol Laporan ke Provinsi dengan Gradasi Premium */}
                <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] hover:shadow-lg text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-[0_8px_20px_rgba(79,70,229,0.3)] transition-all active:scale-95">
                    <Plus size={18} /> Laporan ke Provinsi
                </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden min-h-[500px] flex flex-col">

                <div className="flex border-b border-slate-100 px-6 md:px-8 pt-6 gap-6">
                    <button
                        onClick={() => setActiveTab('masuk')}
                        className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'masuk' ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Inbox size={18} /> Request Toko
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full leading-none shadow-sm">{inboxItems.filter(i => i.status === 'pending').length}</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('terkirim')}
                        className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'terkirim' ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Send size={18} /> Diteruskan ke Provinsi
                        </div>
                    </button>
                </div>

                <div className="p-6 md:p-8 flex-1 bg-slate-50/50">
                    {activeTab === 'masuk' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                            {inboxItems.map((item) => (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

                                        <div className="flex gap-4">
                                            <div className={`mt-1 shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${item.type === 'request' ? 'bg-[#EDF2FE] text-[#4f46e5]' : 'bg-amber-50 text-amber-500'}`}>
                                                {item.type === 'request' ? <PackagePlus size={24} /> : <AlertTriangle size={24} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-slate-900 text-base">{item.title}</h4>
                                                    {item.status === 'pending' && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-amber-200">Menunggu</span>}
                                                    {item.status === 'approved' && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-emerald-200">Diteruskan</span>}
                                                    {item.status === 'rejected' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-red-200">Ditolak</span>}
                                                </div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{item.sender}</p>
                                                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{item.desc}</p>

                                                <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-slate-400">
                                                    <Clock size={14} /> {item.time}
                                                </div>
                                            </div>
                                        </div>

                                        {item.status === 'pending' && (
                                            <div className="flex items-center gap-2 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-slate-100 md:border-none shrink-0 w-full md:w-auto">
                                                <button onClick={() => handleReject(item.id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors active:scale-95">
                                                    <XCircle size={16} /> Tolak
                                                </button>
                                                {/* UPDATE: Tombol Approve dengan Gradasi */}
                                                <button onClick={() => handleApprove(item.id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white font-bold text-xs hover:shadow-lg transition-all shadow-sm active:scale-95">
                                                    <Check size={16} /> Teruskan ke Provinsi
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'terkirim' && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[350px] animate-in fade-in slide-in-from-bottom-4">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-[#EDF2FE] rounded-full blur-[40px] scale-150"></div>
                                <div className="w-24 h-24 bg-white border border-slate-100 shadow-xl rounded-full flex items-center justify-center relative z-10 text-[#4f46e5]">
                                    <Rocket size={40} className="animate-float" />
                                </div>
                            </div>
                            <h4 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Eskalasi Laporan</h4>
                            <p className="text-sm text-slate-500 max-w-sm text-center leading-relaxed">
                                Permohonan dari toko yang Anda teruskan ke Manajer Provinsi akan muncul di tab ini.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}