"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { DollarSign, Percent, Users, TrendingUp, ShoppingBag, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PerformaKotaPage() {
    const { data: session } = useSession();
    const userCity = (session?.user as any)?.assignedCity || 'Medan'; // Fallback jika belum ada di session

    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<{
        summary: { revenue: number, margin: number, traffic: number },
        chartData: { categories: string[], targets: number[], realized: number[] },
        brief: { topStore: string, bottomStore: string, message: string }
    } | null>(null);

    useEffect(() => {
        if (!userCity) return;
        setIsLoading(true);

        // Fetch data dinamis dari API berdasarkan kota user yang login
        fetch(`/api/city/dashboard?city=${encodeURIComponent(userCity)}`)
            .then(res => {
                if (!res.ok) throw new Error("Gagal mengambil data");
                return res.json();
            })
            .then(data => {
                setDashboardData(data);
            })
            .catch(err => {
                console.error("Dashboard Fetch Error:", err);
                // Fallback state jika API belum dibuat agar UI tidak crash
                setDashboardData({
                    summary: { revenue: 0, margin: 0, traffic: 0 },
                    chartData: { categories: [], targets: [], realized: [] },
                    brief: { topStore: '-', bottomStore: '-', message: 'Belum ada data analisis untuk kota ini.' }
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [userCity]);

    // Format nilai Rupiah ke bentuk Miliar (M) atau Juta (Jt)
    const formatRevenue = (value: number) => {
        if (value >= 1_000_000_000) return { val: (value / 1_000_000_000).toFixed(2), unit: 'Miliar' };
        if (value >= 1_000_000) return { val: (value / 1_000_000).toFixed(2), unit: 'Juta' };
        return { val: value.toLocaleString('id-ID'), unit: '' };
    };

    const revFormat = dashboardData ? formatRevenue(dashboardData.summary.revenue) : { val: '0', unit: '' };

    const barOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: '#ffffff',
            borderColor: '#E2E8F0',
            borderWidth: 1,
            padding: [10, 14],
            extraCssText: 'border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);',
            formatter: function (params: any) {
                let tooltipHtml = `<div style="font-weight:bold; color:#0F172A; margin-bottom:8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">${params[0].name}</div>`;
                params.forEach((param: any) => {
                    // Karena data dari DB aslinya nilai penuh, kita tidak perlu dikali sejuta lagi di sini
                    const fullValue = param.value ? param.value.toLocaleString('id-ID') : '0';
                    tooltipHtml += `
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:24px; margin-bottom: 6px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${param.color.colorStops ? param.color.colorStops[0].color : param.color};"></span>
                                <span style="color:#64748B; font-size:12px; font-weight:600;">${param.seriesName}</span>
                            </div>
                            <span style="color:#0F172A; font-weight:bold; font-size:13px;">Rp ${fullValue}</span>
                        </div>`;
                });
                return tooltipHtml;
            }
        },
        legend: { bottom: 0, icon: 'circle', textStyle: { color: '#475569', fontWeight: '600', fontSize: 12 }, itemGap: 24 },
        grid: { left: '3%', right: '4%', bottom: '20%', top: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: dashboardData?.chartData.categories || [],
            axisLabel: { interval: 0, rotate: 25, fontSize: 11, fontWeight: '600', color: '#64748B', margin: 12 },
            axisLine: { lineStyle: { color: '#E2E8F0' } },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: function (value: number) {
                    return value >= 1_000_000_000 ? `Rp ${value / 1_000_000_000}M` : `Rp ${value / 1_000_000}Jt`;
                },
                color: '#64748B', fontWeight: '600'
            },
            splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } }
        },
        series: [
            {
                name: 'Target Bulanan', type: 'bar', barWidth: '20%',
                data: dashboardData?.chartData.targets || [],
                itemStyle: { color: '#E2E8F0', borderRadius: [8, 8, 0, 0] }
            },
            {
                name: 'Realisasi Penjualan', type: 'bar', barWidth: '20%',
                data: dashboardData?.chartData.realized || [],
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#6A7BFA' },
                        { offset: 1, color: '#4f46e5' }
                    ]),
                    borderRadius: [8, 8, 0, 0]
                },
                label: {
                    show: true, position: 'top',
                    formatter: function (params: any) {
                        return params.value >= 1_000_000_000 ? `Rp ${(params.value / 1_000_000_000).toFixed(1)}M` : `Rp ${(params.value / 1_000_000).toFixed(0)}Jt`;
                    },
                    fontSize: 10, fontWeight: 'bold', color: '#4f46e5'
                }
            }
        ]
    };

    if (isLoading) return <div className="w-full h-full flex flex-col items-center justify-center text-[#6A7BFA] gap-3 min-h-[60vh]"><Loader2 size={32} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm">Menyinkronkan Database Kota...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8">

            {/* HERO BANNER PREMIUM */}
            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] rounded-[40px] p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-transform duration-1000" />
                <div className="relative z-10 max-w-3xl text-white">
                    <h2 className="text-[32px] lg:text-[40px] font-bold mb-4 tracking-tight leading-tight">
                        Ringkasan Performa Kota.<br />Wilayah {userCity}.
                    </h2>
                    <p className="text-white/90 text-sm lg:text-base leading-relaxed mb-8">
                        Pantau pencapaian target, omzet toko lokal, dan konversi daya beli<br className="hidden md:block" />
                        masyarakat {userCity} secara mendalam berdasarkan data terbaru.
                    </p>
                    <Link href="/dashboard/city/forecast">
                        <button className="bg-white text-[#4f46e5] hover:bg-[#EDF2FE] hover:shadow-xl hover:-translate-y-1 font-bold py-3.5 px-8 rounded-[40px] transition-all active:scale-95 text-sm flex items-center gap-2 group/btn">
                            Analisis AI Toko <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
                <div className="hidden lg:block w-[320px] h-[260px] relative z-10 mr-4 animate-float">
                    <img src="/ilustrasi-city-nobg-fix.png" alt="Illustration" className="w-full h-full object-contain drop-shadow-2xl scale-125 transition-transform duration-1000 ease-out" />
                </div>
            </div>

            {/* SUMMARY CARDS DINAMIS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] group cursor-default">
                    <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all duration-300"><DollarSign size={24} /></div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5 relative group/info cursor-help w-fit">
                            <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-[#4f46e5] transition-colors">Total Omzet {userCity}</p>
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/info:block bg-slate-900 text-white p-3 rounded-xl shadow-xl z-20 min-w-[200px] pointer-events-none">
                                <p className="text-xs font-bold border-b border-slate-700 pb-1.5 mb-1.5">Nilai Aktual</p>
                                <p className="text-lg font-black tracking-tight text-emerald-400">Rp {dashboardData?.summary.revenue.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight border-b-2 border-dashed border-transparent group-hover:border-slate-300 w-fit pb-0.5 transition-colors">
                            Rp {revFormat.val} <span className="text-xl lg:text-2xl text-slate-400 font-medium tracking-normal">{revFormat.unit}</span>
                        </h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] group cursor-default">
                    <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all duration-300"><Percent size={24} /></div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Margin Profit Lokal</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">{dashboardData?.summary.margin.toFixed(1)}<span className="text-2xl text-slate-400 font-medium">%</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] group cursor-default">
                    <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all duration-300"><Users size={24} /></div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5 relative group/info cursor-help w-fit">
                            <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-[#4f46e5] transition-colors">Pengunjung Harian (Avg)</p>
                            <div className="absolute bottom-full right-0 md:left-0 md:right-auto mb-2 hidden group-hover/info:block bg-slate-900 text-white p-3 rounded-xl shadow-xl z-20 min-w-[180px] pointer-events-none">
                                <p className="text-xs font-bold border-b border-slate-700 pb-1.5 mb-1.5">Total Traffic</p>
                                <p className="text-lg font-black tracking-tight text-white">{dashboardData?.summary.traffic.toLocaleString('id-ID')} <span className="text-xs font-normal opacity-80">Orang</span></p>
                            </div>
                        </div>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight border-b-2 border-dashed border-transparent group-hover:border-slate-300 w-fit pb-0.5 transition-colors">
                            {dashboardData?.summary.traffic.toLocaleString('id-ID')} <span className="text-lg lg:text-xl text-slate-400 font-medium tracking-normal">Orang</span>
                        </h3>
                    </div>
                </div>
            </div>

            {/* GRAFIK UTAMA DINAMIS */}
            <div className="bg-white border border-slate-100 rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out delay-200 fill-mode-both">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#EDF2FE] p-2.5 rounded-xl text-[#4f46e5]">
                            <ShoppingBag size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Komparasi Target Cabang</h3>
                    </div>
                    <span className="text-[10px] bg-slate-50 text-slate-500 px-4 py-2 rounded-full font-bold border border-slate-200 uppercase tracking-widest">
                        Area: {userCity}
                    </span>
                </div>

                <div className="w-full h-[450px] relative">
                    {dashboardData?.chartData.categories.length === 0 ? (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white text-slate-400 gap-3">
                            <AlertCircle size={36} className="opacity-50" />
                            <span className="font-bold text-sm tracking-wide">Data target & realisasi belum tersedia untuk kota ini.</span>
                        </div>
                    ) : (
                        <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                    )}
                </div>

                {/* EXECUTIVE BRIEF DINAMIS DARI DATABASE */}
                <div className="mt-8 flex flex-col sm:flex-row items-start gap-4 p-5 bg-[#F8FAFC] rounded-3xl border border-slate-200">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shrink-0">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[#4f46e5] mb-1.5 uppercase tracking-widest">Analisis Eksekutif Kota:</p>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            {dashboardData?.brief.message}
                        </p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
                .animate-float { animation: float 6s ease-in-out infinite; }
            `}} />
        </div>
    );
}