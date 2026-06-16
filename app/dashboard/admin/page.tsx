"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import {
    ShoppingCart, Package, Percent, Activity, LayoutList, ShoppingBag,
    Map as MapIcon, Loader2, ArrowRight, PackageSearch, Store, BarChart3,
    Globe, BellRing, BrainCircuit, CheckCircle2, ServerCrash
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const { data: session } = useSession();

    const userState = (session?.user as any)?.assignedState || 'Nasional';
    const userEmail = session?.user?.email || '';

    const echartsRef = useRef<ReactECharts>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    const [fastApiStatus, setFastApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [dbLatency, setDbLatency] = useState<number>(0);

    const [activeTrendTab, setActiveTrendTab] = useState<'trend' | 'channel'>('trend');
    const [activePortoTab, setActivePortoTab] = useState<'produk' | 'retailer'>('produk');

    const [dashboardData, setDashboardData] = useState<any>(null);
    const [instructions, setInstructions] = useState<any[]>([]);

    useEffect(() => {
        if (!userEmail) return;

        const checkSystemHealth = async () => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            try {
                const res = await fetch(`${apiUrl}/api/health`);
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
            fetch(`/api/admin/analytics/dashboard?state=${encodeURIComponent(userState)}&email=${encodeURIComponent(userEmail)}`),
            fetch(`/api/admin/notifications?email=${userEmail}`).then(res => {
                if (res.ok) return res.json();
                return [];
            })
        ])
            .then(async ([mapData, resDb, notifs]) => {
                const endTime = performance.now();
                setDbLatency(Math.round(endTime - startTime));

                let dbData: any = null;
                if (resDb.ok) {
                    try {
                        dbData = await resDb.json();
                    } catch (e) {
                        dbData = null;
                    }
                }

                if (mapData && mapData.features) {
                    // MENGGUNAKAN TRANSLATOR LENGKAP DARI FILE MAP YANG BERHASIL
                    const geojsonNameTranslator: Record<string, string> = {
                        "IRIAN JAYA TIMUR": "PAPUA", "IRIAN JAYA TENGAH": "PAPUA", "IRIAN JAYA BARAT": "PAPUA",
                        "NUSATENGGARA BARAT": "NTB", "NUSA TENGGARA TIMUR": "NTT", "DAERAH ISTIMEWA YOGYAKARTA": "DI YOGYAKARTA",
                        "PROBANTEN": "BANTEN", "DI. ACEH": "NAD ACEH", "JAWA TENGAH": "JAWA TENGAH", "JAWA TIMUR": "JAWA TIMUR",
                        "MALUKU UTARA": "MALUKU UTARA", "MALUKU": "MALUKU", "KALIMANTAN SELATAN": "KALIMANTAN SELATAN",
                        "KALIMANTAN BARAT": "KALIMANTAN BARAT", "SULAWESI SELATAN": "SULAWESI SELATAN", "DKI JAKARTA": "DKI JAKARTA",
                        "JAWA BARAT": "JAWA BARAT", "GORONTALO": "GORONTALO", "SULAWESI TENGGARA": "SULAWESI TENGGARA",
                        "RIAU": "RIAU", "SULAWESI TENGAH": "SULAWESI TENGAH", "KALIMANTAN TIMUR": "KALIMANTAN TIMUR",
                        "SULAWESI UTARA": "SULAWESI UTARA", "SUMATERA UTARA": "SUMATERA UTARA", "BANGKA BELITUNG": "BANGKA BELITUNG",
                        "SUMATERA BARAT": "SUMATERA BARAT", "KALIMANTAN TENGAH": "KALIMANTAN TENGAH", "SUMATERA SELATAN": "SUMATERA SELATAN",
                        "JAMBI": "JAMBI", "LAMPUNG": "LAMPUNG", "BENGKULU": "BENGKULU", "SULAWESI BARAT": "SULAWESI BARAT",
                        "KALIMANTAN UTARA": "KALIMANTAN UTARA", "KEPULAUAN RIAU": "KEPULAUAN RIAU", "BALI": "BALI", "KEP. BANGKA BELITUNG": "BANGKA BELITUNG",
                        "KEP. RIAU": "KEPULAUAN RIAU", "KEPRI": "KEPULAUAN RIAU"
                    };

                    const userStateUpper = userState.toUpperCase();

                    if (userStateUpper !== 'NASIONAL' && userStateUpper !== '') {
                        mapData.features = mapData.features.filter((feature: any) => {
                            let rawName = feature.properties.state || feature.properties.Propinsi || feature.properties.NAME_1 || "";
                            let pName = rawName.toUpperCase();
                            if (geojsonNameTranslator[pName]) pName = geojsonNameTranslator[pName];
                            feature.properties.name = pName;
                            return pName === userStateUpper;
                        });
                    } else {
                        mapData.features.forEach((feature: any) => {
                            let rawName = feature.properties.state || feature.properties.Propinsi || feature.properties.NAME_1 || "";
                            let pName = rawName.toUpperCase();
                            if (geojsonNameTranslator[pName]) pName = geojsonNameTranslator[pName];
                            feature.properties.name = pName;
                        });
                    }

                    echarts.registerMap('regional_view', mapData);
                    setIsMapLoaded(true);
                }

                setDashboardData(dbData);

                if (Array.isArray(notifs)) {
                    const commandFeeds = notifs.filter((n: any) => n.title.includes('Memo Target'));
                    setInstructions(commandFeeds.slice(0, 3));
                }

                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Error memuat data admin:", err);
                setIsLoading(false);
            });

        checkSystemHealth();
        const interval = setInterval(checkSystemHealth, 15000);
        return () => clearInterval(interval);
    }, [userState, userEmail]);

    // ================== ECHARTS CONFIGURATIONS ==================

    const mapOption = useMemo(() => {
        // PERBAIKAN: Normalisasi nama data dari API menjadi huruf kapital agar cocok dengan GeoJSON
        const mapData = (dashboardData?.mapDistribution || []).map((d: any) => ({
            ...d,
            name: d.name ? d.name.toUpperCase() : ""
        }));

        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDF2FE', padding: [12, 16],
                extraCssText: 'border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(106,123,250,0.15);',
                formatter: (params: any) => `
                    <div style="font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:#6A7BFA; margin-bottom:4px;">Distribusi Wilayah</div>
                    <div style="color:#0F172A; font-weight:800; font-size:15px;">${params.name || 'Wilayah'}</div>
                    <div style="color:#4f46e5; font-weight:700; margin-top:4px; font-size:13px;">${(params.value || 0).toLocaleString('id-ID')} Unit Terjual</div>
                `
            },
            visualMap: { min: 0, max: 20000, show: false, inRange: { color: ['#EDF2FE', '#4f46e5'] } },
            series: [{
                type: 'map', map: 'regional_view', nameProperty: 'name', roam: true,
                scaleLimit: { min: 0.5, max: 10 }, zoom: 1.2,
                label: { show: false },
                itemStyle: { areaColor: '#EDF2FE', borderColor: '#6A7BFA', borderWidth: 1 },
                emphasis: {
                    itemStyle: { areaColor: '#4f46e5', borderColor: '#FFFFFF', borderWidth: 2, shadowBlur: 8, shadowColor: 'rgba(79,70,229,0.4)' },
                    label: { show: true, color: '#FFFFFF', fontWeight: 'bold', fontSize: 10, backgroundColor: '#0F172A', padding: [4, 8], borderRadius: 4 }
                },
                data: mapData
            }]
        };
    }, [dashboardData]);

    const trendChartOption = {
        tooltip: { trigger: 'axis', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDF2FE', extraCssText: 'border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);' },
        grid: { left: '2%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: dashboardData?.trendLine?.labels || [], axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { rotate: 45, fontSize: 10, fontWeight: '600' } },
        yAxis: { type: 'value', axisLabel: { formatter: '{value}' }, splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } } },
        series: [{
            name: 'Total Unit', type: 'line', smooth: true, symbolSize: 8,
            itemStyle: { color: '#4f46e5' }, lineStyle: { width: 4 },
            areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(106, 123, 250, 0.4)' }, { offset: 1, color: 'rgba(79, 70, 229, 0)' }]) },
            data: dashboardData?.trendLine?.values || []
        }]
    };

    const channelChartOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDF2FE', extraCssText: 'border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);' },
        grid: { left: '2%', right: '15%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: dashboardData?.salesMethod?.map((d: any) => d.name) || [], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontWeight: '700', color: '#475569' } },
        series: [{
            name: 'Unit Terjual', type: 'bar', barWidth: '45%',
            data: dashboardData?.salesMethod?.map((d: any, i: number) => ({ value: d.value, itemStyle: { color: i === 0 ? '#4f46e5' : i === 1 ? '#6A7BFA' : '#A3B1FF', borderRadius: [0, 6, 6, 0] } })) || [],
            label: { show: true, position: 'right', formatter: '{c}', fontWeight: 'bold' }
        }]
    };

    const activeProducts = dashboardData?.topProducts || [];

    const productChartOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDF2FE', extraCssText: 'border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);' },
        grid: { left: '2%', right: '12%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: activeProducts.map((d: any) => d.name).reverse(), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontWeight: '600', color: '#0F172A', fontSize: 10 } },
        series: [{
            name: 'Volume (Unit)', type: 'bar', data: activeProducts.map((d: any) => d.value).reverse(),
            itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#6A7BFA' }, { offset: 1, color: '#4f46e5' }]), borderRadius: [0, 6, 6, 0] },
            barWidth: '45%',
            label: { show: true, position: 'right', formatter: '{c}', color: '#64748B', fontWeight: '700', fontSize: 10 }
        }]
    };

    const retailerChartOption = {
        tooltip: { trigger: 'item', formatter: '<div style="font-weight:bold; margin-bottom:4px;">{b}</div><div style="color:#6A7BFA; font-weight:bold;">{c} Unit ({d}%)</div>', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14] },
        legend: { bottom: '0%', left: 'center', icon: 'circle', itemGap: 20, textStyle: { color: '#475569', fontWeight: '500', fontSize: 12 } },
        color: ['#4f46e5', '#6A7BFA', '#818CF8', '#A3B1FF', '#C7D2FE', '#E0E7FF'],
        series: [{
            name: 'Retailer', type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'], avoidLabelOverlap: false,
            itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
            label: { show: false }, data: dashboardData?.retailerShare || []
        }]
    };

    if (isLoading) return (
        <div className="w-full h-[80vh] flex flex-col items-center justify-center text-[#6A7BFA] gap-4">
            <Loader2 size={40} className="animate-spin" />
            <span className="font-bold tracking-widest uppercase text-sm text-[#4f46e5]">Memuat Data Aktual...</span>
        </div>
    );

    return (
        <div className="pb-12 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">

            {/* ================= HERO SECTION ================= */}
            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] rounded-[40px] p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
                <div className="relative z-10 max-w-3xl text-white">
                    <h2 className="text-[32px] lg:text-[40px] font-bold mb-4 tracking-tight leading-tight">
                        Ringkasan Performa.<br />Cakupan {userState}.
                    </h2>
                    <p className="text-white/90 text-sm lg:text-base leading-relaxed mb-8 max-w-xl font-medium">
                        Pantau wawasan komprehensif terkait performa volume penjualan, produk top, dan sebaran inventaris secara real-time.
                    </p>
                    <Link href="/dashboard/admin/forecast">
                        <button className="bg-white text-[#4f46e5] hover:bg-[#EDF2FE] hover:shadow-xl hover:-translate-y-1 font-bold py-3.5 px-8 rounded-[40px] transition-all active:scale-95 text-sm flex items-center gap-2 group/btn shadow-md">
                            Analisis Prediktif AI <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
                <div className="hidden lg:block w-[320px] h-[260px] relative z-10 mr-4 animate-float opacity-90 group-hover:opacity-100 transition-opacity">
                    <img src="/ilustrasi-provinsi-nobg-new.png" alt="Illustration" className="w-full h-full object-contain drop-shadow-2xl scale-125" />
                </div>
            </div>

            {/* ================= STRATEGIC COMMAND CENTER ================= */}
            <div className="bg-white rounded-[35px] border-2 border-[#4f46e5]/10 p-6 shadow-sm overflow-hidden relative group transition-all hover:border-[#4f46e5]/30">
                <div className="flex items-center justify-between mb-5 px-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#4f46e5] text-white rounded-2xl animate-pulse"><BellRing size={20} /></div>
                        <div><h3 className="font-bold text-slate-900 text-lg">Pusat Komando Strategis</h3><p className="text-xs text-slate-500 font-medium">Instruksi langsung & log notifikasi</p></div>
                    </div>
                    <Link href="/dashboard/admin/inbox" className="text-xs font-bold text-[#4f46e5] hover:underline">Lihat Semua Memo</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {instructions.length === 0 ? (
                        <div className="col-span-3 py-6 text-center text-slate-400 text-sm font-medium bg-slate-50 rounded-3xl border border-dashed border-slate-200">Belum ada instruksi atau memo hari ini.</div>
                    ) : (
                        instructions.map((ins, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-[28px] border border-slate-100 flex flex-col gap-3 relative overflow-hidden transition-all hover:shadow-md cursor-default">
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#4f46e5] uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100"><BrainCircuit size={12} /> Memo AI</div>
                                    <span className="text-[10px] text-slate-400 font-bold">{new Date(ins.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800 line-clamp-1">{ins.title.replace('Memo Target: ', '')}</p>
                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 italic">"{ins.description.replace(/[*_#]/g, '')}"</p>
                                <div className="mt-auto flex items-center gap-1.5 text-[10px] font-bold text-emerald-500"><CheckCircle2 size={12} /> Instruksi Aktif</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ================= KPI CARDS ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all shadow-sm"><ShoppingCart size={24} /></div>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Total Penjualan</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                            {dashboardData?.summary?.totalUnits ? (dashboardData.summary.totalUnits / 1000).toFixed(1) : 0}
                            <span className="text-xl lg:text-2xl text-slate-400 font-medium ml-1">Ribu Unit</span>
                        </h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all shadow-sm"><Percent size={24} /></div>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Rata-Rata Margin</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                            {dashboardData?.summary?.avgMargin?.toFixed(1) || 0}
                            <span className="text-xl lg:text-2xl text-slate-400 font-medium ml-1">%</span>
                        </h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all shadow-sm"><Package size={24} /></div>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Total Pendapatan</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                            {dashboardData?.summary?.totalSales ? (dashboardData.summary.totalSales / 1000000000).toFixed(1) : 0}
                            <span className="text-lg lg:text-xl text-slate-400 font-medium ml-1 capitalize">Miliar</span>
                        </h3>
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

            {/* ================= MAP & TOP PRODUCTS ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* MAP SECTION */}
                <div className="lg:col-span-3 bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col relative group">
                    <div className="flex items-center justify-between mb-6 px-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:bg-[#4f46e5] group-hover:text-white transition-colors"><MapIcon size={20} /></div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Peta Wilayah Kerja</h3>
                                <p className="text-slate-500 text-xs mt-0.5">Pemetaan otomatis data live wilayah {userState}.</p>
                            </div>
                        </div>
                        <span className="hidden sm:block text-[10px] bg-[#EDF2FE] text-[#4f46e5] px-3 py-1.5 rounded-full border border-[#6A7BFA]/20 font-bold uppercase tracking-widest shadow-sm">
                            Fokus: {userState}
                        </span>
                    </div>

                    <div className="w-full h-[450px] lg:h-[530px] relative z-10 rounded-[24px] bg-[#F8FAFC] border border-slate-100 overflow-hidden group-hover:shadow-inner transition-shadow duration-500">
                        {isMapLoaded ? (
                            <ReactECharts ref={echartsRef} option={mapOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-semibold text-sm gap-3">
                                <Loader2 size={32} className="animate-spin text-[#6A7BFA]" />
                                <span>Mempersiapkan Peta Geografis...</span>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 text-xs font-semibold text-slate-500 bg-white/90 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-200 shadow-sm pointer-events-none">
                            💡 Peta dapat digeser (Drag) dan di-zoom (Scroll)
                        </div>
                    </div>
                </div>

                {/* TOP PRODUCTS SECTION (REVISED UI) */}
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col h-full">
                    <div className="mb-2 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl"><ShoppingBag size={20} /></div>
                            <h3 className="text-xl font-bold text-slate-900">Top Produk Ritel</h3>
                        </div>
                        <p className="text-xs font-medium text-slate-500 ml-14">Berdasarkan volume penjualan aktual.</p>
                    </div>

                    {/* Menggunakan justify-between agar fill height secara otomatis merata tanpa space kosong berlebih */}
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
                                        <span className="font-bold text-[13px] text-slate-700 group-hover/item:text-[#4f46e5] transition-colors">
                                            {i + 1}. {prod.name}
                                        </span>
                                        <span className="font-black text-sm text-slate-900 group-hover/item:text-[#4f46e5] transition-colors">
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
                <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col h-[480px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl"><Activity size={20} /></div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Analisis Kinerja</h3>
                                <p className="text-slate-500 text-xs mt-0.5">Tren riwayat & efektivitas metode</p>
                            </div>
                        </div>

                        <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-[20px] shrink-0">
                            <button
                                onClick={() => setActiveTrendTab('trend')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-xs font-bold transition-all ${activeTrendTab === 'trend' ? 'bg-white text-[#4f46e5] shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                            >
                                <BarChart3 size={14} /> Tren Bulanan
                            </button>
                            <button
                                onClick={() => setActiveTrendTab('channel')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-xs font-bold transition-all ${activeTrendTab === 'channel' ? 'bg-white text-[#4f46e5] shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                            >
                                <Globe size={14} /> Jalur Penjualan
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative">
                        {activeTrendTab === 'trend' && <div className="absolute inset-0 animate-in fade-in"><ReactECharts option={trendChartOption} style={{ height: '100%', width: '100%' }} /></div>}
                        {activeTrendTab === 'channel' && <div className="absolute inset-0 animate-in fade-in"><ReactECharts option={channelChartOption} style={{ height: '100%', width: '100%' }} /></div>}
                    </div>
                </div>

                {/* Portofolio Kategori */}
                <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col h-[480px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl"><LayoutList size={20} /></div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Distribusi Portofolio</h3>
                                <p className="text-slate-500 text-xs mt-0.5">Sebaran kategori & mitra lokal</p>
                            </div>
                        </div>

                        <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-[20px] shrink-0">
                            <button
                                onClick={() => setActivePortoTab('produk')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-xs font-bold transition-all ${activePortoTab === 'produk' ? 'bg-white text-[#4f46e5] shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                            >
                                <PackageSearch size={14} /> Kategori Produk
                            </button>
                            <button
                                onClick={() => setActivePortoTab('retailer')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-xs font-bold transition-all ${activePortoTab === 'retailer' ? 'bg-white text-[#4f46e5] shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                            >
                                <Store size={14} /> Mitra Retailer
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative">
                        {activePortoTab === 'produk' && <div className="absolute inset-0 animate-in fade-in"><ReactECharts option={productChartOption} style={{ height: '100%', width: '100%' }} /></div>}
                        {activePortoTab === 'retailer' && <div className="absolute inset-0 animate-in fade-in"><ReactECharts option={retailerChartOption} style={{ height: '100%', width: '100%' }} /></div>}
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