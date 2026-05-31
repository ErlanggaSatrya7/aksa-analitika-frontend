"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Inbox, CheckCircle2, XCircle, Send, PackagePlus, AlertTriangle, Clock, Check, Plus, PackageCheck, Loader2 } from 'lucide-react';

export default function RegionalInboxPage() {
    const { data: session } = useSession();
    const userState = (session?.user as any)?.assignedState || '';

    const [activeTab, setActiveTab] = useState('masuk');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [inboxItems, setInboxItems] = useState<any[]>([]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchInboxData = async () => {
        if (!userState) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/regional/inbox?state=${encodeURIComponent(userState)}`);
            if (res.ok) setInboxItems(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchInboxData(); }, [userState]);

    const handleApprove = async (id: string) => {
        setIsActionLoading(id);
        try {
            const res = await fetch('/api/regional/inbox', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'PENDING_CENTER' })
            });
            if (res.ok) {
                setInboxItems(items => items.map(item => item.id === id ? { ...item, status: 'PENDING_CENTER' } : item));
                showToast("Permintaan disetujui dan telah diteruskan ke Pusat.", "success");
            } else {
                showToast("Gagal menyetujui permintaan.", "error");
            }
        } catch (error) {
            showToast("Terjadi kesalahan sistem.", "error");
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        setIsActionLoading(id);
        try {
            const res = await fetch('/api/regional/inbox', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'REJECTED_REGION' })
            });
            if (res.ok) {
                setInboxItems(items => items.map(item => item.id === id ? { ...item, status: 'REJECTED_REGION' } : item));
                showToast("Permintaan ditolak. Beritahu cabang terkait.", "error");
            } else {
                showToast("Gagal menolak permintaan.", "error");
            }
        } catch (error) {
            showToast("Terjadi kesalahan sistem.", "error");
        } finally {
            setIsActionLoading(null);
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
    };

    const pendingCount = inboxItems.filter(i => i.status.includes('PENDING_REGION') || i.status === 'PENDING').length;
    const forwardedItems = inboxItems.filter(i => i.status === 'PENDING_CENTER' || i.status === 'APPROVED_CENTER');

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
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Evaluasi permohonan cabang wilayah {userState} dan teruskan ke Super Admin.</p>
                </div>
                <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] hover:shadow-lg text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-[0_8px_20px_rgba(79,70,229,0.3)] transition-all active:scale-95">
                    <Plus size={18} /> Permohonan ke Pusat
                </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden min-h-[500px] flex flex-col">
                <div className="flex border-b border-slate-100 px-6 md:px-8 pt-6 gap-6">
                    <button onClick={() => setActiveTab('masuk')} className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'masuk' ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <div className="flex items-center gap-2">
                            <Inbox size={18} /> Kotak Masuk Cabang
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full leading-none shadow-sm">{pendingCount}</span>
                        </div>
                    </button>
                    <button onClick={() => setActiveTab('terkirim')} className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'terkirim' ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <div className="flex items-center gap-2">
                            <Send size={18} /> Diteruskan ke Pusat
                            <span className="bg-[#4f46e5] text-white text-[10px] px-2 py-0.5 rounded-full leading-none shadow-sm">{forwardedItems.length}</span>
                        </div>
                    </button>
                </div>

                <div className="p-6 md:p-8 flex-1 bg-slate-50/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-[#6A7BFA] gap-3">
                            <Loader2 size={32} className="animate-spin" />
                            <span className="font-bold text-sm">Menyinkronkan Database Cabang...</span>
                        </div>
                    ) : activeTab === 'masuk' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                            {inboxItems.length === 0 || pendingCount === 0 ? (
                                <div className="text-center py-10 text-slate-400 font-medium">Tidak ada permohonan masuk dari cabang di wilayah ini.</div>
                            ) : inboxItems.filter(i => !i.status.includes('CENTER')).map((item) => (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="mt-1 shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-[#EDF2FE] text-[#4f46e5]">
                                                <PackagePlus size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-slate-900 text-base">Permohonan Stok {item.productCategory}</h4>
                                                    {(item.status === 'PENDING' || item.status === 'PENDING_REGION') && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-amber-200">Menunggu</span>}
                                                    {item.status === 'REJECTED_REGION' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-red-200">Ditolak Region</span>}
                                                </div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Dari: {item.retailer?.name} - {item.retailer?.city}</p>
                                                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">Mengajukan transfer <strong>{(item.qtyRequested).toLocaleString('id-ID')} Pcs</strong> produk <strong>{item.productCategory}</strong>. Mohon evaluasi untuk diteruskan ke Pusat.</p>
                                                <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-slate-400"><Clock size={14} /> {formatTime(item.createdAt)}</div>
                                            </div>
                                        </div>

                                        {(item.status === 'PENDING' || item.status === 'PENDING_REGION') && (
                                            <div className="flex items-center gap-2 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-slate-100 md:border-none shrink-0 w-full md:w-auto">
                                                <button onClick={() => handleReject(item.id)} disabled={isActionLoading === item.id} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors active:scale-95 disabled:opacity-50">
                                                    {isActionLoading === item.id ? <Loader2 size={16} className="animate-spin" /> : <><XCircle size={16} /> Tolak</>}
                                                </button>
                                                <button onClick={() => handleApprove(item.id)} disabled={isActionLoading === item.id} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white font-bold text-xs hover:shadow-md transition-all shadow-sm active:scale-95 disabled:opacity-50">
                                                    {isActionLoading === item.id ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Izinkan & Teruskan</>}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'terkirim' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                            {forwardedItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full min-h-[350px]">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-[#EDF2FE] rounded-full blur-[40px] scale-150"></div>
                                        <div className="w-24 h-24 bg-white border border-slate-100 shadow-xl rounded-full flex items-center justify-center relative z-10 text-[#4f46e5]"><PackageCheck size={40} className="animate-bounce" /></div>
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">Belum ada Terusan ke Pusat!</h4>
                                    <p className="text-sm text-slate-500 max-w-sm text-center leading-relaxed">Permohonan yang kamu setujui untuk diteruskan ke Super Admin akan muncul di sini.</p>
                                </div>
                            ) : forwardedItems.map((item) => (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="mt-1 shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-500"><Send size={24} /></div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-slate-900 text-base">Permohonan {item.productCategory} (Diteruskan)</h4>
                                                    {item.status === 'PENDING_CENTER' && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-blue-200">Di Meja Pusat</span>}
                                                    {item.status === 'APPROVED_CENTER' && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-emerald-200">Disetujui Pusat</span>}
                                                </div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tujuan: Gudang Nasional</p>
                                                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">Persetujuan eskalasi untuk <strong>{(item.qtyRequested).toLocaleString('id-ID')} Pcs</strong> dari <strong>{item.retailer?.city}</strong> telah dikirim ke meja Super Admin.</p>
                                            </div>
                                        </div>
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