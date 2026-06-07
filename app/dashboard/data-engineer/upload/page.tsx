"use client";
import React, { useState, useRef, useEffect } from 'react';
import { CloudUpload, FileSpreadsheet, CheckCircle2, Loader2, XCircle, Trash2, BrainCircuit, ServerCrash, Database, Timer, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import * as xlsx from 'xlsx';

export default function UploadDatasetPage() {
    const { data: session } = useSession();
    const user = session?.user as any;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // STATE DIAGNOSTIK INFRASTRUKTUR & LIVE RADAR
    const [systemStatus, setSystemStatus] = useState({
        isChecking: true,
        isApiOnline: false,
        isDbOnline: false
    });

    // STATUS UPLOAD
    const [uploadState, setUploadState] = useState<'idle' | 'previewing' | 'uploading' | 'success' | 'completed' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [displayData, setDisplayData] = useState<any[]>([]);

    const [uploadStats, setUploadStats] = useState({ fileName: '', totalRows: 0 });
    const [elapsedTime, setElapsedTime] = useState(0);

    // FUNGSI FORMAT STOPWATCH
    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) return `${h}j ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s} detik`;
    };

    // MENGECEK KONEKSI & MEMANTAU STATUS AI (LIVE RADAR)
    useEffect(() => {
        let localTimer: NodeJS.Timeout;

        const checkInfrastructure = async () => {
            let apiOnline = false;
            let dbOnline = false;
            let pipelineIsRunning = false;
            let currentRunningFile = '';
            let serverElapsed = 0;
            let lastStatus = '';
            let lastError = '';

            // Cek FastAPI
            try {
                const resApi = await fetch('http://localhost:8000/api/health');
                if (resApi.ok) {
                    apiOnline = true;
                    const data = await resApi.json();

                    if (data.pipeline_running) {
                        pipelineIsRunning = true;
                        currentRunningFile = data.current_file;
                        serverElapsed = data.elapsed_seconds || 0;
                    }
                    lastStatus = data.last_status;
                    lastError = data.last_error;
                }
            } catch (error) { }

            // Cek Supabase (Database Utama)
            try {
                const resDb = await fetch('/api/data-engineer/dashboard');
                if (resDb.ok) dbOnline = true;
            } catch (error) { }

            setSystemStatus({
                isChecking: false,
                isApiOnline: apiOnline,
                isDbOnline: dbOnline
            });

            // LOGIKA UX: Komunikasi dengan Background Task AI
            if (pipelineIsRunning) {
                setUploadState('success');
                setUploadStats(prev => ({
                    ...prev,
                    fileName: currentRunningFile || prev.fileName || 'Sedang Diproses...'
                }));
                setElapsedTime(serverElapsed);
            } else if (!pipelineIsRunning && uploadState === 'success') {
                if (lastStatus === 'error') {
                    setErrorMessage(lastError || 'Proses digagalkan oleh MLOps Engine (Error Internal).');
                    setUploadState('error');
                } else {
                    setUploadState('completed');
                }
            }
        };

        checkInfrastructure();
        const interval = setInterval(checkInfrastructure, 2000);

        if (uploadState === 'success') {
            localTimer = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }

        return () => {
            clearInterval(interval);
            if (localTimer) clearInterval(localTimer);
        };
    }, [uploadState]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await generateLocalPreview(file);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (!systemStatus.isApiOnline || !systemStatus.isDbOnline) return;
        const file = e.dataTransfer.files?.[0];
        if (file) await generateLocalPreview(file);
    };

    const generateLocalPreview = async (file: File) => {
        const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        const isExtensionValid = file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

        if (!validTypes.includes(file.type) && !isExtensionValid) {
            setErrorMessage('❌ Format file dilarang! Harap upload file berektensi .csv atau .xlsx saja.');
            setUploadState('error');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            setSelectedFile(file);
            setUploadStats({ fileName: file.name, totalRows: 0 });

            const buffer = await file.arrayBuffer();
            const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
            const sheetName = workbook.SheetNames[0];

            const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, dateNF: 'yyyy-mm-dd' });

            setDisplayData(rawData.slice(0, 10));
            setUploadState('previewing');
        } catch (error) {
            setDisplayData([]);
            setUploadState('previewing');
        }
    };

    const executeUploadToDatabase = async () => {
        if (!selectedFile) return;

        setUploadState('uploading');
        setErrorMessage('');
        setElapsedTime(0);

        let currentProgress = 0;
        const progressInterval = setInterval(() => {
            currentProgress += Math.floor(Math.random() * 15) + 5;
            if (currentProgress > 90) currentProgress = 90;
            setProgress(currentProgress);
        }, 400);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('uploadedBy', user?.name || user?.email || 'Data Engineer');

        try {
            const res = await fetch('http://localhost:8000/api/dataset/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            clearInterval(progressInterval);

            if (res.ok) {
                setProgress(100);
                setTimeout(() => setUploadState('success'), 800);
            } else {
                setErrorMessage(data.error || 'Terjadi kesalahan saat mengirim data ke server AI.');
                setUploadState('error');
            }
        } catch (error) {
            clearInterval(progressInterval);
            setErrorMessage('Gagal terhubung ke AI Engine. Pastikan FastAPI menyala di port 8000.');
            setUploadState('error');
        }
    };

    const resetUpload = () => {
        setUploadState('idle');
        setProgress(0);
        setElapsedTime(0);
        setDisplayData([]);
        setSelectedFile(null);
        setErrorMessage('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const isSystemReady = systemStatus.isApiOnline && systemStatus.isDbOnline;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8 relative">

            {/* --- MINI HERO BANNER --- */}
            <div className="bg-white rounded-[32px] p-8 lg:p-10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-50 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3 bg-indigo-50 w-fit px-3 py-1.5 rounded-full border border-indigo-100">
                        <Sparkles size={14} className="text-indigo-500" />
                        <span className="text-xs font-bold tracking-wide uppercase text-indigo-600">Data Ingestion</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Upload Dataset</h2>
                    <p className="text-sm text-slate-500 max-w-lg">
                        Suntikkan data transaksi mentah (.csv/.xlsx) untuk dinormalisasi ke PostgreSQL. MLOps Pipeline akan otomatis melakukan evaluasi dan retraining jika data valid.
                    </p>
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 lg:p-10 transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 fill-mode-both">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv, .xlsx" className="hidden" disabled={!isSystemReady} />

                    {uploadState === 'idle' && (
                        <>
                            {systemStatus.isChecking ? (
                                <div className="border-2 border-slate-100 rounded-[32px] p-12 lg:p-20 flex flex-col items-center justify-center bg-slate-50/50">
                                    <Loader2 size={40} className="text-indigo-400 animate-spin mb-4" />
                                    <h3 className="font-bold text-xl text-slate-500">Memeriksa Kesiapan Infrastruktur AI...</h3>
                                </div>
                            ) : isSystemReady ? (
                                <div className={`border-2 border-dashed rounded-[32px] p-12 lg:p-20 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${isDragging ? 'border-[#4f46e5] bg-[#EDF2FE] scale-[1.01]' : 'border-slate-200 hover:border-[#6A7BFA] hover:bg-indigo-50/30'}`}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className={`p-4 rounded-full mb-6 shadow-sm transition-colors ${isDragging ? 'bg-[#4f46e5] text-white' : 'bg-[#EDF2FE] text-[#4f46e5]'}`}>
                                        <CloudUpload size={48} />
                                    </div>
                                    <h3 className="font-bold text-2xl text-slate-900 mb-2">Tarik & Lepas File Di Sini</h3>
                                    <p className="text-slate-400 mb-8 text-center max-w-sm text-sm font-medium">Format yang didukung: <strong>.csv, .xlsx</strong></p>
                                    <button className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] hover:shadow-lg hover:shadow-indigo-500/30 text-white font-bold py-3.5 px-10 rounded-[40px] transition-all shadow-md active:scale-95 text-sm pointer-events-none">
                                        Pilih File dari Perangkat
                                    </button>
                                </div>
                            ) : (
                                <div className="border-2 border-red-200 bg-red-50/50 rounded-[32px] p-12 flex flex-col items-center justify-center text-center">
                                    <div className="p-4 bg-red-100 rounded-full text-red-500 mb-4 shadow-sm border border-red-200"><ServerCrash size={40} /></div>
                                    <h3 className="font-bold text-2xl text-red-700 mb-2 tracking-tight">Pipeline Upload Terkunci</h3>
                                    <p className="text-red-600/80 mb-6 max-w-md text-sm font-medium">
                                        Anda tidak dapat mengunggah data karena sebagian infrastruktur mati. Silakan periksa status layanan di bawah.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 ${systemStatus.isApiOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-100 text-red-600 border-red-300'}`}>
                                            <BrainCircuit size={14} /> FastAPI: {systemStatus.isApiOnline ? 'Online' : 'Offline'}
                                        </div>
                                        <div className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 ${systemStatus.isDbOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-100 text-red-600 border-red-300'}`}>
                                            <Database size={14} /> Database: {systemStatus.isDbOnline ? 'Online' : 'Offline'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {uploadState === 'previewing' && (
                        <div className="py-10 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 border-4 border-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-sm"><FileSpreadsheet size={40} /></div>
                            <h3 className="font-bold text-2xl text-slate-900 mb-3 tracking-tight">File Siap Dieksekusi</h3>
                            <p className="text-slate-500 mb-8 max-w-md text-sm font-medium">
                                File <strong className="text-slate-800">{uploadStats.fileName}</strong> berhasil dibaca. MLOps Pipeline siap memproses data ini.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                <button onClick={resetUpload} className="bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-500 font-bold py-3.5 px-8 rounded-[40px] transition-all text-sm flex items-center justify-center gap-2 active:scale-95"><Trash2 size={18} /> Batal</button>
                                <button onClick={executeUploadToDatabase} className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] hover:shadow-lg text-white font-bold py-3.5 px-10 rounded-[40px] transition-all text-sm shadow-[0_8px_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 active:scale-95"><BrainCircuit size={20} /> Mulai Pipeline AI Latar Belakang</button>
                            </div>
                        </div>
                    )}

                    {uploadState === 'uploading' && (
                        <div className="py-20 flex flex-col items-center justify-center animate-in fade-in">
                            <Loader2 size={48} className="text-[#4f46e5] animate-spin mb-6" />
                            <h3 className="font-bold text-2xl text-slate-900 mb-2">Mentransfer ke Server AI...</h3>
                            <div className="w-full max-w-md bg-[#EDF2FE] rounded-full h-3 overflow-hidden shadow-inner mt-8">
                                <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-xs font-bold text-[#4f46e5] mt-4">{progress}% Terkirim</p>
                        </div>
                    )}

                    {uploadState === 'success' && (
                        <div className="py-12 lg:py-16 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                            <div className="relative mb-6">
                                <div className="w-20 h-20 bg-[#EDF2FE] text-[#4f46e5] border-4 border-[#6A7BFA]/20 rounded-full flex items-center justify-center shadow-sm z-10 relative">
                                    <BrainCircuit size={40} />
                                </div>
                                <span className="absolute top-0 right-0 flex h-5 w-5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white"></span>
                                </span>
                            </div>

                            <h3 className="font-bold text-3xl text-slate-900 mb-4 tracking-tight">AI Sedang Memproses 🚀</h3>

                            <div className="mb-6 flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full border border-slate-700 shadow-md animate-in slide-in-from-bottom-2">
                                <Timer size={18} className="text-emerald-400 animate-pulse" />
                                <span className="font-mono font-bold text-sm tracking-wider">
                                    Live Time: {formatTime(elapsedTime)}
                                </span>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl max-w-xl mb-8 text-left shadow-sm">
                                <ul className="text-sm text-slate-500 space-y-3 font-semibold">
                                    <li className="flex items-center gap-3"><Loader2 size={18} className="text-[#4f46e5] animate-spin shrink-0" /> Sinkronisasi data retailer (Supabase).</li>
                                    <li className="flex items-center gap-3"><Loader2 size={18} className="text-[#4f46e5] animate-spin shrink-0" /> Ingesti puluhan ribu baris data (Batch Insert).</li>
                                    <li className="flex items-center gap-3"><Loader2 size={18} className="text-[#4f46e5] animate-spin shrink-0" /> <strong className="text-[#4f46e5]">Retraining Algoritma Random Forest</strong>.</li>
                                    <li className="flex items-center gap-3"><Loader2 size={18} className="text-[#4f46e5] animate-spin shrink-0" /> Benchmarking Model: R2, MAE, RMSE, MAPE.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {uploadState === 'error' && (
                        <div className="py-16 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-red-50 text-red-500 border-4 border-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm"><XCircle size={40} /></div>
                            <h3 className="font-bold text-3xl text-slate-900 mb-3 tracking-tight">Upload Gagal! 🚨</h3>
                            <p className="text-red-600 mb-8 max-w-lg text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-200 shadow-inner leading-relaxed">
                                {errorMessage}
                            </p>
                            <button onClick={resetUpload} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-10 rounded-[40px] transition-all shadow-sm active:scale-95">Coba Lagi</button>
                        </div>
                    )}

                    {uploadState === 'completed' && (
                        <div className="py-12 lg:py-16 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 border-4 border-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-sm"><CheckCircle2 size={40} /></div>
                            <h3 className="font-bold text-3xl text-slate-900 mb-4 tracking-tight">Pipeline Selesai! 🎉</h3>
                            <p className="text-slate-500 mb-8 max-w-md text-sm font-medium">Data berhasil dinormalisasi ke database dan MLOps Pipeline telah mencatat evaluasi metrik terbaru AI.</p>
                            <div className="flex gap-4">
                                <button onClick={resetUpload} className="bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-3.5 px-8 rounded-[40px] transition-all active:scale-95">Upload File Baru</button>
                                <Link href="/dashboard/data-engineer/history">
                                    <button className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] hover:shadow-lg hover:shadow-indigo-500/30 text-white font-bold py-3.5 px-8 rounded-[40px] transition-all shadow-[0_8px_20px_rgba(79,70,229,0.3)] active:scale-95">
                                        Lihat History MLOps
                                    </button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {uploadState === 'previewing' && displayData.length > 0 && (
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-2xl bg-[#EDF2FE] text-[#4f46e5]"><FileSpreadsheet size={20} /></div>
                            <div>
                                <h3 className="font-bold text-xl text-slate-900">Preview Struktur File</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Validasi manual 10 baris pertama sebelum dieksekusi oleh mesin.</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 custom-scrollbar pb-2">
                            <table className="w-max min-w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        {Object.keys(displayData[0]).map((key, i) => (
                                            <th key={i} className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {displayData.map((row, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-[#EDF2FE]/30 transition-colors">
                                            {Object.values(row).map((val: any, j) => (
                                                <td key={j} className="p-4 text-slate-600 font-medium">
                                                    {typeof val === 'number' && val > 1000 ? val.toLocaleString('id-ID') : String(val)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}