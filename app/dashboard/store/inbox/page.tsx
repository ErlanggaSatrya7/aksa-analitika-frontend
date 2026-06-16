"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Inbox, Send, AlertTriangle, Clock, Plus, CheckCircle2, MessageSquare, XCircle, Loader2, Package } from 'lucide-react';
import Link from 'next/link';

export default function StoreInboxPage() {
    const { data: session } = useSession();
    const user = session?.user as any;
    const retailerId = user?.retailerId || '';
    const userId = user?.id || '';

    const [activeTab, setActiveTab] = useState('masuk');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [inboxData, setInboxData] = useState({
        memos: [] as any[],
        requests: [] as any[]
    });

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        if (!retailerId || !userId) return;
        setIsLoading(true);

        const fetchInbox = async () => {
            try {
                const res = await fetch(`/api/store/inbox?retailerId=${retailerId}&userId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setInboxData({
                        memos: data.memos || [],
                        requests: data.requests || []
                    });
                }
            } catch (error) {
                console.error("Gagal menarik data inbox", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInbox();
    }, [retailerId, userId]);

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' WIB';
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING_CITY':
                return <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-amber-200 shadow-sm flex items-center gap-1.5 w-fit"><Clock size={12} /> Menunggu (Regional)</span>;
            case 'APPROVED_CITY':
            case 'PENDING_STATE':
                return <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-blue-200 shadow-sm flex items-center gap-1.5 w-fit"><Loader2 size={12} className="animate-spin" /> Di Meja Pusat</span>;
            case 'APPROVED_STATE':
            case 'APPROVED_CENTER':
                return <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-emerald-200 shadow-sm flex items-center gap-1.5 w-fit"><CheckCircle2 size={12} /> Disetujui / Dikirim</span>;
            case 'REJECTED':
            case 'REJECTED_REGION':
            case 'REJECTED_CENTER':
                return <span className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-red-200 shadow-sm flex items-center gap-1.5 w-fit"><XCircle size={12} /> Ditolak</span>;
            default:
                return <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-200 shadow-sm flex items-center gap-1.5 w-fit">{status}</span>;
        }
    };

    return (
        <div className="pb-12 max-w-6xl mx-auto animate-in fade-in duration-700 relative">
            {/* LOKAL TOAST NOTIFICATION */}
            {toast && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-[40px] shadow-2xl flex items-center gap-3 z-[150] animate-in slide-in-from-top-5 duration-300 font-bold border text-sm w-[90%] max-w-sm ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertTriangle size={20} className="shrink-0" />}
                    <p className="leading-tight">{toast.message}</p>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pusat Informasi Cabang</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                        Pantau instruksi masuk dan status pengajuan restock logistik Anda.
                    </p>
                </div>
                <Link href="/dashboard/store/forecast">
                    <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] hover:shadow-lg text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-[0_8px_20px_rgba(79,70,229,0.3)] transition-all active:scale-95">
                        <Plus size={18} /> Buat Permohonan via AI
                    </button>
                </Link>
            </div>

            {/* INBOX CONTAINER */}
            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden min-h-[500px] flex flex-col relative">
                <div className="flex border-b border-slate-100 px-6 md:px-8 pt-8 gap-8 bg-slate-50/50 z-10">
                    <button onClick={() => setActiveTab('masuk')} className={`pb-4 text-sm font-bold transition-all border-b-[3px] flex items-center gap-2.5 ${activeTab === 'masuk' ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <Inbox size={18} /> Memo Diterima
                        {inboxData.memos.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full leading-none shadow-sm">{inboxData.memos.length}</span>
                        )}
                    </button>
                    <button onClick={() => setActiveTab('terkirim')} className={`pb-4 text-sm font-bold transition-all border-b-[3px] flex items-center gap-2.5 ${activeTab === 'terkirim' ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <Send size={18} /> Permohonan Saya
                        <span className="bg-[#4f46e5] text-white text-[10px] px-2 py-0.5 rounded-full leading-none shadow-sm">{inboxData.requests.length}</span>
                    </button>
                </div>

                <div className="p-6 md:p-8 flex-1 bg-[#F8FAFC]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-[#4f46e5] gap-4">
                            <Loader2 size={36} className="animate-spin" />
                            <span className="font-bold text-sm tracking-widest uppercase text-slate-400">Menyinkronkan Inbox...</span>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'masuk' && (
                                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                                    {inboxData.memos.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <div className="w-20 h-20 bg-white text-slate-300 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-sm"><Inbox size={36} /></div>
                                            <h4 className="text-xl font-bold text-slate-800 mb-2">Inbox Kosong</h4>
                                            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">Belum ada permohonan masuk atau instruksi terbaru dari Pusat maupun Regional.</p>
                                        </div>
                                    ) : inboxData.memos.map((item) => (
                                        <div key={item.id} className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow group">
                                            <div className="flex flex-col md:flex-row gap-5">
                                                <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center bg-[#EDF2FE] text-[#4f46e5] group-hover:scale-105 transition-transform">
                                                    <MessageSquare size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                                        <h4 className="font-bold text-slate-900 text-lg">{item.title}</h4>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12} /> {formatTime(item.createdAt)}</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Pengirim: Pusat / Regional</p>
                                                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl font-medium">{item.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'terkirim' && (
                                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                                    {inboxData.requests.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <div className="w-20 h-20 bg-white text-slate-300 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-sm"><Send size={32} className="ml-1" /></div>
                                            <h4 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Pengajuan</h4>
                                            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">Anda belum pernah mengajukan tambahan stok. Gunakan fitur AI Forecast untuk menganalisis dan mengajukan restock secara cerdas.</p>
                                            <Link href="/dashboard/store/forecast" className="mt-6 px-8 py-3.5 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white font-bold text-sm rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all">
                                                Coba AI Forecast Sekarang
                                            </Link>
                                        </div>
                                    ) : inboxData.requests.map((req) => (
                                        <div key={req.id} className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-5 group">
                                            <div className="flex gap-5">
                                                <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100 group-hover:border-slate-200 transition-colors">
                                                    <Package size={24} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <h4 className="font-bold text-slate-900 text-lg">Restock: {req.productCategory}</h4>
                                                        <span className="text-[10px] font-bold text-[#4f46e5] bg-[#EDF2FE] px-2.5 py-1 rounded-md border border-[#4f46e5]/10">ID: {req.id.substring(0, 8)}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 font-medium mb-3">Kuantitas Diajukan: <strong className="text-slate-900">{req.qtyRequested} Pcs</strong></p>
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                                                        <Clock size={14} /> Dikirim: {formatTime(req.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md:text-right flex flex-col items-start md:items-end justify-center mt-2 md:mt-0 pt-4 md:pt-0 border-t border-slate-100 md:border-none">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-2">Status Saat Ini</span>
                                                {renderStatusBadge(req.status)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}