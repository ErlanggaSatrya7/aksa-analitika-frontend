"use client";
import React, { useState, useEffect } from 'react';
import { Inbox, CheckCircle2, XCircle, Send, MapPin, AlertTriangle, Clock, Check, Plus, Loader2 } from 'lucide-react';

// Mendefinisikan tipe data sesuai database Supabase (Prisma)
interface LogisticRequest {
    id: string;
    productCategory: string;
    qtyRequested: number;
    status: string;
    createdAt: string;
    retailer: {
        name: string;
        city: string;
        state: string;
    };
}

export default function AdminInboxPage() {
    const [activeTab, setActiveTab] = useState('masuk');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [inboxItems, setInboxItems] = useState<LogisticRequest[]>([]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // MENGAMBIL DATA PERMINTAAN LOGISTIK DARI DATABASE
    const fetchInboxData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/inbox');
            if (res.ok) {
                const data = await res.json();
                setInboxItems(data);
            }
        } catch (error) {
            console.error("Gagal menarik data inbox:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInboxData();
    }, []);

    // FUNGSI UPDATE KE DATABASE: APPROVE (APPROVED_CENTER)
    const handleApprove = async (id: string) => {
        setIsActionLoading(id);
        try {
            const res = await fetch('/api/admin/inbox', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'APPROVED_CENTER' })
            });

            if (res.ok) {
                setInboxItems(items => items.map(item => item.id === id ? { ...item, status: 'APPROVED_CENTER' } : item));
                showToast("Instruksi berhasil disetujui dan didelegasikan ke Provinsi.", "success");
            } else {
                showToast("Gagal menyetujui permintaan.", "error");
            }
        } catch (error) {
            showToast("Terjadi kesalahan sistem.", "error");
        } finally {
            setIsActionLoading(null);
        }
    };

    // FUNGSI UPDATE KE DATABASE: REJECT (REJECTED)
    const handleReject = async (id: string) => {
        setIsActionLoading(id);
        try {
            const res = await fetch('/api/admin/inbox', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'REJECTED' })
            });

            if (res.ok) {
                setInboxItems(items => items.map(item => item.id === id ? { ...item, status: 'REJECTED' } : item));
                showToast("Instruksi/Permohonan Provinsi ditolak.", "error");
            } else {
                showToast("Gagal menolak permintaan.", "error");
            }
        } catch (error) {
            showToast("Terjadi kesalahan sistem.", "error");
        } finally {
            setIsActionLoading(null);
        }
    };

    // Format Tanggal (CreatedAt)
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
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
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola perizinan Provinsi dan broadcast kebijakan skala Nasional.</p>
                </div>
                <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:shadow-lg transition-all active:scale-95">
                    <Plus size={18} /> Buat Memo Baru
                </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden min-h-[500px] flex flex-col">
                <div className="flex border-b border-slate-100 px-6 md:px-8 pt-6 gap-6">
                    <button onClick={() => setActiveTab('masuk')} className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'masuk' ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <div className="flex items-center gap-2">
                            <Inbox size={18} /> Kotak Masuk
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full leading-none shadow-sm">
                                {inboxItems.filter(i => i.status.includes('PENDING')).length}
                            </span>
                        </div>
                    </button>
                    <button onClick={() => setActiveTab('terkirim')} className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'terkirim' ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <div className="flex items-center gap-2">
                            <Send size={18} /> Memo Terkirim
                        </div>
                    </button>
                </div>

                <div className="p-6 md:p-8 flex-1 bg-slate-50/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-[#6A7BFA] gap-3">
                            <Loader2 size={32} className="animate-spin" />
                            <span className="font-bold text-sm">Menyinkronkan Database...</span>
                        </div>
                    ) : activeTab === 'masuk' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                            {inboxItems.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 font-medium">Tidak ada permohonan logistik masuk.</div>
                            ) : inboxItems.map((item) => (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="mt-1 shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-[#EDF2FE] text-[#4f46e5]">
                                                <MapPin size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-slate-900 text-base">Permintaan Tambahan {item.productCategory}</h4>

                                                    {/* LOGIC BADGE STATUS DARI DATABASE */}
                                                    {item.status.includes('PENDING') && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-amber-200">Menunggu</span>}
                                                    {item.status.includes('APPROVED') && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-emerald-200">Disetujui</span>}
                                                    {item.status === 'REJECTED' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-red-200">Ditolak</span>}
                                                </div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Dari: {item.retailer.name} - {item.retailer.city}, {item.retailer.state}</p>
                                                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                                                    Mengajukan permohonan rilis kuota suplai <strong>{item.productCategory}</strong> sebesar <strong>{(item.qtyRequested).toLocaleString('id-ID')} Pcs</strong> dari gudang pusat untuk mengantisipasi potensi defisit inventaris wilayah.
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-slate-400">
                                                    <Clock size={14} /> {formatTime(item.createdAt)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* HANYA MUNCUL JIKA STATUS PENDING */}
                                        {item.status.includes('PENDING') && (
                                            <div className="flex items-center gap-2 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-slate-100 md:border-none shrink-0 w-full md:w-auto">
                                                <button onClick={() => handleReject(item.id)} disabled={isActionLoading === item.id} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50">
                                                    {isActionLoading === item.id ? <Loader2 size={16} className="animate-spin" /> : <><XCircle size={16} /> Tolak</>}
                                                </button>
                                                <button onClick={() => handleApprove(item.id)} disabled={isActionLoading === item.id} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white font-bold text-xs hover:shadow-lg transition-all shadow-sm active:scale-95 disabled:opacity-50">
                                                    {isActionLoading === item.id ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Setujui Anggaran</>}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'terkirim' && (
                        <div className="flex flex-col items-center justify-center h-64 animate-in fade-in">
                            <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4">
                                <Send size={28} className="ml-1" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-700">Belum ada Memo terkirim</h4>
                            <p className="text-sm text-slate-500 mt-1">Kebijakan yang Anda broadcast ke tabel Notifications akan muncul di sini.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}