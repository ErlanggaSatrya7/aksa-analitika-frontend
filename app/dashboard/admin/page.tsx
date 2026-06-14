"use client";
import React, { useState, useEffect } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { ShoppingCart, Package, Percent, Map as MapIcon, Loader2, ArrowRight, PackageSearch, Store, BarChart3, Globe, Activity, LayoutList, BrainCircuit, ServerCrash } from 'lucide-react';
import Link from 'next/link';

export default function RingkasanNasional() {
    const [isLoading, setIsLoading] = useState(true);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    const [activeTrendTab, setActiveTrendTab] = useState<'trend' | 'channel'>('trend');
    const [activePortoTab, setActivePortoTab] = useState<'produk' | 'retailer'>('produk');
    const [dashboardData, setDashboardData] = useState<any>(null);

    const [fastApiStatus, setFastApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [dbLatency, setDbLatency] = useState<number>(0);

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const res = await fetch('/indonesia.geojson');
                if (!res.ok) throw new Error("File GeoJSON tidak ditemukan (404)");
                const geoJson = await res.json();
                return geoJson;
            } catch (error) {
                console.error("Gagal memuat peta:", error);
                return null;
            }
        };

        const fetchDashboardData = async () => {
            const startTime = performance.now();
            try {
                const res = await fetch('/api/admin/analytics/dashboard');
                const data = await res.json();
                const endTime = performance.now();
                setDbLatency(Math.round(endTime - startTime));
                return data;
            } catch (error) {
                console.error("Gagal memuat data dashboard:", error);
                return null;
            }
        };

        const checkSystemHealth = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/health');
                if (res.ok) setFastApiStatus('online');
                else setFastApiStatus('offline');
            } catch {
                setFastApiStatus('offline');
            }
        };

        Promise.all([fetchMapData(), fetchDashboardData()])
            .then(([mapData, dbData]) => {
                if (mapData && mapData.features) {
                    const geojsonNameTranslator: Record<string, string> = {
                        "IRIAN JAYA TIMUR": "PAPUA", "IRIAN JAYA TENGAH": "PAPUA", "IRIAN JAYA BARAT": "PAPUA",
                        "NUSATENGGARA BARAT": "NTB", "NUSA TENGGARA TIMUR": "NTT", "DAERAH ISTIMEWA YOGYAKARTA": "DI YOGYAKARTA",
                        "PROBANTEN": "BANTEN", "DI. ACEH": "NAD ACEH", "JAWA TENGAH": "JAWA TENGAH", "JAWA TIMUR": "JAWA TIMUR",
                        "MALUKU UTARA": "MALUKU UTARA", "MALUKU": "MALUKU", "KALIMANTAN SELATAN": "KALIMANTAN SELATAN",
                        "KALIMANTAN BARAT": "KALIMANTAN BARAT", "SULAWESI SELATAN": "SULAWESI SELATAN", "DKI JAKARTA": "DKI JAKARTA",
                        "JAWA BARAT": "JAWA BARAT", "GORONTALO": "GORONTALO", "SULAWESI TENGGARA": "SULAWESI TENGGARA",
                        "RIAU": "RIAU", "SULAWESI TENGAH": "SULAWESI TENGAH", "KALIMANTAN TIMUR": "KALIMANTAN TIMUR",
                        "SULAWESI UTARA": "SULAWESI UTARA", "SUMATERA UTARA": "SUMATERA UTARA",
                        "BANGKA BELITUNG": "BANGKA BELITUNG", "KEPULAUAN BANGKA BELITUNG": "BANGKA BELITUNG", "KEP. BANGKA BELITUNG": "BANGKA BELITUNG",
                        "SUMATERA BARAT": "SUMATERA BARAT", "KALIMANTAN TENGAH": "KALIMANTAN TENGAH", "SUMATERA SELATAN": "SUMATERA SELATAN",
                        "JAMBI": "JAMBI", "LAMPUNG": "LAMPUNG", "BENGKULU": "BENGKULU", "SULAWESI BARAT": "SULAWESI BARAT",
                        "KALIMANTAN UTARA": "KALIMANTAN UTARA", "BALI": "BALI",
                        "KEPULAUAN RIAU": "KEPULAUAN RIAU", "KEP. RIAU": "KEPULAUAN RIAU", "KEPRI": "KEPULAUAN RIAU"
                    };

                    mapData.features.forEach((feature: any) => {
                        let rawName = feature.properties.Propinsi || feature.properties.state || feature.properties.NAME_1 || "";
                        let pName = rawName.toUpperCase();
                        if (geojsonNameTranslator[pName]) {
                            pName = geojsonNameTranslator[pName];
                        }
                        feature.properties.Propinsi = pName;
                    });

                    echarts.registerMap('indonesia_nasional', mapData);
                    setIsMapLoaded(true);
                }

                setDashboardData(dbData);
                setIsLoading(false);
            });

        checkSystemHealth();
        const interval = setInterval(checkSystemHealth, 15000);
        return () => clearInterval(interval);
    }, []);

    const mapDataFormatted = dashboardData?.mapDistribution?.map((d: any) => ({
        name: d.name.toUpperCase(),
        value: d.value
    })) || [];

    const miniMapOption = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', backgroundColor: '#ffffff', textStyle: { color: '#0F172A', fontSize: 13 }, borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14], formatter: (params: any) => `<div style="font-weight:600; font-size:11px; text-transform:uppercase; color:#64748B; margin-bottom:4px;">${params.name || 'Wilayah'}</div><div style="color:#6A7BFA; font-weight:bold; font-size:15px;">${params.value ? (params.value).toLocaleString('id-ID') : 0} Unit</div>` },
        visualMap: { min: 0, max: 50000, text: ['Tinggi', 'Rendah'], realtime: false, calculable: true, inRange: { color: ['#EDF2FE', '#A3B1FF', '#4f46e5'] }, show: false },
        series: [{
            name: 'Volume Provinsi',
            type: 'map',
            map: 'indonesia_nasional',
            nameProperty: 'Propinsi',
            roam: true,
            label: { show: false },
            itemStyle: { areaColor: '#E2E8F0', borderColor: '#FFFFFF', borderWidth: 1 },
            emphasis: { itemStyle: { areaColor: '#A3B1FF' }, label: { show: false } },
            data: mapDataFormatted
        }]
    };

    const trendChartOption = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            padding: [12, 16],
            textStyle: { color: '#0F172A', fontSize: 13 },
            axisPointer: { type: 'line', lineStyle: { color: '#CBD5E1', width: 1, type: 'dashed' } },
            formatter: (params: any) => {
                const val = params[0].value ? params[0].value.toLocaleString('id-ID') : 0;
                return `
                    <div style="font-weight:700; margin-bottom:6px; color:#64748B; font-size:12px;">${params[0].name}</div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:#4f46e5;"></span>
                        <span style="font-weight:800; color:#0F172A; font-size:15px;">${val} <span style="font-weight:500; color:#64748B; font-size:13px;">Unit</span></span>
                    </div>
                `;
            }
        },
        grid: { left: '2%', right: '5%', bottom: '15%', top: '15%', containLabel: true }, // RUANG BAWAH DIPERBESAR
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dashboardData?.trendLine?.labels || [],
            axisLine: { lineStyle: { color: '#E2E8F0' } },
            axisLabel: {
                color: '#64748B',
                fontWeight: '600',
                margin: 12,
                interval: 0,           // Mencegah ada bulan yang diloncati
                hideOverlap: false,    // Mencegah Echarts menyembunyikan label otomatis
                rotate: 45,            // Dimiringkan agar rapi
                fontSize: 10
            },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#94A3B8',
                fontWeight: '500',
                formatter: (value: number) => {
                    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                    if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                    return value;
                }
            },
            splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } }
        },
        series: [{
            name: 'Total Unit',
            type: 'line',
            smooth: 0.4,
            symbol: 'circle',
            symbolSize: 8,
            showSymbol: true,
            label: {
                show: true,
                position: 'top',
                color: '#4f46e5',
                fontWeight: 'bold',
                fontSize: 11,
                formatter: (params: any) => {
                    let val = params.value;
                    if (val === 0) return ''; // Sembunyikan label jika 0 agar bersih
                    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
                    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
                    return val;
                }
            },
            itemStyle: { color: '#ffffff', borderColor: '#4f46e5', borderWidth: 2, shadowColor: 'rgba(79, 70, 229, 0.4)', shadowBlur: 4 },
            lineStyle: {
                width: 4,
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#A3B1FF' }, { offset: 1, color: '#4f46e5' }
                ]),
                shadowColor: 'rgba(79, 70, 229, 0.3)', shadowBlur: 8, shadowOffsetY: 6
            },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(79, 70, 229, 0.4)' },
                    { offset: 0.8, color: 'rgba(79, 70, 229, 0.05)' },
                    { offset: 1, color: 'rgba(79, 70, 229, 0)' }
                ])
            },
            data: dashboardData?.trendLine?.values || []
        }]
    };

    const channelChartOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        // grid: { left: '2%', right: '15%', bottom: '5%', top: '10%', containLabel: true },    
        grid: { left: '2%', right: '5%', bottom: '20%', top: '15%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: dashboardData?.salesMethod?.map((d: any) => d.name) || [], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontWeight: '700', color: '#475569' } },
        series: [{ name: 'Unit Terjual', type: 'bar', barWidth: '45%', data: dashboardData?.salesMethod?.map((d: any, i: number) => ({ value: d.value, itemStyle: { color: i === 0 ? '#4f46e5' : i === 1 ? '#6A7BFA' : '#A3B1FF', borderRadius: [0, 6, 6, 0] } })) || [], label: { show: true, position: 'right', formatter: '{c}', fontWeight: 'bold' } }]
    };

    const productChartOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '2%', right: '12%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: dashboardData?.topProducts?.map((d: any) => d.name).reverse() || [], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontWeight: '600', color: '#0F172A', fontSize: 10 } },
        series: [{ name: 'Volume (Unit)', type: 'bar', data: dashboardData?.topProducts?.map((d: any) => d.value).reverse() || [], itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#6A7BFA' }, { offset: 1, color: '#4f46e5' }]), borderRadius: [0, 6, 6, 0] }, barWidth: '45%', label: { show: true, position: 'right', formatter: '{c}', color: '#64748B', fontWeight: '700', fontSize: 10 } }]
    };

    const retailerChartOption = {
        tooltip: {
            trigger: 'item',
            formatter: '<div style="font-weight:bold; margin-bottom:4px;">{b}</div><div style="color:#6A7BFA; font-weight:bold;">{c} Unit ({d}%)</div>',
            backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14]
        },
        legend: { type: 'scroll', bottom: '0%', left: 'center', icon: 'circle', itemGap: 15, textStyle: { color: '#475569', fontWeight: '500', fontSize: 11 } },
        series: [{
            name: 'Retailer', type: 'pie', radius: ['35%', '60%'], center: ['50%', '42%'], avoidLabelOverlap: true,
            itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
            label: { show: true, formatter: '{b}\n{d}%', fontWeight: 'bold', fontSize: 10, color: '#475569' },
            labelLine: { show: true, length: 10, length2: 10 },
            data: dashboardData?.retailerShare?.map((d: any) => ({ name: d.name || d.retailer || 'Unknown Retailer', value: d.value || d.units || d.total || 0 })) || []
        }]
    };

    if (isLoading) return <div className="w-full h-[80vh] flex flex-col items-center justify-center text-[#6A7BFA] gap-4"><Loader2 size={36} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm">Memuat Database Nasional...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8">
            {/* HERO SECTION */}
            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] rounded-[40px] p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-transform duration-1000" />
                <div className="relative z-10 max-w-3xl text-white">
                    <h2 className="text-[32px] lg:text-[40px] font-bold mb-4 tracking-tight leading-tight">Ringkasan Eksekutif Nasional.<br />Performa Bisnis Real-time.</h2>
                    <p className="text-white/90 text-sm lg:text-base leading-relaxed mb-8">Pantau wawasan komprehensif terkait performa volume penjualan unit dan sebaran inventaris<br className="hidden md:block" />di seluruh wilayah operasional Indonesia.</p>
                    <Link href="/dashboard/admin/map"><button className="bg-white text-[#4f46e5] hover:bg-[#EDF2FE] hover:shadow-xl hover:-translate-y-1 font-bold py-3.5 px-8 rounded-[40px] transition-all active:scale-95 text-sm flex items-center gap-2 group/btn">Lihat Peta Lengkap <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" /></button></Link>
                </div>
                <div className="hidden lg:block w-[320px] h-[260px] relative z-10 mr-4 animate-float"><img src="/ilustrasi-superAdmin-nobg-fix.png" alt="Illustration" className="w-full h-full object-contain drop-shadow-2xl scale-125" /></div>
            </div>

            {/* 4 KARTU METRIK & STATUS AI */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><ShoppingCart size={24} /></div>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Total Penjualan</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">{(dashboardData?.summary?.totalUnits / 1000000).toFixed(1) || 0} <span className="text-xl lg:text-2xl text-slate-400 font-medium">Juta Unit</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><Percent size={24} /></div>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Rata-Rata Margin</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">{dashboardData?.summary?.avgMargin?.toFixed(1) || 0}<span className="text-xl lg:text-2xl text-slate-400 font-medium">%</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><Package size={24} /></div>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Total Pendapatan</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">{(dashboardData?.summary?.totalSales / 1000000000).toFixed(1) || 0} <span className="text-lg lg:text-xl text-slate-400 font-medium capitalize">Miliar</span></h3>
                    </div>
                </div>

                <div className={`bg-white rounded-[32px] p-6 lg:p-8 border shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 group/card ${fastApiStatus === 'online' ? 'hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)] border-slate-100' : 'hover:shadow-[0_20px_40px_-15px_rgba(239,68,68,0.2)] border-red-100'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-3.5 rounded-2xl transition-colors ${fastApiStatus === 'checking' ? 'bg-slate-100 text-slate-400' : fastApiStatus === 'online' ? 'bg-emerald-50 text-emerald-600 group-hover/card:bg-emerald-500 group-hover/card:text-white' : 'bg-red-50 text-red-500 group-hover/card:bg-red-500 group-hover/card:text-white'}`}>
                            {fastApiStatus === 'offline' ? <ServerCrash size={24} /> : <BrainCircuit size={24} />}
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border ${fastApiStatus === 'checking' ? 'bg-slate-50 text-slate-500' : fastApiStatus === 'online' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600 animate-pulse'}`}>
                            {fastApiStatus === 'checking' ? 'Checking' : fastApiStatus === 'online' ? <><Activity size={10} /> {dbLatency}ms</> : 'Terputus'}
                        </span>
                    </div>
                    <div>
                        <p className={`text-[11px] lg:text-xs font-bold uppercase tracking-widest mb-1.5 transition-colors ${fastApiStatus === 'online' ? 'text-slate-500 group-hover/card:text-emerald-600' : 'text-red-500'}`}>
                            AKSA AI & MLOps
                        </p>
                        <h3 className={`text-3xl lg:text-4xl font-bold tracking-tight ${fastApiStatus === 'checking' ? 'text-slate-400' : fastApiStatus === 'online' ? 'text-slate-900' : 'text-red-600'}`}>
                            {fastApiStatus === 'checking' ? '...' : fastApiStatus === 'online' ? 'Online' : 'Offline'}
                        </h3>
                    </div>
                </div>

            </div>

            {/* MAP & PERFORMA REGIONAL */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-6 px-2 relative z-10">
                        <div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl"><MapIcon size={20} /></div>
                        <div><h3 className="text-xl font-bold text-slate-900">Sebaran Penjualan Unit</h3><p className="text-slate-500 text-xs mt-0.5">Performa wilayah aktual berdasar letak geografis</p></div>
                    </div>

                    <div className="w-full h-[400px] relative z-10 rounded-[24px] bg-[#F8FAFC] border border-slate-100 overflow-hidden flex items-center justify-center">
                        {isMapLoaded ? (
                            <ReactECharts option={miniMapOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 font-semibold text-sm gap-3">
                                <Loader2 size={32} className="animate-spin text-[#6A7BFA]" />
                                <span className="text-slate-500">Menyinkronkan Peta Interaktif...</span>
                                <span className="text-xs font-normal text-slate-400">Pastikan file indonesia.geojson ada di folder public/</span>
                            </div>
                        )}
                    </div>
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

            {/* CHART ANALYTICS */}
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