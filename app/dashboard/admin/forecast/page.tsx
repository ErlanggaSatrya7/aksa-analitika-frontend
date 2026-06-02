"use client";
import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { BrainCircuit, AlertCircle, Loader2, Info, MapPin, Building2, Store, PackageSearch, Sparkles, ChevronDown, Lightbulb, Clock, TrendingDown, History, CheckCircle2, ChevronUp, Send, ServerOff, X } from 'lucide-react';
export default function AIForecastingPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isPredicting, setIsPredicting] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // KUNCI KEJUJURAN: Status koneksi FastAPI (Saat ini hardcoded FALSE karena belum dibuat)
    const [isFastApiConnected, setIsFastApiConnected] = useState(false);

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

    // STATE DATA - DIBIARKAN KOSONG/NULL
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
        fetch('/api/admin/locations')
            .then(res => res.json())
            .then(data => {
                setMasterStates(data.states || []);
                setMasterCities(data.cities || []);
                setMasterRetailers(data.retailers || []);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));

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

    // PERBAIKAN: Mencegah eksekusi dummy data
    const handleGenerateForecast = () => {
        if (!isFastApiConnected) {
            showToast("FastAPI Offline", "Tidak dapat menarik prediksi karena mesin Machine Learning belum terhubung ke sistem.", true);
            return;
        }

        // --- NANTI LOGIKANYA MASUK SINI SETELAH FASTAPI JALAN ---
        setIsPredicting(true);
        // ... fetching to fastapi ...
    };

    const handleBroadcastAlert = async () => {
        setIsBroadcasting(true);
        try {
            const targetCabang = filterProv !== 'Semua Provinsi' ? `Manajer Provinsi ${filterProv}` : 'Seluruh Manajer Provinsi Nasional';

            const res = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target: targetCabang,
                    insight: forecastData?.insightText || "Peringatan Anomali Makro Nasional."
                })
            });

            if (res.ok) {
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

    if (isLoading) return <div className="w-full h-full flex items-center justify-center text-[#6A7BFA] gap-3"><Loader2 size={24} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm">Mensinkronisasi dengan Database...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-6 relative">

            {toastMsg && (
                <div className={`fixed top-24 right-6 lg:right-10 z-[9999] border rounded-[24px] p-4 flex gap-4 items-center shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] animate-in slide-in-from-right-8 fade-in duration-300 max-w-md ${toastMsg.isAlert ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <div className={`p-3 rounded-full shrink-0 ${toastMsg.isAlert ? 'bg-amber-100 text-amber-600' : 'bg-[#EDF2FE] text-[#6A7BFA]'}`}>
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
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">AI Forecasting & Proyeksi</h2>
                        {/* BADGE OFFLINE */}
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-600 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm">
                            <ServerOff size={12} /> FastAPI Offline
                        </span>
                    </div>
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
                        {/* PERBAIKAN: Tombol diblokir dan warna diganti pucat karena FastAPI Offline */}
                        <button
                            onClick={handleGenerateForecast}
                            disabled={!isFastApiConnected}
                            className={`w-full xl:w-auto px-8 py-3.5 rounded-[20px] font-bold text-sm transition-all flex items-center justify-center gap-2 ${isFastApiConnected ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] hover:shadow-lg hover:shadow-[#4f46e5]/30 text-white active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
                        >
                            {isPredicting ? <><Loader2 size={18} className="animate-spin" /> Menarik Data...</> : <><Sparkles size={18} /> Prediksi DB</>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out delay-200 fill-mode-both z-10 min-h-[400px]">

                {/* PERBAIKAN: STATE SAAT FAST API BELUM TERHUBUNG (MENGGANTIKAN DATA DUMMY) */}
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
            </div>

            {/* LOG RIWAYAT BROADCAST ALERT (Tetap berfungsi karena ini baca dari Database biasa) */}
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
                    </div>
                )}
            </div>
        </div>
    );
}