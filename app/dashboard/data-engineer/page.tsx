"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Database, FileSpreadsheet, HardDrive, BrainCircuit, ArrowRight,
    TrendingUp, CloudUpload, Eye, ServerCrash, Activity, CheckCircle2,
    Target, Percent, Sparkles, TrendingDown, Gauge
} from 'lucide-react';

export default function DataEngineerDashboard() {
    const [recentData, setRecentData] = useState<any[]>([]);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [latency, setLatency] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    const [fastApiStatus, setFastApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [isModelReady, setIsModelReady] = useState(false);

    // STATE UNTUK METRIK DINAMIS DARI DATABASE (Real-time!)
    const [championMetrics, setChampionMetrics] = useState({
        mape: 0.0,
        mae: 0.0,
        r2: 0.0
    });

    useEffect(() => {
        // 1. Fetch Data & Metrics dari Backend
        const fetchDatabase = async () => {
            const startTime = performance.now();
            try {
                // Fetch baris dataset
                const resDb = await fetch('/api/data-engineer/dashboard');
                if (resDb.ok) {
                    const data = await resDb.json();
                    setRecentData(data.recentData || []);
                    setTotalRows(data.totalRows || 0);
                }

                // Fetch Metrik Real-Time
                const resMetrics = await fetch('http://localhost:8000/api/model/latest-metrics');
                if (resMetrics.ok) {
                    const metData = await resMetrics.json();
                    if (metData.metrics) {
                        setChampionMetrics({
                            mape: metData.metrics.mape,
                            mae: metData.metrics.mae,
                            r2: metData.metrics.r2
                        });
                    }
                }
            } catch (error) {
                console.error("Gagal mengambil data database/metrik:", error);
            } finally {
                const endTime = performance.now();
                setLatency(Math.round(endTime - startTime));
                setIsLoading(false);
            }
        };

        // 2. Fetch Status Server FastAPI
        const checkFastApi = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/health');
                if (res.ok) {
                    const data = await res.json();
                    setFastApiStatus('online');
                    setIsModelReady(data.model_ready);
                } else {
                    setFastApiStatus('offline');
                }
            } catch (error) {
                console.error("FastAPI tidak terdeteksi:", error);
                setFastApiStatus('offline');
            }
        };

        fetchDatabase();
        checkFastApi();

        const interval = setInterval(() => {
            checkFastApi();
            fetchDatabase(); // Refresh metrik setiap 30 detik untuk berjaga-jaga jika ada pipeline selesai
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatTotalRows = (num: number) => {
        if (num === 0) return "0";
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    // =========================================================
    // LOGIKA PERHITUNGAN METRIK FORECAST STATUS (Sesuai Rule)
    // =========================================================
    const mapeValue = championMetrics.mape;
    const forecastAccuracy = (100 - mapeValue).toFixed(2);

    let statusText = "Poor";
    let statusColor = "text-red-600 bg-red-50 border-red-200";
    let statusIconColor = "text-red-600 bg-red-100";
    let statusDot = "bg-red-500";

    // Validasi agar saat loading/data kosong tidak merah
    if (mapeValue === 0) {
        statusText = "Waiting...";
        statusColor = "text-slate-600 bg-slate-50 border-slate-200";
        statusIconColor = "text-slate-500 bg-slate-200";
        statusDot = "bg-slate-400";
    } else if (mapeValue < 10) {
        statusText = "Excellent";
        statusColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
        statusIconColor = "text-emerald-600 bg-emerald-100";
        statusDot = "bg-emerald-500";
    } else if (mapeValue <= 20) {
        statusText = "Good";
        statusColor = "text-blue-600 bg-blue-50 border-blue-100";
        statusIconColor = "text-blue-600 bg-blue-100";
        statusDot = "bg-blue-500";
    } else if (mapeValue <= 50) {
        statusText = "Fair";
        statusColor = "text-amber-600 bg-amber-50 border-amber-100";
        statusIconColor = "text-amber-600 bg-amber-100";
        statusDot = "bg-amber-500";
    }

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8">
            {/* --- HEADER HERO --- */}
            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] rounded-[40px] p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10 max-w-2xl text-white">
                    <div className="flex items-center gap-2 mb-4 bg-white/20 w-fit px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-sm">
                        <Sparkles size={14} className="text-amber-300" />
                        <span className="text-xs font-bold tracking-wide uppercase text-white drop-shadow-sm">MLOps Command Center</span>
                    </div>
                    <h2 className="text-[32px] lg:text-[40px] font-bold mb-4 tracking-tight leading-tight">
                        Pusat Kendali Machine Learning<br />& Integrasi Dataset.
                    </h2>
                    <p className="text-white/85 text-sm lg:text-base leading-relaxed mb-8 max-w-[650px]">
                        Pipeline AI saat ini beroperasi secara mandiri. Anda dapat meninjau sampel dataset<br className="hidden lg:block" />
                        historis atau mengunggah data ritel agregat bulanan<br className="hidden lg:block" />
                        untuk melakukan <strong className="text-white">retraining model prediksi</strong> secara berkala.
                    </p>
                    <Link href="/dashboard/data-engineer/upload">
                        <button className="bg-white text-[#4f46e5] hover:bg-slate-50 hover:-translate-y-1 font-bold py-3.5 px-8 rounded-[40px] transition-all shadow-lg active:scale-95 text-sm flex items-center gap-2 group">
                            Upload Jutaan Data <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
                <div className="hidden md:block w-[320px] h-[260px] relative z-10 mr-4 animate-float">
                    <img src="/ilustrasi-UploadData-NoBg-Fix.png" alt="Illustration" className="w-full h-full object-contain drop-shadow-2xl scale-125" />
                </div>
            </div>

            {/* --- BARIS 1: STATUS SISTEM & DATABASE (3 KARTU) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl"><HardDrive size={24} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Total Data Latih</p>
                        <h3 className="text-2xl font-bold text-slate-900">{isLoading ? '...' : formatTotalRows(totalRows)} <span className="text-sm font-medium text-slate-400">Rows</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Database size={24} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">DB Latency</p>
                        <h3 className={`text-2xl font-bold ${latency < 500 ? 'text-emerald-600' : 'text-amber-500'}`}>{isLoading ? '...' : `${latency}ms`}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${fastApiStatus === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {fastApiStatus === 'online' ? <BrainCircuit size={24} /> : <ServerCrash size={24} />}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">AI Engine API</p>
                        <h3 className={`text-2xl font-bold ${fastApiStatus === 'online' ? 'text-slate-900' : 'text-red-600'}`}>{fastApiStatus === 'online' ? 'Online' : 'Offline'}</h3>
                    </div>
                </div>
            </div>

            {/* --- BARIS 2: 4 KARTU MODEL PERFORMANCE --- */}
            <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2">
                    Current Model Performance
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">Real-time</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                    {/* Card 1: Forecast Accuracy */}
                    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Target size={20} /></div>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">Model Precision</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Forecast Accuracy</p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{mapeValue === 0 ? '--' : forecastAccuracy}</h3>
                                <span className="text-lg text-slate-400 font-bold">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: MAPE */}
                    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><Percent size={20} /></div>
                            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">Error Rate</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">MAPE</p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{mapeValue === 0 ? '--' : championMetrics.mape}</h3>
                                <span className="text-lg text-slate-400 font-bold">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: MAE */}
                    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><TrendingDown size={20} /></div>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">Unit Variance</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">MAE</p>
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{mapeValue === 0 ? '--' : championMetrics.mae}</h3>
                        </div>
                    </div>

                    {/* Card 4: Forecast Status (Dinamis sesuai Rule) */}
                    <div className={`bg-white rounded-[32px] p-6 border shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all duration-300 ${statusColor.replace('text-', 'border-').replace('bg-', '')}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-3 rounded-2xl ${statusIconColor}`}><Gauge size={20} /></div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border ${statusColor}`}>
                                <span className={`w-2 h-2 rounded-full ${statusDot} animate-pulse`}></span>
                                Evaluated
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Forecast Status</p>
                            <h3 className={`text-3xl font-black tracking-tight ${statusColor.split(' ')[0]}`}>{statusText}</h3>
                        </div>
                    </div>

                </div>
            </div>

            {/* --- TABEL DATA --- */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#EDF2FE] rounded-2xl text-[#6A7BFA]"><FileSpreadsheet size={20} /></div>
                        <div>
                            <h3 className="font-bold text-xl text-slate-900">Sampel Dataset Historis</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Cuplikan data riwayat sebelum masuk pipeline model AI.</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link href="/dashboard/data-engineer/dataset">
                            <button className="text-[12px] bg-slate-50 text-slate-600 hover:bg-[#EDF2FE] hover:text-[#4f46e5] px-5 py-2.5 rounded-[40px] font-bold transition-all border border-slate-200 hover:border-[#4f46e5] shadow-sm flex items-center gap-2 active:scale-95">
                                <Eye size={16} /> Lihat Semua
                            </button>
                        </Link>
                        <Link href="/dashboard/data-engineer/upload">
                            <button className="text-[12px] bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white hover:shadow-lg hover:shadow-[#4f46e5]/30 px-5 py-2.5 rounded-[40px] font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95">
                                <CloudUpload size={16} /> Upload Data Baru
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="overflow-x-auto overflow-y-auto max-h-[500px] rounded-2xl border border-slate-100 custom-scrollbar pb-2 relative">
                    <table className="w-max min-w-full text-left border-collapse whitespace-nowrap">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-md shadow-sm border-b border-slate-200">
                            <tr>
                                <th className="p-4 pl-6 font-bold text-slate-500 text-[11px] uppercase tracking-widest">No</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Retailer</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Retailer ID</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Invoice Date</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Region</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">State</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Product</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Price per Unit</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Units Sold</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Total Sales</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Operating Profit</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Operating Margin</th>
                                <th className="p-4 pr-6 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Sales Method</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={13} className="p-8 text-center text-slate-500 font-medium animate-pulse">Memuat data historis dari database...</td>
                                </tr>
                            ) : recentData.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="p-8 text-center text-slate-500 font-medium">Belum ada data historis yang tersedia. Silakan upload data baru.</td>
                                </tr>
                            ) : recentData.map((row: any, index: number) => (
                                <tr key={row.id} className="border-b border-slate-50 hover:bg-[#EDF2FE]/50 transition-colors">
                                    <td className="p-4 pl-6 font-bold text-slate-400">{index + 1}</td>
                                    <td className="p-4 font-semibold text-slate-900">{row.retailer?.name || 'N/A'}</td>
                                    <td className="p-4 text-slate-500 font-mono text-[11px]">{row.retailerId || '-'}</td>
                                    <td className="p-4"><span className="text-xs text-[#4f46e5] bg-[#EDF2FE] px-2 py-1 rounded-md font-bold">{new Date(row.invoiceDate).toLocaleDateString('id-ID')}</span></td>
                                    <td className="p-4 text-slate-600">{row.retailer?.region || '-'}</td>
                                    <td className="p-4 text-slate-600 font-medium">{row.retailer?.state || '-'}</td>
                                    <td className="p-4 font-semibold text-slate-700">{row.product}</td>
                                    <td className="p-4 text-slate-600 font-medium text-right">Rp {row.pricePerUnit?.toLocaleString('id-ID')}</td>
                                    <td className="p-4 font-bold text-slate-800 text-right bg-slate-50/50">{row.unitsSold?.toLocaleString('id-ID')}</td>
                                    <td className="p-4 text-emerald-600 font-bold text-right">Rp {row.totalSales?.toLocaleString('id-ID')}</td>
                                    <td className="p-4 text-[#4f46e5] font-bold text-right bg-[#EDF2FE]/30">Rp {row.operatingProfit?.toLocaleString('id-ID')}</td>
                                    <td className="p-4 text-amber-600 font-bold text-right">{(row.operatingMargin * 100).toFixed(0)}%</td>
                                    <td className="p-4 pr-6 text-slate-500 text-xs">{row.salesMethod}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
                .animate-float { animation: float 6s ease-in-out infinite; }
            `}} />
        </div>
    );
}