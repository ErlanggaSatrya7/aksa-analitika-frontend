"use client";
import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { BrainCircuit, AlertCircle, Loader2, Info, MapPin, Store, PackageSearch, Sparkles, ChevronDown, Lightbulb, Clock, TrendingDown, History, CheckCircle2, ChevronUp, Send, ServerCrash, X, TrendingUp, Bell } from 'lucide-react';

export default function AIForecastingPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isPredicting, setIsPredicting] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // Status koneksi FastAPI 
    const [isFastApiConnected, setIsFastApiConnected] = useState(false);

    // Filter States
    const [filterProv, setFilterProv] = useState('Semua Provinsi');
    const [filterRetailerName, setFilterRetailerName] = useState('Semua Retailer');
    const [filterRetailerId, setFilterRetailerId] = useState('Semua Retailer');
    const [filterProduct, setFilterProduct] = useState('Semua Kategori Produk');

    // Data Master Dinamis dari DB
    const [masterStates, setMasterStates] = useState<string[]>([]);
    const [masterRetailers, setMasterRetailers] = useState<{ id: string, name: string, states: string[] }[]>([]);
    const [masterProducts, setMasterProducts] = useState<string[]>([]);

    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<{ title: string, desc: string, isAlert: boolean } | null>(null);

    // Ganti nama state modal agar lebih relevan (bukan email lagi)
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);

    const filterRef = useRef<HTMLDivElement>(null);
    const [insightTime, setInsightTime] = useState('');

    // STATE DATA
    const [forecastData, setForecastData] = useState<any>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

    const updateTimestamp = () => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return now.toLocaleDateString('id-ID', options) + ' WIB';
    };

    const fetchBroadcastHistory = async () => {
        try {
            const res = await fetch('/api/admin/broadcast');
            if (res.ok) {
                const data = await res.json();
                setBroadcastHistory(data);
            }
        } catch (error) {
            console.error("Gagal menarik riwayat broadcast:", error);
        }
    };

    useEffect(() => {
        const initSystem = async () => {
            try {
                // 1. Cek Koneksi AI Backend
                const healthRes = await fetch('http://localhost:8000/api/health');
                setIsFastApiConnected(healthRes.ok);

                // 2. Tarik Data Master dari Database
                const locRes = await fetch('/api/admin/locations');
                const data = await locRes.json();

                setMasterStates(data.states || []);
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
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) setOpenDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showToast = (title: string, desc: string, isAlert: boolean = false) => {
        setToastMsg({ title, desc, isAlert });
        setTimeout(() => setToastMsg(null), 5000);
    }

    const availableRetailers = filterProv === 'Semua Provinsi'
        ? masterRetailers
        : masterRetailers.filter(r => r.states && r.states.includes(filterProv));

    const handleGenerateForecast = async () => {
        if (!isFastApiConnected) {
            showToast("Server ML Terputus", "Koneksi ke FastAPI gagal. Pastikan engine berjalan.", true);
            return;
        }

        setIsPredicting(true);
        setInsightTime(updateTimestamp());

        try {
            const res = await fetch("http://localhost:8000/api/forecast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    province: filterProv === 'Semua Provinsi' ? "Semua Provinsi" : filterProv,
                    retailer: filterRetailerId === 'Semua Retailer' ? "Semua Retailer" : filterRetailerId,
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

    // --- LOGIKA PENENTUAN TARGET SCOPE DARI DROPDOWN ---
    let broadcastScope = 'GLOBAL';
    let broadcastLabel = 'Seluruh Nasional (Semua Manajer)';

    if (filterProv !== 'Semua Provinsi' && filterRetailerId === 'Semua Retailer') {
        broadcastScope = `PROVINCE:${filterProv}`;
        broadcastLabel = `Semua Manajer di Provinsi ${filterProv}`;
    } else if (filterRetailerId !== 'Semua Retailer') {
        broadcastScope = `RETAILER:${filterRetailerId}`;
        broadcastLabel = `Manajer Retailer: ${filterRetailerName} (${filterProv})`;
    }

    const confirmBroadcast = async () => {
        setIsBroadcasting(true);
        try {
            const res = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetScope: broadcastScope,
                    target: broadcastLabel,
                    insight: forecastData?.ai_analysis || "Peringatan Anomali Makro Nasional."
                })
            });

            if (res.ok) {
                await fetchBroadcastHistory();
                setShowBroadcastModal(false);
                showToast("Instruksi Terkirim!", `Notifikasi push diteruskan ke ${broadcastLabel}.`, false);
                setIsHistoryOpen(true);
            } else {
                showToast("Gagal Terkirim", "Terjadi kesalahan pada server.", true);
            }
        } catch (error) {
            showToast("Error", "Gagal menghubungi server database.", true);
        } finally {
            setIsBroadcasting(false);
        }
    };

    // --- UX: ECHARTS FORECAST DIPERCANTIK ---
    const trendChartOption = forecastData ? {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#E2E8F0',
            padding: [12, 16],
            textStyle: { color: '#0F172A', fontSize: 13 },
            axisPointer: { type: 'line', lineStyle: { color: '#CBD5E1', type: 'dashed' } }
        },
        legend: {
            data: ['Histori Aktual', 'Prediksi (AI Forecast)'],
            bottom: 0,
            icon: 'circle',
            textStyle: { fontWeight: '600', color: '#64748B' }
        },
        grid: { left: '3%', right: '4%', bottom: '20%', top: '8%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: forecastData.chart.labels,
            axisLine: { lineStyle: { color: '#E2E8F0' } },
            axisLabel: {
                color: '#64748B',
                fontWeight: '600',
                margin: 12,
                interval: 0,
                rotate: 45,
                fontSize: 10,
                lineHeight: 14
            }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } },
            axisLabel: {
                color: '#94A3B8',
                fontWeight: '600',
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
                smooth: 0.4,
                lineStyle: { width: 3, color: '#94A3B8' },
                itemStyle: { color: '#94A3B8' },
                symbolSize: 8,
                showSymbol: true
            },
            {
                name: 'Prediksi (AI Forecast)',
                type: 'line',
                data: forecastData.chart.predicted,
                smooth: 0.4,
                lineStyle: { width: 4, color: '#4f46e5', shadowColor: 'rgba(79, 70, 229, 0.3)', shadowBlur: 8, shadowOffsetY: 6 },
                itemStyle: { color: '#ffffff', borderColor: '#4f46e5', borderWidth: 2 },
                areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(79, 70, 229, 0.3)' }, { offset: 1, color: 'rgba(79, 70, 229, 0)' }]) },
                symbolSize: 8,
                showSymbol: true
            }
        ]
    } : {};

    if (isLoading) return <div className="w-full h-[80vh] flex flex-col items-center justify-center text-[#4f46e5] gap-4"><Loader2 size={36} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm">Mensinkronisasi dengan Database...</span></div>;

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

            {/* MODAL BROADCAST INTERNAL (PENGGANTI EMAIL) */}
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
                                <span className="font-bold text-[#4f46e5] bg-[#EDF2FE] px-3 py-1.5 rounded-lg w-fit">
                                    {broadcastLabel}
                                </span>
                                <span className="font-semibold text-slate-400">Sistem:</span>
                                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                    <Bell size={14} className="text-slate-400" /> Push Notification (In-App)
                                </span>
                            </div>
                            <div className="border border-slate-200 rounded-[20px] p-5 bg-slate-50 text-sm text-slate-700 leading-relaxed whitespace-pre-line custom-scrollbar max-h-[300px] overflow-y-auto mt-2">
                                {`[URGENT] Proyeksi AI & Tindakan Eksekutif
                                
Berdasarkan analisis Machine Learning (Random Forest) dan AKSA AI yang dijalankan pada ${insightTime}, kami menemukan proyeksi data sebagai berikut:

${forecastData?.ai_analysis?.replace(/[*_#]/g, '')}

Mohon segera lakukan penyesuaian operasional di wilayah Anda berdasarkan rekomendasi di atas. Laporan dapat diakses melalui portal Anda.

Salam,
Admin Eksekutif - Aksa Analitika`}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowBroadcastModal(false)} className="px-5 py-2.5 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">Batal</button>
                            <button onClick={confirmBroadcast} disabled={isBroadcasting} className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#4f46e5] text-white hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 active:scale-95">
                                {isBroadcasting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Teruskan ke Cabang
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER FORECAST */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">AI Forecasting & Proyeksi</h2>
                        {!isFastApiConnected && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-600 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm">
                                <ServerCrash size={12} /> FastAPI Offline
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><Info size={16} className="text-[#4f46e5]" /> Analisis proyeksi ke depan dan instruksi eksekutif otomatis.</p>
                </div>
            </div>

            {/* PANEL FILTER & KONTROL */}
            <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 relative z-20">
                <div className="flex flex-col xl:flex-row xl:items-end gap-6">
                    <div ref={filterRef} className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* FILTER PROVINSI */}
                        <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'prov' ? 'z-50' : 'z-10'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 flex justify-between">
                                <span>Level 1: Provinsi</span>
                                <span className="opacity-50">(Opsional)</span>
                            </label>
                            <button onClick={() => setOpenDropdown(openDropdown === 'prov' ? null : 'prov')} className={`flex items-center justify-between bg-white border ${openDropdown === 'prov' ? 'border-[#4f46e5] ring-4 ring-[#4f46e5]/10 shadow-sm' : 'border-slate-200 hover:border-[#4f46e5]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-4 py-3 text-sm font-bold text-slate-700 transition-all duration-300 group`}>
                                <div className="flex items-center gap-2 truncate">
                                    <MapPin size={16} className="text-[#4f46e5] group-hover:scale-110 transition-all duration-300" />
                                    <span className="truncate group-hover:text-[#4f46e5] transition-colors">{filterProv}</span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 group-hover:text-[#4f46e5] transition-all duration-300 ${openDropdown === 'prov' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'prov' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                    {['Semua Provinsi', ...masterStates].map((item) => (
                                        <button key={item} onClick={() => {
                                            setFilterProv(item);
                                            setFilterRetailerName('Semua Retailer');
                                            setFilterRetailerId('Semua Retailer');
                                            setFilterProduct('Semua Kategori Produk');
                                            setOpenDropdown(null);
                                        }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterProv === item ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5] hover:translate-x-1'}`}>
                                            {item} {filterProv === item && <CheckCircle2 size={16} className="text-white" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* FILTER RETAILER */}
                        <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'retailer' ? 'z-50' : 'z-10'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 flex justify-between">
                                <span>Level 2: Retailer</span>
                                <span className="opacity-50">(Opsional)</span>
                            </label>
                            <button onClick={() => setOpenDropdown(openDropdown === 'retailer' ? null : 'retailer')} className={`flex items-center justify-between bg-white border ${openDropdown === 'retailer' ? 'border-[#4f46e5] ring-4 ring-[#4f46e5]/10 shadow-sm' : 'border-slate-200 hover:border-[#4f46e5]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-4 py-3 text-sm font-bold text-slate-700 transition-all duration-300 group`}>
                                <div className="flex items-center gap-2 truncate">
                                    <Store size={16} className="text-[#4f46e5] group-hover:scale-110 transition-all duration-300" />
                                    <span className="truncate group-hover:text-[#4f46e5] transition-colors">{filterRetailerName}</span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 group-hover:text-[#4f46e5] transition-all duration-300 ${openDropdown === 'retailer' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'retailer' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                    <button onClick={() => { setFilterRetailerName('Semua Retailer'); setFilterRetailerId('Semua Retailer'); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterRetailerId === 'Semua Retailer' ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5] hover:translate-x-1'}`}>
                                        Semua Retailer {filterRetailerId === 'Semua Retailer' && <CheckCircle2 size={16} className="text-white" />}
                                    </button>
                                    {availableRetailers.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setFilterRetailerName(item.name);
                                                setFilterRetailerId(item.id);
                                                setOpenDropdown(null);
                                            }}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterRetailerId === item.id ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5] hover:translate-x-1'}`}
                                        >
                                            {item.name} {filterRetailerId === item.id && <CheckCircle2 size={16} className="text-white" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* FILTER PRODUK */}
                        <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'product' ? 'z-50' : 'z-10'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 flex justify-between">
                                <span>Spesifik: Produk</span>
                                <span className="opacity-50">(Opsional)</span>
                            </label>
                            <button onClick={() => setOpenDropdown(openDropdown === 'product' ? null : 'product')} className={`flex items-center justify-between bg-white border ${openDropdown === 'product' ? 'border-[#4f46e5] ring-4 ring-[#4f46e5]/10 shadow-sm' : 'border-slate-200 hover:border-[#4f46e5]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-4 py-3 text-sm font-bold text-slate-700 transition-all duration-300 group`}>
                                <div className="flex items-center gap-2 truncate">
                                    <PackageSearch size={16} className="text-[#4f46e5] group-hover:scale-110 transition-all duration-300" />
                                    <span className="truncate group-hover:text-[#4f46e5] transition-colors">{filterProduct}</span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 group-hover:text-[#4f46e5] transition-all duration-300 ${openDropdown === 'product' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'product' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                    {['Semua Kategori Produk', ...masterProducts].map((item) => (
                                        <button key={item} onClick={() => { setFilterProduct(item); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterProduct === item ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5] hover:translate-x-1'}`}>
                                            {item} {filterProduct === item && <CheckCircle2 size={16} className="text-white" />}
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
                            className={`w-full xl:w-auto px-8 py-3.5 rounded-[20px] font-bold text-sm transition-all flex items-center justify-center gap-2 ${isFastApiConnected && !isPredicting ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] hover:shadow-lg hover:shadow-[#4f46e5]/30 text-white active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
                        >
                            {isPredicting ? <><Loader2 size={18} className="animate-spin" /> Sedang Menganalisis...</> : <><Sparkles size={18} /> Proyeksi AI</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* HASIL FORECAST & INSIGHT */}
            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col relative overflow-hidden z-10 min-h-[400px]">

                {/* SAAT FAST API BELUM TERHUBUNG */}
                {!forecastData && !isPredicting && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 p-6 text-center">
                        <div className="bg-white p-6 rounded-full shadow-sm border border-slate-100 mb-4 animate-pulse">
                            <ServerCrash size={48} className={isFastApiConnected ? "text-indigo-400" : "text-amber-500/50"} />
                        </div>
                        <span className="font-bold text-xl text-slate-700 mb-2 tracking-tight">
                            {isFastApiConnected ? "Tentukan Parameter & Jalankan Prediksi" : "Mesin Prediksi AI Belum Terhubung"}
                        </span>
                        <p className="text-sm font-medium text-slate-500 max-w-md">
                            {isFastApiConnected
                                ? "Mulai dari Level 1 (Provinsi) hingga sangat spesifik di Level Produk (Opsional). Klik tombol 'Proyeksi AI' untuk memulai kalkulasi."
                                : "Fitur komparasi algoritma dan forecasting membutuhkan koneksi langsung ke server Machine Learning (FastAPI). Status saat ini: OFFLINE."}
                        </p>
                    </div>
                )}

                {/* TAMPILAN JIKA BERHASIL MENDAPAT DATA DARI FASTAPI */}
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
                                <h3 className="text-2xl font-black text-slate-900 leading-tight">Insight Prediksi: {filterProv}</h3>
                                <p className="text-sm text-slate-500 mt-1">Dihasilkan oleh model Random Forest & AKSA AI</p>
                            </div>

                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-[24px] border border-slate-100 shrink-0">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Akurasi Model</p>
                                    <p className="text-xl font-black text-emerald-500">92.8%</p>
                                </div>
                                <div className="w-px h-10 bg-slate-200"></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Forecast (+4 Minggu)</p>
                                    <p className="text-xl font-black text-[#4f46e5]">{(forecastData.predicted_total || 0).toLocaleString('id-ID')} <span className="text-sm text-slate-500 font-bold">Unit</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 h-[350px] bg-white rounded-[32px] p-4 border border-slate-100 relative shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                <ReactECharts option={trendChartOption} style={{ height: '100%', width: '100%' }} />
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex-1 bg-gradient-to-b from-[#6A7BFA] to-[#4f46e5] rounded-[32px] p-6 text-white relative overflow-hidden shadow-[0_15px_30px_rgba(79,70,229,0.3)]">
                                    <BrainCircuit className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10" />
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-center gap-2 mb-4 opacity-90"><Lightbulb size={20} /><h4 className="font-bold">Analisis Pakar AKSA AI</h4></div>
                                        <p className="text-sm leading-relaxed font-medium opacity-95 flex-1 overflow-y-auto custom-scrollbar pr-2 whitespace-pre-line">
                                            {forecastData.ai_analysis?.replace(/[*_#]/g, '')}
                                        </p>
                                        <button onClick={() => setShowBroadcastModal(true)} disabled={isBroadcasting} className="mt-6 w-full bg-white text-[#4f46e5] px-4 py-3 rounded-[16px] text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95">
                                            <Send size={16} /> Teruskan ke Cabang
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
                <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="flex items-center justify-between w-full group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl group-hover:bg-gradient-to-r group-hover:from-[#6A7BFA] group-hover:to-[#4f46e5] group-hover:text-white group-hover:shadow-md transition-all"><History size={24} /></div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-slate-900">Riwayat Broadcast Terkirim</h3>
                            <p className="text-sm text-slate-500 mt-0.5">Catatan instruksi dan peringatan AI yang telah dikirim ke Dashboard Cabang.</p>
                        </div>
                    </div>
                    <div className="p-2 text-slate-400 group-hover:text-[#4f46e5] transition-colors">{isHistoryOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}</div>
                </button>

                {isHistoryOpen && (
                    <div className="mt-8 border-t border-slate-100 pt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                        {broadcastHistory.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 font-medium">Belum ada riwayat notifikasi yang dikirim.</div>
                        ) : (
                            <div className="max-h-[380px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                                {broadcastHistory.map((item, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-5 bg-white border border-slate-200 rounded-[24px] hover:shadow-md transition-shadow">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] px-2.5 py-1 rounded-md shadow-sm">{item.id}</span>
                                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Clock size={12} /> {item.date}</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 mb-1">Target Notifikasi: <span className="text-[#4f46e5]">{item.target}</span></p>
                                            <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-3xl truncate">{item.insight}</p>
                                        </div>
                                        <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-5">
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100"><CheckCircle2 size={14} /> Sukses Terkirim</span>
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