"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ReactECharts from 'echarts-for-react';
import { Wallet, TrendingUp, Loader2, ArrowRight, Target, Percent, Award, BarChart3, Package, Clock, Truck, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function StoreDashboard() {
    const { data: session } = useSession();
    const user = session?.user as any;

    const retailerId = user?.retailerId || '';
    const storeName = user?.name ? `Cabang ${user.name}` : 'Ramayana Plaza Medan';

    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);

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
            .then(data => {
                setDashboardData(data);
            })
            .catch(err => console.error("Store Dashboard Fetch Error:", err))
            .finally(() => setIsLoading(false));
    }, [retailerId]);

    const formatRupiah = (value: number) => {
        if (value >= 1_000_000_000) return { val: (value / 1_000_000_000).toFixed(2), unit: 'Miliar' };
        if (value >= 1_000_000) return { val: (value / 1_000_000).toFixed(2), unit: 'Juta' };
        return { val: value.toLocaleString('id-ID'), unit: '' };
    };

    const defaultData = {
        kpi: { revenue: 0, targetPct: 0, marginPct: 0 },
        chartData: { categories: [], revenue: [], profit: [] },
        topCategories: [],
        logisticStatus: null
    };

    const dataToDisplay = dashboardData || defaultData;
    const revFormat = formatRupiah(dataToDisplay.kpi.revenue);
    const logistik = dataToDisplay.logisticStatus; // Ambil status logistik

    // Logika Dinamis Status Logistik
    const isPending = logistik?.status === 'PENDING_CITY';
    const isApprovedCityOrState = logistik?.status === 'APPROVED_CITY' || logistik?.status === 'APPROVED_STATE';
    const isApprovedCenter = logistik?.status === 'APPROVED_CENTER';
    const isRejected = logistik?.status === 'REJECTED';

    const storeBarOption = {
        tooltip: {
            trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14], extraCssText: 'border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);',
            formatter: function (params: any) {
                let tooltipHtml = `<div style="font-weight:bold; color:#0F172A; margin-bottom:8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">${params[0].name}</div>`;
                params.forEach((param: any) => {
                    const formatVal = param.value >= 1_000_000_000 ? `${(param.value / 1_000_000_000).toFixed(2)} M` : `${(param.value / 1_000_000).toFixed(2)} Jt`;
                    tooltipHtml += `<div style="display:flex; justify-content:space-between; align-items:center; gap:24px; margin-bottom: 4px;"><div style="display:flex; align-items:center; gap:6px;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${param.color.colorStops ? param.color.colorStops[0].color : param.color};"></span><span style="color:#64748B; font-size:12px; font-weight:500;">${param.seriesName}</span></div><span style="color:#0F172A; font-weight:bold; font-size:13px;">Rp ${formatVal}</span></div>`;
                });
                return tooltipHtml;
            }
        },
        legend: { bottom: 0, icon: 'circle', textStyle: { color: '#475569', fontWeight: '600' } },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: dataToDisplay.chartData.categories, axisLabel: { color: '#64748B', fontWeight: '600', fontSize: 10, interval: 0, rotate: 15 } },
        yAxis: {
            type: 'value',
            axisLabel: { formatter: function (value: number) { return value >= 1_000_000_000 ? `Rp ${value / 1_000_000_000}M` : `Rp ${value / 1_000_000}Jt`; }, color: '#64748B' },
            splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } }
        },
        series: [
            { name: 'Omzet', type: 'bar', barWidth: '20%', itemStyle: { color: '#E2E8F0', borderRadius: [4, 4, 0, 0] }, data: dataToDisplay.chartData.revenue },
            { name: 'Profit Bersih', type: 'bar', barWidth: '20%', itemStyle: { color: '#4f46e5', borderRadius: [4, 4, 0, 0] }, data: dataToDisplay.chartData.profit }
        ]
    };

    if (isLoading) return <div className="w-full h-full flex flex-col items-center justify-center text-[#6A7BFA] gap-3 min-h-[60vh]"><Loader2 size={32} className="animate-spin" /><span className="font-bold uppercase tracking-widest text-sm">Menyiapkan Analitik Toko...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8">
            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] rounded-[40px] p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-700 group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-transform duration-1000" />
                <div className="relative z-10 max-w-3xl text-white">
                    <h2 className="text-[32px] lg:text-[40px] font-bold mb-4 tracking-tight leading-tight">Ringkasan Performa Analitik.<br />{storeName}.</h2>
                    <p className="text-white/90 text-sm lg:text-base leading-relaxed mb-8">Pantau rekap transaksi kasir, pencapaian target profit, dan status persetujuan restock logistik toko secara komprehensif hari ini.</p>
                    <Link href="/dashboard/store/sales">
                        <button className="bg-white text-[#4f46e5] hover:bg-[#EDF2FE] hover:shadow-xl hover:-translate-y-1 font-bold py-3.5 px-8 rounded-[40px] transition-all active:scale-95 text-sm flex items-center gap-2 group/btn">Detail Penjualan <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" /></button>
                    </Link>
                </div>
                <div className="hidden lg:block w-[320px] h-[260px] relative z-10 mr-4 animate-float">
                    <img src="/ilustrasi-retailer-NoBg-Fix.png" alt="Illustration" className="w-full h-full object-contain drop-shadow-2xl scale-125 transition-transform duration-1000 ease-out" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] transition-all duration-300 group cursor-default">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><Wallet size={24} /></div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1"><TrendingUp size={12} /> Live</span>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Total Omzet (Bulan Ini)</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Rp {revFormat.val} <span className="text-xl lg:text-2xl text-slate-400 font-medium">{revFormat.unit}</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] transition-all duration-300 group cursor-default">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><Target size={24} /></div>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">Sedang Berjalan</span>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Pencapaian Target Cabang</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">{dataToDisplay.kpi.targetPct.toFixed(1)}<span className="text-xl lg:text-2xl text-slate-400 font-medium">%</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] transition-all duration-300 group cursor-default">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><Percent size={24} /></div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">Sangat Sehat</span>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Net Profit Margin</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">{dataToDisplay.kpi.marginPct.toFixed(1)}<span className="text-xl lg:text-2xl text-slate-400 font-medium">%</span></h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-[#EDF2FE] text-[#4f46e5] rounded-xl"><BarChart3 size={20} /></div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Performa Profitabilitas Kategori</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Komparasi nilai Omzet vs Profit Bersih.</p>
                        </div>
                    </div>
                    <div className="w-full h-[350px]">
                        {dataToDisplay.chartData.categories.length > 0 ? (
                            <ReactECharts option={storeBarOption} style={{ height: '100%' }} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 border-2 border-dashed border-slate-100 rounded-2xl"><AlertTriangle className="opacity-50" size={32} /> <span className="font-bold text-sm">Belum ada transaksi</span></div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* WIDGET STATUS LOGISTIK DINAMIS */}
                    <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col group relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Package size={18} /></div>
                            <div>
                                <h3 className="font-bold text-slate-900">Status Logistik</h3>
                                <p className="text-[10px] text-slate-500 line-clamp-1">Pengajuan: {logistik ? logistik.productCategory : 'Tidak ada'}</p>
                            </div>
                        </div>

                        {!logistik ? (
                            <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400">Belum ada pengajuan restock</p>
                            </div>
                        ) : isRejected ? (
                            <div className="flex gap-3 bg-red-50 p-4 rounded-2xl border border-red-100 items-center">
                                <XCircle className="text-red-500 shrink-0" size={24} />
                                <div>
                                    <p className="text-xs font-bold text-red-700">Ditolak oleh Pusat</p>
                                    <p className="text-[11px] text-red-600 mt-1">Pengajuan {logistik.qtyRequested} Pcs tidak disetujui.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 border-l-2 border-slate-100 ml-3 pl-4 relative">
                                {/* STEP 1: PENDING / APPROVED */}
                                <div className={`relative ${isPending ? 'opacity-100' : 'opacity-100'}`}>
                                    <span className={`absolute -left-[23px] top-0.5 w-3 h-3 rounded-full ring-4 ring-white ${isPending ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                                    <p className={`text-xs font-bold flex items-center gap-1.5 ${isPending ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {isPending ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                                        {isPending ? 'Menunggu Review Kota' : 'Disetujui'}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">Pengajuan {logistik.qtyRequested} Pcs {isPending ? 'sedang ditinjau' : 'telah disetujui'}.</p>
                                </div>
                                {/* STEP 2: DALAM PERJALANAN */}
                                <div className={`relative ${isApprovedCityOrState ? 'opacity-100' : (isApprovedCenter ? 'opacity-100' : 'opacity-40')}`}>
                                    <span className={`absolute -left-[23px] top-0.5 w-3 h-3 rounded-full ring-4 ring-white ${isApprovedCityOrState ? 'bg-[#4f46e5] animate-pulse' : (isApprovedCenter ? 'bg-emerald-500' : 'bg-slate-300')}`}></span>
                                    <p className={`text-xs font-bold flex items-center gap-1.5 ${isApprovedCityOrState ? 'text-[#4f46e5]' : (isApprovedCenter ? 'text-emerald-600' : 'text-slate-500')}`}>
                                        {isApprovedCenter ? <CheckCircle2 size={14} /> : <Truck size={14} />}
                                        Dalam Perjalanan
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">Truk logistik provinsi {isApprovedCenter ? 'telah tiba' : 'sedang menuju cabang'}.</p>
                                </div>
                                {/* STEP 3: SELESAI */}
                                <div className={`relative ${isApprovedCenter ? 'opacity-100' : 'opacity-40'}`}>
                                    <span className={`absolute -left-[23px] top-0.5 w-3 h-3 rounded-full ring-4 ring-white ${isApprovedCenter ? 'bg-[#4f46e5] animate-pulse' : 'bg-slate-300'}`}></span>
                                    <p className={`text-xs font-bold flex items-center gap-1.5 ${isApprovedCenter ? 'text-[#4f46e5]' : 'text-slate-500'}`}>
                                        <Package size={14} /> Persiapan Display
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">Menunggu penerimaan di area loading dock.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* LEADERBOARD */}
                    <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col group relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#EDF2FE] text-[#4f46e5] rounded-xl"><Award size={18} /></div>
                            <h3 className="font-bold text-slate-900">Top Kategori</h3>
                        </div>
                        <div className="space-y-4">
                            {dataToDisplay.topCategories.length > 0 ? dataToDisplay.topCategories.slice(0, 3).map((cat: any, i: number) => (
                                <div key={i} className="group/item cursor-default">
                                    <div className="flex justify-between items-center text-xs mb-1.5">
                                        <span className="font-bold text-slate-700 truncate pr-2 group-hover/item:text-[#4f46e5] transition-colors">{i + 1}. {cat.name}</span>
                                        <span className="font-bold text-slate-900 shrink-0">{cat.revenue}</span>
                                    </div>
                                    <div className="w-full bg-[#EDF2FE] rounded-full h-1.5 overflow-hidden">
                                        <div className={`${cat.color} h-full rounded-full transition-all duration-1000 opacity-85 group-hover/item:opacity-100`} style={{ width: cat.pct }}></div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-slate-400 text-center font-medium border-2 border-dashed border-slate-100 p-3 rounded-xl">Belum ada data penjualan</p>
                            )}
                            <div className="pt-2 text-center">
                                <Link href="/dashboard/store/sales">
                                    <p className="text-[10px] text-slate-400 font-bold hover:text-[#4f46e5] cursor-pointer transition-colors inline-flex items-center gap-1">Lihat Semua Kategori <ArrowRight size={10} /></p>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } } .animate-float { animation: float 6s ease-in-out infinite; }` }} />
        </div>
    );
}