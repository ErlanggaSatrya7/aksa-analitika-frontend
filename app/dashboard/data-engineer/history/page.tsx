"use client";
import React, { useState, useEffect } from 'react';
import { Database, BrainCircuit, Loader2, FileX, Trash2, ShieldAlert, Terminal, Activity, CheckCircle2, Sparkles } from 'lucide-react';

export default function HistoryPage() {
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fitur Hapus
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Radar AI Latar Belakang
    const [aiStatus, setAiStatus] = useState<'idle' | 'running'>('idle');
    const [currentAiFile, setCurrentAiFile] = useState('');

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

    // Radar Pemantau FastAPI
    useEffect(() => {
        fetchHistory();

        const checkAiPipeline = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/health');
                if (res.ok) {
                    const data = await res.json();
                    if (data.pipeline_running) {
                        setAiStatus('running');
                        setCurrentAiFile(data.current_file);
                    } else {
                        // Jika AI baru saja selesai, refresh tabel history untuk memunculkan data baru
                        if (aiStatus === 'running') fetchHistory();
                        setAiStatus('idle');
                        setCurrentAiFile('');
                    }
                }
            } catch (error) {
                setAiStatus('idle');
            }
        };

        checkAiPipeline();
        const interval = setInterval(checkAiPipeline, 3000); // Polling setiap 3 detik
        return () => clearInterval(interval);
    }, [aiStatus]);

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
        <div className="pb-10 max-w-7xl mx-auto space-y-8">
            {/* --- MINI HERO BANNER --- */}
            <div className="bg-white rounded-[32px] p-8 lg:p-10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-50 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3 bg-indigo-50 w-fit px-3 py-1.5 rounded-full border border-indigo-100">
                        <Sparkles size={14} className="text-indigo-500" />
                        <span className="text-xs font-bold tracking-wide uppercase text-indigo-600">Audit & Log</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">System & AI History</h2>
                    <p className="text-sm text-slate-500 max-w-lg">
                        Log pemantauan MLOps terpusat untuk seluruh aktivitas ingesti data ke PostgreSQL dan hasil evaluasi (retraining) model Machine Learning.
                    </p>
                </div>

                {selectedIds.length > 0 && (
                    <div className="relative z-10 mt-6 md:mt-0">
                        <button onClick={handleDeleteHistory} disabled={isDeleting} className="flex items-center gap-2 px-6 py-3.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 rounded-[40px] font-bold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50">
                            {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                            Hapus {selectedIds.length} Riwayat Terpilih
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* LIVE AI RADAR SECTION */}
                {aiStatus === 'running' && (
                    <div className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.15)] p-6 lg:p-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        {/* Background Effect */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#4f46e5] rounded-full blur-[80px] opacity-30 animate-pulse" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <div className="w-14 h-14 bg-slate-800 text-[#6A7BFA] rounded-2xl flex items-center justify-center border border-slate-700 shadow-inner">
                                        <Terminal size={28} />
                                    </div>
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-white flex items-center gap-2">
                                        AI Engine Sedang Bekerja <Loader2 size={18} className="animate-spin text-[#6A7BFA]" />
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Memproses <strong className="text-emerald-400 font-mono">{currentAiFile}</strong> di latar belakang.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 border border-slate-700 px-6 py-4 rounded-2xl w-full md:w-auto">
                                <ul className="text-xs font-mono text-slate-300 space-y-2">
                                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> [TAHAP 1] Ingesti Data Database</li>
                                    <li className="flex items-center gap-2"><Activity size={14} className="text-[#6A7BFA] animate-pulse" /> [TAHAP 2] Evaluasi Metrik Model Baru...</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* HISTORY TABLE SECTION */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out delay-100 fill-mode-both">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-2xl bg-[#EDF2FE] text-[#4f46e5]"><ShieldAlert size={20} /></div>
                        <h3 className="text-xl font-bold text-slate-900">Catatan Aktivitas Database</h3>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-100 pb-2 custom-scrollbar">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-5 pl-6 w-10">
                                        <input type="checkbox" checked={selectedIds.length === historyData.length && historyData.length > 0} onChange={handleSelectAll} className="w-4 h-4 text-[#4f46e5] bg-white border-slate-300 rounded cursor-pointer" />
                                    </th>
                                    <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Waktu Proses</th>
                                    <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Tipe Aktivitas</th>
                                    <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Nama Target File</th>
                                    <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest text-right">Volume Data</th>
                                    <th className="p-5 pr-6 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Catatan MLOps</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-500 font-medium animate-pulse">
                                            <Loader2 size={24} className="animate-spin inline-block mr-2 text-[#4f46e5]" /> Sinkronisasi riwayat sistem...
                                        </td>
                                    </tr>
                                ) : historyData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4"><FileX size={32} /></div>
                                                <h4 className="font-bold text-lg text-slate-800 mb-1">Riwayat Kosong</h4>
                                                <p className="text-sm text-slate-500 max-w-sm">Sistem belum mencatat adanya aktivitas Ingesti AI atau penghapusan data.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    historyData.map((item) => {
                                        // PENTING: Mencegah undefined date dengan mengecek created_at atau createdAt
                                        const dateValue = item.created_at || item.createdAt;
                                        const dateObj = new Date(dateValue);

                                        return (
                                            <tr key={item.id} className={`border-b border-slate-50 transition-colors ${selectedIds.includes(item.id) ? 'bg-[#EDF2FE]/50' : 'hover:bg-[#EDF2FE]/30'}`}>
                                                <td className="p-5 pl-6 align-top pt-6">
                                                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelect(item.id)} className="w-4 h-4 text-[#4f46e5] bg-white border-slate-300 rounded cursor-pointer" />
                                                </td>
                                                <td className="p-5 text-slate-500 font-medium align-top pt-6">
                                                    <span className="text-slate-800 font-bold block mb-1">{dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    <span className="text-[11px] bg-slate-100 px-2 py-1 rounded-md font-mono">{dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                                                </td>
                                                <td className="p-5 align-top pt-6">
                                                    {item.action === 'UPLOAD' || item.action === 'DATASET_UPLOADED' ? (
                                                        <div className="flex flex-col items-start gap-2">
                                                            <span className="inline-flex items-center gap-1.5 bg-[#EDF2FE] text-[#4f46e5] text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border border-[#6A7BFA]/20">
                                                                <BrainCircuit size={12} /> ML Executed
                                                            </span>
                                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${item.status?.includes('TERIMA') || item.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                {item.status || 'Data Disimpan'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border border-red-200">
                                                            <Trash2 size={12} /> Data Dihapus
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-5 font-semibold text-slate-700 font-mono text-xs align-top pt-6">{item.fileName || '-'}</td>
                                                <td className="p-5 text-emerald-600 font-bold text-right align-top pt-6">{(item.totalRows || 0).toLocaleString('id-ID')} Baris</td>

                                                {/* RENDER CATATAN MLOPS */}
                                                <td className="p-5 pr-6 align-top">
                                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 max-w-sm">
                                                        <pre className="text-[11px] font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">
                                                            {item.notes || 'Tidak ada catatan tambahan.'}
                                                        </pre>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}