"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Inbox, Send, AlertTriangle, Clock, Plus, CheckCircle2, MessageSquare, XCircle, Loader2, Package } from 'lucide-react';

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
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (!retailerId || !userId) return;
        setIsLoading(true);

        const fetchInbox = async () => {
            try {
                const res = await fetch(`/api/store/inbox?retailerId=${retailerId}&userId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setInboxData(data);
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

    // Helper untuk merender badge status logistik
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING_CITY':
                return <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border border-amber-200">Menunggu (Kota)</span>;
            case 'APPROVED_CITY':
            case 'PENDING_STATE':
                return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border border-blue-200">Di Meja Provinsi</span>;
            case 'APPROVED_STATE':
            case 'APPROVED_CENTER':
                return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border border-emerald-200">Disetujui / Dikirim</span>;
            case 'REJECTED':
                return <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border border-red-200">Ditolak</span>;
            default:
                return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border border-slate-200">{status}</span>;
        }
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
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Kotak Masuk</h2>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Terima memo dari Manajer Kota dan pantau status permohonan suplai barang Anda.</p>
                </div>
                <button
                    onClick={() => showToast("Fitur pembuatan permohonan manual sedang disiapkan", "success")}
                    className="flex items-center justify-center gap-2 bg-[#6A7BFA] hover:bg-[#5869E8] text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-[0_8px_20px_rgba(106,123,250,0.3)] transition-all active:scale-95"
                >
                    <Plus size={18} /> Buat Permohonan
                </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden min-h-[500px] flex flex-col">

                <div className="flex border-b border-slate-100 px-6 md:px-8 pt-6 gap-6">
                    <button
                        onClick={() => setActiveTab('masuk')}
                        className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'masuk' ? 'border-[#6A7BFA] text-[#6A7BFA]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Inbox size={18} /> Memo Diterima
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full leading-none">{inboxData.memos.length}</span>
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

                <div className="p-6 md:p-8 flex-1 bg-slate-50/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-[#6A7BFA] gap-3">
                            <Loader2 size={32} className="animate-spin" />
                            <span className="font-bold text-sm">Menyinkronkan Inbox...</span>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'masuk' && (
                                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                                    {inboxData.memos.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400 font-medium">Belum ada pesan atau memo yang masuk.</div>
                                    ) : inboxData.memos.map((item) => (
                                        <div key={item.id} className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex gap-4">
                                                <div className="mt-1 shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-[#6A7BFA]">
                                                    <MessageSquare size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-base mb-1">{item.title}</h4>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Dari: Pusat / Manajer Kota</p>
                                                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{item.description}</p>
                                                    <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-slate-400">
                                                        <Clock size={14} /> {formatTime(item.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'terkirim' && (
                                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                                    {inboxData.requests.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full min-h-[350px]">
                                            <div className="relative mb-6">
                                                <div className="absolute inset-0 bg-[#EDF2FE] rounded-full blur-[40px] scale-150"></div>
                                                <div className="w-24 h-24 bg-white border border-slate-100 shadow-xl rounded-full flex items-center justify-center relative z-10 text-[#6A7BFA]">
                                                    <CheckCircle2 size={40} className="animate-bounce" />
                                                </div>
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-800 mb-2">Semua Transaksi Normal</h4>
                                            <p className="text-sm text-slate-500 max-w-sm text-center leading-relaxed">
                                                Anda belum membuat permohonan restock darurat ke Manajer Kota.
                                            </p>
                                        </div>
                                    ) : inboxData.requests.map((req) => (
                                        <div key={req.id} className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex gap-4">
                                                <div className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100">
                                                    <Package size={24} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h4 className="font-bold text-slate-900 text-base">Restock: {req.productCategory}</h4>
                                                        <span className="hidden md:inline-block text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">ID: {req.id.substring(0, 8)}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 font-medium mb-2">Jumlah Diajukan: <strong className="text-slate-900">{req.qtyRequested} Pcs</strong></p>
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                                                        <Clock size={12} /> {formatTime(req.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md:text-right flex md:block items-center justify-between mt-2 md:mt-0 pt-3 md:pt-0 border-t border-slate-100 md:border-none">
                                                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest md:block mb-2 md:mb-1">Status Pengajuan</span>
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