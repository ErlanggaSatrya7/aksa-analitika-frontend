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

    useEffect(() => {
        fetch('/indonesia.json')
            .then((response) => response.json())
            .then((data) => {
                echarts.registerMap('indonesia_nasional', data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const miniMapOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item', backgroundColor: '#ffffff', textStyle: { color: '#0F172A', fontSize: 13 }, borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14],
            formatter: (params: any) => `<div style="font-weight:600; font-size:11px; text-transform:uppercase; color:#64748B; margin-bottom:4px;">${params.name || 'Wilayah'}</div><div style="color:#6A7BFA; font-weight:bold; font-size:15px;">${params.value ? (params.value * 1000).toLocaleString('id-ID') : 0} Unit</div>`
        },
        visualMap: { min: 0, max: 5000, text: ['Tinggi', 'Rendah'], realtime: false, calculable: true, inRange: { color: ['#EDF2FE', '#A3B1FF', '#4f46e5'] }, textStyle: { color: '#64748B', fontSize: 11, fontWeight: '500' }, itemWidth: 10, itemHeight: 80, bottom: 20, left: 10 },
        series: [{
            name: 'Volume Provinsi', type: 'map', map: 'indonesia_nasional', nameProperty: 'Propinsi', roam: false, label: { show: false }, itemStyle: { areaColor: '#E2E8F0', borderColor: '#FFFFFF', borderWidth: 1 }, emphasis: { itemStyle: { areaColor: '#A3B1FF' }, label: { show: false } },
            data: [
                { name: 'SUMATERA UTARA', value: 1900 }, { name: 'DKI JAKARTA', value: 4500 },
                { name: 'JAWA TIMUR', value: 3100 }, { name: 'JAWA BARAT', value: 2800 },
                { name: 'SULAWESI SELATAN', value: 1200 }, { name: 'BALI', value: 1500 },
                { name: 'KALIMANTAN SELATAN', value: 800 },
            ]
        }]
    };

    const trendChartOption = {
        tooltip: { trigger: 'axis', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0' },
        grid: { left: '2%', right: '4%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], axisLine: { lineStyle: { color: '#E2E8F0' } } },
        yAxis: { type: 'value', axisLabel: { formatter: '{value}M' }, splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } } },
        series: [{
            name: 'Total Unit',
            type: 'line',
            smooth: true,
            symbolSize: 8,
            itemStyle: { color: '#4f46e5' }, // Warna outline chart selaras dengan secondary color
            lineStyle: { width: 4 },
            areaStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [{ offset: 0, color: 'rgba(106, 123, 250, 0.4)' }, { offset: 1, color: 'rgba(79, 70, 229, 0)' }] // Efek gradasi area
                }
            },
            data: [1.1, 1.3, 1.2, 1.6, 1.8, 2.1, 1.9, 2.3, 2.5, 2.8, 3.1, 3.5]
        }]
    };

    const channelChartOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '2%', right: '15%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: ['Online (E-commerce)', 'Factory Outlet', 'Offline (Toko Fisik)'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontWeight: '700', color: '#475569' } },
        series: [{
            name: 'Unit Terjual',
            type: 'bar',
            barWidth: '45%',
            data: [
                { value: 7200, itemStyle: { color: '#4f46e5', borderRadius: [0, 6, 6, 0] } }, // Warna paling gelap untuk value terbesar
                { value: 4800, itemStyle: { color: '#6A7BFA', borderRadius: [0, 6, 6, 0] } },
                { value: 3400, itemStyle: { color: '#A3B1FF', borderRadius: [0, 6, 6, 0] } }
            ],
            label: { show: true, position: 'right', formatter: '{c}k Unit', fontWeight: 'bold' }
        }]
    };

    const productChartOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '2%', right: '12%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: ["Men's Street", "Women's Athletic", "Kids Footwear", "Men's Athletic", "Women's Apparel"].reverse(), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontWeight: '600', color: '#0F172A', fontSize: 12 } },
        series: [{
            name: 'Volume (Unit)',
            type: 'bar',
            data: [4200, 3100, 2800, 1900, 1500].reverse(),
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#6A7BFA' },
                    { offset: 1, color: '#4f46e5' }
                ]), // Efek gradasi linear pada bar
                borderRadius: [0, 6, 6, 0]
            },
            barWidth: '45%',
            label: { show: true, position: 'right', formatter: '{c}k', color: '#64748B', fontWeight: '700', fontSize: 12 }
        }]
    };

    const retailerChartOption = {
        tooltip: { trigger: 'item', formatter: '<div style="font-weight:bold; margin-bottom:4px;">{b}</div><div style="color:#6A7BFA; font-weight:bold;">{c} Juta Unit ({d}%)</div>', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14] },
        legend: { bottom: '0%', left: 'center', icon: 'circle', itemGap: 20, textStyle: { color: '#475569', fontWeight: '500', fontSize: 12 } },
        series: [{ name: 'Retailer', type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'], avoidLabelOverlap: false, itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 }, label: { show: false }, data: [{ value: 6.8, name: 'Ramayana', itemStyle: { color: '#312E81' } }, { value: 5.2, name: 'Matahari', itemStyle: { color: '#4f46e5' } }, { value: 3.4, name: 'Sport Station', itemStyle: { color: '#6A7BFA' } }] }]
    };

    if (isLoading) return <div className="w-full h-full flex items-center justify-center text-[#6A7BFA] gap-3"><Loader2 size={24} className="animate-spin" /><span className="font-medium tracking-widest uppercase text-sm">Memuat Ringkasan Data...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8">
            {/* BANNER UTAMA DENGAN GRADASI */}
            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] rounded-[40px] p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-transform duration-1000" />
                <div className="relative z-10 max-w-3xl text-white">
                    <h2 className="text-[32px] lg:text-[40px] font-bold mb-4 tracking-tight leading-tight">Ringkasan Eksekutif Nasional.<br />Performa Bisnis Real-time.</h2>
                    <p className="text-white/90 text-sm lg:text-base leading-relaxed mb-8">Pantau wawasan komprehensif terkait performa volume penjualan unit dan sebaran inventaris<br className="hidden md:block" />di seluruh wilayah operasional Indonesia. Sistem ini dilengkapi proyeksi<br className="hidden md:block" />Machine Learning cerdas untuk memprediksi lonjakan pasar.</p>
                    <Link href="/dashboard/admin/map">
                        <button className="bg-white text-[#4f46e5] hover:bg-[#EDF2FE] hover:shadow-xl hover:-translate-y-1 font-bold py-3.5 px-8 rounded-[40px] transition-all active:scale-95 text-sm flex items-center gap-2 group/btn">
                            Lihat Peta Lengkap <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
                <div className="hidden lg:block w-[320px] h-[260px] relative z-10 mr-4 animate-float">
                    <img src="/ilustrasi-superAdmin-nobg-fix.png" alt="Illustration" className="w-full h-full object-contain drop-shadow-2xl scale-125" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] group cursor-default">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all duration-300"><ShoppingCart size={24} /></div>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100"><TrendingUp size={14} /> +12.5%</span>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Total Penjualan</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">15,4 <span className="text-xl lg:text-2xl text-slate-400 font-medium">Juta Unit</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] group cursor-default">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all duration-300"><Percent size={24} /></div>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100"><TrendingUp size={14} /> +2.1%</span>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Rata-Rata Margin</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">34.8<span className="text-xl lg:text-2xl text-slate-400 font-medium">%</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] group cursor-default">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all duration-300"><Package size={24} /></div>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-red-700 bg-red-50 px-3 py-1.5 rounded-full border border-red-100"><TrendingDown size={14} /> -0.8%</span>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Sisa Inventaris</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">2,1 <span className="text-lg lg:text-xl text-slate-400 font-medium capitalize tracking-normal">Juta Unit</span></h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-6 px-2 relative z-10">
                        <div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:bg-[#4f46e5] group-hover:text-white transition-colors"><MapIcon size={20} /></div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Sebaran Penjualan Unit</h3>
                            <p className="text-slate-500 text-xs mt-0.5">Performa wilayah aktual berdasar letak geografis</p>
                        </div>
                    </div>
                    <div className="w-full h-[400px] relative z-10 rounded-[24px] bg-[#F8FAFC] border border-slate-100 overflow-hidden group-hover:shadow-inner transition-shadow">
                        <ReactECharts option={miniMapOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col group">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Top 7 Provinsi (Unit)</h3>
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                        {[
                            { name: 'DKI Jakarta', val: '4.5M Unit', pct: '85%', color: 'bg-[#312E81]' },
                            { name: 'Jawa Timur', val: '3.1M Unit', pct: '65%', color: 'bg-[#4f46e5]' }, // Update ke secondary
                            { name: 'Jawa Barat', val: '2.8M Unit', pct: '55%', color: 'bg-[#6A7BFA]' }, // Update ke primary
                            { name: 'Sumatera Utara', val: '1.9M Unit', pct: '35%', color: 'bg-[#818CF8]' },
                            { name: 'Bali', val: '1.5M Unit', pct: '28%', color: 'bg-[#A3B1FF]' },
                            { name: 'Sulawesi Selatan', val: '1.2M Unit', pct: '20%', color: 'bg-[#C7D2FE]' },
                            { name: 'Kalimantan Selatan', val: '0.8M Unit', pct: '12%', color: 'bg-[#E0E7FF]' },
                        ].map((prov, i) => (
                            <div key={i} className="group/item cursor-default">
                                <div className="flex justify-between items-center text-sm mb-2.5">
                                    <span className="font-semibold text-slate-700 group-hover/item:text-[#4f46e5] transition-colors">{prov.name}</span>
                                    <span className="font-bold text-slate-900 group-hover/item:text-[#4f46e5] transition-colors">{prov.val}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div className={`${prov.color} h-full rounded-full transition-all duration-1000 ease-out group-hover/item:brightness-110`} style={{ width: prov.pct }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col h-[480px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl"><Activity size={20} /></div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Analisis Kinerja</h3>
                                <p className="text-slate-500 text-xs mt-0.5">Tren waktu & efektivitas metode</p>
                            </div>
                        </div>
                        <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-[20px] shrink-0">
                            <button onClick={() => setActiveTrendTab('trend')} className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-xs font-bold transition-all ${activeTrendTab === 'trend' ? 'bg-white text-[#4f46e5] shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                                <BarChart3 size={14} /> Tren Bulanan
                            </button>
                            <button onClick={() => setActiveTrendTab('channel')} className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-xs font-bold transition-all ${activeTrendTab === 'channel' ? 'bg-white text-[#4f46e5] shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                                <Globe size={14} /> Jalur Penjualan
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative">
                        {activeTrendTab === 'trend' && (
                            <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <ReactECharts option={trendChartOption} style={{ height: '100%', width: '100%' }} />
                            </div>
                        )}
                        {activeTrendTab === 'channel' && (
                            <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <ReactECharts option={channelChartOption} style={{ height: '100%', width: '100%' }} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col h-[480px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl"><LayoutList size={20} /></div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Portofolio Bisnis</h3>
                                <p className="text-slate-500 text-xs mt-0.5">Produk terlaris & kontribusi mitra</p>
                            </div>
                        </div>
                        <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-[20px] shrink-0">
                            <button onClick={() => setActivePortoTab('produk')} className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-xs font-bold transition-all ${activePortoTab === 'produk' ? 'bg-white text-[#4f46e5] shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                                <PackageSearch size={14} /> Kategori Produk
                            </button>
                            <button onClick={() => setActivePortoTab('retailer')} className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-xs font-bold transition-all ${activePortoTab === 'retailer' ? 'bg-white text-[#4f46e5] shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                                <Store size={14} /> Mitra Retailer
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative">
                        {activePortoTab === 'produk' && (
                            <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <ReactECharts option={productChartOption} style={{ height: '100%', width: '100%' }} />
                            </div>
                        )}
                        {activePortoTab === 'retailer' && (
                            <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <ReactECharts option={retailerChartOption} style={{ height: '100%', width: '100%' }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } } .animate-float { animation: float 6s ease-in-out infinite; }` }} />
        </div>
    );
}