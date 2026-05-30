"use client";
import React, { useState, useEffect } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { ShoppingCart, Package, Percent, TrendingUp, TrendingDown, Map as MapIcon, Loader2, ArrowRight, PackageSearch, Store, BarChart3, Globe, Activity, LayoutList } from 'lucide-react';
import Link from 'next/link';

export default function RingkasanNasional() {
    const [isLoading, setIsLoading] = useState(true);
    const [activeTrendTab, setActiveTrendTab] = useState<'trend' | 'channel'>('trend');
    const [activePortoTab, setActivePortoTab] = useState<'produk' | 'retailer'>('produk');

    // STATE DATA DINAMIS DARI DATABASE
    const [dashboardData, setDashboardData] = useState<any>(null);

    useEffect(() => {
        // Fetch Peta GeoJSON sekaligus Data Analitik dari Database
        Promise.all([
            fetch('/indonesia.json').then((res) => res.json()),
            fetch('/api/admin/analytics/dashboard').then((res) => res.json()) // API Baru
        ])
            .then(([mapData, dbData]) => {
                echarts.registerMap('indonesia_nasional', mapData);
                setDashboardData(dbData);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const miniMapOption = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', backgroundColor: '#ffffff', textStyle: { color: '#0F172A', fontSize: 13 }, borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14], formatter: (params: any) => `<div style="font-weight:600; font-size:11px; text-transform:uppercase; color:#64748B; margin-bottom:4px;">${params.name || 'Wilayah'}</div><div style="color:#6A7BFA; font-weight:bold; font-size:15px;">${params.value ? (params.value).toLocaleString('id-ID') : 0} Unit</div>` },
        visualMap: { min: 0, max: 5000, text: ['Tinggi', 'Rendah'], realtime: false, calculable: true, inRange: { color: ['#EDF2FE', '#A3B1FF', '#4f46e5'] }, show: false },
        series: [{
            name: 'Volume Provinsi', type: 'map', map: 'indonesia_nasional', nameProperty: 'Propinsi', roam: false, label: { show: false }, itemStyle: { areaColor: '#E2E8F0', borderColor: '#FFFFFF', borderWidth: 1 }, emphasis: { itemStyle: { areaColor: '#A3B1FF' }, label: { show: false } },
            data: dashboardData?.mapDistribution || [] // Data Dinamis
        }]
    };

    const trendChartOption = {
        tooltip: { trigger: 'axis', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0' },
        grid: { left: '2%', right: '4%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: dashboardData?.trendLine?.labels || ['Jan', 'Feb', 'Mar'], axisLine: { lineStyle: { color: '#E2E8F0' } } },
        yAxis: { type: 'value', axisLabel: { formatter: '{value}' }, splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } } },
        series: [{ name: 'Total Unit', type: 'line', smooth: true, symbolSize: 8, itemStyle: { color: '#4f46e5' }, lineStyle: { width: 4 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(106, 123, 250, 0.4)' }, { offset: 1, color: 'rgba(79, 70, 229, 0)' }] } }, data: dashboardData?.trendLine?.values || [] }]
    };

    const channelChartOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '2%', right: '15%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: dashboardData?.salesMethod?.map((d: any) => d.name) || [], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontWeight: '700', color: '#475569' } },
        series: [{ name: 'Unit Terjual', type: 'bar', barWidth: '45%', data: dashboardData?.salesMethod?.map((d: any, i: number) => ({ value: d.value, itemStyle: { color: i === 0 ? '#4f46e5' : i === 1 ? '#6A7BFA' : '#A3B1FF', borderRadius: [0, 6, 6, 0] } })) || [], label: { show: true, position: 'right', formatter: '{c} Unit', fontWeight: 'bold' } }]
    };

    const productChartOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '2%', right: '12%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: dashboardData?.topProducts?.map((d: any) => d.name).reverse() || [], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontWeight: '600', color: '#0F172A', fontSize: 12 } },
        series: [{ name: 'Volume (Unit)', type: 'bar', data: dashboardData?.topProducts?.map((d: any) => d.value).reverse() || [], itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#6A7BFA' }, { offset: 1, color: '#4f46e5' }]), borderRadius: [0, 6, 6, 0] }, barWidth: '45%', label: { show: true, position: 'right', formatter: '{c}', color: '#64748B', fontWeight: '700', fontSize: 12 } }]
    };

    const retailerChartOption = {
        tooltip: { trigger: 'item', formatter: '<div style="font-weight:bold; margin-bottom:4px;">{b}</div><div style="color:#6A7BFA; font-weight:bold;">{c} Unit ({d}%)</div>', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14] },
        legend: { bottom: '0%', left: 'center', icon: 'circle', itemGap: 20, textStyle: { color: '#475569', fontWeight: '500', fontSize: 12 } },
        series: [{ name: 'Retailer', type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'], avoidLabelOverlap: false, itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 }, label: { show: false }, data: dashboardData?.retailerShare || [] }]
    };

    if (isLoading) return <div className="w-full h-full flex items-center justify-center text-[#6A7BFA] gap-3"><Loader2 size={24} className="animate-spin" /><span className="font-medium tracking-widest uppercase text-sm">Memuat Database Nasional...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8">
            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] rounded-[40px] p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out group">
                {/* BANNER TETAP SAMA */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-transform duration-1000" />
                <div className="relative z-10 max-w-3xl text-white">
                    <h2 className="text-[32px] lg:text-[40px] font-bold mb-4 tracking-tight leading-tight">Ringkasan Eksekutif Nasional.<br />Performa Bisnis Real-time.</h2>
                    <p className="text-white/90 text-sm lg:text-base leading-relaxed mb-8">Pantau wawasan komprehensif terkait performa volume penjualan unit dan sebaran inventaris<br className="hidden md:block" />di seluruh wilayah operasional Indonesia.</p>
                    <Link href="/dashboard/admin/map"><button className="bg-white text-[#4f46e5] hover:bg-[#EDF2FE] hover:shadow-xl hover:-translate-y-1 font-bold py-3.5 px-8 rounded-[40px] transition-all active:scale-95 text-sm flex items-center gap-2 group/btn">Lihat Peta Lengkap <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" /></button></Link>
                </div>
                <div className="hidden lg:block w-[320px] h-[260px] relative z-10 mr-4 animate-float"><img src="/ilustrasi-superAdmin-nobg-fix.png" alt="Illustration" className="w-full h-full object-contain drop-shadow-2xl scale-125" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* TOTAL PENJUALAN */}
                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><ShoppingCart size={24} /></div>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Total Penjualan</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">{(dashboardData?.summary?.totalUnits / 1000000).toFixed(1) || 0} <span className="text-xl lg:text-2xl text-slate-400 font-medium">Juta Unit</span></h3>
                    </div>
                </div>

                {/* MARGIN */}
                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><Percent size={24} /></div>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Rata-Rata Margin</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">{dashboardData?.summary?.avgMargin?.toFixed(1) || 0}<span className="text-xl lg:text-2xl text-slate-400 font-medium">%</span></h3>
                    </div>
                </div>

                {/* INVENTARIS */}
                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><Package size={24} /></div>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Total Pendapatan</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">{(dashboardData?.summary?.totalSales / 1000000000).toFixed(1) || 0} <span className="text-lg lg:text-xl text-slate-400 font-medium capitalize">Miliar</span></h3>
                    </div>
                </div>
            </div>

            {/* Sisa UI Bawah Sama, Chart Component akan otomatis render data baru */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-6 px-2 relative z-10">
                        <div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl"><MapIcon size={20} /></div>
                        <div><h3 className="text-xl font-bold text-slate-900">Sebaran Penjualan Unit</h3><p className="text-slate-500 text-xs mt-0.5">Performa wilayah aktual berdasar letak geografis</p></div>
                    </div>
                    <div className="w-full h-[400px] relative z-10 rounded-[24px] bg-[#F8FAFC] border border-slate-100 overflow-hidden"><ReactECharts option={miniMapOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} /></div>
                </div>
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col group">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Top 7 Provinsi (Unit)</h3>
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                        {dashboardData?.topProvinces?.map((prov: any, i: number) => (
                            <div key={i} className="group/item cursor-default">
                                <div className="flex justify-between items-center text-sm mb-2.5">
                                    <span className="font-semibold text-slate-700">{prov.name}</span>
                                    <span className="font-bold text-slate-900">{(prov.val / 1000).toFixed(1)}k Unit</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-[#4f46e5] h-full rounded-full transition-all duration-1000" style={{ width: prov.pct }}></div></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* TAB BOTTOM (Analisis & Portofolio) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col h-[480px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
                        <div className="flex items-center gap-3"><div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl"><Activity size={20} /></div><div><h3 className="text-xl font-bold text-slate-900">Analisis Kinerja</h3><p className="text-slate-500 text-xs mt-0.5">Tren waktu & efektivitas metode</p></div></div>
                        <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-[20px] shrink-0">
                            <button onClick={() => setActiveTrendTab('trend')} className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-xs font-bold transition-all ${activeTrendTab === 'trend' ? 'bg-white text-[#4f46e5] shadow-sm border border-slate-100' : 'text-slate-500'}`}><BarChart3 size={14} /> Tren Bulanan</button>
                            <button onClick={() => setActiveTrendTab('channel')} className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-xs font-bold transition-all ${activeTrendTab === 'channel' ? 'bg-white text-[#4f46e5] shadow-sm border border-slate-100' : 'text-slate-500'}`}><Globe size={14} /> Jalur Penjualan</button>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative">
                        {activeTrendTab === 'trend' && <div className="absolute inset-0 animate-in fade-in"><ReactECharts option={trendChartOption} style={{ height: '100%', width: '100%' }} /></div>}
                        {activeTrendTab === 'channel' && <div className="absolute inset-0 animate-in fade-in"><ReactECharts option={channelChartOption} style={{ height: '100%', width: '100%' }} /></div>}
                    </div>
                </div>

                <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col h-[480px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
                        <div className="flex items-center gap-3"><div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl"><LayoutList size={20} /></div><div><h3 className="text-xl font-bold text-slate-900">Portofolio Bisnis</h3></div></div>
                        <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-[20px] shrink-0">
                            <button onClick={() => setActivePortoTab('produk')} className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-xs font-bold transition-all ${activePortoTab === 'produk' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-slate-500'}`}><PackageSearch size={14} /> Kategori Produk</button>
                            <button onClick={() => setActivePortoTab('retailer')} className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-xs font-bold transition-all ${activePortoTab === 'retailer' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-slate-500'}`}><Store size={14} /> Mitra Retailer</button>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative">
                        {activePortoTab === 'produk' && <div className="absolute inset-0 animate-in fade-in"><ReactECharts option={productChartOption} style={{ height: '100%', width: '100%' }} /></div>}
                        {activePortoTab === 'retailer' && <div className="absolute inset-0 animate-in fade-in"><ReactECharts option={retailerChartOption} style={{ height: '100%', width: '100%' }} /></div>}
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } } .animate-float { animation: float 6s ease-in-out infinite; }` }} />
        </div>
    );
}