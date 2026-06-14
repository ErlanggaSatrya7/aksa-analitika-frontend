"use client";
import React, { useState, useRef, useEffect } from 'react';
import {
    CloudUpload, FileSpreadsheet, CheckCircle2, Loader2, XCircle, Trash2,
    BrainCircuit, ServerCrash, Database, Timer, Sparkles, Circle, Check,
    Activity, ArrowRight, TrendingUp, TrendingDown, RefreshCcw
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import * as xlsx from 'xlsx';

export default function UploadDatasetPage() {
    const { data: session } = useSession();
    const user = session?.user as any;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [systemStatus, setSystemStatus] = useState({
        isChecking: true,
        isApiOnline: false,
        isDbOnline: false
    });

    const [uploadState, setUploadState] = useState<'idle' | 'previewing' | 'processing' | 'completed' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [displayData, setDisplayData] = useState<any[]>([]);

    const [uploadStats, setUploadStats] = useState({ fileName: '', totalRows: 0, startTime: new Date(), fileSize: 0 });
    const [elapsedTime, setElapsedTime] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [pipelineDecision, setPipelineDecision] = useState<'ACCEPTED' | 'REJECTED'>('ACCEPTED');
    const [metricsData, setMetricsData] = useState<any>(null);

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const pipelineStages = [
        { title: "Dataset Validation", desc: "Validating file structure, columns, and missing values." },
        { title: "Data Engineering", desc: "Cleaning, transforming, and synchronizing to PostgreSQL." },
        { title: "Model Training", desc: "Loading production model & training new Random Forest candidate." },
        { title: "Model Evaluation", desc: "Cross-validation and benchmarking R², MAE, MAPE." },
        { title: "Deployment Decision", desc: "Comparing metrics to determine production deployment." }
    ];

    useEffect(() => {
        let localTimer: NodeJS.Timeout;

        const checkInfrastructure = async () => {
            let apiOnline = false;
            let dbOnline = false;

            try {
                const resApi = await fetch('http://localhost:8000/api/health');
                if (resApi.ok) {
                    apiOnline = true;
                    const data = await resApi.json();

                    if (data.pipeline_running) {
                        if (uploadState !== 'processing') {
                            setUploadState('processing');
                            setUploadStats(prev => ({ ...prev, fileName: data.current_file || 'Background Process' }));
                        }
                        setElapsedTime(data.elapsed_seconds || 0);
                        setCurrentStep(data.current_step);

                        if (data.training_logs && data.training_logs.decision) {
                            setMetricsData(data.training_logs);
                        }
                    } else if (!data.pipeline_running && uploadState === 'processing') {
                        if (data.last_status === 'error' || data.last_status === 'GAGAL') {
                            setErrorMessage(data.last_error || 'Proses digagalkan oleh MLOps Engine (Error Internal).');
                            setUploadState('error');
                        } else {
                            if (metricsData) {
                                setPipelineDecision(metricsData.decision);
                            } else {
                                setPipelineDecision(data.last_status?.includes('TOLAK') ? 'REJECTED' : 'ACCEPTED');
                            }
                            setCurrentStep(5);
                            setTimeout(() => setUploadState('completed'), 500);
                        }
                    }
                }
            } catch (error) {
                if (uploadState === 'processing') {
                    setErrorMessage("Koneksi ke AI Engine terputus secara tiba-tiba. Pastikan server berjalan.");
                    setUploadState('error');
                }
            }

            try {
                const resDb = await fetch('/api/data-engineer/dashboard');
                if (resDb.ok) dbOnline = true;
            } catch (error) { }

            setSystemStatus({ isChecking: false, isApiOnline: apiOnline, isDbOnline: dbOnline });
        };

        checkInfrastructure();
        const interval = setInterval(checkInfrastructure, 1500);

        if (uploadState === 'processing') {
            localTimer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
        }

        return () => {
            clearInterval(interval);
            if (localTimer) clearInterval(localTimer);
        };
    }, [uploadState, metricsData]);

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
            setErrorMessage('Format file dilarang! Harap upload file berektensi .csv atau .xlsx.');
            setUploadState('error');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            setSelectedFile(file);
            const isLargeFile = file.size > 5 * 1024 * 1024;
            const buffer = await file.arrayBuffer();
            const readOptions: any = { type: 'buffer', cellDates: true };
            if (isLargeFile) readOptions.sheetRows = 5;

            const workbook = xlsx.read(buffer, readOptions);
            const sheetName = workbook.SheetNames[0];
            const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, dateNF: 'yyyy-mm-dd' });

            const rowCount = isLargeFile ? 0 : rawData.length;
            const previewData = isLargeFile ? rawData : rawData.slice(0, 5);

            setUploadStats({ fileName: file.name, totalRows: rowCount, startTime: new Date(), fileSize: file.size });
            setDisplayData(previewData);
            setUploadState('previewing');
        } catch (error) {
            setErrorMessage('Gagal membaca file lokal. File mungkin korup atau tidak valid.');
            setUploadState('error');
        }
    };

    const executeUploadToDatabase = async () => {
        if (!selectedFile) return;

        setUploadState('processing');
        setCurrentStep(0);
        setElapsedTime(0);
        setErrorMessage('');
        setMetricsData(null);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('uploadedBy', user?.name || user?.email || 'Data Engineer');

        try {
            const res = await fetch('http://localhost:8000/api/dataset/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                let errorText = 'Gagal mengirim data ke server AI. HTTP Status: ' + res.status;
                try {
                    const data = await res.json();
                    errorText = data.error || data.message || errorText;
                } catch (jsonError) {
                    errorText = "Terjadi kegagalan kritis di sisi server AI. Harap periksa terminal backend.";
                }
                setErrorMessage(errorText);
                setUploadState('error');
            }
        } catch (error: any) {
            setErrorMessage(error.message || 'Koneksi terputus. Pastikan FastAPI menyala di port 8000.');
            setUploadState('error');
        }
    };

    const resetUpload = () => {
        setUploadState('idle');
        setElapsedTime(0);
        setCurrentStep(0);
        setDisplayData([]);
        setSelectedFile(null);
        setErrorMessage('');
        setMetricsData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const isSystemReady = systemStatus.isApiOnline && systemStatus.isDbOnline;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8 relative">

            {(uploadState === 'idle' || uploadState === 'previewing' || uploadState === 'error') && (
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
                    {uploadState === 'idle' && (
                        <div className="relative z-10 mt-6 md:mt-0 flex gap-4">
                            <button onClick={() => window.location.reload()} className="bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 font-bold py-2 px-4 rounded-full transition-all text-xs flex items-center gap-2 shadow-sm"><RefreshCcw size={14} /> Refresh Koneksi</button>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-8">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv, .xlsx" className="hidden" disabled={!isSystemReady} />

                {uploadState === 'idle' && (
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 lg:p-10 transition-all duration-300 animate-in fade-in fill-mode-both">
                        {systemStatus.isChecking ? (
                            <div className="border-2 border-slate-100 rounded-[32px] p-12 lg:p-20 flex flex-col items-center justify-center bg-slate-50/50">
                                <Loader2 size={40} className="text-[#4f46e5] animate-spin mb-4" />
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
                                    Anda tidak dapat mengunggah data karena sebagian infrastruktur mati. Silakan periksa status layanan di atas.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {uploadState === 'previewing' && (
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-8 lg:p-10 animate-in zoom-in-95 fill-mode-both">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl"><FileSpreadsheet size={28} /></div>
                                <div>
                                    <h3 className="font-bold text-2xl text-slate-900 tracking-tight">{uploadStats.fileName}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-slate-500 font-medium text-sm">{formatBytes(uploadStats.fileSize)}</span>
                                        <span className="text-slate-500 font-medium text-sm">
                                            • {uploadStats.totalRows > 0 ? `${uploadStats.totalRows.toLocaleString()} Rows` : 'Menghitung total baris di server...'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={resetUpload} className="bg-slate-50 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-bold py-3 px-6 rounded-full transition-all text-sm flex items-center gap-2"><Trash2 size={16} /> Batal</button>
                                <button onClick={executeUploadToDatabase} className="bg-[#4f46e5] hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full transition-all text-sm shadow-md flex items-center gap-2"><BrainCircuit size={18} /> Execute Pipeline</button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-slate-200 custom-scrollbar pb-2">
                            <table className="w-max min-w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        {displayData.length > 0 && Object.keys(displayData[0]).map((key, i) => (
                                            <th key={i} className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {displayData.map((row, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
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

                {uploadState === 'processing' && (
                    <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
                        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                                    <Activity className="text-indigo-600" /> AI Processing Pipeline
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Dataset sedang diproses secara otomatis melalui pipeline Data Engineering dan MLOps.</p>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200">
                                <Timer className="text-slate-400" size={20} />
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Running Duration</p>
                                    <p className="font-mono text-lg font-bold text-slate-800">{formatTime(elapsedTime)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm lg:col-span-1">
                                <h3 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">Pipeline Stages</h3>
                                <div className="space-y-6">
                                    {pipelineStages.map((stage, idx) => {
                                        const isCompleted = currentStep > idx;
                                        const isActive = currentStep === idx;

                                        return (
                                            <div key={idx} className="flex gap-4 relative">
                                                {idx !== pipelineStages.length - 1 && (
                                                    <div className={`absolute left-3 top-8 bottom-[-24px] w-0.5 ${isCompleted ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                                                )}
                                                <div className="relative z-10 bg-white pt-1">
                                                    {isCompleted ? (
                                                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm"><Check size={14} strokeWidth={3} /></div>
                                                    ) : isActive ? (
                                                        <div className="w-6 h-6 rounded-full border-2 border-indigo-600 text-indigo-600 flex items-center justify-center bg-indigo-50"><Loader2 size={14} className="animate-spin" /></div>
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center bg-slate-50"><Circle size={8} className="text-slate-300" fill="currentColor" /></div>
                                                    )}
                                                </div>
                                                <div className={`pb-2 ${isActive ? 'opacity-100' : isCompleted ? 'opacity-70' : 'opacity-40'}`}>
                                                    <h4 className={`text-sm font-bold ${isActive ? 'text-indigo-600' : 'text-slate-800'}`}>{stage.title}</h4>
                                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{stage.desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-6 flex flex-col">
                                <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200"><Database size={24} className="text-slate-600" /></div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{uploadStats.fileName || "Processing..."}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">Pipeline in progress</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#0F172A] rounded-[32px] p-6 lg:p-8 flex-1 border border-slate-800 shadow-xl overflow-hidden relative flex flex-col justify-end min-h-[250px]">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
                                    <div className="relative z-10 font-mono text-xs md:text-sm text-slate-300 space-y-3">
                                        <p className="text-slate-500">[SYSTEM] Server connection synchronized.</p>
                                        {currentStep >= 0 && <p className="text-emerald-400">[STAGE 1] Validating file structure and reading dataset to memory... OK.</p>}
                                        {currentStep >= 1 && <p className="text-emerald-400">[STAGE 2] Ingesting mass data to PostgreSQL database... Success.</p>}
                                        {currentStep >= 2 && <p className="text-blue-400">
                                            [STAGE 3] Loading Production Model (RandomForest). Initiating Candidate Training...
                                        </p>}

                                        {/* OUTPUT TRANSPARAN LOG METRIK */}
                                        {currentStep >= 3 && metricsData && (
                                            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-2 mt-2">
                                                <p className="text-amber-400">[STAGE 4] Cross-validation completed. Metrics Comparison:</p>
                                                <div className="grid grid-cols-2 gap-4 mt-2 pl-4">
                                                    <div>
                                                        <p className="text-slate-400">--- PROD. MODEL ---</p>
                                                        <p>R² Score : {metricsData.prod_r2}</p>
                                                        <p>MAE      : {metricsData.prod_mae}</p>
                                                        <p>MAPE     : {metricsData.prod_mape}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400">--- CANDIDATE ---</p>
                                                        <p className={metricsData.cand_r2 > metricsData.prod_r2 ? "text-emerald-400" : "text-red-400"}>R² Score : {metricsData.cand_r2}</p>
                                                        <p className={metricsData.cand_mae < metricsData.prod_mae ? "text-emerald-400" : "text-red-400"}>MAE      : {metricsData.cand_mae}</p>
                                                        <p className={metricsData.cand_mape < metricsData.prod_mape ? "text-emerald-400" : "text-red-400"}>MAPE     : {metricsData.cand_mape}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {currentStep >= 4 && metricsData && (
                                            <p className={`mt-4 font-bold ${metricsData.decision === 'ACCEPTED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                [STAGE 5] Deployment decision: {metricsData.decision === 'ACCEPTED' ? 'CANDIDATE ACCEPTED. OVERWRITING PROD MODEL...' : 'CANDIDATE REJECTED. MAINTAINING PROD MODEL.'}
                                            </p>
                                        )}

                                        {currentStep < 5 && (
                                            <div className="flex items-center gap-2 mt-4 text-slate-400">
                                                <Loader2 size={14} className="animate-spin" /> Executing server block...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- STATE 4: COMPLETED (RETRAINING SUMMARY CARD) --- */}
                {uploadState === 'completed' && metricsData && (
                    <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-6">
                        <div className={`rounded-[32px] p-8 border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm ${pipelineDecision === 'ACCEPTED' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-full bg-white shadow-sm ${pipelineDecision === 'ACCEPTED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {pipelineDecision === 'ACCEPTED' ? <CheckCircle2 size={32} /> : <Activity size={32} />}
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-bold tracking-tight ${pipelineDecision === 'ACCEPTED' ? 'text-emerald-800' : 'text-amber-800'}`}>
                                        {pipelineDecision === 'ACCEPTED' ? 'Model Accepted' : 'Model Rejected'}
                                    </h2>
                                    <p className={`text-sm mt-1 font-medium ${pipelineDecision === 'ACCEPTED' ? 'text-emerald-600' : 'text-amber-700'}`}>
                                        {pipelineDecision === 'ACCEPTED' ? 'New model deployed to production.' : 'Current production model remains active because it performs better.'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={resetUpload} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-3 px-6 rounded-full transition-all text-sm">Upload New</button>
                                <Link href="/dashboard/data-engineer/history">
                                    <button className={`text-white font-bold py-3 px-6 rounded-full transition-all text-sm shadow-md ${pipelineDecision === 'ACCEPTED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>View Logs</button>
                                </Link>
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-2 mt-8 mb-4">Retraining Summary</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-200">Current Prod Model</span>
                                    <div className="mt-8 space-y-6">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">MAPE</p>
                                            <p className="text-2xl font-bold text-slate-800">{metricsData.prod_mape}<span className="text-sm text-slate-400 ml-1">%</span></p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">MAE</p>
                                            <p className="text-2xl font-bold text-slate-800">{metricsData.prod_mae}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">R² Score</p>
                                            <p className="text-2xl font-bold text-slate-800">{metricsData.prod_r2}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden lg:flex flex-col items-center justify-center -mx-4 z-10">
                                <div className="bg-slate-50 border border-slate-200 p-3 rounded-full text-slate-400 shadow-sm"><ArrowRight size={20} /></div>
                            </div>

                            <div className="bg-white rounded-[32px] p-8 border border-indigo-200 shadow-[0_8px_30px_rgba(79,70,229,0.05)] relative overflow-hidden flex flex-col justify-between">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
                                <div className="relative z-10">
                                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full uppercase tracking-widest border border-indigo-100">Candidate Model</span>
                                    <div className="mt-8 space-y-6">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">MAPE</p>
                                                <p className={`text-2xl font-bold ${metricsData.cand_mape < metricsData.prod_mape ? 'text-emerald-600' : 'text-amber-600'}`}>{metricsData.cand_mape}<span className="text-sm ml-1">%</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">MAE</p>
                                                <p className={`text-2xl font-bold ${metricsData.cand_mae < metricsData.prod_mae ? 'text-emerald-600' : 'text-amber-600'}`}>{metricsData.cand_mae}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">R² Score</p>
                                                <p className={`text-2xl font-bold ${metricsData.cand_r2 > metricsData.prod_r2 ? 'text-emerald-600' : 'text-amber-600'}`}>{metricsData.cand_r2}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* --- STATE 5: ERROR --- */}
                {uploadState === 'error' && (
                    <div className="py-16 flex flex-col items-center justify-center text-center animate-in zoom-in-95 bg-white rounded-[40px] border border-slate-100 shadow-sm p-10">
                        <div className="w-20 h-20 bg-red-50 text-red-500 border-4 border-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm"><XCircle size={40} /></div>
                        <h3 className="font-bold text-3xl text-slate-900 mb-3 tracking-tight">Upload Gagal! 🚨</h3>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-inner mb-8 max-w-lg w-full text-left">
                            <p className="text-red-700 text-sm font-mono break-words whitespace-pre-wrap">
                                {errorMessage ? String(errorMessage) : "Terjadi kesalahan internal pada server AI. Silakan periksa log terminal backend."}
                            </p>
                        </div>
                        <button onClick={resetUpload} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-10 rounded-full transition-all shadow-sm active:scale-95">Coba Lagi</button>
                    </div>
                )}

            </div>
        </div>
    );
}