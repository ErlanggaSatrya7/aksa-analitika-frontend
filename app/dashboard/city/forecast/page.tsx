"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import ReactECharts from 'echarts-for-react';
import { BrainCircuit, Loader2, Info, Store, PackageSearch, Sparkles, ChevronDown, Lightbulb, Clock, TrendingDown, History, CheckCircle2, ChevronUp, Send, AlertCircle, ServerOff, X } from 'lucide-react';

export default function CityForecastPage() {
    const { data: session } = useSession();
    const userCity = (session?.user as any)?.assignedCity || 'Medan';

    const [isLoading, setIsLoading] = useState(true);
    const [isPredicting, setIsPredicting] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // KUNCI KEJUJURAN: Status koneksi FastAPI (Saat ini hardcoded FALSE)
    const [isFastApiConnected, setIsFastApiConnected] = useState(false);

    const [filterStore, setFilterStore] = useState('Semua Toko');
    const [filterProduct, setFilterProduct] = useState('Semua Kategori');

    // Memisahkan opsi dropdown dari data forecast
    const [availableStores, setAvailableStores] = useState<string[]>(['Semua Toko']);
    const [availableProducts, setAvailableProducts] = useState<string[]>(['Semua Kategori']);

    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<{ title: string, desc: string, isAlert: boolean } | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    const [insightTime, setInsightTime] = useState('');

    // STATE DATA GRAFIK - Dibiarkan kosong/null di awal
    const [forecastData, setForecastData] = useState<any>(null);

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

    const updateTimestamp = () => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return now.toLocaleDateString('id-ID', options) + ' WIB';
    };

    useEffect(() => {
        setInsightTime(updateTimestamp());
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) setOpenDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Options (Dropdown)
    useEffect(() => {
        if (!userCity) return;
        setIsLoading(true);

        const fetchInitialOptions = async () => {
            try {
                const res = await fetch(`/api/city/forecast/options?city=${encodeURIComponent(userCity)}`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableStores(data.stores || ['Semua Toko']);
                    setAvailableProducts(data.products || ['Semua Kategori']);
                }
            } catch (error) {
                console.error("Forecast Options Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialOptions();
    }, [userCity]);

    // Fetch Riwayat Eskalasi Laporan dari Database
    useEffect(() => {
        if (!userCity) return;
        const fetchHistory = async () => {
            try {
                const res = await fetch(`/api/city/forecast/history?city=${encodeURIComponent(userCity)}`);
                if (res.ok) setBroadcastHistory(await res.json());
            } catch (error) {
                console.error("Gagal menarik riwayat eskalasi", error);
            }
        };
        fetchHistory();
    }, [userCity]);

    const showToast = (title: string, desc: string, isAlert: boolean = false) => {
        setToastMsg({ title, desc, isAlert });
        setTimeout(() => setToastMsg(null), 4000);
    }

    // PERBAIKAN: Mencegah eksekusi dummy data
    const handleGenerateForecast = async () => {
        if (!isFastApiConnected) {
            showToast("FastAPI Offline", "Tidak dapat menarik prediksi karena mesin Machine Learning belum terhubung ke sistem.", true);
            return;
        }

        // Nanti logika fetch sesungguhnya ditaruh di sini
        setIsPredicting(true);
    };

    // FUNGSI ESKALASI (POST KE DATABASE)
    const handleBroadcastAlert = async () => {
        setIsBroadcasting(true);
        try {
            const res = await fetch('/api/city/forecast/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    city: userCity,
                    insight: forecastData?.insightText || "Permohonan eskalasi suplai darurat akibat potensi defisit stok di tingkat cabang."
                })
            });

            if (res.ok) {
                const newLog = await res.json();
                setBroadcastHistory(prev => [newLog, ...prev]);
                showToast("Eskalasi Terkirim!", `Laporan telah sukses dikirim ke Manajer Provinsi.`, true);
                setIsHistoryOpen(true);
            } else {
                showToast("Gagal Terkirim", "Akun State Admin belum tersedia di sistem database.", false);
            }
        } catch (error) {
            showToast("Gagal", "Jaringan terputus saat menghubungi server pusat.", false);
        } finally {
            setIsBroadcasting(false);
        }
    };

    const forecastOption = {
        tooltip: {
            trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: '#CBD5E1', type: 'dashed' } },
            backgroundColor: '#ffffff', borderColor: '#E2E8F0', borderWidth: 1, padding: [12, 16], extraCssText: 'border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);',
            formatter: function (params: any) {
                let tooltipHtml = `<div style="font-weight:bold; color:#0F172A; margin-bottom:8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">Periode: ${params[0].name}</div>`;
                const sortedParams = [...params].sort((a, b) => (b.value || 0) - (a.value || 0));
                sortedParams.forEach((param: any) => {
                    if (param.value !== null && param.value !== undefined) {
                        tooltipHtml += `<div style="display:flex; justify-content:space-between; align-items:center; gap:32px; margin-bottom: 6px;"><div style="display:flex; align-items:center; gap:8px;"><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${param.color};"></span><span style="color:#64748B; font-size:12px; font-weight:600;">${param.seriesName}</span></div><span style="color:${param.color}; font-weight:bold; font-size:13px;">${param.value.toLocaleString('id-ID')} Pcs</span></div>`;
                    }
                });
                return tooltipHtml;
            }
        },
        legend: { type: 'scroll', data: ['Data Gudang Aktual', 'Skenario Optimis', 'Prediksi Utama', 'Skenario Pesimis'], bottom: 0, icon: 'circle', textStyle: { color: '#475569', fontSize: 11, fontWeight: '600' }, itemGap: 15 },
        grid: { left: '4%', right: '6%', bottom: '25%', top: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: forecastData?.chartData?.dates || ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ming'], axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#64748B', fontWeight: '500', margin: 12 } },
        yAxis: { type: 'value', axisLabel: { formatter: '{value}', color: '#64748B', fontWeight: '600' }, splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } } },
        series: [
            {
                name: 'Data Gudang Aktual', type: 'line', smooth: true, symbolSize: 8,
                itemStyle: { color: '#4f46e5', borderWidth: 2, borderColor: '#fff' },
                lineStyle: { width: 4, color: '#4f46e5' },
                areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(106, 123, 250, 0.4)' }, { offset: 1, color: 'rgba(79, 70, 229, 0)' }] } },
                data: forecastData?.chartData?.actual || []
            },
            { name: 'Skenario Optimis', type: 'line', smooth: true, symbolSize: 6, itemStyle: { color: '#10B981', borderWidth: 2, borderColor: '#fff' }, lineStyle: { width: 2, type: 'dashed', color: '#10B981' }, data: forecastData?.chartData?.optimis || [] },
            {
                name: 'Prediksi Utama', type: 'line', smooth: true, symbolSize: 8, itemStyle: { color: '#F59E0B', borderWidth: 2, borderColor: '#fff' }, lineStyle: { width: 3, type: 'dashed', color: '#F59E0B' },
                data: forecastData?.chartData?.prediksi || [],
                markLine: { symbol: 'none', label: { formatter: 'Akhir Pekan', position: 'end', color: '#64748B', fontSize: 10, fontWeight: '600', padding: [0, 0, 5, 0] }, lineStyle: { color: '#CBD5E1', type: 'dashed', width: 1.5 }, data: [{ xAxis: 'Jum' }] }
            },
            { name: 'Skenario Pesimis', type: 'line', smooth: true, symbolSize: 6, itemStyle: { color: '#EF4444', borderWidth: 2, borderColor: '#fff' }, lineStyle: { width: 2, type: 'dashed', color: '#EF4444' }, data: forecastData?.chartData?.pesimis || [] }
        ]
    };

    if (isLoading) return <div className="w-full h-full flex items-center justify-center text-[#6A7BFA] gap-3 min-h-[60vh]"><Loader2 size={32} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm">Menghubungkan ke Server Kota...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-6 relative">

            {toastMsg && (
                <div className={`fixed top-24 right-6 lg:right-10 z-[9999] border rounded-[24px] p-4 flex gap-4 items-center shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] animate-in slide-in-from-right-8 fade-in duration-300 max-w-md ${toastMsg.isAlert ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <div className={`p-3 rounded-full shrink-0 ${toastMsg.isAlert ? 'bg-amber-100 text-amber-600' : 'bg-[#EDF2FE] text-[#4f46e5]'}`}>
                        {toastMsg.isAlert ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">{toastMsg.title}</h4>
                        <p className="text-xs mt-0.5 opacity-80">{toastMsg.desc}</p>
                    </div>
                    <button onClick={() => setToastMsg(null)} className="ml-2 opacity-50 hover:opacity-100"><X size={16} /></button>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">AI Forecasting Wilayah {userCity}</h2>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-600 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm">
                            <ServerOff size={12} /> FastAPI Offline
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><Info size={16} className="text-[#6A7BFA]" /> Analisis tren gabungan toko dan eskalasi ke Provinsi.</p>
                </div>
            </div>

            <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both relative z-20">
                <div className="flex flex-col xl:flex-row xl:items-end gap-6">
                    <div ref={filterRef} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'store' ? 'z-50' : 'z-10'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Filter Cabang / Agregat</label>
                            <button onClick={() => setOpenDropdown(openDropdown === 'store' ? null : 'store')} className={`flex items-center justify-between bg-white border ${openDropdown === 'store' ? 'border-[#4f46e5] ring-4 ring-[#6A7BFA]/10 shadow-sm' : 'border-slate-200 hover:border-[#6A7BFA]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-4 py-3.5 text-sm font-bold text-slate-700 transition-all duration-300 group`}>
                                <div className="flex items-center gap-2 truncate"><Store size={16} className="text-[#6A7BFA] group-hover:scale-110 group-hover:text-[#4f46e5] transition-all" /><span className="truncate group-hover:text-[#4f46e5] transition-colors">{filterStore}</span></div>
                                <ChevronDown size={16} className={`text-slate-400 group-hover:text-[#4f46e5] transition-transform ${openDropdown === 'store' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'store' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-60 overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                    {availableStores.map((item) => (
                                        <button key={item} onClick={() => { setFilterStore(item); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterStore === item ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-md' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5]'}`}>
                                            {item} {filterStore === item && <CheckCircle2 size={16} className="text-white" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'product' ? 'z-50' : 'z-10'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Kategori Produk</label>
                            <button onClick={() => setOpenDropdown(openDropdown === 'product' ? null : 'product')} className={`flex items-center justify-between bg-white border ${openDropdown === 'product' ? 'border-[#4f46e5] ring-4 ring-[#6A7BFA]/10 shadow-sm' : 'border-slate-200 hover:border-[#6A7BFA]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-4 py-3.5 text-sm font-bold text-slate-700 transition-all duration-300 group`}>
                                <div className="flex items-center gap-2 truncate"><PackageSearch size={16} className="text-[#6A7BFA] group-hover:scale-110 group-hover:text-[#4f46e5] transition-all" /><span className="truncate group-hover:text-[#4f46e5] transition-colors">{filterProduct}</span></div>
                                <ChevronDown size={16} className={`text-slate-400 group-hover:text-[#4f46e5] transition-transform ${openDropdown === 'product' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'product' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-60 overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                    {availableProducts.map((item) => (
                                        <button key={item} onClick={() => { setFilterProduct(item); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterProduct === item ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-md' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5]'}`}>
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
                            className={`w-full xl:w-auto px-8 py-3.5 rounded-[20px] font-bold text-sm transition-all flex items-center justify-center gap-2 ${isFastApiConnected ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] hover:shadow-lg text-white active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
                        >
                            {isPredicting ? <><Loader2 size={18} className="animate-spin" /> Menarik Data...</> : <><Sparkles size={18} /> Komparasi AI & Gudang</>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out delay-200 fill-mode-both z-10 min-h-[400px]">

                {/* STATE SAAT FAST API BELUM TERHUBUNG */}
                {!forecastData && !isPredicting && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 p-6 text-center">
                        <div className="bg-white p-6 rounded-full shadow-sm border border-slate-100 mb-4 animate-pulse">
                            <ServerOff size={48} className="text-amber-500/50" />
                        </div>
                        <span className="font-bold text-xl text-slate-700 mb-2 tracking-tight">Mesin Prediksi AI Belum Terhubung</span>
                        <p className="text-sm font-medium text-slate-500 max-w-md">
                            Fitur komparasi algoritma dan *forecasting* membutuhkan koneksi langsung ke server Machine Learning (FastAPI). <br /><br />
                            Status saat ini: <strong className="text-amber-600">OFFLINE</strong>.
                        </p>
                    </div>
                )}

                {/* SISA KODE DI BAWAH INI AKAN MUNCUL SAAT FASTAPI SUDAH JALAN */}
                <div className={`transition-opacity duration-500 ${forecastData && !isPredicting ? 'opacity-100' : 'opacity-0 hidden'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                        <div className="flex items-center gap-2 bg-[#EDF2FE] px-4 py-2 rounded-full text-[#4f46e5] text-xs font-bold border border-[#6A7BFA]/20 w-fit">
                            <BrainCircuit size={16} /> City-Level Aggregated Prediction
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full text-emerald-600 text-xs font-bold border border-emerald-100 w-fit shadow-sm">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            API Gudang Kota Tersinkronisasi
                        </div>
                    </div>

                    <div className="w-full h-[350px]">
                        {forecastData && <ReactECharts option={forecastOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />}
                    </div>

                    {forecastData?.insightText && (
                        <div className="mt-8 p-6 lg:p-8 border bg-[#F8FAFC] border-slate-200 rounded-[32px] shadow-inner relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-100/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 relative z-10 border-b border-slate-200 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 rounded-2xl shadow-sm border border-amber-200"><Lightbulb size={24} className="fill-amber-500/20" /></div>
                                    <div>
                                        <h4 className="font-bold text-xl text-slate-900 flex items-center gap-2">Rekomendasi Manajerial <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] uppercase tracking-widest rounded-md animate-pulse shadow-sm">Urgent</span></h4>
                                        <p className="text-sm font-medium text-slate-500 mt-0.5">Eskalasi laporan ke Manajer Provinsi segera.</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm shrink-0">
                                    <Clock size={14} className="text-[#4f46e5]" /> Real-time: {insightTime}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10 mb-6">
                                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 text-slate-800"><Info size={18} className="text-[#4f46e5]" /><span className="font-bold text-xs uppercase tracking-widest">Kondisi Stok Regional {userCity}</span></div>
                                    <p className="text-slate-700 text-sm font-medium leading-relaxed">{forecastData.insightText}</p>
                                </div>
                                <div className="bg-red-50 p-5 rounded-[24px] border border-red-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 text-red-600"><TrendingDown size={18} /><span className="font-bold text-xs uppercase tracking-widest">Risiko Keterlambatan</span></div>
                                    <p className="text-red-900/80 text-sm font-medium leading-relaxed">Jika tidak dilakukan permohonan suplai dari Provinsi hari ini, maka <strong className="text-red-700">60% Cabang {userCity}</strong> akan mengalami kekosongan produk pada hari Sabtu.</p>
                                </div>
                            </div>

                            <div className="flex justify-end relative z-10 border-t border-slate-200 pt-5">
                                <button onClick={handleBroadcastAlert} disabled={isBroadcasting} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-[#6A7BFA] hover:to-[#4f46e5] text-white px-8 py-3.5 rounded-[20px] font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-70">
                                    {isBroadcasting ? <><Loader2 size={18} className="animate-spin" /> Mengirim Eskalasi...</> : <><Send size={18} /> Eskalasi Laporan ke Provinsi</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="flex items-center justify-between w-full group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl group-hover:bg-gradient-to-r group-hover:from-[#6A7BFA] group-hover:to-[#4f46e5] group-hover:text-white group-hover:shadow-md transition-all"><History size={24} /></div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-slate-900">Riwayat Eskalasi Laporan</h3>
                            <p className="text-sm text-slate-500 mt-0.5">Catatan peringatan AI yang telah diajukan ke tingkat Provinsi.</p>
                        </div>
                    </div>
                    <div className="p-2 text-slate-400 group-hover:text-[#4f46e5] transition-colors">{isHistoryOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}</div>
                </button>

                {isHistoryOpen && (
                    <div className="mt-8 border-t border-slate-100 pt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                        <div className="max-h-[380px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                            {broadcastHistory.length === 0 ? (
                                <div className="text-center py-6 text-slate-400 font-medium">Belum ada riwayat eskalasi yang diajukan ke Provinsi.</div>
                            ) : broadcastHistory.map((item, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-5 bg-white border border-slate-200 rounded-[24px] hover:shadow-md transition-shadow">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] px-2.5 py-1 rounded-md shadow-sm">{item.id}</span>
                                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Clock size={12} /> {item.date}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 mb-1">Penerima: <span className="text-[#4f46e5]">{item.target}</span></p>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-3xl truncate">{item.insight}</p>
                                    </div>
                                    <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-5">
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100"><CheckCircle2 size={14} /> Sukses Terkirim</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}