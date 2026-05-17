"use client";
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Wallet, TrendingUp, Loader2, ArrowRight, Target, Percent, Award, BarChart3, Package, Clock, Truck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function StoreDashboard() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    // DATASET-BASED CHART: Revenue vs Profit by Category
    const storeBarOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14], extraCssText: 'border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);' },
        legend: { bottom: 0, icon: 'circle', textStyle: { color: '#475569', fontWeight: '600' } },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: ["Men's Street", "Men's Ath.", "Women's Street", "Women's Ath.", "Men's Apparel"], axisLabel: { color: '#64748B', fontWeight: '600', fontSize: 10 } },
        yAxis: { type: 'value', axisLabel: { formatter: 'Rp {value}Jt', color: '#64748B' }, splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } } },
        series: [
            { name: 'Omzet', type: 'bar', barWidth: '20%', itemStyle: { color: '#E2E8F0', borderRadius: [4, 4, 0, 0] }, data: [101, 84, 67, 64, 91] },
            // UPDATE: Warna profit bersinergi dengan tema Premium
            { name: 'Profit Bersih', type: 'bar', barWidth: '20%', itemStyle: { color: '#4f46e5', borderRadius: [4, 4, 0, 0] }, data: [50, 25, 23, 22, 27] }
        ]
    };

    const topCategories = [
        { name: "Men's Street Footwear", unit: 1200, revenue: "Rp 1.011 Juta", color: "bg-[#312E81]", pct: "100%" },
        { name: "Men's Apparel", unit: 900, revenue: "Rp 910 Juta", color: "bg-[#4338CA]", pct: "85%" },
        { name: "Men's Athletic Footwear", unit: 1000, revenue: "Rp 842 Juta", color: "bg-[#4f46e5]", pct: "80%" }, // Update color
        { name: "Women's Apparel", unit: 1000, revenue: "Rp 842 Juta", color: "bg-[#6A7BFA]", pct: "80%" },
        { name: "Women's Street Footwear", unit: 1000, revenue: "Rp 674 Juta", color: "bg-[#818CF8]", pct: "65%" },
    ];

    if (isLoading) return <div className="w-full h-full flex items-center justify-center text-[#6A7BFA] gap-3"><Loader2 size={24} className="animate-spin" /><span className="font-bold uppercase tracking-widest text-sm">Menyiapkan Analitik Toko...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8">

            {/* HERO BANNER UPDATE: Premium Gradient */}
            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] rounded-[40px] p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-700 group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-transform duration-1000" />
                <div className="relative z-10 max-w-3xl text-white">
                    <h2 className="text-[32px] lg:text-[40px] font-bold mb-4 tracking-tight leading-tight">
                        Ringkasan Performa Analitik Cabang.<br />Ramayana Plaza Medan.
                    </h2>
                    <p className="text-white/90 text-sm lg:text-base leading-relaxed mb-8">Pantau rekap transaksi kasir, pencapaian target profit, dan status persetujuan restock logistik toko secara komprehensif hari ini.</p>
                    <Link href="/dashboard/store/sales">
                        <button className="bg-white text-[#4f46e5] hover:bg-[#EDF2FE] hover:shadow-xl hover:-translate-y-1 font-bold py-3.5 px-8 rounded-[40px] transition-all active:scale-95 text-sm flex items-center gap-2 group/btn">Detail Penjualan <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" /></button>
                    </Link>
                </div>
                <div className="hidden lg:block w-[320px] h-[260px] relative z-10 mr-4 animate-float">
                    <img src="/ilustrasi-retailer-NoBg-Fix.png" alt="Illustration" className="w-full h-full object-contain drop-shadow-2xl scale-125 transition-transform duration-1000 ease-out" />
                </div>
            </div>

            {/* KARTU KPI CABANG */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] group cursor-default">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><Wallet size={24} /></div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1"><TrendingUp size={12} /> +5.2%</span>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Total Omzet (Bulan Ini)</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Rp 4,92 <span className="text-xl lg:text-2xl text-slate-400 font-medium">Miliar</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] group cursor-default">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><Target size={24} /></div>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">Sedang Berjalan</span>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Pencapaian Target Cabang</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">82.4<span className="text-xl lg:text-2xl text-slate-400 font-medium">%</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] group cursor-default">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><Percent size={24} /></div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">Sangat Sehat</span>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Net Profit Margin</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">38.4<span className="text-xl lg:text-2xl text-slate-400 font-medium">%</span></h3>
                    </div>
                </div>
            </div>

            {/* ANALISIS DETAIL TOKO & STATUS LOGISTIK */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* GRAFIK OMZET VS PROFIT (Makan 2 Kolom) */}
                <div className="lg:col-span-2 bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-[#EDF2FE] text-[#4f46e5] rounded-xl"><BarChart3 size={20} /></div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Performa Profitabilitas Kategori</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Komparasi nilai Omzet vs Profit Bersih.</p>
                        </div>
                    </div>
                    <div className="w-full h-[350px]"><ReactECharts option={storeBarOption} style={{ height: '100%' }} /></div>
                </div>

                {/* KOLOM KANAN: STATUS LOGISTIK & LEADERBOARD */}
                <div className="space-y-6">
                    {/* WIDGET BARU: FEEDBACK LOOP / STATUS PENGAJUAN */}
                    <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col group relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Package size={18} /></div>
                            <div>
                                <h3 className="font-bold text-slate-900">Status Logistik</h3>
                                <p className="text-[10px] text-slate-500">Respon dari Manajer Kota</p>
                            </div>
                        </div>

                        <div className="space-y-4 border-l-2 border-slate-100 ml-3 pl-4 relative">
                            {/* Titik Timeline 1: Diterima */}
                            <div className="relative">
                                <span className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white"></span>
                                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 size={14} /> Disetujui Kota</p>
                                <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">Pengajuan restock Men's Street disetujui (Ref: REQ-089).</p>
                            </div>
                            {/* Titik Timeline 2: Diperjalanan */}
                            <div className="relative">
                                <span className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-[#4f46e5] ring-4 ring-white"></span>
                                <p className="text-xs font-bold text-[#4f46e5] flex items-center gap-1.5"><Truck size={14} /> Dalam Perjalanan</p>
                                <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">Truk logistik provinsi sedang menuju Ramayana Plaza.</p>
                            </div>
                            {/* Titik Timeline 3: Pending Eksekusi Lapangan */}
                            <div className="relative opacity-60">
                                <span className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-slate-300 ring-4 ring-white"></span>
                                <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Clock size={14} /> Persiapan Display</p>
                                <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">Menunggu penerimaan di area loading dock (ETA: Besok 09:00).</p>
                            </div>
                        </div>
                    </div>

                    {/* LEADERBOARD KATEGORI TOKO */}
                    <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col group relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#EDF2FE] text-[#4f46e5] rounded-xl"><Award size={18} /></div>
                            <h3 className="font-bold text-slate-900">Top Kategori</h3>
                        </div>
                        <div className="space-y-4">
                            {topCategories.slice(0, 3).map((cat, i) => (
                                <div key={i} className="group/item cursor-default">
                                    <div className="flex justify-between items-center text-xs mb-1.5">
                                        <span className="font-bold text-slate-700 truncate pr-2 group-hover/item:text-[#4f46e5] transition-colors">{i + 1}. {cat.name}</span>
                                        <span className="font-bold text-slate-900 shrink-0">{cat.revenue}</span>
                                    </div>
                                    <div className="w-full bg-[#EDF2FE] rounded-full h-1.5 overflow-hidden">
                                        <div className={`${cat.color} h-full rounded-full transition-all duration-1000 opacity-85 group-hover/item:opacity-100`} style={{ width: cat.pct }}></div>
                                    </div>
                                </div>
                            ))}
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