"use client";
import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { BrainCircuit, AlertCircle, Loader2, Info, MapPin, Building2, Store, PackageSearch, Sparkles, ChevronDown, Lightbulb, Clock, TrendingDown, History, CheckCircle2, ChevronUp, Send } from 'lucide-react';

export default function AIForecastingPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isPredicting, setIsPredicting] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // Filter States
    const [filterProv, setFilterProv] = useState('Semua Provinsi');
    const [filterCity, setFilterCity] = useState('Semua Kota');
    const [filterRetailer, setFilterRetailer] = useState('Semua Retailer');
    const [filterProduct, setFilterProduct] = useState('Semua Kategori Produk');

    // Data Master dari Database
    const [masterStates, setMasterStates] = useState<string[]>([]);
    const [masterCities, setMasterCities] = useState<{ name: string, provinceName: string }[]>([]);
    const [masterRetailers, setMasterRetailers] = useState<{ id: string, name: string, cityName: string }[]>([]);

    const masterProducts = [
        "MEN SHOES - RUNNING", "WOMEN SHOES - SNEAKERS", "MEN CLOTHING - SPORTSWEAR",
        "WOMEN CLOTHING - LEGGINGS", "KIDS SPORTS - SWIMMING", "MEN ACCESSORIES - BAGS"
    ];

    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<{ title: string, desc: string, isAlert: boolean } | null>(null);

    const filterRef = useRef<HTMLDivElement>(null);
    const [insightTime, setInsightTime] = useState('');

    // STATE DATA
    const [forecastData, setForecastData] = useState<any>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // MENGHILANGKAN DATA DUMMY, GANTI JADI KOSONG
    const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

    const updateTimestamp = () => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return now.toLocaleDateString('id-ID', options) + ' WIB';
    };

    // FUNGSI MENARIK RIWAYAT BROADCAST DARI DATABASE
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
        fetch('/api/admin/locations')
            .then(res => res.json())
            .then(data => {
                setMasterStates(data.states || []);
                setMasterCities(data.cities || []);
                setMasterRetailers(data.retailers || []);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));

        // Panggil Riwayat Broadcast saat halaman dimuat
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
        setTimeout(() => setToastMsg(null), 4000);
    }

    const availableCities = filterProv === 'Semua Provinsi'
        ? masterCities
        : masterCities.filter(c => c.provinceName.toUpperCase() === filterProv.toUpperCase());

    const availableRetailers = filterCity === 'Semua Kota'
        ? masterRetailers
        : masterRetailers.filter(r => r.cityName.toUpperCase() === filterCity.toUpperCase());

    const handleGenerateForecast = () => {
        setIsPredicting(true);
        setTimeout(() => {
            setIsPredicting(false);
            setInsightTime(updateTimestamp());

            const area = filterProv === 'Semua Provinsi' ? 'seluruh provinsi di Indonesia' : `wilayah ${filterProv}`;
            const produk = filterProduct === 'Semua Kategori Produk' ? 'semua kategori produk' : `sektor ${filterProduct}`;
            const retailerText = filterRetailer === 'Semua Retailer' ? 'seluruh jaringan mitra' : `jaringan ${filterRetailer}`;

            setForecastData({
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun (W1)', 'Jun (W2)', 'Jun (W3)'],
                actual: [1.2, 1.5, 1.3, 1.8, 2.1, null, null, null],
                optimis: [null, null, null, null, 2.1, 2.6, 2.9, 3.3],
                prediksi: [null, null, null, null, 2.1, 2.4, 2.6, 2.9],
                pesimis: [null, null, null, null, 2.1, 2.2, 2.3, 2.5],
                insightText: `Proyeksi Makro: Komparasi AI dengan API Logistik mendeteksi lonjakan permintaan ${produk} untuk ${retailerText} di ${area}. Sistem merekomendasikan rilis kuota cadangan ke gudang provinsi terkait.`
            });

            showToast("Analisis Selesai", "Prediksi AI berhasil direstrukturisasi dari Database.");
        }, 1500);
    };

    // FUNGSI UNTUK MENGIRIM BROADCAST LANGSUNG KE TABEL DATABASE
    const handleBroadcastAlert = async () => {
        setIsBroadcasting(true);
        try {
            const targetCabang = filterProv !== 'Semua Provinsi' ? `Manajer Provinsi ${filterProv}` : 'Seluruh Manajer Provinsi Nasional';

            // Tembak Data ke API
            const res = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target: targetCabang,
                    insight: forecastData?.insightText || "Peringatan Anomali Makro Nasional."
                })
            });

            if (res.ok) {
                // Refresh data riwayat agar langsung muncul di bawah!
                await fetchBroadcastHistory();
                showToast("Memo Terkirim!", `Instruksi eksekutif telah sukses di-broadcast ke ${targetCabang}.`, true);
                setIsHistoryOpen(true);
            } else {
                showToast("Gagal Terkirim", "Terjadi kesalahan pada server.", false);
            }
        } catch (error) {
            showToast("Error", "Gagal menghubungi server database.", false);
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
                        const fullValue = (param.value * 1000000).toLocaleString('id-ID');
                        tooltipHtml += `<div style="display:flex; justify-content:space-between; align-items:center; gap:32px; margin-bottom: 6px;"><div style="display:flex; align-items:center; gap:8px;"><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${param.color};"></span><span style="color:#64748B; font-size:12px; font-weight:600;">${param.seriesName}</span></div><span style="color:${param.color}; font-weight:bold; font-size:13px;">${fullValue} Pcs</span></div>`;
                    }
                });
                return tooltipHtml;
            }
        },
        legend: { type: 'scroll', data: ['Data Aktual DB', 'Skenario Optimis', 'Prediksi Utama AI', 'Skenario Pesimis'], bottom: 0, icon: 'circle', textStyle: { color: '#475569', fontSize: 11, fontWeight: '600' }, itemGap: 15 },
        grid: { left: '4%', right: '6%', bottom: '25%', top: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: forecastData?.labels || [], axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#64748B', fontWeight: '500', margin: 12 } },
        yAxis: { type: 'value', axisLabel: { formatter: '{value}M', color: '#64748B', fontWeight: '600' }, splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } } },
        series: [
            { name: 'Data Aktual DB', type: 'line', smooth: true, symbolSize: 8, itemStyle: { color: '#4f46e5', borderWidth: 2, borderColor: '#fff' }, lineStyle: { width: 4, color: '#4f46e5' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(106, 123, 250, 0.4)' }, { offset: 1, color: 'rgba(79, 70, 229, 0)' }] } }, data: forecastData?.actual || [] },
            { name: 'Skenario Optimis', type: 'line', smooth: true, symbolSize: 6, itemStyle: { color: '#10B981', borderWidth: 2, borderColor: '#fff' }, lineStyle: { width: 2, type: 'dashed', color: '#10B981' }, data: forecastData?.optimis || [] },
            {
                name: 'Prediksi Utama AI', type: 'line', smooth: true, symbolSize: 8, itemStyle: { color: '#F59E0B', borderWidth: 2, borderColor: '#fff' }, lineStyle: { width: 3, type: 'dashed', color: '#F59E0B' }, data: forecastData?.prediksi || [],
                markLine: { symbol: 'none', label: { formatter: 'Garis Prediksi', position: 'end', color: '#64748B', fontSize: 10, fontWeight: '600', padding: [0, 0, 5, 0] }, lineStyle: { color: '#CBD5E1', type: 'dashed', width: 1.5 }, data: [{ xAxis: 'Mei' }] }
            },
            { name: 'Skenario Pesimis', type: 'line', smooth: true, symbolSize: 6, itemStyle: { color: '#EF4444', borderWidth: 2, borderColor: '#fff' }, lineStyle: { width: 2, type: 'dashed', color: '#EF4444' }, data: forecastData?.pesimis || [] }
        ]
    };

    if (isLoading) return <div className="w-full h-full flex items-center justify-center text-[#6A7BFA] gap-3"><Loader2 size={24} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm">Mensinkronisasi dengan Database...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-6 relative">

            {toastMsg && (
                <div className={`fixed top-24 right-6 lg:right-10 z-[9999] border rounded-[24px] p-4 flex gap-4 items-center shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] animate-in slide-in-from-right-8 fade-in duration-300 max-w-md ${toastMsg.isAlert ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                    <div className={`p-3 rounded-full shrink-0 ${toastMsg.isAlert ? 'bg-emerald-100 text-emerald-600' : 'bg-[#EDF2FE] text-[#6A7BFA]'}`}>
                        {toastMsg.isAlert ? <CheckCircle2 size={20} /> : <BrainCircuit size={20} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">{toastMsg.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{toastMsg.desc}</p>
                    </div>
                    <button onClick={() => setToastMsg(null)} className="ml-2 text-slate-400 hover:text-slate-600"><AlertCircle size={16} /></button>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">AI Forecasting & Proyeksi</h2>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><Info size={16} className="text-[#6A7BFA]" /> Analisis proyeksi dan kirim peringatan ke Manajer Cabang.</p>
                </div>
            </div>

            <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both relative z-20">
                <div className="flex flex-col xl:flex-row xl:items-end gap-6">
                    <div ref={filterRef} className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* 1. FILTER PROVINSI */}
                        <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'prov' ? 'z-50' : 'z-10'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">State / Provinsi</label>
                            <button onClick={() => setOpenDropdown(openDropdown === 'prov' ? null : 'prov')} className={`flex items-center justify-between bg-white border ${openDropdown === 'prov' ? 'border-[#4f46e5] ring-4 ring-[#6A7BFA]/10 shadow-sm' : 'border-slate-200 hover:border-[#6A7BFA]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-4 py-3 text-sm font-bold text-slate-700 transition-all duration-300 group`}>
                                <div className="flex items-center gap-2 truncate">
                                    <MapPin size={16} className="text-[#6A7BFA] group-hover:scale-110 group-hover:text-[#4f46e5] transition-all duration-300" />
                                    <span className="truncate group-hover:text-[#4f46e5] transition-colors">{filterProv}</span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 group-hover:text-[#4f46e5] transition-all duration-300 ${openDropdown === 'prov' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'prov' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                    {['Semua Provinsi', ...masterStates].map((item) => (
                                        <button key={item} onClick={() => { setFilterProv(item); setFilterCity('Semua Kota'); setFilterRetailer('Semua Retailer'); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterProv === item ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5] hover:translate-x-1'}`}>
                                            {item} {filterProv === item && <CheckCircle2 size={16} className="text-white" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. FILTER KOTA */}
                        <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'city' ? 'z-50' : 'z-10'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">City / Kota</label>
                            <button onClick={() => setOpenDropdown(openDropdown === 'city' ? null : 'city')} className={`flex items-center justify-between bg-white border ${openDropdown === 'city' ? 'border-[#4f46e5] ring-4 ring-[#6A7BFA]/10 shadow-sm' : 'border-slate-200 hover:border-[#6A7BFA]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-4 py-3 text-sm font-bold text-slate-700 transition-all duration-300 group`}>
                                <div className="flex items-center gap-2 truncate">
                                    <Building2 size={16} className="text-[#6A7BFA] group-hover:scale-110 group-hover:text-[#4f46e5] transition-all duration-300" />
                                    <span className="truncate group-hover:text-[#4f46e5] transition-colors">{filterCity}</span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 group-hover:text-[#4f46e5] transition-all duration-300 ${openDropdown === 'city' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'city' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                    {['Semua Kota', ...Array.from(new Set(availableCities.map(c => c.name)))].map((item) => (
                                        <button key={item} onClick={() => { setFilterCity(item); setFilterRetailer('Semua Retailer'); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterCity === item ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5] hover:translate-x-1'}`}>
                                            {item} {filterCity === item && <CheckCircle2 size={16} className="text-white" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 3. FILTER RETAILER */}
                        <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'retailer' ? 'z-50' : 'z-10'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Mitra Retailer</label>
                            <button onClick={() => setOpenDropdown(openDropdown === 'retailer' ? null : 'retailer')} className={`flex items-center justify-between bg-white border ${openDropdown === 'retailer' ? 'border-[#4f46e5] ring-4 ring-[#6A7BFA]/10 shadow-sm' : 'border-slate-200 hover:border-[#6A7BFA]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-4 py-3 text-sm font-bold text-slate-700 transition-all duration-300 group`}>
                                <div className="flex items-center gap-2 truncate">
                                    <Store size={16} className="text-[#6A7BFA] group-hover:scale-110 group-hover:text-[#4f46e5] transition-all duration-300" />
                                    <span className="truncate group-hover:text-[#4f46e5] transition-colors">{filterRetailer}</span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 group-hover:text-[#4f46e5] transition-all duration-300 ${openDropdown === 'retailer' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'retailer' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                    {['Semua Retailer', ...Array.from(new Set(availableRetailers.map(r => r.name.split(' - ')[0])))].map((item) => (
                                        <button key={item} onClick={() => { setFilterRetailer(item); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterRetailer === item ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5] hover:translate-x-1'}`}>
                                            {item} {filterRetailer === item && <CheckCircle2 size={16} className="text-white" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 4. FILTER PRODUK */}
                        <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'product' ? 'z-50' : 'z-10'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Kategori Produk</label>
                            <button onClick={() => setOpenDropdown(openDropdown === 'product' ? null : 'product')} className={`flex items-center justify-between bg-white border ${openDropdown === 'product' ? 'border-[#4f46e5] ring-4 ring-[#6A7BFA]/10 shadow-sm' : 'border-slate-200 hover:border-[#6A7BFA]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-4 py-3 text-sm font-bold text-slate-700 transition-all duration-300 group`}>
                                <div className="flex items-center gap-2 truncate">
                                    <PackageSearch size={16} className="text-[#6A7BFA] group-hover:scale-110 group-hover:text-[#4f46e5] transition-all duration-300" />
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
                        <button onClick={handleGenerateForecast} disabled={isPredicting || isBroadcasting} className="w-full xl:w-auto bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] hover:shadow-lg hover:shadow-[#4f46e5]/30 text-white px-8 py-3.5 rounded-[20px] font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70">
                            {isPredicting ? <><Loader2 size={18} className="animate-spin" /> Menarik Data...</> : <><Sparkles size={18} /> Prediksi DB</>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out delay-200 fill-mode-both z-10 min-h-[400px]">

                {/* 1. STATE SAAT BELUM PREDIKSI */}
                {!forecastData && !isPredicting && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                        <div className="bg-white p-6 rounded-full shadow-sm border border-slate-100 mb-4 animate-bounce">
                            <BrainCircuit size={48} className="text-[#6A7BFA]/50" />
                        </div>
                        <span className="font-bold text-xl text-slate-600 mb-2">Area Analisis Kosong</span>
                        <p className="text-sm font-medium text-slate-500">Pilih parameter wilayah dan klik "Prediksi DB" untuk memuat hasil AI.</p>
                    </div>
                )}

                {/* 2. STATE SAAT LOADING PREDIKSI */}
                {isPredicting && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-30 flex flex-col items-center justify-center text-[#4f46e5] gap-4 animate-in fade-in duration-300">
                        <Loader2 size={36} className="animate-spin" />
                        <span className="font-bold text-xl text-slate-800">Menyusun Prediksi...</span>
                    </div>
                )}

                {/* 3. STATE KETIKA DATA SUDAH ADA */}
                <div className={`transition-opacity duration-500 ${forecastData && !isPredicting ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                        <div className="flex items-center gap-2 bg-[#EDF2FE] px-4 py-2 rounded-full text-[#4f46e5] text-xs font-bold border border-[#6A7BFA]/20 w-fit">
                            <BrainCircuit size={16} /> Model: Random Forest Regressor
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full text-emerald-600 text-xs font-bold border border-emerald-100 w-fit shadow-sm">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            API Logistik Nasional Tersinkronisasi
                        </div>
                    </div>

                    <div className="w-full h-[350px]">
                        {forecastData && <ReactECharts option={forecastOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />}
                    </div>

                    <div className="mt-8 p-6 lg:p-8 border bg-[#F8FAFC] border-slate-200 rounded-[32px] shadow-inner relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-100/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 relative z-10 border-b border-slate-200 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 rounded-2xl shadow-sm border border-amber-200"><Lightbulb size={24} className="fill-amber-500/20" /></div>
                                <div>
                                    <h4 className="font-bold text-xl text-slate-900 flex items-center gap-2">Insight Tindakan Eksekutif</h4>
                                    <p className="text-sm font-medium text-slate-500 mt-0.5">Berikan instruksi operasional ke cabang terkait.</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm shrink-0">
                                <Clock size={14} className="text-[#4f46e5]" /> Pemindaian Terakhir: {insightTime}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10 mb-6">
                            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 text-slate-800"><Info size={18} className="text-[#4f46e5]" /><span className="font-bold text-xs uppercase tracking-widest">Kondisi Makro</span></div>
                                <p className="text-slate-700 text-sm font-medium leading-relaxed">{forecastData?.insightText}</p>
                            </div>
                            <div className="bg-red-50 p-5 rounded-[24px] border border-red-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 text-red-600"><TrendingDown size={18} /><span className="font-bold text-xs uppercase tracking-widest">Risiko Jika Cabang Terlambat</span></div>
                                <p className="text-red-900/80 text-sm font-medium leading-relaxed">Kelalaian restock oleh cabang akan mengakibatkan <strong className="text-red-700">Out-of-Stock (OOS) massal</strong> dan menurunkan omzet nasional secara signifikan.</p>
                            </div>
                        </div>

                        <div className="flex justify-end relative z-10 border-t border-slate-200 pt-5">
                            <button
                                onClick={handleBroadcastAlert}
                                disabled={isBroadcasting}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-[#6A7BFA] hover:to-[#4f46e5] text-white px-8 py-3.5 rounded-[20px] font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-70"
                            >
                                {isBroadcasting ? <><Loader2 size={18} className="animate-spin" /> Mengirim Alert...</> : <><Send size={18} /> Kirim Alert Peringatan ke Cabang</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* LOG RIWAYAT BROADCAST ALERT */}
            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="flex items-center justify-between w-full group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl group-hover:bg-gradient-to-r group-hover:from-[#6A7BFA] group-hover:to-[#4f46e5] group-hover:text-white group-hover:shadow-md transition-all"><History size={24} /></div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-slate-900">Riwayat Broadcast Terkirim</h3>
                            <p className="text-sm text-slate-500 mt-0.5">Catatan instruksi dan peringatan AI yang telah dikirim Admin ke Cabang.</p>
                        </div>
                    </div>
                    <div className="p-2 text-slate-400 group-hover:text-[#4f46e5] transition-colors">{isHistoryOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}</div>
                </button>

                {isHistoryOpen && (
                    <div className="mt-8 border-t border-slate-100 pt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                        {broadcastHistory.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 font-medium">Belum ada riwayat broadcast yang dikirim.</div>
                        ) : (
                            <div className="max-h-[380px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                                {broadcastHistory.map((item, idx) => (
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
                        )}
                        {broadcastHistory.length > 0 && (
                            <button className="w-full mt-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-[#4f46e5] text-sm font-bold rounded-2xl transition-colors border border-dashed border-slate-200">
                                Muat Riwayat Lebih Lama...
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}