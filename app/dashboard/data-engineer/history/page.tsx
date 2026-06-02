"use client";
import React, { useState, useEffect } from 'react';
import { Database, BrainCircuit, Loader2, FileX, Trash2, ShieldAlert } from 'lucide-react';

export default function HistoryPage() {
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fitur Hapus
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/data-engineer/history');
            if (res.ok) {
                const data = await res.json();
                setHistoryData(data.logs || []);
            }
        } catch (error) {
            console.error("Gagal mengambil data riwayat:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // FUNGSI CHECKBOX
    const handleSelectAll = () => {
        if (selectedIds.length === historyData.length) setSelectedIds([]);
        else setSelectedIds(historyData.map(h => h.id));
    };

    const handleSelect = (id: string) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
        else setSelectedIds([...selectedIds, id]);
    };

    // FUNGSI HAPUS HISTORY
    const handleDeleteHistory = async () => {
        if (!confirm("Yakin ingin membersihkan riwayat ini? Data riwayat tidak bisa dikembalikan.")) return;

        setIsDeleting(true);
        try {
            const res = await fetch('/api/data-engineer/history', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (res.ok) {
                setSelectedIds([]);
                fetchHistory(); // Refresh data
            }
        } catch (error) {
            console.error("Error menghapus history", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="pb-10 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Riwayat Sistem</h2>
                    <p className="text-sm text-slate-500 mt-1">Log audit permanen untuk aktivitas penambahan dan penghapusan data.</p>
                </div>

                {selectedIds.length > 0 && (
                    <button onClick={handleDeleteHistory} disabled={isDeleting} className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 rounded-[20px] font-bold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50">
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Hapus {selectedIds.length} Riwayat
                    </button>
                )}
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out delay-100">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <ShieldAlert size={20} className="text-[#6A7BFA]" /> Catatan Keamanan & Aktivitas
                </h3>

                <div className="overflow-x-auto rounded-2xl border border-slate-100 pb-2 custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-5 pl-6 w-10">
                                    <input type="checkbox" checked={selectedIds.length === historyData.length && historyData.length > 0} onChange={handleSelectAll} className="w-4 h-4 text-[#4f46e5] bg-white border-slate-300 rounded cursor-pointer" />
                                </th>
                                <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Tanggal & Waktu</th>
                                <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Aktivitas</th>
                                <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Nama File</th>
                                <th className="p-5 pr-6 font-bold text-slate-400 text-[11px] uppercase tracking-widest text-right">Baris Terdampak</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500 font-medium animate-pulse">
                                        <Loader2 size={24} className="animate-spin inline-block mr-2 text-[#4f46e5]" /> Memuat riwayat sistem...
                                    </td>
                                </tr>
                            ) : historyData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4"><FileX size={32} /></div>
                                            <h4 className="font-bold text-lg text-slate-800 mb-1">Riwayat Bersih</h4>
                                            <p className="text-sm text-slate-500 max-w-sm">Sistem belum mencatat adanya aktivitas penambahan atau penghapusan data.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                historyData.map((item) => (
                                    <tr key={item.id} className={`border-b border-slate-50 transition-colors ${selectedIds.includes(item.id) ? 'bg-[#EDF2FE]/50' : 'hover:bg-[#EDF2FE]/30'}`}>
                                        <td className="p-5 pl-6">
                                            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelect(item.id)} className="w-4 h-4 text-[#4f46e5] bg-white border-slate-300 rounded cursor-pointer" />
                                        </td>
                                        <td className="p-5 text-slate-500 font-medium">
                                            {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                        </td>
                                        <td className="p-5">
                                            {item.action === 'UPLOAD' ? (
                                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                                                    <Database size={12} /> Data Diunggah
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border border-red-200">
                                                    <Trash2 size={12} /> Data Dihapus
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5 font-semibold text-slate-900">{item.fileName}</td>
                                        <td className="p-5 pr-6 text-slate-600 font-bold text-right">{item.totalRows.toLocaleString('id-ID')} rows</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}