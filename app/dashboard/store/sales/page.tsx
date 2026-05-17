"use client";
import React, { useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { PieChart, TrendingUp, Users, CreditCard, ChevronDown, CheckCircle2, BarChart3, Activity, Loader2 } from 'lucide-react';

export default function StoreSalesAnalysis() {
    const [isLoading, setIsLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('Semua Kategori');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) setOpenDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 1. CHART: Tren Penjualan Harian
    const dailyTrendOption = {
        tooltip: { trigger: 'axis', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14], extraCssText: 'border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);' },
        grid: { left: '3%', right: '4%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'], axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#64748B', fontWeight: '600' } },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } }, axisLabel: { formatter: '{value} Pcs', color: '#64748B' } },
        series: [{
            name: 'Volume Harian', type: 'line', smooth: true, symbolSize: 8,
            itemStyle: { color: '#6A7BFA' }, lineStyle: { width: 4 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(106, 123, 250, 0.2)' }, { offset: 1, color: 'rgba(106, 123, 250, 0)' }] } },
            data: [120, 135, 125, 180, 240, 380, 410] // Peak di Weekend
        }]
    };

    // 2. CHART: Metode Pembayaran (Doughnut)
    const paymentOption = {
        tooltip: { trigger: 'item', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14], extraCssText: 'border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);' },
        legend: { bottom: '0%', left: 'center', icon: 'circle', textStyle: { color: '#475569', fontWeight: '500' } },
        series: [{
            name: 'Metode Bayar', type: 'pie', radius: ['45%', '70%'], center: ['50%', '40%'], avoidLabelOverlap: false,
            itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
            label: { show: false },
            data: [
                { value: 55, name: 'QRIS / E-Wallet', itemStyle: { color: '#6A7BFA' } },
                { value: 30, name: 'Kartu Debit/Kredit', itemStyle: { color: '#312E81' } },
                { value: 15, name: 'Tunai', itemStyle: { color: '#A3B1FF' } }
            ]
        }]
    };

    if (isLoading) return <div className="w-full h-full flex items-center justify-center text-[#6A7BFA] gap-3"><Loader2 size={24} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm">Menyiapkan Analitik...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-6 relative">
            {openDropdown && <div className="fixed inset-0 z-[30]" onClick={() => setOpenDropdown(null)}></div>}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">Analisis Penjualan Toko</h2>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><Activity size={16} className="text-[#6A7BFA]" /> Pantau tren harian dan perilaku pembeli di Ramayana Plaza Medan.</p>
                </div>
            </div>

            {/* FILTER KATEGORI */}
            <div className="bg-white rounded-[32px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 relative z-[40]">
                <div ref={filterRef} className="w-full md:w-1/3">
                    <div className={`flex flex-col gap-1.5 relative transition-all ${openDropdown === 'category' ? 'z-[60]' : 'z-10'}`}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Filter Berdasarkan Kategori</label>
                        <button onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-[20px] px-4 py-3.5 text-sm font-bold text-slate-700 hover:border-[#6A7BFA]/60 transition-all group relative z-[50]">
                            <div className="flex items-center gap-2 truncate"><BarChart3 size={16} className="text-[#6A7BFA] group-hover:scale-110 transition-transform" /><span className="truncate group-hover:text-[#6A7BFA]">{filterCategory}</span></div>
                            <ChevronDown size={16} className={`text-slate-400 group-hover:text-[#6A7BFA] transition-transform ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
                        </button>
                        {openDropdown === 'category' && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                {['Semua Kategori', "Men's Street", "Men's Athletic", "Women's Apparel"].map((item) => (
                                    <button key={item} onClick={() => { setFilterCategory(item); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterCategory === item ? 'bg-[#EDF2FE] text-[#6A7BFA]' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#6A7BFA]'}`}>
                                        {item} {filterCategory === item && <CheckCircle2 size={16} className="text-[#6A7BFA]" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 relative z-10">
                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_20px_40px_-15px_rgba(106,123,250,0.2)] hover:-translate-y-1.5 transition-all duration-300 group">
                    <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-[#6A7BFA] group-hover:text-white transition-all"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#6A7BFA] transition-colors">Volume Mingguan</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">1.590 <span className="text-xl lg:text-2xl text-slate-400 font-medium tracking-normal">Pcs</span></h3>
                    </div>
                </div>
                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_20px_40px_-15px_rgba(106,123,250,0.2)] hover:-translate-y-1.5 transition-all duration-300 group">
                    <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-[#6A7BFA] group-hover:text-white transition-all"><Users size={24} /></div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#6A7BFA] transition-colors">Avg. Belanja / Tiket</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Rp 350<span className="text-xl lg:text-2xl text-slate-400 font-medium tracking-normal">k</span></h3>
                    </div>
                </div>
                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_20px_40px_-15px_rgba(106,123,250,0.2)] hover:-translate-y-1.5 transition-all duration-300 group">
                    <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-[#6A7BFA] group-hover:text-white transition-all"><CreditCard size={24} /></div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#6A7BFA] transition-colors">Transaksi QRIS Terbanyak</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Sabtu</h3>
                    </div>
                </div>
            </div>

            {/* CHART ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 relative z-10">
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col group">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Tren Penjualan Harian</h3>
                    <p className="text-sm text-slate-500 mb-6">Lonjakan terjadi pada hari Jumat hingga Minggu.</p>
                    <div className="w-full h-[350px]"><ReactECharts option={dailyTrendOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} /></div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col group">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Metode Pembayaran</h3>
                    <p className="text-sm text-slate-500 mb-6">Preferensi transaksi kasir minggu ini.</p>
                    <div className="w-full h-[350px] group-hover:scale-[1.02] transition-transform duration-500"><ReactECharts option={paymentOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} /></div>
                </div>
            </div>
        </div>
    );
}