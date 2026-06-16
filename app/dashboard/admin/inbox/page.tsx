"use client";
import React, { useState, useEffect } from 'react';
import {
    Inbox, CheckCircle2, XCircle, Clock, Check,
    Loader2, Store, Package, AlertTriangle, ShieldAlert
} from 'lucide-react';

// Mendefinisikan tipe data sesuai skema Prisma TERBARU
interface LogisticRequest {
    id: string;
    productCategory: string;
    qtyRequested: number;
    status: string;
    createdAt: string;
    retailer: {
        name: string;
        // city dan state sudah dihapus dari tabel retailer di skema terbaru
    };
}

export default function AdminInboxPage() {
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [inboxItems, setInboxItems] = useState<LogisticRequest[]>([]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
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
                showToast("Instruksi berhasil disetujui dan didelegasikan.", "success");
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
                showToast("Permohonan logistik ditolak.", "error");
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
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
    };

    const pendingCount = inboxItems.filter(i => i.status.includes('PENDING')).length;

    return (
        <div className="pb-12 max-w-6xl mx-auto animate-in fade-in duration-700 relative">

            {/* LOKAL TOAST NOTIFICATION */}
            {toast && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-[40px] shadow-2xl flex items-center gap-3 z-[150] animate-in slide-in-from-top-5 duration-300 font-bold border text-sm w-[90%] max-w-sm ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertTriangle size={20} className="shrink-0" />}
                    <p className="leading-tight">{toast.message}</p>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Command Center</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                        <ShieldAlert size={16} className="text-indigo-500" />
                        Kelola dan tinjau eskalasi permohonan logistik dari jaringan retailer.
                    </p>
                </div>
            </div>

            {/* INBOX CONTAINER */}
            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden min-h-[500px] flex flex-col relative">
                <div className="px-8 pt-8 pb-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 z-10">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2.5 text-lg">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Inbox size={20} /></div>
                        Permohonan Masuk
                    </h3>
                    {pendingCount > 0 && (
                        <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm animate-pulse">
                            {pendingCount} Menunggu Respons
                        </span>
                    )}
                </div>

                <div className="p-6 md:p-8 flex-1 bg-[#F8FAFC]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-indigo-500 gap-4">
                            <Loader2 size={36} className="animate-spin" />
                            <span className="font-bold text-sm tracking-widest uppercase text-slate-500">Menyinkronkan Database...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4">
                            {inboxItems.length === 0 ? (
                                <div className="text-center py-16 flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-5">
                                        <Inbox size={36} />
                                    </div>
                                    <h4 className="font-bold text-lg text-slate-700">Inbox Kosong</h4>
                                    <p className="text-sm text-slate-400 font-medium mt-1">Tidak ada permohonan logistik yang memerlukan tindakan saat ini.</p>
                                </div>
                            ) : inboxItems.map((item) => (
                                <div key={item.id} className="bg-white border border-slate-100 rounded-[32px] p-6 lg:p-8 shadow-sm hover:shadow-[0_8px_30px_rgba(79,70,229,0.06)] transition-all duration-300 group">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

                                        <div className="flex gap-5">
                                            <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100/50 shadow-sm group-hover:scale-105 transition-transform">
                                                <Package size={26} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-bold text-slate-900 text-lg tracking-tight">Eskalasi Suplai: {item.productCategory}</h4>

                                                    {/* LOGIC BADGE STATUS DARI DATABASE */}
                                                    {item.status.includes('PENDING') && <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border border-amber-200">Menunggu</span>}
                                                    {item.status.includes('APPROVED') && <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border border-emerald-200">Disetujui</span>}
                                                    {item.status === 'REJECTED' && <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border border-rose-200">Ditolak</span>}
                                                </div>

                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                                    <Store size={14} className="text-indigo-400" />
                                                    Mitra Retailer: <span className="text-indigo-600">{item.retailer.name}</span>
                                                </div>

                                                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl font-medium">
                                                    Mengajukan permohonan rilis kuota suplai tambahan sebesar <strong className="text-slate-900">{(item.qtyRequested).toLocaleString('id-ID')} Unit</strong> dari gudang pusat untuk mengantisipasi potensi defisit inventaris berdasarkan tren penjualan terbaru.
                                                </p>

                                                <div className="flex items-center gap-2 mt-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <Clock size={14} /> Dikirim pada: {formatTime(item.createdAt)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ACTION BUTTONS (HANYA MUNCUL JIKA STATUS PENDING) */}
                                        {item.status.includes('PENDING') && (
                                            <div className="flex items-center gap-3 mt-4 md:mt-0 pt-6 md:pt-0 border-t border-slate-100 md:border-none shrink-0 w-full md:w-auto">
                                                <button
                                                    onClick={() => handleReject(item.id)}
                                                    disabled={isActionLoading === item.id}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-[16px] bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                                                >
                                                    {isActionLoading === item.id ? <Loader2 size={16} className="animate-spin" /> : <><XCircle size={16} /> Tolak</>}
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(item.id)}
                                                    disabled={isActionLoading === item.id}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-[16px] bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-bold text-xs hover:shadow-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                >
                                                    {isActionLoading === item.id ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Setujui Anggaran</>}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}