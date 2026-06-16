"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
    BrainCircuit, Loader2, Info, Store, PackageSearch, Sparkles,
    ChevronDown, Lightbulb, Clock, TrendingDown, History, CheckCircle2,
    ChevronUp, Send, AlertCircle, ServerOff, X, TrendingUp, Bell
} from 'lucide-react';

export default function RegionalForecastPage() {
    const { data: session } = useSession();
    const userState = (session?.user as any)?.assignedState || '';
    const userEmail = session?.user?.email || '';

    const [isLoading, setIsLoading] = useState(true);
    const [isPredicting, setIsPredicting] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [isFastApiConnected, setIsFastApiConnected] = useState(false);

    // Filter States (Tanpa Filter Kota)
    const [filterRetailerName, setFilterRetailerName] = useState('Semua Retailer');
    const [filterRetailerId, setFilterRetailerId] = useState('Semua Retailer');
    const [filterProduct, setFilterProduct] = useState('Semua Kategori Produk');

    const [masterRetailers, setMasterRetailers] = useState<{ id: string, name: string, states: string[] }[]>([]);
    const [masterProducts, setMasterProducts] = useState<string[]>([]);

    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<{ title: string, desc: string, isAlert: boolean } | null>(null);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);

    const filterRef = useRef<HTMLDivElement>(null);
    const [insightTime, setInsightTime] = useState('');

    const [forecastData, setForecastData] = useState<any>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

    const [activeAiTab, setActiveAiTab] = useState<'evaluasi' | 'mitigasi'>('evaluasi');

    const updateTimestamp = () => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return now.toLocaleDateString('id-ID', options) + ' WIB';
    };

    const fetchBroadcastHistory = async () => {
        if (!userEmail) return;
        try {
            const res = await fetch(`/api/regional/escalation?email=${userEmail}`);
            if (res.ok) setBroadcastHistory(await res.json());
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        const initSystem = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const healthRes = await fetch(`${apiUrl}/api/health`, { cache: 'no-store' });
                setIsFastApiConnected(healthRes.ok);

                const locRes = await fetch('/api/admin/locations');
                const data = await locRes.json();

                setMasterRetailers(data.retailers || []);
                setMasterProducts(data.products || []);
            } catch (error) {
                console.error("Gagal inisialisasi:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initSystem();
        fetchBroadcastHistory();
    }, [userState, userEmail]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setOpenDropdown(null); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showToast = (title: string, desc: string, isAlert: boolean = false) => {
        setToastMsg({ title, desc, isAlert });
        setTimeout(() => setToastMsg(null), 4000);
    }

    // Filter retailer yang HANYA beroperasi di Provinsi user
    const availableRetailers = masterRetailers.filter(r => r.states && r.states.includes(userState));

    const handleGenerateForecast = async () => {
        if (!isFastApiConnected) {
            showToast("Server ML Terputus", "Koneksi ke FastAPI gagal. Pastikan engine berjalan.", true);
            return;
        }

        setIsPredicting(true);
        setInsightTime(updateTimestamp());
        setActiveAiTab('evaluasi');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/api/forecast`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    province: userState,
                    retailer: filterRetailerId,
                    retailer_name: filterRetailerName,
                    product: filterProduct
                })
            });

            if (!res.ok) throw new Error("Gagal memproses prediksi di server.");
            const data = await res.json();

            if (data.status === "error") {
                showToast("Prediksi Gagal", data.message || "Model tidak dapat mengenali parameter.", true);
                setForecastData(null);
            } else {
                setForecastData(data);
                showToast("Analisis Selesai", "Prediksi masa depan dan insight dari AKSA AI siap.", false);
            }

        } catch (error) {
            console.error(error);
            showToast("Gagal Menarik Data", "Cek koneksi server FastAPI Anda.", true);
            setForecastData(null);
        } finally {
            setIsPredicting(false);
        }
    };

    let broadcastScope = 'GLOBAL';
    let broadcastLabel = 'Seluruh Nasional (Semua Manajer)';

    if (filterRetailerId === 'Semua Retailer') {
        broadcastScope = `PROVINCE:${userState}`;
        broadcastLabel = `Semua Cabang di Provinsi ${userState}`;
    } else {
        broadcastScope = `RETAILER:${filterRetailerId}`;
        broadcastLabel = `Manajer Retailer: ${filterRetailerName} (${userState})`;
    }

    const confirmBroadcast = async () => {
        setIsBroadcasting(true);
        try {
            const res = await fetch('/api/regional/escalation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    state: userState,
                    email: userEmail,
                    insight: forecastData?.ai_analysis || "Permohonan eskalasi logistik darurat dari Provinsi."
                })
            });

            if (res.ok) {
                await fetchBroadcastHistory();
                setShowBroadcastModal(false);
                showToast("Eskalasi Terkirim!", `Laporan telah sukses diajukan ke Pusat.`, false);
                setIsHistoryOpen(true);
            } else {
                showToast("Gagal", "Kesalahan server.", true);
            }
        } catch (err) {
            showToast("Error", "Gagal menghubungi server database.", true);
        } finally {
            setIsBroadcasting(false);
        }
    };

    // FUNGSI MEMECAH JAWABAN AI MENJADI 2 BAGIAN YANG LEBIH RAPI & AMAN
    const parseAiResponse = (text: string) => {
        if (!text) return { evaluasi: '', mitigasi: '' };
        let cleanText = text.replace(/[*#`~>]/g, '');
        let evalText = cleanText;
        let mitText = "Tindakan mitigasi sedang dikalkulasi oleh AI...";

        if (cleanText.includes('[EVALUASI]') && cleanText.includes('[MITIGASI]')) {
            const parts = cleanText.split('[MITIGASI]');
            evalText = parts[0].replace('[EVALUASI]', '').trim();
            mitText = parts[1].trim();
        }
        return { evaluasi: evalText, mitigasi: mitText };
    };

    const parsedAiAnalysis = parseAiResponse(forecastData?.ai_analysis || "");

    // ECHARTS FORECAST (DIKEMBALIKAN KE FORMAT 2 SERIES AGAR COCOK DENGAN FAST API)
    const trendChartOption = forecastData ? {
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#ffffff',
            borderColor: '#f1f5f9',
            borderWidth: 1,
            padding: [16, 20],
            textStyle: { color: '#0F172A', fontSize: 13, fontWeight: '500' },
            borderRadius: 16,
            extraCssText: 'box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.04);',
            axisPointer: { type: 'line', lineStyle: { color: '#cbd5e1', width: 2, type: 'dashed' } },
            formatter: function (params: any) {
                let html = `<div style="font-weight:700; font-size:11px; text-transform:uppercase; color:#64748B; margin-bottom:8px;">Periode: ${params[0].name}</div>`;
                params.forEach((param: any) => {
                    html += `
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px; align-items:center; gap:16px;">
                        <span style="color:#475569; font-weight:600; display:flex; align-items:center; gap:6px;">
                            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${param.color};"></span>
                            ${param.seriesName}
                        </span>
                        <span style="font-weight:800; color:#0F172A;">${param.value ? param.value.toLocaleString('id-ID') : '-'} Unit</span>
                    </div>`;
                });
                return html;
            }
        },
        legend: {
            data: ['Histori Aktual', 'Prediksi AI'],
            bottom: '0%',
            icon: 'circle',
            itemGap: 24,
            textStyle: { fontWeight: '700', color: '#64748b', fontSize: 12 }
        },
        grid: { left: '3%', right: '8%', bottom: '15%', top: '8%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: forecastData.chart.labels,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#64748B', fontWeight: '600', margin: 16, interval: 0, fontSize: 10, align: 'center' }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9', width: 1.5 } },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: '#94a3b8',
                fontWeight: '700',
                fontSize: 11,
                formatter: (val: number) => {
                    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
                    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
                    return val;
                }
            }
        },
        series: [
            {
                name: 'Histori Aktual',
                type: 'line',
                data: forecastData.chart.actual,
                smooth: 0.5,
                lineStyle: { width: 3, color: '#94a3b8', type: 'solid' },
                itemStyle: { color: '#94a3b8', borderWidth: 2, borderColor: '#fff' },
                symbol: 'circle', symbolSize: 8, showSymbol: true
            },
            {
                name: 'Prediksi AI',
                type: 'line',
                data: forecastData.chart.predicted,
                smooth: 0.5,
                lineStyle: { width: 4, color: '#4f46e5', shadowColor: 'rgba(79, 70, 229, 0.4)', shadowBlur: 14, shadowOffsetY: 8 },
                itemStyle: { color: '#4f46e5', borderColor: '#ffffff', borderWidth: 3 },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(79, 70, 229, 0.35)' },
                        { offset: 0.7, color: 'rgba(79, 70, 229, 0.05)' },
                        { offset: 1, color: 'rgba(79, 70, 229, 0)' }
                    ])
                },
                symbol: 'circle', symbolSize: 10, showSymbol: true
            }
        ]
    } : {};

    if (isLoading) return <div className="w-full h-[80vh] flex flex-col items-center justify-center text-[#4f46e5] gap-4"><Loader2 size={36} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm">Menyiapkan Engine MLOps...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-6 relative animate-in fade-in">

            {/* TOAST NOTIFICATION */}
            {toastMsg && (
                <div className={`fixed top-24 right-6 lg:right-10 z-[9999] border rounded-[24px] p-4 flex gap-4 items-center shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] animate-in slide-in-from-right-8 fade-in duration-300 max-w-md ${toastMsg.isAlert ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                    <div className={`p-3 rounded-full shrink-0 ${toastMsg.isAlert ? 'bg-amber-100 text-amber-600' : 'bg-[#D1FAE5] text-emerald-600'}`}>
                        {toastMsg.isAlert ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">{toastMsg.title}</h4>
                        <p className="text-xs mt-0.5 opacity-80">{toastMsg.desc}</p>
                    </div>
                    <button onClick={() => setToastMsg(null)} className="ml-2 opacity-50 hover:opacity-100"><X size={16} /></button>
                </div>
            )}

            {/* MODAL BROADCAST INTERNAL */}
            {showBroadcastModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-100">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Send size={18} className="text-[#4f46e5]" /> Review Instruksi Dashboard</h3>
                            <button onClick={() => setShowBroadcastModal(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-[80px_1fr] gap-3 text-sm items-center">
                                <span className="font-semibold text-slate-400">Target:</span>
                                <span className="font-bold text-[#4f46e5] bg-[#EDF2FE] px-3 py-1.5 rounded-lg w-fit shadow-sm border border-[#4f46e5]/10">
                                    {broadcastLabel}
                                </span>
                                <span className="font-semibold text-slate-400">Sistem:</span>
                                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                    <Bell size={14} className="text-slate-400" /> Push Notification (In-App)
                                </span>
                            </div>
                            <div className="border border-slate-200 rounded-[20px] p-5 bg-slate-50 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap custom-scrollbar max-h-[300px] overflow-y-auto mt-2">
                                {`[URGENT] Proyeksi AI & Tindakan Eksekutif Wilayah ${userState}\n\nBerdasarkan analisis Machine Learning (Random Forest) dan AKSA AI yang dijalankan pada ${insightTime}, kami menemukan proyeksi data sebagai berikut:\n\nEVALUASI:\n${parsedAiAnalysis.evaluasi}\n\nTINDAKAN MITIGASI:\n${parsedAiAnalysis.mitigasi}\n\nMohon segera lakukan penyesuaian operasional di wilayah Anda berdasarkan rekomendasi di atas. Laporan dapat diakses melalui portal Anda.\n\nSalam,\nAdmin Regional ${userState}`}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowBroadcastModal(false)} className="px-5 py-2.5 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">Batal</button>
                            <button onClick={confirmBroadcast} disabled={isBroadcasting} className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#4f46e5] text-white hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 active:scale-95">
                                {isBroadcasting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Ajukan Eskalasi ke Pusat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER FORECAST */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI Forecasting & Proyeksi</h2>
                        {!isFastApiConnected && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-600 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm">
                                <ServerOff size={12} /> FastAPI Offline
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium"><Info size={16} className="text-[#6A7BFA]" /> Analisis proyeksi data masa depan dan instruksi eskalasi otomatis.</p>
                </div>
            </div>

            {/* PANEL FILTER (TANPA KOTA) */}
            <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 relative z-20">
                <div className="flex flex-col xl:flex-row xl:items-end gap-6">
                    <div ref={filterRef} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* FILTER RETAILER */}
                        <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'retailer' ? 'z-50' : 'z-10'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Filter Mitra Retailer</label>
                            <button onClick={() => setOpenDropdown(openDropdown === 'retailer' ? null : 'retailer')} className={`flex items-center justify-between bg-white border ${openDropdown === 'retailer' ? 'border-[#4f46e5] ring-4 ring-[#6A7BFA]/10 shadow-sm' : 'border-slate-200 hover:border-[#6A7BFA]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-5 py-3.5 text-sm font-bold text-slate-700 transition-all duration-300 group relative z-[50]`}>
                                <div className="flex items-center gap-2.5 truncate">
                                    <Store size={18} className="text-[#6A7BFA] group-hover:text-[#4f46e5] transition-all" />
                                    <span>{filterRetailerName}</span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform ${openDropdown === 'retailer' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'retailer' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[20px] shadow-2xl z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                    <button onClick={() => { setFilterRetailerName('Semua Retailer'); setFilterRetailerId('Semua Retailer'); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterRetailerId === 'Semua Retailer' ? 'bg-[#EDF2FE] text-[#4f46e5]' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5]'}`}>
                                        Semua Retailer {filterRetailerId === 'Semua Retailer' && <CheckCircle2 size={16} className="text-[#4f46e5]" />}
                                    </button>
                                    {availableRetailers.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setFilterRetailerName(item.name);
                                                setFilterRetailerId(item.id);
                                                setOpenDropdown(null);
                                            }}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterRetailerId === item.id ? 'bg-[#EDF2FE] text-[#4f46e5]' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5]'}`}
                                        >
                                            {item.name} {filterRetailerId === item.id && <CheckCircle2 size={16} className="text-[#4f46e5]" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* FILTER PRODUK */}
                        <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'product' ? 'z-50' : 'z-10'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 flex justify-between">
                                <span>Filter Produk Kategori</span>
                                <span className="opacity-50">(Opsional)</span>
                            </label>
                            <button onClick={() => setOpenDropdown(openDropdown === 'product' ? null : 'product')} className={`flex items-center justify-between bg-white border ${openDropdown === 'product' ? 'border-[#4f46e5] ring-4 ring-[#6A7BFA]/10 shadow-sm' : 'border-slate-200 hover:border-[#6A7BFA]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-5 py-3.5 text-sm font-bold text-slate-700 transition-all duration-300 group relative z-[50]`}>
                                <div className="flex items-center gap-2.5 truncate">
                                    <PackageSearch size={18} className="text-[#6A7BFA] group-hover:text-[#4f46e5] transition-all" />
                                    <span>{filterProduct}</span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform ${openDropdown === 'product' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'product' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[20px] shadow-2xl z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                    {['Semua Kategori Produk', ...masterProducts].map((item) => (
                                        <button key={item} onClick={() => { setFilterProduct(item); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterProduct === item ? 'bg-[#EDF2FE] text-[#4f46e5]' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5]'}`}>
                                            {item} {filterProduct === item && <CheckCircle2 size={16} className="text-[#4f46e5]" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full xl:w-auto shrink-0 relative z-20">
                        <button
                            onClick={handleGenerateForecast}
                            disabled={!isFastApiConnected || isPredicting}
                            className={`w-full xl:w-auto px-8 py-3.5 rounded-[20px] font-bold text-sm transition-all flex items-center justify-center gap-2 ${isFastApiConnected && !isPredicting ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white hover:shadow-lg hover:-translate-y-0.5 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
                        >
                            {isPredicting ? <><Loader2 size={18} className="animate-spin" /> Mengkalkulasi Data...</> : <><Sparkles size={18} /> Eksekusi AI Model</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* HASIL FORECAST & INSIGHT */}
            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col relative overflow-hidden z-10 min-h-[500px]">

                {/* ANIMASI LOADING OVERLAY */}
                {isPredicting && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm p-6 text-center animate-in fade-in duration-300 rounded-[40px]">
                        <div className="relative mb-6">
                            <div className="w-24 h-24 border-4 border-indigo-100 border-t-[#4f46e5] rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center"><BrainCircuit className="text-[#4f46e5] animate-pulse" size={32} /></div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Memproses Proyeksi AI</h3>
                        <p className="text-sm font-medium text-slate-500 max-w-md animate-pulse">Menganalisis pola historis, menjalankan model Random Forest, dan merumuskan strategi...</p>
                    </div>
                )}

                {/* SAAT FAST API BELUM TERHUBUNG & BELUM PREDIKSI */}
                {!forecastData && !isPredicting && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 p-6 text-center">
                        <div className="bg-white p-6 rounded-full shadow-sm border border-slate-100 mb-4 animate-pulse">
                            <ServerOff size={48} className={isFastApiConnected ? "text-indigo-400" : "text-amber-500/50"} />
                        </div>
                        <span className="font-bold text-xl text-slate-700 mb-2 tracking-tight">
                            {isFastApiConnected ? "Tentukan Parameter & Jalankan Prediksi" : "Mesin Prediksi AI Belum Terhubung"}
                        </span>
                        <p className="text-sm font-medium text-slate-500 max-w-md">
                            {isFastApiConnected
                                ? "Pilih Retailer dan Produk (Opsional). Klik tombol 'Eksekusi AI Model' untuk memulai kalkulasi."
                                : "Fitur komparasi algoritma dan forecasting membutuhkan koneksi langsung ke server Machine Learning (FastAPI). Status saat ini: OFFLINE."}
                        </p>
                    </div>
                )}

                {/* TAMPILAN JIKA BERHASIL MENDAPAT DATA */}
                {forecastData && !isPredicting && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-[#EDF2FE] text-[#4f46e5] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-[#4f46e5]/10"><Clock size={12} /> {insightTime}</span>
                                    {forecastData.trend_direction === 'up' ? (
                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-emerald-100"><TrendingUp size={12} /> Tren Naik</span>
                                    ) : (
                                        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-red-100"><TrendingDown size={12} /> Penurunan</span>
                                    )}
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">Insight Prediksi: {userState}</h3>
                                <p className="text-sm text-slate-500 mt-1 font-medium">Dihasilkan oleh model Random Forest & AKSA AI Copilot</p>
                            </div>

                            <div className="flex items-center gap-5 bg-white p-5 rounded-[24px] border border-slate-200 shadow-sm shrink-0">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Akurasi Model</p>
                                    <p className="text-xl font-black text-emerald-500">95.2%</p>
                                </div>
                                <div className="w-px h-10 bg-slate-200"></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Forecast (+4 Minggu)</p>
                                    <p className="text-xl font-black text-[#4f46e5]">{(forecastData.predicted_total || 0).toLocaleString('id-ID')} <span className="text-sm text-slate-400 font-bold uppercase">Unit</span></p>
                                </div>
                            </div>
                        </div>

                        {/* GRID STRUKTUR SEIMBANG */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

                            {/* CONTAINER GRAFIK PREMIUM */}
                            <div className="lg:col-span-2 min-h-[440px] bg-white rounded-[32px] p-6 border border-slate-100 relative shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col">
                                <ReactECharts option={trendChartOption} style={{ height: '100%', width: '100%', flex: 1 }} />
                            </div>

                            {/* CONTAINER AI INSIGHT DENGAN KLIK TABS */}
                            <div className="flex flex-col min-h-[440px]">
                                <div className="flex-1 bg-gradient-to-br from-[#4f46e5] to-[#3730a3] rounded-[32px] p-6 lg:p-8 text-white relative overflow-hidden shadow-[0_15px_30px_rgba(79,70,229,0.3)] flex flex-col">
                                    <BrainCircuit className="absolute -right-6 -bottom-6 w-40 h-40 text-white opacity-5" />

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-center gap-3 mb-5 opacity-90">
                                            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm shadow-sm border border-white/10">
                                                <Lightbulb size={20} className="text-amber-300" />
                                            </div>
                                            <h4 className="font-bold text-lg tracking-wide">Saran Pakar AI</h4>
                                        </div>

                                        {/* TABS (PILL BUTTONS) */}
                                        <div className="flex bg-white/10 p-1.5 rounded-[16px] mb-5 shrink-0 shadow-inner">
                                            <button
                                                onClick={() => setActiveAiTab('evaluasi')}
                                                className={`flex-1 text-xs font-bold py-2.5 rounded-[12px] transition-all ${activeAiTab === 'evaluasi' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-white/70 hover:text-white'}`}
                                            >
                                                Evaluasi Tren
                                            </button>
                                            <button
                                                onClick={() => setActiveAiTab('mitigasi')}
                                                className={`flex-1 text-xs font-bold py-2.5 rounded-[12px] transition-all ${activeAiTab === 'mitigasi' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-white/70 hover:text-white'}`}
                                            >
                                                Tindakan Mitigasi
                                            </button>
                                        </div>

                                        {/* ISI TABS - WHITESPACE PRE-WRAP AGAR PARAGRAF RAPI */}
                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 pb-2">
                                            <p className="text-[13px] leading-[1.8] font-medium text-indigo-50 whitespace-pre-wrap animate-in fade-in zoom-in-95 duration-200">
                                                {activeAiTab === 'evaluasi' ? parsedAiAnalysis.evaluasi : parsedAiAnalysis.mitigasi}
                                            </p>
                                        </div>

                                        {/* TOMBOL BROADCAST */}
                                        <button onClick={() => setShowBroadcastModal(true)} disabled={isBroadcasting} className="mt-5 w-full bg-white text-[#4f46e5] px-4 py-3.5 rounded-[20px] text-sm font-bold hover:bg-slate-50 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 group border border-transparent">
                                            <Send size={16} className="group-hover:translate-x-1 transition-transform" /> Ajukan Eskalasi ke Pusat
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* LOG RIWAYAT BROADCAST */}
            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="flex items-center justify-between w-full group focus:outline-none">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:bg-[#4f46e5] group-hover:text-white transition-colors"><History size={24} /></div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Eskalasi Nasional</h3>
                            <p className="text-sm text-slate-500 mt-0.5 font-medium">Catatan permohonan logistik dan kuota yang telah diajukan ke Pusat.</p>
                        </div>
                    </div>
                    <div className="p-2 text-slate-400 group-hover:text-[#4f46e5] transition-colors">{isHistoryOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}</div>
                </button>

                {isHistoryOpen && (
                    <div className="mt-8 border-t border-slate-100 pt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                        {broadcastHistory.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 font-medium">Belum ada riwayat eskalasi yang diajukan ke Pusat.</div>
                        ) : (
                            <div className="max-h-[380px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                                {broadcastHistory.map((item, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-5 bg-white border border-slate-200 rounded-[24px] hover:shadow-md transition-shadow">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2.5">
                                                <span className="text-[10px] font-bold text-[#4f46e5] bg-[#EDF2FE] px-2.5 py-1 rounded-md shadow-sm border border-[#4f46e5]/10">{item.id}</span>
                                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Clock size={12} /> {item.date}</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 mb-1.5">Penerima: <span className="text-[#4f46e5]">{item.target}</span></p>
                                            <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-4xl line-clamp-2">{item.insight}</p>
                                        </div>
                                        <div className="shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-5 flex items-center">
                                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest"><CheckCircle2 size={14} /> Sukses Terkirim</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}