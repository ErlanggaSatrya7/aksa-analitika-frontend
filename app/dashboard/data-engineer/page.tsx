"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, FileSpreadsheet, HardDrive, BrainCircuit, ArrowRight, TrendingUp, CloudUpload, Eye } from 'lucide-react';

export default function DataEngineerDashboard() {
    const [recentData, setRecentData] = useState<any[]>([]);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [latency, setLatency] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    const [accuracy, setAccuracy] = useState<string | null>(null);
    const [growth, setGrowth] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const startTime = performance.now();
            try {
                const res = await fetch('/api/data-engineer/dashboard');
                const data = await res.json();
                if (res.ok) {
                    setRecentData(data.recentData || []);
                    setTotalRows(data.totalRows || 0);
                    setAccuracy(data.accuracy ?? null);
                    setGrowth(data.growth ?? null);
                }
            } catch (error) {
                console.error("Gagal mengambil data:", error);
            } finally {
                const endTime = performance.now();
                setLatency(Math.round(endTime - startTime));
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatTotalRows = (num: number) => {
        if (num === 0) return "0";
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8">
            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] rounded-[40px] p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10 max-w-2xl text-white">
                    <h2 className="text-[32px] lg:text-[40px] font-bold mb-4 tracking-tight leading-tight">
                        Pusat Kendali Machine Learning<br />& Integrasi Dataset.
                    </h2>
                    <p className="text-white/85 text-sm lg:text-base leading-relaxed mb-8 max-w-[650px]">
                        Pipeline AI saat ini beroperasi secara mandiri. Anda dapat meninjau sampel dataset<br className="hidden lg:block" />
                        historis (3-5 tahun terakhir) atau mengunggah data ritel agregat bulanan<br className="hidden lg:block" />
                        untuk melakukan <strong className="text-white">retraining model prediksi</strong> secara berkala.
                    </p>
                    <Link href="/dashboard/data-engineer/upload">
                        <button className="bg-white text-[#4f46e5] hover:bg-slate-50 hover:-translate-y-1 font-bold py-3.5 px-8 rounded-[40px] transition-all shadow-lg active:scale-95 text-sm flex items-center gap-2 group">
                            Retrain Model (Upload CSV) <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
                <div className="hidden md:block w-[320px] h-[260px] relative z-10 mr-4 animate-float">
                    <img src="/ilustrasi-UploadData-NoBg-Fix.png" alt="Illustration" className="w-full h-full object-contain drop-shadow-2xl scale-125" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 fill-mode-both delay-100 relative group/card cursor-default">
                    <div className="flex justify-between items-start mb-5">
                        <div className="p-3 bg-[#EDF2FE] text-[#6A7BFA] group-hover/card:bg-[#4f46e5] group-hover/card:text-white transition-colors rounded-2xl w-fit"><HardDrive size={22} /></div>
                        <span className="text-[11px] font-bold text-[#4f46e5] bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1"><TrendingUp size={12} /> Data Bersih</span>
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover/card:text-[#4f46e5] transition-colors">Total Baris Data Historis</p>
                        <div className="relative group/number inline-block cursor-help border-b border-dashed border-slate-300 hover:border-[#6A7BFA] transition-colors pb-0.5">
                            <h3 className="text-2xl lg:text-3xl font-bold text-slate-900">
                                {isLoading ? '...' : formatTotalRows(totalRows)} <span className="text-xl text-slate-400 font-medium">Rows</span>
                            </h3>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/number:block bg-slate-900 text-white p-3 rounded-xl shadow-2xl z-50 min-w-[200px] pointer-events-none animate-in fade-in slide-in-from-bottom-2 text-center">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Jumlah Aktual DB</p>
                                <p className="text-lg font-black text-emerald-400 tracking-tight">{totalRows.toLocaleString('id-ID')} <span className="text-sm font-medium opacity-80">Baris</span></p>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 fill-mode-both delay-200 cursor-default group/card">
                    <div className="flex justify-between items-start mb-5">
                        <div className="p-3 bg-emerald-50 text-emerald-600 group-hover/card:bg-emerald-500 group-hover/card:text-white transition-colors rounded-2xl w-fit"><Database size={22} /></div>
                        <span className="text-[11px] font-bold text-emerald-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                            Latency: {isLoading ? '...' : `${latency}ms`}
                        </span>
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover/card:text-emerald-600 transition-colors">Status Database Cloud</p>
                        <h3 className={`text-2xl lg:text-3xl font-bold ${isLoading ? 'text-slate-400' : (latency < 500 ? 'text-emerald-600' : 'text-amber-500')}`}>
                            {isLoading ? 'Memuat...' : (latency < 500 ? 'Optimal' : 'Lambat')}
                        </h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.2)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 fill-mode-both delay-300 cursor-default group/card">
                    <div className="flex justify-between items-start mb-5">
                        <div className={`p-3 rounded-2xl w-fit transition-colors ${accuracy !== null ? 'bg-amber-50 text-amber-600 group-hover/card:bg-amber-500 group-hover/card:text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <BrainCircuit size={22} />
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border ${accuracy !== null ? 'bg-slate-50 border-slate-100 text-amber-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
                            {isLoading ? '...' : (
                                accuracy !== null
                                    ? <><TrendingUp size={12} /> +{growth}% (Live)</>
                                    : 'FastAPI Offline'
                            )}
                        </span>
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover/card:text-amber-600 transition-colors">Akurasi Algoritma ML</p>
                        <h3 className={`text-2xl lg:text-3xl font-bold ${accuracy !== null ? 'text-slate-900' : 'text-slate-400'}`}>
                            {isLoading ? '...' : (accuracy !== null ? `${accuracy}%` : 'N/A')}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400 fill-mode-both">
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
                                <CloudUpload size={16} /> Retrain Data
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="overflow-x-auto overflow-y-auto max-h-[500px] rounded-2xl border border-slate-100 custom-scrollbar pb-2">
                    <table className="w-max min-w-full text-left border-collapse whitespace-nowrap">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-md shadow-sm border-b border-slate-200">
                            <tr>
                                <th className="p-4 pl-6 font-bold text-slate-500 text-[11px] uppercase tracking-widest">No</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Retailer</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Retailer ID</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Invoice Date</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Region</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">State</th>
                                <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">City</th>
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
                                    <td colSpan={14} className="p-8 text-center text-slate-500 font-medium animate-pulse">Memuat data historis dari database...</td>
                                </tr>
                            ) : recentData.length === 0 ? (
                                <tr>
                                    <td colSpan={14} className="p-8 text-center text-slate-500 font-medium">Belum ada data historis yang tersedia.</td>
                                </tr>
                            ) : recentData.map((row: any, index: number) => (
                                <tr key={row.id} className="border-b border-slate-50 hover:bg-[#EDF2FE]/50 transition-colors">
                                    <td className="p-4 pl-6 font-bold text-slate-400">{index + 1}</td>
                                    <td className="p-4 font-semibold text-slate-900">{row.retailer?.name || 'N/A'}</td>
                                    <td className="p-4 text-slate-500 font-mono text-[11px]">{row.retailerId || '-'}</td>
                                    <td className="p-4"><span className="text-xs text-[#4f46e5] bg-[#EDF2FE] px-2 py-1 rounded-md font-bold">{new Date(row.invoiceDate).toLocaleDateString('id-ID')}</span></td>
                                    <td className="p-4 text-slate-600">{row.retailer?.region || '-'}</td>
                                    <td className="p-4 text-slate-600 font-medium">{row.retailer?.state || '-'}</td>
                                    <td className="p-4 text-slate-600">{row.retailer?.city || '-'}</td>
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