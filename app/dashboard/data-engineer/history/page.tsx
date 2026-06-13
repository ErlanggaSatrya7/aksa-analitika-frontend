"use client";
import React, { useState, useEffect } from 'react';
import {
    Database, BrainCircuit, Loader2, FileX, Trash2, ShieldAlert,
    Terminal, Activity, CheckCircle2, Sparkles, XCircle, TrendingUp, TrendingDown, Clock, Layers
} from 'lucide-react';

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
        const interval = setInterval(checkAiPipeline, 3000);
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
                fetchHistory();
            }
        } catch (error) {
            console.error("Error menghapus history", error);
        } finally {
            setIsDeleting(false);
        }
    };

    // Fungsi Pembantu: Mengekstrak durasi dari teks "Catatan MLOps"
    const extractDuration = (notes: string) => {
        const match = notes.match(/Durasi:\s*(\d+\s*detik)/i);
        return match ? match[1] : '-';
    };

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8">
            {/* --- HERO BANNER --- */}
            <div className="bg-white rounded-[32px] p-8 lg:p-10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-50 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3 bg-indigo-50 w-fit px-3 py-1.5 rounded-full border border-indigo-100">
                        <Sparkles size={14} className="text-indigo-500" />
                        <span className="text-xs font-bold tracking-wide uppercase text-indigo-600">Model Registry</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Riwayat Retraining Model</h2>
                    <p className="text-sm text-slate-500 max-w-lg">
                        Log pemantauan MLOps terpusat untuk aktivitas ingesti data dan hasil evaluasi (retraining) model Forecasting.
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

                {/* HISTORY TIMELINE / CARDS SECTION */}
                <div className="flex items-center gap-3 mb-4 mt-8 ml-2">
                    <div className="p-2 rounded-xl bg-[#EDF2FE] text-[#4f46e5]"><ShieldAlert size={20} /></div>
                    <h3 className="text-xl font-bold text-slate-900">Deployment Log</h3>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-slate-500 font-medium flex justify-center items-center gap-3">
                        <Loader2 size={24} className="animate-spin text-[#4f46e5]" /> Menyinkronkan Model Registry...
                    </div>
                ) : historyData.length === 0 ? (
                    <div className="bg-white rounded-[40px] border border-slate-100 p-12 text-center flex flex-col items-center shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4"><FileX size={32} /></div>
                        <h4 className="font-bold text-lg text-slate-800 mb-1">Riwayat Kosong</h4>
                        <p className="text-sm text-slate-500 max-w-sm">Belum ada siklus retraining yang dicatat oleh sistem MLOps.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* HEADER CHECKBOX BULK ACTIONS */}
                        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm w-fit">
                            <input type="checkbox" checked={selectedIds.length === historyData.length && historyData.length > 0} onChange={handleSelectAll} className="w-4 h-4 text-[#4f46e5] bg-white border-slate-300 rounded cursor-pointer" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pilih Semua</span>
                        </div>

                        {historyData.map((item, index) => {
                            const dateValue = item.created_at || item.createdAt;
                            const dateObj = new Date(dateValue);
                            const isAccepted = item.status?.includes('TERIMA') || item.status === 'SUCCESS';
                            const isDeleted = item.action === 'DELETE';
                            const duration = extractDuration(item.notes || '');

                            // Visual Status configuration
                            let badgeColor = isDeleted ? 'bg-red-50 text-red-600 border-red-200' : isAccepted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';
                            let icon = isDeleted ? <Trash2 size={16} /> : isAccepted ? <CheckCircle2 size={16} /> : <XCircle size={16} />;
                            let statusTitle = isDeleted ? 'Data Dihapus' : isAccepted ? 'Model Accepted & Deployed' : 'Model Rejected';
                            let statusDesc = isDeleted ? 'Dataset beserta log terhapus dari sistem.' : isAccepted ? 'Model baru di-deploy ke production karena memiliki akurasi yang lebih baik.' : 'Model production saat ini tetap aktif karena model baru tidak lebih baik.';

                            // Highlight baris pertama (terbaru) jika dia adalah model yang diterima
                            const isActiveModel = index === 0 && isAccepted && !isDeleted;

                            return (
                                <div key={item.id} className={`bg-white rounded-[32px] border ${isActiveModel ? 'border-[#6A7BFA] shadow-[0_8px_30px_rgba(79,70,229,0.1)]' : 'border-slate-100 shadow-sm'} overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col md:flex-row relative`}>

                                    {/* Active Badge Marker */}
                                    {isActiveModel && (
                                        <div className="absolute top-0 right-0 bg-[#6A7BFA] text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl z-10 flex items-center gap-1.5 shadow-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span> ACTIVE MODEL
                                        </div>
                                    )}

                                    {/* LEFT PANEL: INFO DATASET & WAKTU */}
                                    <div className="bg-slate-50/50 p-6 lg:p-8 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between shrink-0">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelect(item.id)} className="w-4 h-4 text-[#4f46e5] bg-white border-slate-300 rounded cursor-pointer shrink-0" />
                                                <div className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${badgeColor}`}>
                                                    {icon} {statusTitle.split(' ')[1]}
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-lg text-slate-900 leading-tight mb-2 truncate" title={item.fileName}>{item.fileName || 'Data Manual'}</h4>

                                            <div className="space-y-2.5 mt-6">
                                                <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                                                    <Clock size={16} className="text-slate-400" />
                                                    {dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                                                    <Layers size={16} className="text-slate-400" />
                                                    {(item.totalRows || 0).toLocaleString('id-ID')} Baris Data
                                                </div>
                                                <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                                                    <Activity size={16} className="text-slate-400" />
                                                    Durasi: {duration}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT PANEL: METRIK & KEPUTUSAN */}
                                    <div className="p-6 lg:p-8 w-full md:w-2/3 flex flex-col justify-between bg-white">
                                        {!isDeleted ? (
                                            <>
                                                <div className="mb-6">
                                                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Deployment Decision</h5>
                                                    <div className="flex items-start gap-3 mt-3">
                                                        <div className={`p-2 rounded-full ${isAccepted ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                            {isAccepted ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                                                        </div>
                                                        <div>
                                                            <h4 className={`text-lg font-bold ${isAccepted ? 'text-emerald-700' : 'text-amber-700'}`}>{statusTitle}</h4>
                                                            <p className="text-sm text-slate-500 font-medium mt-0.5 leading-relaxed">{statusDesc}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* FALLBACK UI UNTUK CATATAN MLOPS (Sampai API di-update dengan metrik JSON) */}
                                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        <BrainCircuit size={14} /> Log Evaluasi Mesin
                                                    </h5>
                                                    <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                        {item.notes || 'Evaluasi diselesaikan tanpa catatan spesifik.'}
                                                    </pre>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-center py-6">
                                                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4"><FileX size={32} /></div>
                                                <h4 className="font-bold text-lg text-slate-500">Data Telah Dihapus</h4>
                                                <p className="text-sm text-slate-400 mt-1 max-w-sm">File ini telah dibersihkan dari database dan tidak lagi memengaruhi model.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}