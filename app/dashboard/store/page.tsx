"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ReactECharts from 'echarts-for-react';
import { Wallet, TrendingUp, Loader2, ArrowRight, Target, Percent, Award, BarChart3, Package, Clock, Truck, CheckCircle2, AlertTriangle, XCircle, ServerCrash, BrainCircuit, Store, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function StoreDashboard() {
    const { data: session } = useSession();
    const user = session?.user as any;
    const retailerId = user?.retailerId || '';

    // --- HELPER: MENDAPATKAN NAMA BRAND DARI ID ---
    const getRetailerBrand = (id: string) => {
        if (!id) return "Mitra Toko";
        const brands: Record<string, string> = {
            '1000001': 'RAMAYANA',
            '1000002': 'ADIDAS OFFICIAL STORE',
            '1000003': 'SPORTS STATION',
            '1000004': 'PLANET SPORTS',
            '1000005': 'TRANSMART',
            '1000006': 'MATAHARI'
        };
        return brands[id] || `Brand (${id})`;
    };

    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [fastApiStatus, setFastApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    const [storeProfile, setStoreProfile] = useState({ name: 'Memuat Toko...', location: 'Memuat Lokasi...' });

    useEffect(() => {
        if (user?.email) {
            fetch(`/api/user/profile?email=${user.email}`)
                .then(res => res.json())
                .then(data => {
                    setStoreProfile({
                        // Gunakan nama dari API, jika gagal gunakan fungsi helper
                        name: data?.retailer?.name || getRetailerBrand(user?.retailerId),
                        // Hapus kota, hanya tampilkan Provinsi
                        location: data?.assignedState ? `Provinsi ${data.assignedState}` : 'Wilayah Belum Diatur'
                    });
                })
                .catch(err => console.error("Fetch profile error:", err));
        }
    }, [user?.email, user?.retailerId]);

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

    useEffect(() => {
        if (!retailerId) {
            const timer = setTimeout(() => setIsLoading(false), 800);
            return () => clearTimeout(timer);
        }

        setIsLoading(true);
        fetch(`/api/store/dashboard?retailerId=${retailerId}`)
            .then(res => {
                if (!res.ok) throw new Error("Gagal mengambil data toko");
                return res.json();
            })
            .then(data => setDashboardData(data))
            .catch(err => console.error("Store Dashboard Fetch Error:", err))
            .finally(() => setIsLoading(false));
    }, [retailerId]);

    // Format ini HANYA dipakai untuk total omzet (karena format dari backend berbentuk angka murni)
    const formatRupiah = (value: number) => {
        const num = Number(value) || 0;
        if (num >= 1_000_000_000_000) return { val: (num / 1_000_000_000_000).toFixed(2), unit: 'Triliun' };
        if (num >= 1_000_000_000) return { val: (num / 1_000_000_000).toFixed(2), unit: 'Miliar' };
        if (num >= 1_000_000) return { val: (num / 1_000_000).toFixed(2), unit: 'Juta' };
        return { val: num.toLocaleString('id-ID'), unit: '' };
    };

    const dataToDisplay = dashboardData;
    const logistik = dataToDisplay?.logisticStatus;

    // Menyesuaikan status logistik dengan skema baru yang tidak pakai "CITY"
    const isPending = logistik?.status === 'PENDING_REGION';
    const isApprovedCenter = logistik?.status === 'APPROVED_CENTER';
    const isRejected = logistik?.status === 'REJECTED_REGION' || logistik?.status === 'REJECTED_CENTER';
    const isWaitingCenter = logistik?.status === 'PENDING_CENTER';

    const storeBarOption = {
        tooltip: {
            trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDF2FE', padding: [10, 14], extraCssText: 'border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);',
            formatter: function (params: any) {
                let tooltipHtml = `<div style="font-weight:bold; color:#0F172A; margin-bottom:8px; border-bottom: 1px solid #EDF2FE; padding-bottom: 4px;">${params[0].name}</div>`;
                params.forEach((param: any) => {
                    const formatVal = param.value >= 1_000_000_000_000 ? `${(param.value / 1_000_000_000_000).toFixed(2)} T`
                        : param.value >= 1_000_000_000 ? `${(param.value / 1_000_000_000).toFixed(2)} M`
                            : `${(param.value / 1_000_000).toFixed(2)} Jt`;
                    tooltipHtml += `<div style="display:flex; justify-content:space-between; align-items:center; gap:24px; margin-bottom: 4px;"><div style="display:flex; align-items:center; gap:6px;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${param.color.colorStops ? param.color.colorStops[0].color : param.color};"></span><span style="color:#64748B; font-size:12px; font-weight:500;">${param.seriesName}</span></div><span style="color:#0F172A; font-weight:bold; font-size:13px;">Rp ${formatVal}</span></div>`;
                });
                return tooltipHtml;
            }
        },
        legend: { bottom: 0, icon: 'circle', textStyle: { color: '#475569', fontWeight: '600' } },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: dataToDisplay?.chartData?.categories || [], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#64748B', fontWeight: '600', fontSize: 10, interval: 0, rotate: 15 } },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: function (value: number) {
                    if (value >= 1_000_000_000_000) return `Rp ${value / 1_000_000_000_000}T`;
                    if (value >= 1_000_000_000) return `Rp ${value / 1_000_000_000}M`;
                    return `Rp ${value / 1_000_000}Jt`;
                },
                color: '#94A3B8', fontWeight: '500'
            },
            splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } }
        },
        series: [
            { name: 'Omzet', type: 'bar', barWidth: '25%', itemStyle: { color: '#C7D2FE', borderRadius: [6, 6, 0, 0] }, data: dataToDisplay?.chartData?.revenue || [] },
            { name: 'Profit Bersih', type: 'bar', barWidth: '25%', itemStyle: { color: '#4f46e5', borderRadius: [6, 6, 0, 0] }, data: dataToDisplay?.chartData?.profit || [] }
        ]
    };

    if (isLoading) return <div className="w-full h-full flex flex-col items-center justify-center text-[#4f46e5] gap-4 min-h-[70vh]"><Loader2 size={36} className="animate-spin" /><span className="font-bold uppercase tracking-widest text-sm text-slate-500">Menyinkronkan Server...</span></div>;

    const hasData = dataToDisplay && dataToDisplay.kpi && dataToDisplay.kpi.revenue > 0;
    const revFormat = formatRupiah(hasData ? dataToDisplay.kpi.revenue : 0);

    return (
        <div className="pb-12 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] rounded-[40px] p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
                <div className="relative z-10 max-w-3xl text-white">
                    <h2 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight leading-[1.1]">
                        Ringkasan Performa.<br />
                        <span className="text-[#E0E7FF]">{storeProfile.name}.</span>
                    </h2>

                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        <span className="bg-indigo-500/30 text-indigo-100 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-400/30 flex items-center gap-1.5 shadow-sm">
                            <MapPin size={12} /> {storeProfile.location}
                        </span>
                        <span className="bg-white/10 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/20 flex items-center gap-1.5 shadow-sm">
                            <Store size={12} /> Admin Retailer
                        </span>
                    </div>

                    <p className="text-indigo-50/90 text-sm lg:text-base leading-relaxed mb-8 max-w-xl font-medium">
                        Pantau rekap transaksi kasir, pencapaian target profit, dan status persetujuan restock logistik toko secara komprehensif.
                    </p>
                    <Link href="/dashboard/store/sales">
                        <button className="bg-white text-[#4f46e5] hover:bg-[#EDF2FE] hover:shadow-xl hover:-translate-y-1 font-bold py-3.5 px-8 rounded-full transition-all active:scale-95 text-sm flex items-center gap-2 group/btn shadow-md">
                            Detail Penjualan <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
                <div className="hidden lg:block w-[340px] h-[280px] relative z-10 mr-4 animate-float opacity-90 group-hover:opacity-100 transition-opacity">
                    <img src="/ilustrasi-retailer-NoBg-Fix.png" alt="Illustration" className="w-full h-full object-contain drop-shadow-2xl scale-110" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(79,70,229,0.1)] hover:-translate-y-1 group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all shadow-sm"><Wallet size={24} /></div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1 shadow-sm"><TrendingUp size={12} /> Live</span>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-hover:text-[#4f46e5] transition-colors">Total Omzet</p>
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">Rp {revFormat.val} <span className="text-lg lg:text-xl text-slate-400 font-semibold">{revFormat.unit}</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(79,70,229,0.1)] hover:-translate-y-1 group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all shadow-sm"><Target size={24} /></div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 shadow-sm">Bulan Ini</span>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-hover:text-[#4f46e5] transition-colors">Target Tercapai</p>
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
                            {hasData ? dataToDisplay.kpi.targetPct.toFixed(1) : "0"}
                            <span className="text-lg lg:text-xl text-slate-400 font-semibold ml-1">%</span>
                        </h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(79,70,229,0.1)] hover:-translate-y-1 group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all shadow-sm"><Percent size={24} /></div>
                        {hasData && dataToDisplay.kpi.marginPct > 0 && <span className="text-[10px] font-bold text-[#4f46e5] bg-[#EDF2FE] px-3 py-1.5 rounded-full border border-[#C7D2FE] shadow-sm">Sehat</span>}
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-hover:text-[#4f46e5] transition-colors">Net Profit Margin</p>
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
                            {hasData ? dataToDisplay.kpi.marginPct.toFixed(1) : "0"}
                            <span className="text-lg lg:text-xl text-slate-400 font-semibold ml-1">%</span>
                        </h3>
                    </div>
                </div>

                <div className={`bg-white rounded-[32px] p-8 border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 group/card relative overflow-hidden ${fastApiStatus === 'online' ? 'hover:shadow-[0_10px_40px_-10px_rgba(106,123,250,0.2)] border-slate-100' : 'hover:shadow-[0_10px_40px_-10px_rgba(244,63,94,0.2)] border-red-100'}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        {fastApiStatus === 'offline' && <ServerCrash size={100} />}
                    </div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className={`p-3.5 rounded-2xl shadow-sm transition-colors ${fastApiStatus === 'checking' ? 'bg-slate-100 text-slate-400' : fastApiStatus === 'online' ? 'bg-[#EDF2FE] text-[#4f46e5] group-hover/card:bg-[#4f46e5] group-hover/card:text-white' : 'bg-red-50 text-red-500 group-hover/card:bg-red-500 group-hover/card:text-white'}`}>
                            {fastApiStatus === 'offline' ? <ServerCrash size={24} /> : <BrainCircuit size={24} />}
                        </div>
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border shadow-sm ${fastApiStatus === 'checking' ? 'bg-white border-slate-200 text-slate-500' : fastApiStatus === 'online' ? 'bg-[#EDF2FE] border-[#C7D2FE] text-[#4f46e5]' : 'bg-red-50 border-red-200 text-red-700 animate-pulse'}`}>
                            {fastApiStatus === 'checking' ? 'Memeriksa...' : fastApiStatus === 'online' ? <><span className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] animate-ping"></span> Terhubung</> : 'Terputus'}
                        </span>
                    </div>
                    <div className="relative z-10">
                        <p className={`text-[11px] lg:text-xs font-bold uppercase tracking-widest mb-2 transition-colors ${fastApiStatus === 'online' ? 'text-slate-400 group-hover/card:text-[#4f46e5]' : 'text-red-500'}`}>
                            Koneksi ML & AI
                        </p>
                        <h3 className={`text-3xl lg:text-4xl font-black tracking-tight ${fastApiStatus === 'checking' ? 'text-slate-300' : fastApiStatus === 'online' ? 'text-slate-800' : 'text-red-600'}`}>
                            {fastApiStatus === 'checking' ? '...' : fastApiStatus === 'online' ? 'Online' : 'Offline'}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

                <div className="lg:col-span-2 bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col group relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-[#EDF2FE] text-[#4f46e5] rounded-2xl"><BarChart3 size={20} /></div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Performa Profitabilitas Kategori</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Komparasi nilai Omzet vs Profit Bersih.</p>
                        </div>
                    </div>
                    <div className="w-full flex-1 min-h-[300px]">
                        {hasData && dataToDisplay.chartData.categories.length > 0 ? (
                            <ReactECharts option={storeBarOption} style={{ height: '100%' }} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                                <AlertTriangle className="opacity-50 text-[#4f46e5]" size={36} />
                                <span className="font-bold text-sm tracking-widest uppercase">Belum ada transaksi</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-amber-50 text-amber-500 rounded-2xl"><Package size={20} /></div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 tracking-tight">Status Logistik</h3>
                                <p className="text-[11px] text-slate-500 line-clamp-1 font-medium mt-0.5">Pengajuan: <span className="text-[#4f46e5] font-bold">{logistik ? logistik.productCategory : 'Tidak ada'}</span></p>
                            </div>
                        </div>

                        {!logistik ? (
                            <div className="flex flex-col items-center justify-center text-center py-8 bg-slate-50/50 rounded-[24px] border border-dashed border-slate-200">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm mb-3 text-slate-300">
                                    <Package size={20} />
                                </div>
                                <p className="text-sm font-bold text-slate-600">Belum Ada Pengajuan</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">Pusat logistik belum menerima tiket restock.</p>
                            </div>
                        ) : isRejected ? (
                            <div className="flex gap-4 bg-red-50 p-5 rounded-[24px] border border-red-100 items-start">
                                <div className="p-2 bg-red-100 rounded-full shrink-0 mt-1"><XCircle className="text-red-600" size={18} /></div>
                                <div>
                                    <p className="text-sm font-bold text-red-800">Ditolak oleh Pusat</p>
                                    <p className="text-xs text-red-600 mt-1.5 leading-relaxed font-medium">Pengajuan sejumlah <strong>{logistik.qtyRequested} Pcs</strong> untuk saat ini belum disetujui. Silakan cek memo dari pusat.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5 border-l-2 border-slate-100 ml-4 pl-5 relative py-2">
                                <div className={`relative ${isPending ? 'opacity-100' : 'opacity-100'}`}>
                                    <span className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white ${isPending ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                                    <p className={`text-sm font-bold flex items-center gap-2 ${isPending ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {isPending ? <Clock size={16} /> : <CheckCircle2 size={16} />} {isPending ? 'Menunggu Review Regional' : 'Disetujui Regional'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">Pengajuan {logistik.qtyRequested} Pcs {isPending ? 'sedang ditinjau' : 'telah disetujui'}.</p>
                                </div>
                                <div className={`relative ${isWaitingCenter ? 'opacity-100' : (isApprovedCenter ? 'opacity-100' : 'opacity-40')}`}>
                                    <span className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white ${isWaitingCenter ? 'bg-[#4f46e5] animate-pulse' : (isApprovedCenter ? 'bg-emerald-500' : 'bg-slate-200')}`}></span>
                                    <p className={`text-sm font-bold flex items-center gap-2 ${isWaitingCenter ? 'text-[#4f46e5]' : (isApprovedCenter ? 'text-emerald-600' : 'text-slate-500')}`}>
                                        {isApprovedCenter ? <CheckCircle2 size={16} /> : <Truck size={16} />} Sedang Diproses Pusat
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">Truk logistik {isApprovedCenter ? 'telah tiba di area cabang' : 'sedang dipersiapkan menuju cabang'}.</p>
                                </div>
                                <div className={`relative ${isApprovedCenter ? 'opacity-100' : 'opacity-40'}`}>
                                    <span className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white ${isApprovedCenter ? 'bg-[#4f46e5] animate-pulse' : 'bg-slate-200'}`}></span>
                                    <p className={`text-sm font-bold flex items-center gap-2 ${isApprovedCenter ? 'text-[#4f46e5]' : 'text-slate-500'}`}>
                                        <Package size={16} /> Siap Display
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">Menunggu serah terima barang di area loading dock.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-[#EDF2FE] text-[#4f46e5] rounded-2xl"><Award size={20} /></div>
                            <h3 className="font-bold text-lg text-slate-900 tracking-tight">Top Kategori</h3>
                        </div>
                        <div className="space-y-5 flex-1 flex flex-col justify-center">
                            {hasData && dataToDisplay.topCategories.length > 0 ? dataToDisplay.topCategories.slice(0, 3).map((cat: any, i: number) => {
                                // PERUBAHAN ADA DI SINI: Kita langsung merender string dari backend (cat.revenue)
                                // tanpa memasukkannya lagi ke dalam fungsi formatRupiah()
                                return (
                                    <div key={i} className="group/item cursor-default">
                                        <div className="flex justify-between items-center text-sm mb-2">
                                            <span className="font-bold text-slate-700 truncate pr-2 group-hover/item:text-[#4f46e5] transition-colors">{i + 1}. {cat.name}</span>
                                            <span className="font-black text-slate-900 shrink-0 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                {cat.revenue} {/* Langsung Tampilkan String dari API */}
                                            </span>
                                        </div>
                                        <div className="w-full bg-[#EDF2FE] rounded-full h-2 overflow-hidden shadow-inner">
                                            <div className={`${cat.color || 'bg-[#4f46e5]'} h-full rounded-full transition-all duration-1000 opacity-85 group-hover/item:opacity-100`} style={{ width: cat.pct || '0%' }}></div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center bg-slate-50 rounded-[20px] border border-dashed border-slate-200 py-6">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Belum ada transaksi</p>
                                </div>
                            )}
                        </div>
                        <div className="pt-4 mt-auto text-center border-t border-slate-50">
                            <Link href="/dashboard/store/sales">
                                <p className="text-[11px] text-slate-500 font-bold hover:text-[#4f46e5] cursor-pointer transition-colors inline-flex items-center gap-1.5 bg-slate-50 hover:bg-[#EDF2FE] px-5 py-2.5 rounded-full">Lihat Semua Kategori <ArrowRight size={14} /></p>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } } .animate-float { animation: float 6s ease-in-out infinite; }` }} />
        </div>
    );
}