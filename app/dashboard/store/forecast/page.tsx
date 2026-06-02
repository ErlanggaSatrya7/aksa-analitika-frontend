"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import ReactECharts from 'echarts-for-react';
import { BrainCircuit, Loader2, Info, PackageSearch, Sparkles, ChevronDown, Lightbulb, Clock, TrendingDown, History, CheckCircle2, ChevronUp, Send, AlertCircle, ServerOff, X } from 'lucide-react';

export default function StoreForecastPage() {
    const { data: session } = useSession();
    const user = session?.user as any;
    const retailerId = user?.retailerId || '';

    const [isLoading, setIsLoading] = useState(true);
    const [isPredicting, setIsPredicting] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // KUNCI KEJUJURAN: Status koneksi FastAPI (Saat ini hardcoded FALSE karena belum dibuat)
    const [isFastApiConnected, setIsFastApiConnected] = useState(false);

    const [filterProduct, setFilterProduct] = useState('Semua Kategori');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<{ title: string, desc: string, isAlert: boolean } | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    const [insightTime, setInsightTime] = useState('');

    // State Dinamis (Dikosongkan dari nilai default agar tidak render palsu)
    const [forecastData, setForecastData] = useState<any>(null);
    const [availableProducts, setAvailableProducts] = useState<string[]>(['Semua Kategori']);

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

    // Initial Fetch (Opsi Dropdown & History)
    useEffect(() => {
        if (!retailerId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        fetch(`/api/store/forecast?retailerId=${retailerId}`)
            .then(res => res.json())
            .then(data => {
                if (data.availableProducts) {
                    setAvailableProducts(data.availableProducts);
                }
                if (data.history) {
                    setBroadcastHistory(data.history);
                }
            })
            .finally(() => setIsLoading(false));
    }, [retailerId]);

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

    const handleBroadcastAlert = async () => {
        if (!retailerId) return;
        setIsBroadcasting(true);

        try {
            // Simulasi quantity (Hanya jalan saat data asli AI sudah turun)
            const qtyMatch = forecastData?.insightText?.match(/sebanyak (\d+)/);
            const qty = qtyMatch ? parseInt(qtyMatch[1]) : 150;

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
                    target: 'Manajer Kota / Cabang',
                    insight: `Pengajuan kuota tambahan ${filterProduct} sebanyak ${qty} Pcs.`
                };

                setBroadcastHistory(prev => [newLog, ...prev]);
                showToast("Permohonan Terkirim!", `Permintaan stok telah dikirim ke Manajer Kota via Inbox.`, true);
                setIsHistoryOpen(true);
            }
        } catch (error) {
            showToast("Gagal Terkirim", "Terjadi kesalahan jaringan.", false);
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
        legend: { type: 'scroll', data: ['Sisa Stok Kasir', 'Skenario Optimis', 'Prediksi Kebutuhan', 'Skenario Pesimis'], bottom: 0, icon: 'circle', textStyle: { color: '#475569', fontSize: 11, fontWeight: '600' }, itemGap: 15 },
        grid: { left: '4%', right: '6%', bottom: '25%', top: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: forecastData?.chartData?.dates || ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ming'], axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#64748B', fontWeight: '500', margin: 12 } },
        yAxis: { type: 'value', axisLabel: { formatter: '{value}', color: '#64748B', fontWeight: '600' }, splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } } },
        series: [
            { name: 'Sisa Stok Kasir', type: 'line', smooth: true, symbolSize: 8, itemStyle: { color: '#6A7BFA', borderWidth: 2, borderColor: '#fff' }, lineStyle: { width: 4, color: '#6A7BFA' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(106, 123, 250, 0.2)' }, { offset: 1, color: 'rgba(106, 123, 250, 0)' }] } }, data: forecastData?.chartData?.actual || [] },
            { name: 'Skenario Optimis', type: 'line', smooth: true, symbolSize: 6, itemStyle: { color: '#10B981', borderWidth: 2, borderColor: '#fff' }, lineStyle: { width: 2, type: 'dashed', color: '#10B981' }, data: forecastData?.chartData?.optimis || [] },
            {
                name: 'Prediksi Kebutuhan', type: 'line', smooth: true, symbolSize: 8, itemStyle: { color: '#F59E0B', borderWidth: 2, borderColor: '#fff' }, lineStyle: { width: 3, type: 'dashed', color: '#F59E0B' }, data: forecastData?.chartData?.prediksi || [],
                markLine: { symbol: 'none', label: { formatter: 'Akhir Pekan', position: 'end', color: '#64748B', fontSize: 10, fontWeight: '600', padding: [0, 0, 5, 0] }, lineStyle: { color: '#CBD5E1', type: 'dashed', width: 1.5 }, data: [{ xAxis: 'Jum' }] }
            },
            { name: 'Skenario Pesimis', type: 'line', smooth: true, symbolSize: 6, itemStyle: { color: '#EF4444', borderWidth: 2, borderColor: '#fff' }, lineStyle: { width: 2, type: 'dashed', color: '#EF4444' }, data: forecastData?.chartData?.pesimis || [] }
        ]
    };

    if (isLoading) return <div className="w-full h-full flex flex-col items-center justify-center text-[#6A7BFA] gap-3 min-h-[60vh]"><Loader2 size={32} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm">Menyiapkan Koneksi API...</span></div>;

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
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">AI Prediksi Kebutuhan Toko</h2>
                        {/* BADGE OFFLINE */}
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-600 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm">
                            <ServerOff size={12} /> FastAPI Offline
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><Info size={16} className="text-[#6A7BFA]" /> Komparasi AI dengan data stok kasir (POS) aktual.</p>
                </div>
            </div>

            <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both relative z-20">
                <div className="flex flex-col xl:flex-row xl:items-end gap-6">
                    <div ref={filterRef} className="flex-1 max-w-md">
                        <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'product' ? 'z-50' : 'z-10'}`}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Filter Kategori Produk</label>
                            <button onClick={() => setOpenDropdown(openDropdown === 'product' ? null : 'product')} className={`flex items-center justify-between bg-white border ${openDropdown === 'product' ? 'border-[#6A7BFA] ring-4 ring-[#6A7BFA]/10 shadow-sm' : 'border-slate-200 hover:border-[#6A7BFA]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-4 py-3.5 text-sm font-bold text-slate-700 transition-all duration-300 group`}>
                                <div className="flex items-center gap-2 truncate"><PackageSearch size={16} className="text-[#6A7BFA] group-hover:scale-110 transition-transform" /><span className="truncate group-hover:text-[#6A7BFA]">{filterProduct}</span></div>
                                <ChevronDown size={16} className={`text-slate-400 group-hover:text-[#6A7BFA] transition-transform ${openDropdown === 'product' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'product' && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-60 overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                    {availableProducts.map((item) => (
                                        <button key={item} onClick={() => { setFilterProduct(item); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterProduct === item ? 'bg-[#EDF2FE] text-[#6A7BFA]' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#6A7BFA]'}`}>
                                            {item} {filterProduct === item && <CheckCircle2 size={16} className="text-[#6A7BFA]" />}
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
                            disabled={!isFastApiConnected || isPredicting}
                            className={`w-full xl:w-auto px-8 py-3.5 rounded-[20px] font-bold text-sm transition-all flex items-center justify-center gap-2 ${isFastApiConnected ? 'bg-[#6A7BFA] hover:bg-[#5869E8] text-white shadow-[0_8px_20px_rgba(106,123,250,0.3)] active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
                        >
                            {isPredicting ? <><Loader2 size={18} className="animate-spin" /> Sinkronisasi API...</> : <><Sparkles size={18} /> Komparasi AI & Kasir</>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out delay-200 fill-mode-both z-10 min-h-[400px]">

                {/* PERBAIKAN: STATE SAAT FAST API BELUM TERHUBUNG */}
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

                {/* --- SISA KODE DI BAWAH INI AKAN MUNCUL SAAT FASTAPI SUDAH JALAN --- */}
                <div className={`transition-opacity duration-500 ${forecastData && !isPredicting ? 'opacity-100' : 'opacity-0 hidden'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                        <div className="flex items-center gap-2 bg-[#EDF2FE] px-4 py-2 rounded-full text-[#6A7BFA] text-xs font-bold border border-[#6A7BFA]/20 w-fit">
                            <BrainCircuit size={16} /> Random Forest Regressor
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full text-emerald-600 text-xs font-bold border border-emerald-100 w-fit shadow-sm">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            Live POS API Connected
                        </div>
                    </div>

                    <div className="w-full h-[350px]">
                        {forecastData && <ReactECharts option={forecastOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />}
                    </div>

                    {forecastData && (
                        <div className="mt-8 p-6 lg:p-8 border bg-[#F8FAFC] border-slate-200 rounded-[32px] shadow-inner relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-100/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 relative z-10 border-b border-slate-200 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-sm border border-amber-200"><Lightbulb size={24} className="fill-amber-500/20" /></div>
                                    <div>
                                        <h4 className="font-bold text-xl text-slate-900 flex items-center gap-2">Saran Tindakan <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] uppercase tracking-widest rounded-md animate-pulse shadow-sm">Urgent</span></h4>
                                        <p className="text-sm font-medium text-slate-500 mt-0.5">Kirim pengajuan restock ke Manajer Kota.</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm shrink-0">
                                    <Clock size={14} className="text-[#6A7BFA]" /> Real-time: {insightTime}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10 mb-6">
                                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-3">
                                    <div className="flex items-center gap-2 text-slate-800"><Info size={18} /><span className="font-bold text-xs uppercase tracking-widest">Kondisi Toko (API)</span></div>
                                    <p className="text-slate-700 text-sm font-medium leading-relaxed">{forecastData?.insightText}</p>
                                </div>
                                <div className="bg-red-50 p-5 rounded-[24px] border border-red-100 shadow-sm flex flex-col gap-3">
                                    <div className="flex items-center gap-2 text-red-600"><TrendingDown size={18} /><span className="font-bold text-xs uppercase tracking-widest">Risiko Kehabisan Barang</span></div>
                                    <p className="text-red-900/80 text-sm font-medium leading-relaxed">Tanpa tambahan stok dari pusat, target <strong className="text-red-700">Penjualan Akhir Pekan</strong> toko Anda berisiko gagal tercapai karena Display Kosong.</p>
                                </div>
                            </div>

                            <div className="flex justify-end relative z-10 border-t border-slate-200 pt-5">
                                <button onClick={handleBroadcastAlert} disabled={isBroadcasting} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-[20px] font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-70">
                                    {isBroadcasting ? <><Loader2 size={18} className="animate-spin" /> Mengirim Permohonan...</> : <><Send size={18} /> Ajukan Restock ke Manajer Kota</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="flex items-center justify-between w-full group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl group-hover:bg-[#EDF2FE] group-hover:text-[#6A7BFA] transition-colors"><History size={24} /></div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-slate-900">Riwayat Pengajuan Restock</h3>
                            <p className="text-sm text-slate-500 mt-0.5">Catatan permintaan barang yang telah dikirim ke Manajer Kota.</p>
                        </div>
                    </div>
                    <div className="p-2 text-slate-400 group-hover:text-[#6A7BFA] transition-colors">{isHistoryOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}</div>
                </button>

                {isHistoryOpen && (
                    <div className="mt-8 border-t border-slate-100 pt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                        <div className="max-h-[380px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                            {broadcastHistory.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">Belum ada riwayat pengajuan.</p>
                            ) : broadcastHistory.map((item, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-5 bg-white border border-slate-200 rounded-[24px]">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{item.id}</span>
                                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Clock size={12} /> {item.date}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 mb-1">Penerima: <span className="text-[#6A7BFA]">{item.target}</span></p>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-3xl truncate">{item.insight}</p>
                                    </div>
                                    <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-5">
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full"><CheckCircle2 size={14} /> Sukses Terkirim</span>
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