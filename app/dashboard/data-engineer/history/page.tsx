"use client";
import React, { useState, useEffect } from 'react';
import {
    Database, BrainCircuit, Loader2, FileX, Trash2, ShieldAlert,
    Terminal, Activity, CheckCircle2, Sparkles, XCircle, TrendingUp,
    TrendingDown, Clock, Layers, Circle, ArrowRight, CheckSquare
} from 'lucide-react';

export default function HistoryPage() {
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    const [aiStatus, setAiStatus] = useState<'idle' | 'running'>('idle');
    const [currentAiFile, setCurrentAiFile] = useState('');
    const [currentStep, setCurrentStep] = useState(-1);

    const pipelineStages = [
        { title: "Dataset Validation", desc: "Validating file structure, columns, and missing values." },
        { title: "Data Engineering", desc: "Cleaning, transforming, and synchronizing to PostgreSQL." },
        { title: "Model Training", desc: "Loading production model & training new Random Forest candidate." },
        { title: "Model Evaluation", desc: "Cross-validation and benchmarking R², MAE, MAPE." },
        { title: "Deployment Decision", desc: "Comparing metrics to determine production deployment." }
    ];

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

        const checkAiPipeline = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const res = await fetch(`${apiUrl}/api/health`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.pipeline_running) {
                        setAiStatus('running');
                        setCurrentAiFile(data.current_file);
                        setCurrentStep(data.current_step);
                    } else {
                        if (aiStatus === 'running') fetchHistory();
                        setAiStatus('idle');
                        setCurrentAiFile('');
                        setCurrentStep(-1);
                    }
                }
            } catch (error) {
                setAiStatus('idle');
                setCurrentStep(-1);
            }
        };

        checkAiPipeline();
        const interval = setInterval(checkAiPipeline, 1500);
        return () => clearInterval(interval);
    }, [aiStatus]);

    const handleSelectAll = () => {
        if (selectedIds.length === historyData.length) setSelectedIds([]);
        else setSelectedIds(historyData.map(h => h.id));
    };

    const handleSelect = (id: string) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
        else setSelectedIds([...selectedIds, id]);
    };

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

    const extractDuration = (notes: string) => {
        const match = notes.match(/Durasi:\s*(\d+\s*detik)/i);
        return match ? match[1] : '-';
    };

    // --- REVISI EKSTRAKSI METRIK YANG LEBIH TANGGUH ---
    const extractMetrics = (notes: string) => {
        try {
            if (!notes || !notes.includes("vs Cand")) return null;

            const prodR2 = notes.match(/Prod.*?R2:\s*([0-9.]+)/i)?.[1] || '-';
            const prodMape = notes.match(/Prod.*?MAPE:\s*([0-9.]+)%/i)?.[1] || '-';

            const candR2 = notes.match(/Cand.*?R2:\s*([0-9.]+)/i)?.[1] || '-';
            const candMape = notes.match(/Cand.*?MAPE:\s*([0-9.]+)%/i)?.[1] || '-';

            return { prodR2, prodMape, candR2, candMape };
        } catch (e) {
            return null;
        }
    };

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8 relative">
            {/* HEADER */}
            <div className="bg-white rounded-[32px] p-8 lg:p-10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-50 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3 bg-indigo-50 w-fit px-3 py-1.5 rounded-full border border-indigo-100">
                        <Sparkles size={14} className="text-indigo-500" />
                        <span className="text-xs font-bold tracking-wide uppercase text-indigo-600">Model Registry</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Riwayat Retraining Model</h2>
                    <p className="text-sm text-slate-500 max-w-lg leading-relaxed">
                        Log pemantauan MLOps terpusat untuk aktivitas ingesti data dan hasil evaluasi (retraining) model Prediktif AI.
                    </p>
                </div>

                {selectedIds.length > 0 && (
                    <div className="relative z-10 mt-6 md:mt-0 animate-in zoom-in-95 duration-200">
                        <button onClick={handleDeleteHistory} disabled={isDeleting} className="flex items-center gap-2 px-6 py-3.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 rounded-[40px] font-bold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50">
                            {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                            Hapus {selectedIds.length} Log Terpilih
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* PIPELINE LIVE STATUS */}
                {aiStatus === 'running' && (
                    <div className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.15)] p-6 lg:p-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#4f46e5] rounded-full blur-[80px] opacity-30 animate-pulse" />
                        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                            <div className="flex items-start gap-5">
                                <div className="relative shrink-0">
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
                                    <p className="text-sm text-slate-400 mt-1 max-w-sm leading-relaxed">
                                        Memproses <strong className="text-emerald-400 font-mono">{currentAiFile}</strong> di latar belakang sistem.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-800/80 border border-slate-700 px-6 py-5 rounded-2xl w-full lg:w-[480px]">
                                <ul className="text-xs font-mono space-y-3">
                                    {pipelineStages.map((stage, idx) => {
                                        const isCompleted = currentStep > idx;
                                        const isActive = currentStep === idx;

                                        return (
                                            <li key={idx} className={`flex items-start gap-3 transition-colors duration-300 ${isActive ? 'text-[#6A7BFA]' : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                {isCompleted ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> :
                                                    isActive ? <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin" /> :
                                                        <Circle size={16} className="shrink-0 mt-0.5 opacity-50" />}
                                                <div>
                                                    <span className={`font-bold ${isActive && 'animate-pulse'}`}>[TAHAP {idx + 1}] {stage.title}</span>
                                                    {isActive && <p className="text-[10px] text-slate-400 mt-1 normal-case leading-relaxed">{stage.desc}</p>}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 mb-4 mt-8 ml-2">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600"><ShieldAlert size={20} /></div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Log Evaluasi Historis</h3>
                </div>

                {isLoading ? (
                    <div className="bg-white rounded-[40px] border border-slate-100 p-16 text-center text-slate-500 font-medium flex justify-center items-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
                        <Loader2 size={24} className="animate-spin text-indigo-600" /> Menyinkronkan Model Registry...
                    </div>
                ) : historyData.length === 0 ? (
                    <div className="bg-white rounded-[40px] border border-slate-100 p-16 text-center flex flex-col items-center shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
                        <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-5"><FileX size={36} /></div>
                        <h4 className="font-bold text-xl text-slate-800 mb-2">Riwayat Kosong</h4>
                        <p className="text-sm text-slate-500 max-w-sm">Belum ada siklus retraining yang dicatat oleh sistem MLOps sejauh ini.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* FITUR SELECT ALL */}
                        <div className="flex items-center gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm w-fit transition-colors hover:border-indigo-300">
                            <input type="checkbox" checked={selectedIds.length === historyData.length && historyData.length > 0} onChange={handleSelectAll} className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded cursor-pointer" />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest cursor-pointer select-none" onClick={handleSelectAll}>Pilih Semua Data</span>
                        </div>

                        {/* RENDER LIST LOG HISTORY */}
                        {historyData.map((item, index) => {
                            const dateValue = item.created_at || item.createdAt;
                            const dateObj = new Date(dateValue);
                            const isAccepted = item.status?.includes('TERIMA') || item.status === 'SUCCESS';
                            const isDeleted = item.action === 'DELETE';
                            const duration = extractDuration(item.notes || '');

                            const metrics = extractMetrics(item.notes || '');

                            // Logika indikator warna komparasi
                            const isMapeBetter = metrics ? parseFloat(metrics.candMape) <= parseFloat(metrics.prodMape) : false;
                            const isR2Better = metrics ? parseFloat(metrics.candR2) >= parseFloat(metrics.prodR2) : false;

                            let badgeColor = isDeleted ? 'bg-rose-50 text-rose-600 border-rose-200' : isAccepted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';
                            let icon = isDeleted ? <Trash2 size={16} /> : isAccepted ? <CheckCircle2 size={16} /> : <XCircle size={16} />;
                            let statusTitle = isDeleted ? 'Data Dihapus' : isAccepted ? 'Model Diterima (Deployed)' : 'Model Ditolak';
                            let statusDesc = isDeleted ? 'Dataset beserta log terhapus secara permanen dari sistem.' : isAccepted ? 'Sistem otomatis mengganti model lama karena performa kandidat lebih baik.' : 'Sistem mempertahankan model lama karena akurasi kandidat belum memadai.';

                            const isActiveModel = index === 0 && isAccepted && !isDeleted;

                            return (
                                <div key={item.id} className={`bg-white rounded-[32px] border ${isActiveModel ? 'border-indigo-500 shadow-[0_8px_30px_rgba(79,70,229,0.1)] ring-4 ring-indigo-50' : 'border-slate-200 shadow-sm'} overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col xl:flex-row relative`}>

                                    {isActiveModel && (
                                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-4 py-2 rounded-bl-2xl z-10 flex items-center gap-1.5 shadow-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ACTIVE IN PRODUCTION
                                        </div>
                                    )}

                                    {/* KOLOM KIRI: METADATA */}
                                    <div className={`p-6 lg:p-8 w-full xl:w-1/3 border-b xl:border-b-0 xl:border-r border-slate-100 flex flex-col justify-between shrink-0 ${isActiveModel ? 'bg-indigo-50/20' : 'bg-slate-50/40'}`}>
                                        <div>
                                            <div className="flex items-center gap-3 mb-5">
                                                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelect(item.id)} className="w-5 h-5 text-indigo-600 bg-white border-slate-300 rounded cursor-pointer shrink-0" />
                                                <div className={`px-3.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${badgeColor}`}>
                                                    {icon} {statusTitle}
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-xl text-slate-900 leading-tight mb-2 break-all line-clamp-2" title={item.fileName}>
                                                {item.fileName || 'Data Manual'}
                                            </h4>

                                            <div className="space-y-3 mt-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500"><Clock size={14} /></div>
                                                    {dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500"><Layers size={14} /></div>
                                                    {(item.totalRows || 0).toLocaleString('id-ID')} Baris Data
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500"><Activity size={14} /></div>
                                                    Waktu Eksekusi: {duration}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KOLOM KANAN: DECISION & METRICS */}
                                    <div className="p-6 lg:p-8 w-full xl:w-2/3 flex flex-col justify-center bg-white relative">
                                        {!isDeleted ? (
                                            <>
                                                <div className="mb-6">
                                                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sistem MLOps Engine</h5>
                                                    <div className="flex items-start gap-3 mt-2">
                                                        <div className={`p-2.5 rounded-2xl mt-1 shrink-0 ${isAccepted ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                            {isAccepted ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                                                        </div>
                                                        <div>
                                                            <h4 className={`text-lg font-bold tracking-tight ${isAccepted ? 'text-emerald-700' : 'text-amber-700'}`}>{statusTitle}</h4>
                                                            <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed max-w-xl">{statusDesc}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* PERBANDINGAN METRIK UI */}
                                                {metrics ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mt-2 items-center relative">

                                                        {/* Prod Model Card */}
                                                        <div className="border border-slate-200 rounded-[24px] p-6 bg-slate-50/50 shadow-sm relative pt-8">
                                                            <span className="text-[10px] font-bold bg-white text-slate-600 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-200 absolute -top-3 left-6 shadow-sm">
                                                                Model Lama (Prod)
                                                            </span>
                                                            <div className="flex justify-between items-center mt-2">
                                                                <div>
                                                                    <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Error (MAPE)</p>
                                                                    <p className="font-black text-2xl text-slate-700">{metrics.prodMape}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Akurasi (R²)</p>
                                                                    <p className="font-black text-2xl text-slate-700">{metrics.prodR2}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Panah Tengah (Hanya di Desktop) */}
                                                        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full items-center justify-center shadow-sm text-slate-400">
                                                            <ArrowRight size={16} />
                                                        </div>

                                                        {/* Candidate Model Card */}
                                                        <div className={`border rounded-[24px] p-6 shadow-sm relative pt-8 transition-colors ${isAccepted ? 'bg-indigo-50/30 border-indigo-200' : 'bg-rose-50/30 border-rose-200'}`}>
                                                            <span className={`text-[10px] font-bold bg-white px-3 py-1.5 rounded-full uppercase tracking-widest border absolute -top-3 left-6 shadow-sm ${isAccepted ? 'text-indigo-600 border-indigo-200' : 'text-rose-600 border-rose-200'}`}>
                                                                Model Baru (Cand)
                                                            </span>
                                                            <div className="flex justify-between items-center mt-2">
                                                                <div>
                                                                    <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Error (MAPE)</p>
                                                                    <p className={`font-black text-2xl ${isMapeBetter ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                        {metrics.candMape}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Akurasi (R²)</p>
                                                                    <p className={`font-black text-2xl ${isR2Better ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                        {metrics.candR2}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100 shadow-inner">
                                                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                            <BrainCircuit size={16} className="text-slate-400" /> Raw Log Evaluasi Mesin
                                                        </h5>
                                                        <pre className="text-[11px] lg:text-xs font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">
                                                            {item.notes || 'Evaluasi diselesaikan tanpa log metrik komparasi.'}
                                                        </pre>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-center py-10">
                                                <div className="w-20 h-20 bg-rose-50 text-rose-300 rounded-full flex items-center justify-center mb-5"><FileX size={36} /></div>
                                                <h4 className="font-bold text-xl text-slate-700">Data Telah Dihapus</h4>
                                                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                                                    File sumber beserta log metriknya telah dibersihkan secara permanen dari database.
                                                </p>
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