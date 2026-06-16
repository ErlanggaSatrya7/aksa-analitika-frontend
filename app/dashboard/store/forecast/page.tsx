"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts'; // Perbaikan Error UMD Echarts
import {
    BrainCircuit, Loader2, Info, PackageSearch, Sparkles, ChevronDown,
    Lightbulb, Clock, TrendingDown, History, CheckCircle2, ChevronUp,
    Send, AlertCircle, ServerOff, X, Activity, TrendingUp as TrendingUpIcon,
    Store, MapPin
} from 'lucide-react';

export default function StoreForecastPage() {
    const { data: session } = useSession();
    const user = session?.user as any;
    const retailerId = user?.retailerId || '';

    // 1. STATE UNTUK PROFIL TOKO ASLI DARI DATABASE
    const [storeProfile, setStoreProfile] = useState({
        name: 'Memuat Toko...',
        state: user?.assignedState || 'Provinsi',
        city: user?.assignedCity || 'Kota'
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isPredicting, setIsPredicting] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // STATUS KONEKSI FastAPI (Real-time)
    const [fastApiStatus, setFastApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    const [filterProduct, setFilterProduct] = useState('Semua Kategori');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<{ title: string, desc: string, isAlert: boolean } | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    const [insightTime, setInsightTime] = useState('');
    const [forecastData, setForecastData] = useState<any>(null);
    const [availableProducts, setAvailableProducts] = useState<string[]>(['Semua Kategori']);

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

    // TABS UNTUK AI INSIGHT
    const [activeAiTab, setActiveAiTab] = useState<'evaluasi' | 'mitigasi'>('evaluasi');

    const updateTimestamp = () => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return now.toLocaleDateString('id-ID', options) + ' WIB';
    };

    // FETCH PROFIL TOKO DARI DATABASE (Anti-Dummy Name)
    useEffect(() => {
        if (user?.email) {
            fetch(`/api/user/profile?email=${user.email}`)
                .then(res => res.json())
                .then(data => {
                    setStoreProfile({
                        name: data?.retailer?.name || 'Toko Retailer',
                        state: data?.assignedState || user?.assignedState || 'Semua Provinsi',
                        city: data?.assignedCity || user?.assignedCity || ''
                    });
                })
                .catch(err => console.error("Fetch profile error:", err));
        }
    }, [user?.email, user?.assignedState, user?.assignedCity]);

    useEffect(() => {
        setInsightTime(updateTimestamp());
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) setOpenDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // HEALTH CHECK FastAPI
    useEffect(() => {
        const checkSystemHealth = async () => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            try {
                const res = await fetch(`${apiUrl}/api/health`, { cache: 'no-store' });
                if (res.ok) setFastApiStatus('online');
                else setFastApiStatus('offline');
            } catch {
                setFastApiStatus('offline');
            }
        };
        checkSystemHealth();
    }, []);

    const isFastApiConnected = fastApiStatus === 'online';

    // Initial Fetch (Dropdown Products & History)
    useEffect(() => {
        if (!retailerId) {
            const timer = setTimeout(() => setIsLoading(false), 800);
            return () => clearTimeout(timer);
        }

        setIsLoading(true);
        fetch(`/api/store/forecast?retailerId=${retailerId}`)
            .then(res => res.json())
            .then(data => {
                if (data.availableProducts && data.availableProducts.length > 0) {
                    setAvailableProducts(data.availableProducts);
                }
                if (data.history) {
                    setBroadcastHistory(data.history);
                }
            })
            .catch(() => console.error("Forecast data fetch error"))
            .finally(() => setIsLoading(false));
    }, [retailerId]);

    const showToast = (title: string, desc: string, isAlert: boolean = false) => {
        setToastMsg({ title, desc, isAlert });
        setTimeout(() => setToastMsg(null), 4000);
    }

    // TRIGGER AI FORECAST (Menyelesaikan Error 422 API)
    const handleGenerateForecast = async () => {
        if (!isFastApiConnected) {
            showToast("FastAPI Offline", "Tidak dapat menarik prediksi karena mesin Machine Learning belum terhubung.", true);
            return;
        }

        setIsPredicting(true);
        setActiveAiTab('evaluasi');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

            // PAYLOAD WAJIB LENGKAP SESUAI PYDANTIC main.py
            const payload = {
                province: storeProfile.state || "Semua Provinsi",
                retailer: retailerId,
                retailer_name: storeProfile.name,
                product: filterProduct === 'Semua Kategori' ? 'Semua Kategori Produk' : filterProduct
            };

            const res = await fetch(`${apiUrl}/api/forecast`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(`Server API merespons dengan status ${res.status}`);
            const data = await res.json();

            if (data.status === "error") {
                showToast("Data Tidak Cukup", data.message || "Model tidak dapat menemukan pola riwayat transaksi.", true);
                setForecastData(null);
            } else {
                setForecastData(data);
                showToast("Analisis Selesai", "Prediksi AI berhasil digenerate.", false);
                setInsightTime(updateTimestamp());
            }

        } catch (error) {
            showToast("Gagal Menarik Data", "Cek koneksi server FastAPI Anda.", true);
            setForecastData(null);
        } finally {
            setIsPredicting(false);
        }
    };

    const handleBroadcastAlert = async () => {
        if (!retailerId) return;
        setIsBroadcasting(true);

        try {
            const qtyMatch = forecastData?.ai_analysis?.match(/sebanyak (\d+)/i);
            const qty = qtyMatch ? parseInt(qtyMatch[1]) : 100;

            const res = await fetch('/api/store/forecast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    retailerId: retailerId,
                    productCategory: filterProduct,
                    qtyRequested: qty
                })
            });

            if (res.ok) {
                const newData = await res.json();
                const newLog = {
                    id: `REQ-${newData.id.substring(0, 4).toUpperCase()}`,
                    date: updateTimestamp(),
                    target: 'Manajer Regional / Pusat',
                    insight: `Pengajuan kuota tambahan ${filterProduct} sebanyak ${qty} Pcs berdasarkan proyeksi AI.`
                };

                setBroadcastHistory(prev => [newLog, ...prev]);
                showToast("Permohonan Terkirim!", `Permintaan restock telah diteruskan ke Atasan.`, false);
                setIsHistoryOpen(true);
            }
        } catch (error) {
            showToast("Gagal Terkirim", "Terjadi kesalahan jaringan.", true);
        } finally {
            setIsBroadcasting(false);
        }
    };

    // PARSING JAWABAN AI UNTUK TABS
    const parseAiResponse = (text: string) => {
        if (!text) return { evaluasi: '', mitigasi: '' };
        let cleanText = text.replace(/[*#`~>]/g, '');
        let evalText = cleanText;
        let mitText = "AI sedang mengkalkulasi rekomendasi tindakan...";

        if (cleanText.includes('[EVALUASI]') && cleanText.includes('[MITIGASI]')) {
            const parts = cleanText.split('[MITIGASI]');
            evalText = parts[0].replace('[EVALUASI]', '').trim();
            mitText = parts[1].trim();
        }
        return { evaluasi: evalText, mitigasi: mitText };
    };

    const parsedAiAnalysis = parseAiResponse(forecastData?.ai_analysis || "");

    const forecastOption = forecastData ? {
        tooltip: {
            trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: '#CBD5E1', type: 'dashed' } },
            backgroundColor: '#ffffff', borderColor: '#EDF2FE', borderWidth: 1, padding: [16, 20], extraCssText: 'border-radius: 16px; box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.1);',
            textStyle: { color: '#0F172A', fontSize: 13, fontWeight: '500' },
            formatter: function (params: any) {
                let tooltipHtml = `<div style="font-weight:700; font-size:11px; text-transform:uppercase; color:#64748B; margin-bottom:8px;">Periode: ${params[0].name}</div>`;
                const sortedParams = [...params].sort((a, b) => (b.value || 0) - (a.value || 0));
                sortedParams.forEach((param: any) => {
                    if (param.value !== null && param.value !== undefined) {
                        tooltipHtml += `<div style="display:flex; justify-content:space-between; align-items:center; gap:24px; margin-bottom: 6px;"><div style="display:flex; align-items:center; gap:8px;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${param.color};"></span><span style="color:#475569; font-size:12px; font-weight:600;">${param.seriesName}</span></div><span style="color:#0F172A; font-weight:800; font-size:13px;">${param.value.toLocaleString('id-ID')} Pcs</span></div>`;
                    }
                });
                return tooltipHtml;
            }
        },
        legend: { data: ['Histori Aktual', 'Prediksi AI'], bottom: '0%', icon: 'circle', itemGap: 24, textStyle: { fontWeight: '700', color: '#64748b', fontSize: 12 } },
        grid: { left: '3%', right: '8%', bottom: '15%', top: '8%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: forecastData?.chart?.labels || [], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#64748B', fontWeight: '600', margin: 16, interval: 0, fontSize: 10, align: 'center' } },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9', width: 1.5 } }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#94a3b8', fontWeight: '700', fontSize: 11, formatter: (val: number) => val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val } },
        series: [
            { name: 'Histori Aktual', type: 'line', data: forecastData?.chart?.actual || [], smooth: 0.5, lineStyle: { width: 3, color: '#94a3b8', type: 'solid' }, itemStyle: { color: '#94a3b8', borderWidth: 2, borderColor: '#fff' }, symbol: 'circle', symbolSize: 8, showSymbol: true },
            { name: 'Prediksi AI', type: 'line', data: forecastData?.chart?.predicted || [], smooth: 0.5, lineStyle: { width: 4, color: '#4f46e5', shadowColor: 'rgba(79, 70, 229, 0.4)', shadowBlur: 14, shadowOffsetY: 8 }, itemStyle: { color: '#4f46e5', borderColor: '#ffffff', borderWidth: 3 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(79, 70, 229, 0.35)' }, { offset: 0.7, color: 'rgba(79, 70, 229, 0.05)' }, { offset: 1, color: 'rgba(79, 70, 229, 0)' }]) }, symbol: 'circle', symbolSize: 10, showSymbol: true }
        ]
    } : {};

    if (isLoading) return <div className="w-full h-[80vh] flex flex-col items-center justify-center text-[#4f46e5] gap-4"><Loader2 size={36} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm">Menyiapkan Engine MLOps...</span></div>;

    return (
        <div className="pb-12 max-w-7xl mx-auto space-y-8 relative animate-in fade-in">

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

            {/* HEADER KHUSUS RETAILER - INFO JELAS & IDENTITAS ASLI */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI Proyeksi Inventaris</h2>
                        {fastApiStatus === 'checking' && <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-bold rounded-full uppercase tracking-wider"><Loader2 size={12} className="animate-spin" /> Checking</span>}
                        {fastApiStatus === 'offline' && <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-600 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm"><ServerOff size={12} /> API Offline</span>}
                        {fastApiStatus === 'online' && <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-600 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm"><CheckCircle2 size={12} /> API Online</span>}
                    </div>

                    {/* BREADCRUMB IDENTITAS RETAILER */}
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                            <Store size={12} className="text-[#4f46e5]" /> Otorisasi: Admin Cabang {storeProfile.name}
                        </span>
                        <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                            <MapPin size={12} className="text-[#4f46e5]" /> {storeProfile.city}, {storeProfile.state}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 relative z-20">
                <div className="flex flex-col xl:flex-row xl:items-end gap-6">
                    <div ref={filterRef} className="flex-1 max-w-md">
                        <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'product' ? 'z-50' : 'z-10'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Filter Kategori Produk</label>
                            <button onClick={() => setOpenDropdown(openDropdown === 'product' ? null : 'product')} className={`flex items-center justify-between bg-white border ${openDropdown === 'product' ? 'border-[#4f46e5] ring-4 ring-[#6A7BFA]/10 shadow-sm' : 'border-slate-200 hover:border-[#6A7BFA]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-5 py-3.5 text-sm font-bold text-slate-700 transition-all duration-300 group`}>
                                <div className="flex items-center gap-2.5 truncate">
                                    <PackageSearch size={18} className="text-[#6A7BFA] group-hover:text-[#4f46e5] transition-all" />
                                    <span>{filterProduct}</span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform ${openDropdown === 'product' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'product' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[20px] shadow-2xl z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                    {availableProducts.map((item) => (
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
                            {isPredicting ? <><Loader2 size={18} className="animate-spin" /> Mengkalkulasi Data...</> : <><Sparkles size={18} /> Analisis Prediksi Kebutuhan</>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col relative overflow-hidden z-10 min-h-[500px]">

                {isPredicting && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm p-6 text-center animate-in fade-in duration-300 rounded-[40px]">
                        <div className="relative mb-6">
                            <div className="w-24 h-24 border-4 border-indigo-100 border-t-[#4f46e5] rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center"><BrainCircuit className="text-[#4f46e5] animate-pulse" size={32} /></div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Memproses Proyeksi AI</h3>
                        <p className="text-sm font-medium text-slate-500 max-w-md animate-pulse">Menganalisis pola riwayat transaksi {filterProduct} di Cabang {storeProfile.name}...</p>
                    </div>
                )}

                {!forecastData && !isPredicting && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 p-6 text-center rounded-[40px]">
                        <div className="bg-white p-6 rounded-full shadow-sm border border-slate-100 mb-4 animate-pulse">
                            <ServerOff size={48} className={isFastApiConnected ? "text-indigo-400" : "text-amber-500/50"} />
                        </div>
                        <span className="font-bold text-xl text-slate-700 mb-2 tracking-tight">
                            {isFastApiConnected ? "Tentukan Parameter & Jalankan Prediksi" : "Mesin Prediksi AI Belum Terhubung"}
                        </span>
                        <p className="text-sm font-medium text-slate-500 max-w-md">
                            {isFastApiConnected
                                ? "Pilih Kategori Produk di atas. Klik tombol 'Analisis Prediksi' untuk melihat proyeksi volume penjualan."
                                : "Fitur komparasi algoritma dan forecasting membutuhkan koneksi langsung ke server Machine Learning. Status saat ini: OFFLINE."}
                        </p>
                    </div>
                )}

                {forecastData && !isPredicting && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-[#EDF2FE] text-[#4f46e5] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-[#4f46e5]/10"><Clock size={12} /> {insightTime}</span>
                                    {forecastData.trend_direction === 'up' ? (
                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-emerald-100"><TrendingUpIcon size={12} /> Tren Naik</span>
                                    ) : (
                                        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-red-100"><TrendingDown size={12} /> Penurunan</span>
                                    )}
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">Insight Prediksi {filterProduct}</h3>
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

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                            <div className="lg:col-span-2 min-h-[440px] bg-white rounded-[32px] p-6 border border-slate-100 relative shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col">
                                <ReactECharts option={forecastOption} style={{ height: '100%', width: '100%', flex: 1 }} />
                            </div>

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

                                        <div className="flex bg-white/10 p-1.5 rounded-[16px] mb-5 shrink-0 shadow-inner">
                                            <button onClick={() => setActiveAiTab('evaluasi')} className={`flex-1 text-xs font-bold py-2.5 rounded-[12px] transition-all ${activeAiTab === 'evaluasi' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-white/70 hover:text-white'}`}>
                                                Evaluasi Tren
                                            </button>
                                            <button onClick={() => setActiveAiTab('mitigasi')} className={`flex-1 text-xs font-bold py-2.5 rounded-[12px] transition-all ${activeAiTab === 'mitigasi' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-white/70 hover:text-white'}`}>
                                                Tindakan Mitigasi
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 pb-2">
                                            <p className="text-[13px] leading-[1.8] font-medium text-indigo-50 whitespace-pre-wrap animate-in fade-in zoom-in-95 duration-200">
                                                {activeAiTab === 'evaluasi' ? parsedAiAnalysis.evaluasi : parsedAiAnalysis.mitigasi}
                                            </p>
                                        </div>

                                        <button onClick={handleBroadcastAlert} disabled={isBroadcasting} className="mt-5 w-full bg-white text-[#4f46e5] px-4 py-3.5 rounded-[20px] text-sm font-bold hover:bg-slate-50 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95 group border border-transparent">
                                            {isBroadcasting ? <><Loader2 size={16} className="animate-spin" /> Memproses...</> : <><Send size={16} className="group-hover:translate-x-1 transition-transform" /> Ajukan Restock Stok</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="flex items-center justify-between w-full group focus:outline-none">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:bg-[#4f46e5] group-hover:text-white transition-colors"><History size={24} /></div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Pengajuan Restock</h3>
                            <p className="text-sm font-medium text-slate-500 mt-0.5">Catatan permohonan logistik yang telah diajukan ke Regional.</p>
                        </div>
                    </div>
                    <div className="p-2 text-slate-400 group-hover:text-[#4f46e5] transition-colors">{isHistoryOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}</div>
                </button>

                {isHistoryOpen && (
                    <div className="mt-8 border-t border-slate-100 pt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                        {broadcastHistory.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 font-medium">Belum ada riwayat permohonan stok.</div>
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