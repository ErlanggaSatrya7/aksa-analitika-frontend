"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Inbox, CheckCircle2, XCircle, Send, PackagePlus, AlertTriangle, Clock, Check, Plus, Rocket, Loader2 } from 'lucide-react';

export default function CityInboxPage() {
    const { data: session } = useSession();
    const userCity = (session?.user as any)?.assignedCity || '';

    const [activeTab, setActiveTab] = useState('masuk');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const [inboxItems, setInboxItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Fetch data dari database
    const fetchInbox = async () => {
        if (!userCity) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/city/inbox?city=${encodeURIComponent(userCity)}`);
            if (res.ok) setInboxItems(await res.json());
        } catch (error) {
            console.error("Fetch inbox error", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchInbox(); }, [userCity]);

    const handleAction = async (id: string, newStatus: string) => {
        setIsActionLoading(id);
        try {
            const res = await fetch('/api/city/inbox', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (res.ok) {
                setInboxItems(items => items.map(item => item.id === id ? { ...item, status: newStatus } : item));
                showToast(newStatus === 'APPROVED_CITY' ? "Permohonan diteruskan ke Provinsi." : "Permohonan ditolak.", newStatus === 'APPROVED_CITY' ? 'success' : 'error');
            } else {
                showToast("Gagal memproses permohonan", "error");
            }
        } catch (error) {
            showToast("Kesalahan jaringan", "error");
        } finally {
            setIsActionLoading(null);
        }
    };

    const formatTime = (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const pendingCount = inboxItems.filter(i => i.status === 'PENDING_CITY' || i.status === 'PENDING').length;
    const forwardedItems = inboxItems.filter(i => i.status.includes('APPROVED_') || i.status === 'PENDING_STATE' || i.status === 'PENDING_CENTER');

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
                <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] hover:shadow-lg text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-[0_8px_20px_rgba(79,70,229,0.3)] transition-all active:scale-95">
                    <Plus size={18} /> Laporan ke Provinsi
                </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden min-h-[500px] flex flex-col">
                <div className="flex border-b border-slate-100 px-6 md:px-8 pt-6 gap-6">
                    <button onClick={() => setActiveTab('masuk')} className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'masuk' ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <div className="flex items-center gap-2">
                            <Inbox size={18} /> Request Toko
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full leading-none shadow-sm">{pendingCount}</span>
                        </div>
                    </button>
                    <button onClick={() => setActiveTab('terkirim')} className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'terkirim' ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <div className="flex items-center gap-2">
                            <Send size={18} /> Diteruskan ke Provinsi
                        </div>
                    </button>
                </div>

                <div className="p-6 md:p-8 flex-1 bg-slate-50/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-[#6A7BFA] gap-3">
                            <Loader2 size={32} className="animate-spin" />
                            <span className="font-bold text-sm">Menyinkronkan Inbox Toko...</span>
                        </div>
                    ) : activeTab === 'masuk' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                            {inboxItems.length === 0 || pendingCount === 0 ? (
                                <div className="text-center py-10 text-slate-400 font-medium">Tidak ada permohonan baru dari toko.</div>
                            ) : inboxItems.filter(i => i.status === 'PENDING_CITY' || i.status === 'PENDING').map((item) => (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="mt-1 shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-[#EDF2FE] text-[#4f46e5]">
                                                <PackagePlus size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-slate-900 text-base">Permohonan Stok: {item.productCategory}</h4>
                                                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-amber-200">Menunggu</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{item.retailer?.name} - {item.retailer?.city}</p>
                                                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">Toko mengajukan suplai tambahan sebanyak <strong>{item.qtyRequested.toLocaleString('id-ID')} Pcs</strong>. Mohon eskalasi ke Manajer Provinsi jika disetujui.</p>
                                                <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-slate-400">
                                                    <Clock size={14} /> {formatTime(item.createdAt)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-slate-100 md:border-none shrink-0 w-full md:w-auto">
                                            <button onClick={() => handleAction(item.id, 'REJECTED')} disabled={isActionLoading === item.id} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50">
                                                {isActionLoading === item.id ? <Loader2 size={16} className="animate-spin" /> : <><XCircle size={16} /> Tolak</>}
                                            </button>
                                            <button onClick={() => handleAction(item.id, 'APPROVED_CITY')} disabled={isActionLoading === item.id} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white font-bold text-xs hover:shadow-lg transition-all disabled:opacity-50">
                                                {isActionLoading === item.id ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Teruskan ke Provinsi</>}
                                            </button>
                                        </div>
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
                                        <div className="w-24 h-24 bg-white border border-slate-100 shadow-xl rounded-full flex items-center justify-center relative z-10 text-[#4f46e5]">
                                            <Rocket size={40} className="animate-bounce" />
                                        </div>
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Eskalasi</h4>
                                    <p className="text-sm text-slate-500 max-w-sm text-center leading-relaxed">Permohonan yang diteruskan ke Manajer Provinsi akan muncul di tab ini.</p>
                                </div>
                            ) : forwardedItems.map((item) => (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm opacity-80">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="mt-1 shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-500"><Send size={24} /></div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-slate-900 text-base">Eskalasi: {item.productCategory}</h4>
                                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-blue-200">Di Meja Provinsi</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tujuan: Manajer Regional</p>
                                                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">Persetujuan eskalasi <strong>{item.qtyRequested.toLocaleString('id-ID')} Pcs</strong> dari toko <strong>{item.retailer?.name}</strong> sukses diteruskan.</p>
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