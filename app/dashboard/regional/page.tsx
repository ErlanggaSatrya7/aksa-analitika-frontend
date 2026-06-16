"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import {
    ShoppingCart, Package, Percent, Activity, LayoutList, ShoppingBag,
    Map as MapIcon, Loader2, ArrowRight, PackageSearch, Store, BarChart3,
    BellRing, BrainCircuit, CheckCircle2, ServerCrash, Zap, Tag, Info
} from 'lucide-react';
import Link from 'next/link';

export default function RegionalDashboardPage() {
    const { data: session } = useSession();
    const userState = (session?.user as any)?.assignedState || '';
    const userEmail = session?.user?.email || '';

    const echartsRef = useRef<ReactECharts>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    // SISTEM DIAGNOSTIK
    const [fastApiStatus, setFastApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [dbLatency, setDbLatency] = useState<number>(0);

    const [activeTrendTab, setActiveTrendTab] = useState<'trend' | 'metode'>('trend');
    const [activePortoTab, setActivePortoTab] = useState<'produk' | 'retailer'>('produk');
    const [dashboardData, setDashboardData] = useState<any>(null);

    // COMMAND CENTER FEED
    const [instructions, setInstructions] = useState<any[]>([]);

    // FETCH DATA DASHBOARD
    useEffect(() => {
        if (!userState || !userEmail) return;

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

        const startTime = performance.now();
        Promise.all([
            fetch('/indonesia.geojson').then(async (res) => {
                const text = await res.text();
                try { return JSON.parse(text); } catch (e) { return null; }
            }),
            fetch(`/api/regional/analytics/dashboard?state=${encodeURIComponent(userState)}`, { cache: 'no-store' }),
            fetch(`/api/admin/notifications?email=${userEmail}`, { cache: 'no-store' }).then(res => {
                if (res.ok) return res.json();
                return [];
            })
        ])
            .then(async ([mapData, resDb, notifs]) => {
                const endTime = performance.now();
                setDbLatency(Math.round(endTime - startTime));

                let dbData = null;
                if (resDb.ok) {
                    dbData = await resDb.json();
                }

                // FILTER PETA HANYA UNTUK PROVINSI USER
                if (mapData && mapData.features) {
                    const geojsonNameTranslator: Record<string, string> = {
                        "ACEH": "NAD ACEH", "BANGKA-BELITUNG": "BANGKA BELITUNG",
                        "JAKARTA RAYA": "DKI JAKARTA", "YOGYAKARTA": "DI YOGYAKARTA",
                        "NUSA TENGGARA BARAT": "NTB", "NUSA TENGGARA TIMUR": "NTT"
                    };

                    const userStateUpper = userState.toUpperCase();

                    mapData.features = mapData.features.filter((feature: any) => {
                        let rawName = feature.properties.state || feature.properties.Propinsi || feature.properties.NAME_1 || "";
                        let pName = rawName.toUpperCase();
                        if (geojsonNameTranslator[pName]) pName = geojsonNameTranslator[pName];
                        feature.properties.name = pName;
                        return pName === userStateUpper;
                    });

                    echarts.registerMap('regional_view', mapData);
                    setIsMapLoaded(true);
                }

                setDashboardData(dbData);

                // FILTER MEMO TARGET
                if (Array.isArray(notifs)) {
                    const commandFeeds = notifs.filter((n: any) => n.title.includes('Memo Target'));
                    setInstructions(commandFeeds.slice(0, 3));
                }

                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Error memuat data regional:", err);
                setIsLoading(false);
            });

        checkSystemHealth();
        const interval = setInterval(checkSystemHealth, 15000);
        return () => clearInterval(interval);
    }, [userState, userEmail]);

    // OPSI PETA (MENGGUNAKAN WARNA IDENTITAS #EDF2FE dan #4f46e5)
    const mapOption = useMemo(() => {
        const mapData = dashboardData?.mapDistribution || [{ name: userState.toUpperCase(), value: dashboardData?.summary?.totalUnits || 0 }];
        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDF2FE', padding: [12, 16],
                extraCssText: 'border-radius: 12px; box-shadow: 0 10px 30px -10px rgba(79,70,229,0.15);',
                formatter: (params: any) => `
                    <div style="font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:#6A7BFA; margin-bottom:6px;">Wilayah Kerja</div>
                    <div style="color:#0F172A; font-weight:800; font-size:16px;">${params.name || 'Memuat...'}</div>
                    <div style="color:#4F46E5; font-weight:700; margin-top:4px; font-size:14px;">Total Volume: ${(params.value || 0).toLocaleString('id-ID')} Unit</div>
                `
            },
            visualMap: { min: 0, max: 50000, show: false, inRange: { color: ['#EDF2FE', '#4F46E5'] } },
            series: [{
                type: 'map', map: 'regional_view', nameProperty: 'name', roam: true,
                scaleLimit: { min: 0.5, max: 10 }, zoom: 1.2,
                label: { show: true, color: '#4f46e5', fontSize: 13, formatter: '{b}', fontWeight: 'bold' },
                itemStyle: { areaColor: '#EDF2FE', borderColor: '#FFFFFF', borderWidth: 1.5 },
                emphasis: {
                    itemStyle: { areaColor: '#6A7BFA', borderColor: '#FFFFFF', borderWidth: 2, shadowBlur: 10, shadowColor: 'rgba(79,70,229,0.3)' },
                    label: { show: true, color: '#FFFFFF', fontWeight: 'bold', fontSize: 11, backgroundColor: '#4f46e5', padding: [4, 8], borderRadius: 4 }
                },
                data: mapData
            }]
        };
    }, [userState, dashboardData]);

    // PERBAIKAN GRAFIK: Label dinyalakan agar angka terlihat tanpa perlu hover
    const trendChartOption = {
        tooltip: { trigger: 'axis', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDF2FE', padding: 12, extraCssText: 'border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);' },
        grid: { left: '2%', right: '4%', bottom: '5%', top: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: dashboardData?.trendLine?.labels || [], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#64748B', fontWeight: '600', margin: 16 } },
        yAxis: { type: 'value', axisLabel: { color: '#94A3B8', fontWeight: '500' }, splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } } },
        series: [{
            name: 'Total Unit', type: 'line', smooth: true, symbol: 'circle', symbolSize: 10, showSymbol: true,
            itemStyle: { color: '#4F46E5', borderColor: '#ffffff', borderWidth: 2 },
            lineStyle: { width: 4, shadowColor: 'rgba(79,70,229,0.3)', shadowBlur: 10, shadowOffsetY: 5 },
            areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(106, 123, 250, 0.3)' }, { offset: 1, color: 'rgba(79, 70, 229, 0)' }]) },
            label: { show: true, position: 'top', formatter: '{c}', fontSize: 11, fontWeight: '800', color: '#4f46e5', padding: [0, 0, 4, 0] },
            data: dashboardData?.trendLine?.values || []
        }]
    };

    const channelChartOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDF2FE', extraCssText: 'border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);' },
        grid: { left: '2%', right: '15%', bottom: '5%', top: '5%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: dashboardData?.salesMethod?.map((d: any) => d.name) || [], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontWeight: '800', color: '#1E293B', margin: 16 } },
        series: [{
            name: 'Unit Terjual', type: 'bar', barWidth: '35%',
            data: dashboardData?.salesMethod?.map((d: any, i: number) => ({ value: d.value, itemStyle: { color: i === 0 ? '#4F46E5' : '#818CF8', borderRadius: [0, 8, 8, 0] } })) || [],
            label: { show: true, position: 'right', formatter: '{c} Unit', fontWeight: '800', color: '#4F46E5', padding: [0, 0, 0, 8] }
        }]
    };

    const activeProducts = dashboardData?.topProducts || [];

    const productChartOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDF2FE', extraCssText: 'border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);' },
        grid: { left: '2%', right: '15%', bottom: '5%', top: '5%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: activeProducts.map((d: any) => d.name).reverse(), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontWeight: '700', color: '#475569', fontSize: 11, margin: 16 } },
        series: [{
            name: 'Volume (Unit)', type: 'bar', data: activeProducts.map((d: any) => d.value).reverse(),
            itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#818CF8' }, { offset: 1, color: '#4F46E5' }]), borderRadius: [0, 8, 8, 0] },
            barWidth: '40%',
            label: { show: true, position: 'right', formatter: '{c}', color: '#334155', fontWeight: '800', fontSize: 11, padding: [0, 0, 0, 8] }
        }]
    };

    const retailerChartOption = {
        tooltip: { trigger: 'item', formatter: '<div style="font-weight:bold; margin-bottom:4px; color:#475569;">{b}</div><div style="color:#4F46E5; font-weight:900; font-size:16px;">{c} Unit <span style="font-weight:600; font-size:12px; color:#94A3B8;">({d}%)</span></div>', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDF2FE', padding: [12, 16], extraCssText: 'border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);' },
        legend: { bottom: '0%', left: 'center', icon: 'circle', itemGap: 24, textStyle: { color: '#64748B', fontWeight: '700', fontSize: 11 } },
        color: ['#4F46E5', '#6A7BFA', '#818CF8', '#A3B1FF', '#C7D2FE', '#E0E7FF'],
        series: [{
            name: 'Retailer', type: 'pie', radius: ['45%', '75%'], center: ['50%', '42%'], avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#ffffff', borderWidth: 4 },
            label: { show: false }, data: dashboardData?.retailerShare || []
        }]
    };

    if (isLoading) return (
        <div className="w-full h-[80vh] flex flex-col items-center justify-center text-[#4f46e5] gap-4">
            <Loader2 size={40} className="animate-spin" />
            <span className="font-bold tracking-widest uppercase text-sm text-slate-500">Menyinkronkan Pusat Data...</span>
        </div>
    );

    return (
        <div className="pb-12 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">

            {/* ================= HERO SECTION ================= */}
            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] rounded-[40px] p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
                <div className="relative z-10 max-w-3xl text-white">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
                        <Zap size={14} className="text-amber-300" />
                        <span className="text-xs font-bold tracking-widest uppercase">Regional Command</span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight leading-[1.1]">
                        Ringkasan Performa.<br />
                        <span className="text-[#E0E7FF]">Provinsi {userState}.</span>
                    </h2>
                    <p className="text-indigo-50/90 text-sm lg:text-base leading-relaxed mb-8 max-w-xl font-medium">
                        Pantau wawasan komprehensif terkait performa volume penjualan, produk unggulan, dan sebaran inventaris secara real-time.
                    </p>
                    <Link href="/dashboard/regional/forecast">
                        <button className="bg-white text-[#4f46e5] hover:bg-[#EDF2FE] hover:shadow-xl hover:-translate-y-1 font-bold py-3.5 px-8 rounded-full transition-all active:scale-95 text-sm flex items-center gap-2 group/btn shadow-md">
                            Buka Analisis AI Cabang <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
                <div className="hidden lg:block w-[340px] h-[280px] relative z-10 mr-4 animate-float opacity-90 group-hover:opacity-100 transition-opacity">
                    <img src="/ilustrasi-provinsi-nobg-new.png" alt="Illustration" className="w-full h-full object-contain drop-shadow-2xl scale-110" />
                </div>
            </div>

            {/* ================= STRATEGIC COMMAND CENTER ================= */}
            <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#EDF2FE] text-[#4f46e5] rounded-2xl relative">
                            <BellRing size={24} />
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-ping"></span>
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-xl tracking-tight">Pusat Komando Wilayah</h3>
                            <p className="text-sm text-slate-500 font-medium">Instruksi operasional & memo notifikasi terbaru dari pusat.</p>
                        </div>
                    </div>
                    <Link href="/dashboard/regional/inbox">
                        <button className="text-sm font-bold text-[#4f46e5] bg-[#EDF2FE] hover:bg-[#C7D2FE] px-5 py-2.5 rounded-full transition-colors active:scale-95">
                            Lihat Semua Memo
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {instructions.length === 0 ? (
                        <div className="col-span-3 py-10 text-center flex flex-col items-center justify-center bg-slate-50/50 rounded-[24px] border border-dashed border-slate-200">
                            <CheckCircle2 size={32} className="text-slate-300 mb-3" />
                            <p className="text-slate-500 font-semibold">Semua tugas wilayah telah diselesaikan.</p>
                            <p className="text-sm text-slate-400 mt-1">Belum ada instruksi atau memo hari ini.</p>
                        </div>
                    ) : (
                        instructions.map((ins, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-[24px] border border-slate-100 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(79,70,229,0.15)] hover:border-[#EDF2FE] group/memo">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#6A7BFA] to-[#4f46e5] opacity-0 group-hover/memo:opacity-100 transition-opacity"></div>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#4f46e5] uppercase tracking-widest bg-[#EDF2FE] px-2.5 py-1.5 rounded-md border border-[#4f46e5]/10">
                                        <BrainCircuit size={12} /> Memo AI Pusat
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">
                                        {new Date(ins.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-base font-bold text-slate-800 line-clamp-1 mt-1 group-hover/memo:text-[#4f46e5] transition-colors">
                                    {ins.title.replace('Memo Target: ', '')}
                                </p>
                                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                                    {ins.description.replace(/[*_#]/g, '')}
                                </p>
                                <div className="mt-auto pt-4 flex items-center gap-1.5 text-[11px] font-bold text-[#4f46e5]">
                                    <CheckCircle2 size={14} /> Memerlukan Perhatian Cabang
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ================= KPI CARDS ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(79,70,229,0.1)] hover:-translate-y-1 group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all shadow-sm"><ShoppingCart size={24} /></div>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Volume Penjualan</p>
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
                            {dashboardData?.summary?.totalUnits ? (dashboardData.summary.totalUnits / 1000).toFixed(1) : 0}
                            <span className="text-lg lg:text-xl text-slate-400 font-semibold ml-1">Ribu Unit</span>
                        </h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(79,70,229,0.1)] hover:-translate-y-1 group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all shadow-sm"><Percent size={24} /></div>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rata-Rata Margin</p>
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
                            {dashboardData?.summary?.avgMargin?.toFixed(1) || 0}
                            <span className="text-lg lg:text-xl text-slate-400 font-semibold ml-1">%</span>
                        </h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(79,70,229,0.1)] hover:-translate-y-1 group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all shadow-sm"><Package size={24} /></div>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Pendapatan</p>
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
                            {dashboardData?.summary?.totalSales ? (dashboardData.summary.totalSales / 1000000000).toFixed(1) : 0}
                            <span className="text-lg lg:text-xl text-slate-400 font-semibold ml-1">Miliar</span>
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
                            {fastApiStatus === 'checking' ? 'Memeriksa...' : fastApiStatus === 'online' ? <><span className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] animate-ping"></span> {dbLatency}ms</> : 'Koneksi Terputus'}
                        </span>
                    </div>
                    <div className="relative z-10">
                        <p className={`text-[11px] lg:text-xs font-bold uppercase tracking-widest mb-2 transition-colors ${fastApiStatus === 'online' ? 'text-slate-400 group-hover/card:text-[#4f46e5]' : 'text-red-500'}`}>
                            Sistem AI & MLOps
                        </p>
                        <h3 className={`text-3xl lg:text-4xl font-black tracking-tight ${fastApiStatus === 'checking' ? 'text-slate-300' : fastApiStatus === 'online' ? 'text-slate-800' : 'text-red-600'}`}>
                            {fastApiStatus === 'checking' ? '...' : fastApiStatus === 'online' ? 'Optimal' : 'Offline'}
                        </h3>
                    </div>
                </div>
            </div>

            {/* ================= MAP & TOP PRODUCTS ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* MAP SECTION */}
                <div className="lg:col-span-3 bg-white rounded-[40px] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col relative group">
                    <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl"><MapIcon size={20} /></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Peta Distribusi Regional</h3>
                                <p className="text-slate-500 text-xs font-medium mt-0.5">Pemetaan visual fokus area {userState}.</p>
                            </div>
                        </div>
                        <span className="hidden sm:block text-[10px] bg-slate-50 text-slate-500 px-3 py-1.5 rounded-md border border-slate-200 font-bold uppercase tracking-widest">
                            Fokus: {userState}
                        </span>
                    </div>

                    <div className="w-full h-[450px] lg:h-[500px] relative rounded-[32px] bg-[#F8FAFC] overflow-hidden mt-2">
                        {isMapLoaded ? (
                            <ReactECharts ref={echartsRef} option={mapOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-semibold text-sm gap-3">
                                <Loader2 size={32} className="animate-spin text-[#4f46e5]" />
                                <span>Menyiapkan Peta Geografis...</span>
                            </div>
                        )}
                        <div className="absolute bottom-5 left-5 text-[10px] font-bold text-slate-500 bg-white/80 px-4 py-2 rounded-full backdrop-blur-md border border-slate-200 shadow-sm pointer-events-none uppercase tracking-widest flex items-center gap-1.5">
                            <Info size={14} /> Area Statis
                        </div>
                    </div>
                </div>

                {/* TOP PRODUCTS SECTION */}
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[40px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col h-full">
                    <div className="mb-2 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl"><ShoppingBag size={20} /></div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Top Produk Wilayah</h3>
                        </div>
                        <p className="text-xs font-medium text-slate-500 ml-14">Berdasarkan volume aktual di {userState}.</p>
                    </div>

                    <div className="flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar mt-4 pr-2 pb-2">
                        {activeProducts.length === 0 ? (
                            <div className="text-center text-slate-400 font-semibold text-sm h-full flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                Belum ada data penjualan tersedia.
                            </div>
                        ) : activeProducts.map((prod: any, i: number) => {
                            const colors = ['bg-[#312E81]', 'bg-[#4f46e5]', 'bg-[#6A7BFA]', 'bg-[#818CF8]', 'bg-[#A3B1FF]', 'bg-[#C7D2FE]', 'bg-[#E0E7FF]'];
                            const maxVal = activeProducts[0]?.value || 1;
                            const percentage = (prod.value / maxVal) * 100;

                            return (
                                <div key={i} className="group/item cursor-default flex flex-col justify-center">
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="font-bold text-[13px] text-slate-700 group-hover/item:text-[#4f46e5] transition-colors truncate pr-4">
                                            {i + 1}. {prod.name}
                                        </span>
                                        <span className="font-black text-sm text-slate-900 group-hover/item:text-[#4f46e5] transition-colors shrink-0">
                                            {(prod.value).toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-bold uppercase">Pcs</span>
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden shadow-inner">
                                        <div
                                            className={`${colors[i % colors.length]} h-full rounded-full transition-all duration-1000 ease-out group-hover/item:brightness-110 relative`}
                                            style={{ width: `${percentage}%` }}
                                        >
                                            <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent to-white/20"></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ================= CHARTS SECTION ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Analisis Kinerja */}
                <div className="bg-white rounded-[40px] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col h-[500px]">
                    <div className="px-6 pt-6 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl"><Activity size={20} /></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Analisis Kinerja</h3>
                                <p className="text-slate-500 text-xs font-medium mt-0.5">Tren riwayat & performa metode beli.</p>
                            </div>
                        </div>

                        {/* Segmented Control Modern (TREN / METODE PEMBELIAN) */}
                        <div className="flex p-1 bg-slate-100 rounded-xl shrink-0 border border-slate-200 shadow-inner">
                            <button
                                onClick={() => setActiveTrendTab('trend')}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${activeTrendTab === 'trend' ? 'bg-white text-[#4f46e5] shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <BarChart3 size={14} /> Tren Bulanan
                            </button>
                            <button
                                onClick={() => setActiveTrendTab('metode')}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${activeTrendTab === 'metode' ? 'bg-white text-[#4f46e5] shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Tag size={14} /> Metode Pembelian
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative mt-4">
                        {activeTrendTab === 'trend' && <div className="absolute inset-0 animate-in fade-in zoom-in-95 duration-300"><ReactECharts option={trendChartOption} style={{ height: '100%', width: '100%' }} /></div>}
                        {activeTrendTab === 'metode' && <div className="absolute inset-0 animate-in fade-in zoom-in-95 duration-300"><ReactECharts option={channelChartOption} style={{ height: '100%', width: '100%' }} /></div>}
                    </div>
                </div>

                {/* Portofolio Kategori */}
                <div className="bg-white rounded-[40px] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col h-[500px]">
                    <div className="px-6 pt-6 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl"><LayoutList size={20} /></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Distribusi Portofolio</h3>
                                <p className="text-slate-500 text-xs font-medium mt-0.5">Komposisi produk & pangsa pasar ritel.</p>
                            </div>
                        </div>

                        {/* Segmented Control Modern */}
                        <div className="flex p-1 bg-slate-100 rounded-xl shrink-0 border border-slate-200 shadow-inner">
                            <button
                                onClick={() => setActivePortoTab('produk')}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${activePortoTab === 'produk' ? 'bg-white text-[#4f46e5] shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <PackageSearch size={14} /> Kategori Produk
                            </button>
                            <button
                                onClick={() => setActivePortoTab('retailer')}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${activePortoTab === 'retailer' ? 'bg-white text-[#4f46e5] shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Store size={14} /> Mitra Retailer
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative mt-4">
                        {activePortoTab === 'produk' && <div className="absolute inset-0 animate-in fade-in zoom-in-95 duration-300"><ReactECharts option={productChartOption} style={{ height: '100%', width: '100%' }} /></div>}
                        {activePortoTab === 'retailer' && <div className="absolute inset-0 animate-in fade-in zoom-in-95 duration-300"><ReactECharts option={retailerChartOption} style={{ height: '100%', width: '100%' }} /></div>}
                    </div>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-12px); } 100% { transform: translateY(0px); } }
                .animate-float { animation: float 6s ease-in-out infinite; }
            `}} />
        </div>
    );
}