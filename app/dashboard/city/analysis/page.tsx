"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { PieChart, Store, ChevronDown, CheckCircle2, TrendingUp, Users, Target, Loader2 } from 'lucide-react';

export default function StoreAnalysisPage() {
    const { data: session } = useSession();
    const userCity = (session?.user as any)?.assignedCity || 'Medan';

    const [isLoading, setIsLoading] = useState(true);
    const [filterStore, setFilterStore] = useState('Semua Toko');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    // State untuk menampung data dinamis dari Database
    const [analysisData, setAnalysisData] = useState({
        kpi: { revenue: 0, margin: 0, units: 0 },
        pieChart: [] as { name: string, value: number, itemStyle?: any }[],
        barChart: { categories: [] as string[], revenue: [] as number[], profit: [] as number[] },
        availableStores: ['Semua Toko']
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) setOpenDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch data setiap kali filter toko atau kota berubah
    useEffect(() => {
        if (!userCity) return;
        setIsLoading(true);

        const fetchAnalysis = async () => {
            try {
                const res = await fetch(`/api/city/analysis?city=${encodeURIComponent(userCity)}&store=${encodeURIComponent(filterStore)}`);
                if (!res.ok) throw new Error("Gagal mengambil data analisis");
                const data = await res.json();

                // Menambahkan warna gradient/solid otomatis untuk pie chart dari backend
                const colorPalette = ['#312E81', '#4f46e5', '#6A7BFA', '#A3B1FF', '#C7D2FE'];
                const coloredPieData = data.pieChart.map((item: any, index: number) => ({
                    ...item,
                    itemStyle: { color: colorPalette[index % colorPalette.length] }
                }));

                setAnalysisData({
                    ...data,
                    pieChart: coloredPieData
                });
            } catch (error) {
                console.error("Analysis Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysis();
    }, [userCity, filterStore]);

    const formatRupiah = (value: number) => {
        if (value >= 1_000_000_000) return { val: (value / 1_000_000_000).toFixed(2), unit: 'Miliar' };
        if (value >= 1_000_000) return { val: (value / 1_000_000).toFixed(2), unit: 'Juta' };
        return { val: value.toLocaleString('id-ID'), unit: '' };
    };

    const revFormat = formatRupiah(analysisData.kpi.revenue);

    const categoryPieOption = {
        tooltip: { trigger: 'item', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14], extraCssText: 'border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);' },
        legend: { bottom: '0%', left: 'center', icon: 'circle', textStyle: { color: '#475569', fontWeight: '500' }, itemGap: 15 },
        series: [{
            name: 'Volume Terjual', type: 'pie', radius: ['40%', '65%'], center: ['50%', '42%'], avoidLabelOverlap: true,
            itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
            label: { show: false },
            data: analysisData.pieChart
        }]
    };

    const profitRevenueOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: '#ffffff',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            padding: [12, 16],
            extraCssText: 'border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);',
            formatter: function (params: any) {
                let tooltipHtml = `<div style="font-weight:bold; color:#0F172A; margin-bottom:8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">${params[0].name}</div>`;
                params.forEach((param: any) => {
                    const formatVal = param.value >= 1_000_000_000
                        ? `${(param.value / 1_000_000_000).toFixed(2)} M`
                        : `${(param.value / 1_000_000).toFixed(2)} Jt`;

                    tooltipHtml += `<div style="display:flex; justify-content:space-between; align-items:center; gap:24px; margin-bottom: 4px;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${param.color.colorStops ? param.color.colorStops[0].color : param.color};"></span>
                            <span style="color:#64748B; font-size:12px; font-weight:500;">${param.seriesName}</span>
                        </div>
                        <span style="color:#0F172A; font-weight:bold; font-size:13px;">Rp ${formatVal}</span>
                    </div>`;
                });
                return tooltipHtml;
            }
        },
        legend: { bottom: '0%', left: 'center', icon: 'circle', textStyle: { color: '#475569', fontWeight: '500' } },
        grid: { left: '3%', right: '4%', bottom: '20%', top: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: analysisData.barChart.categories,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#64748B', fontWeight: '600', interval: 0, rotate: 20, fontSize: 10, margin: 12 }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } },
            axisLabel: {
                formatter: function (value: number) {
                    return value >= 1_000_000_000 ? `Rp ${value / 1_000_000_000}M` : `Rp ${value / 1_000_000}Jt`;
                },
                color: '#64748B', fontWeight: '500', fontSize: 10
            }
        },
        series: [
            {
                name: 'Total Pendapatan', type: 'bar', barWidth: '25%',
                itemStyle: { color: '#E2E8F0', borderRadius: [4, 4, 0, 0] },
                data: analysisData.barChart.revenue
            },
            {
                name: 'Net Profit', type: 'bar', barWidth: '25%',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#6A7BFA' },
                        { offset: 1, color: '#4f46e5' }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                },
                data: analysisData.barChart.profit
            }
        ]
    };

    if (isLoading) return <div className="w-full h-full flex items-center justify-center text-[#6A7BFA] gap-3 min-h-[60vh]"><Loader2 size={32} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm">Menganalisis Kinerja Kategori...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-6 relative">
            {openDropdown && <div className="fixed inset-0 z-[30]" onClick={() => setOpenDropdown(null)}></div>}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">Analisis Kinerja Toko</h2>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><PieChart size={16} className="text-[#6A7BFA]" /> Bedah performa volume dan rasio margin profit per outlet di {userCity}.</p>
                </div>
            </div>

            {/* PANEL FILTER TOKO */}
            <div className="bg-white rounded-[32px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 relative z-[40]">
                <div ref={filterRef} className="w-full md:w-1/2">
                    <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'store' ? 'z-[60]' : 'z-10'}`}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Pilih Toko Spesifik</label>
                        <button onClick={() => setOpenDropdown(openDropdown === 'store' ? null : 'store')} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-[20px] px-4 py-3.5 text-sm font-bold text-slate-700 hover:border-[#6A7BFA]/60 transition-all group relative z-[50]">
                            <div className="flex items-center gap-2 truncate"><Store size={16} className="text-[#6A7BFA] group-hover:scale-110 group-hover:text-[#4f46e5] transition-all" /><span className="truncate group-hover:text-[#4f46e5] transition-colors">{filterStore}</span></div>
                            <ChevronDown size={16} className={`text-slate-400 group-hover:text-[#4f46e5] transition-transform ${openDropdown === 'store' ? 'rotate-180' : ''}`} />
                        </button>
                        {openDropdown === 'store' && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-60 overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                {analysisData.availableStores.map((item) => (
                                    <button key={item} onClick={() => { setFilterStore(item); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterStore === item ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-md' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5]'}`}>
                                        {item} {filterStore === item && <CheckCircle2 size={16} className="text-white" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI CARDS DINAMIS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 relative z-10">
                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] hover:-translate-y-1.5 transition-all duration-300 group cursor-default">
                    <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all duration-300"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Total Pendapatan Toko</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Rp {revFormat.val} <span className="text-xl lg:text-2xl text-slate-400 font-medium tracking-normal">{revFormat.unit}</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] hover:-translate-y-1.5 transition-all duration-300 group cursor-default">
                    <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all duration-300"><Target size={24} /></div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Net Profit Margin (Avg)</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">{analysisData.kpi.margin.toFixed(1)}<span className="text-2xl text-slate-400 font-medium">%</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] hover:-translate-y-1.5 transition-all duration-300 group cursor-default">
                    <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all duration-300"><Users size={24} /></div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Volume Unit Terjual</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">{analysisData.kpi.units.toLocaleString('id-ID')} <span className="text-xl text-slate-400 font-medium tracking-normal">Pcs</span></h3>
                    </div>
                </div>
            </div>

            {/* CHART ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 relative z-10">
                <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col group">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Porsi Volume Unit Kategori</h3>
                    <p className="text-sm text-slate-500 mb-6">Kontribusi volume penjualan berdasarkan lini produk.</p>
                    <div className="w-full h-[350px] group-hover:scale-[1.02] transition-transform duration-500">
                        {analysisData.pieChart.length > 0 ? (
                            <ReactECharts option={categoryPieOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">Data kategori tidak tersedia.</div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col group">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">Pendapatan vs Profit <span className="text-[10px] bg-[#EDF2FE] text-[#4f46e5] px-2 py-1 rounded-md tracking-widest uppercase font-bold">IDR</span></h3>
                    <p className="text-sm text-slate-500 mb-6">Komparasi nilai penjualan kotor terhadap laba bersih per kategori.</p>
                    <div className="w-full h-[350px]">
                        {analysisData.barChart.categories.length > 0 ? (
                            <ReactECharts option={profitRevenueOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">Data profit tidak tersedia.</div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}