"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { Wallet, Package, Percent, TrendingUp, TrendingDown, Map as MapIcon, Loader2, ArrowRight, PackageSearch, Store, BarChart3, Globe, Activity, LayoutList, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function PerformaSumutPage() {
    const echartsRef = useRef<ReactECharts>(null);
    const [isLoading, setIsLoading] = useState(true);

    // State Filter Regional
    const [selectedCity, setSelectedCity] = useState('Semua Kota');
    const [isFiltering, setIsFiltering] = useState(false);

    // State Navigasi Tab (Bagian bawah)
    const [activeTrendTab, setActiveTrendTab] = useState<'trend' | 'channel'>('trend');
    const [activePortoTab, setActivePortoTab] = useState<'produk' | 'retailer'>('produk');

    useEffect(() => {
        fetch('/indonesia.json')
            .then(res => res.json())
            .then(data => {
                data.features = data.features.filter((feature: any) => feature.properties.Propinsi === 'SUMATERA UTARA');
                echarts.registerMap('sumut_view', data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    // LOGIKA DATA TOP 7 PRODUK REGIONAL
    const getTopProducts = (city: string) => {
        const cityLower = city.toLowerCase();
        if (cityLower === 'medan') return [
            { name: 'Sepatu Lari Adidas', val: '850', pct: '100%', color: 'bg-[#312E81]' },
            { name: 'Kemeja Polos Pria', val: '720', pct: '85%', color: 'bg-[#4f46e5]' }, // Update to secondary color
            { name: 'Tas Ransel Laptop', val: '540', pct: '65%', color: 'bg-[#6A7BFA]' }, // Update to primary color
            { name: 'Sepatu Sneakers Vans', val: '410', pct: '50%', color: 'bg-[#818CF8]' },
            { name: 'Celana Jeans Denim', val: '390', pct: '45%', color: 'bg-[#A3B1FF]' },
            { name: 'Kaos Polo Polos', val: '320', pct: '38%', color: 'bg-[#C7D2FE]' },
            { name: 'Jam Tangan Digital', val: '280', pct: '33%', color: 'bg-[#E0E7FF]' }
        ];
        if (cityLower === 'binjai') return [
            { name: 'Kemeja Polos Pria', val: '310', pct: '100%', color: 'bg-[#312E81]' },
            { name: 'Sepatu Lari Adidas', val: '280', pct: '90%', color: 'bg-[#4f46e5]' },
            { name: 'Sandal Kulit Pria', val: '150', pct: '50%', color: 'bg-[#6A7BFA]' },
            { name: 'Tas Ransel Laptop', val: '120', pct: '40%', color: 'bg-[#818CF8]' },
            { name: 'Kaos Kaki Katun', val: '95', pct: '30%', color: 'bg-[#A3B1FF]' },
            { name: 'Topi Baseball', val: '80', pct: '26%', color: 'bg-[#C7D2FE]' },
            { name: 'Ikat Pinggang Kulit', val: '65', pct: '21%', color: 'bg-[#E0E7FF]' }
        ];
        return [
            { name: 'Sepatu Lari Adidas', val: '1.450', pct: '100%', color: 'bg-[#312E81]' },
            { name: 'Kemeja Polos Pria', val: '1.200', pct: '82%', color: 'bg-[#4f46e5]' },
            { name: 'Tas Ransel Laptop', val: '980', pct: '67%', color: 'bg-[#6A7BFA]' },
            { name: 'Sepatu Sneakers Vans', val: '850', pct: '58%', color: 'bg-[#818CF8]' },
            { name: 'Sandal Kulit Pria', val: '620', pct: '42%', color: 'bg-[#A3B1FF]' },
            { name: 'Celana Jeans Denim', val: '580', pct: '40%', color: 'bg-[#C7D2FE]' },
            { name: 'Kaos Polo Polos', val: '490', pct: '34%', color: 'bg-[#E0E7FF]' }
        ];
    };

    const topProducts = getTopProducts(selectedCity);

    const handleCityClick = (city: string) => {
        setIsFiltering(true);
        setSelectedCity(city);
        setTimeout(() => { setIsFiltering(false); }, 500);
    };

    // 1. OPSI PETA REGIONAL
    const mapOption = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14],
            extraCssText: 'border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);',
            formatter: () => `<div style="font-weight:600; font-size:11px; text-transform:uppercase; color:#64748B; margin-bottom:4px;">Wilayah Kerja</div><div style="color:#6A7BFA; font-weight:bold; font-size:15px;">Sumatera Utara</div><div style="font-size:10px; color:#10B981; margin-top:6px; background:#ECFDF5; padding:2px 6px; border-radius:4px; display:inline-block; font-weight:bold;">● Status: Aktif</div>`
        },
        series: [{
            type: 'map', map: 'sumut_view', roam: true, scaleLimit: { min: 1, max: 5 }, zoom: 1.2,
            label: { show: true, color: '#475569', fontSize: 11, formatter: '{b}', fontWeight: 'bold' },
            itemStyle: { areaColor: '#E2E8F0', borderColor: '#FFFFFF', borderWidth: 2 },
            // UPDATE: Warna emphasis peta diselaraskan dengan gradien
            emphasis: { itemStyle: { areaColor: '#4f46e5', borderColor: '#FFFFFF', borderWidth: 2 }, label: { show: true, color: '#FFFFFF' } },
            data: [{ name: 'SUMATERA UTARA', value: 1 }]
        }]
    }), []);

    // 2. OPSI TREN BULANAN (Skala Regional)
    const trendChartOption = {
        tooltip: { trigger: 'axis', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0' },
        grid: { left: '2%', right: '4%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'], axisLine: { lineStyle: { color: '#E2E8F0' } } },
        yAxis: { type: 'value', axisLabel: { formatter: '{value}k' }, splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } } },
        series: [{
            name: 'Total Unit', type: 'line', smooth: true, symbolSize: 8,
            itemStyle: { color: '#4f46e5' }, // UPDATE: Warna line
            lineStyle: { width: 4 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(106, 123, 250, 0.4)' }, { offset: 1, color: 'rgba(79, 70, 229, 0)' }] } }, // UPDATE: Warna area gradient
            data: [120, 145, 130, 175, 190, 210]
        }]
    };

    // 3. OPSI METODE PENJUALAN (Skala Regional)
    const channelChartOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '2%', right: '15%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: {
            type: 'category',
            data: ['Online (Sumbagut)', 'Factory Outlet', 'Toko Fisik'],
            axisLine: { show: false }, axisTick: { show: false },
            axisLabel: { fontWeight: '700', color: '#475569' }
        },
        series: [{
            name: 'Unit Terjual', type: 'bar', barWidth: '45%',
            data: [
                { value: 850, itemStyle: { color: '#4f46e5', borderRadius: [0, 6, 6, 0] } }, // UPDATE: Darker for top
                { value: 620, itemStyle: { color: '#6A7BFA', borderRadius: [0, 6, 6, 0] } },
                { value: 430, itemStyle: { color: '#A3B1FF', borderRadius: [0, 6, 6, 0] } }
            ],
            label: { show: true, position: 'right', formatter: '{c} Pcs', fontWeight: 'bold' }
        }]
    };

    // 4. OPSI KATEGORI PRODUK (Skala Regional)
    const productChartOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '2%', right: '12%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: {
            type: 'category',
            data: ["Men's Street", "Women's Athletic", "Kids Footwear", "Men's Athletic"].reverse(),
            axisLine: { show: false }, axisTick: { show: false },
            axisLabel: { fontWeight: '600', color: '#0F172A', fontSize: 12 }
        },
        series: [{
            name: 'Volume (Unit)', type: 'bar',
            data: [620, 480, 450, 350].reverse(),
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#6A7BFA' }, { offset: 1, color: '#4f46e5' }]), // UPDATE: Gradient bar
                borderRadius: [0, 6, 6, 0]
            },
            barWidth: '45%',
            label: { show: true, position: 'right', formatter: '{c} Pcs', color: '#64748B', fontWeight: '700', fontSize: 12 }
        }]
    };

    // 5. OPSI DISTRIBUSI RETAILER (Skala Regional)
    const retailerChartOption = {
        tooltip: { trigger: 'item', formatter: '<div style="font-weight:bold; margin-bottom:4px;">{b}</div><div style="color:#6A7BFA; font-weight:bold;">{c} Ribu Unit ({d}%)</div>', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14] },
        legend: { bottom: '0%', left: 'center', icon: 'circle', itemGap: 20, textStyle: { color: '#475569', fontWeight: '500', fontSize: 12 } },
        series: [{
            name: 'Retailer', type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'], avoidLabelOverlap: false,
            itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
            label: { show: false },
            // UPDATE: Warna chart donat
            data: [
                { value: 1.2, name: 'Ramayana', itemStyle: { color: '#312E81' } },
                { value: 0.4, name: 'Sport Station', itemStyle: { color: '#4f46e5' } },
                { value: 0.3, name: 'Matahari', itemStyle: { color: '#6A7BFA' } }
            ]
        }]
    };

    if (isLoading) return <div className="w-full h-full flex items-center justify-center text-[#6A7BFA] gap-3"><Loader2 size={24} className="animate-spin" /><span className="font-bold uppercase tracking-widest text-sm">Menyiapkan Dashboard Regional...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8">

            {/* HERO BANNER - UPDATE: Premium Gradient */}
            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] rounded-[40px] p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-transform duration-1000" />
                <div className="relative z-10 max-w-3xl text-white">
                    <h2 className="text-[32px] lg:text-[40px] font-bold mb-4 tracking-tight leading-tight">Ringkasan Performa Regional.<br />Provinsi Sumatera Utara.</h2>
                    <p className="text-white/90 text-sm lg:text-base leading-relaxed mb-8">Pantau wawasan komprehensif terkait performa volume penjualan, tren kota, dan sebaran inventaris di wilayah operasional Anda secara real-time.</p>
                    <Link href="/dashboard/regional/forecast">
                        <button className="bg-white text-[#4f46e5] hover:bg-[#EDF2FE] hover:shadow-xl hover:-translate-y-1 font-bold py-3.5 px-8 rounded-[40px] transition-all active:scale-95 text-sm flex items-center gap-2 group/btn">
                            Analisis AI Cabang <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
                {/* Gambar ilustrasi sekarang tenang dan profesional tanpa zoom-in */}
                <div className="hidden lg:block w-[320px] h-[260px] relative z-10 mr-4 animate-float">
                    <img src="/ilustrasi-provinsi-nobg-new.png" alt="Illustration" className="w-full h-full object-contain drop-shadow-2xl scale-125" />
                </div>
            </div>

            {/* KARTU METRIK UPDATE HOVER/COLORS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] group cursor-default">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all duration-300"><Wallet size={24} /></div>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100"><TrendingUp size={14} /> +8.2%</span>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Total Pendapatan</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Rp 4,9 <span className="text-xl lg:text-2xl text-slate-400 font-medium tracking-normal">Miliar</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] group cursor-default">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all duration-300"><Percent size={24} /></div>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100"><TrendingUp size={14} /> +1.4%</span>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Persentase Keuntungan</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">32.4<span className="text-xl lg:text-2xl text-slate-400 font-medium">%</span></h3>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)] group cursor-default">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all duration-300"><Package size={24} /></div>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-full border border-red-100"><TrendingDown size={14} /> +4.2%</span>
                    </div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Total Barang Terjual</p>
                        <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">12.500 <span className="text-xl lg:text-2xl text-slate-400 font-medium tracking-normal">Pcs</span></h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-6 px-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#EDF2FE] text-[#6A7BFA] rounded-2xl group-hover:bg-[#4f46e5] group-hover:text-white transition-colors"><MapIcon size={20} /></div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Peta Wilayah Kerja</h3>
                                <p className="text-slate-500 text-xs mt-0.5">Pemetaan otomatis data live Sumatera Utara.</p>
                            </div>
                        </div>
                        <span className="hidden sm:block text-[10px] bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 font-bold uppercase tracking-widest shadow-sm">
                            Fokus: Sumatera Utara
                        </span>
                    </div>
                    <div className="w-full h-[450px] lg:h-[530px] relative z-10 rounded-[24px] bg-[#F8FAFC] border border-slate-100 overflow-hidden group-hover:shadow-inner transition-shadow duration-500">
                        <ReactECharts ref={echartsRef} option={mapOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                        <div className="absolute bottom-4 left-4 text-xs font-semibold text-slate-500 bg-white/90 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-200 shadow-sm pointer-events-none">
                            💡 Peta dapat digeser dan di-zoom
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col group relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out delay-200 fill-mode-both">
                    {isFiltering && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-[#4f46e5] gap-3 animate-in fade-in">
                            <Loader2 size={28} className="animate-spin" />
                            <span className="font-bold text-sm tracking-wide">Menarik data toko...</span>
                        </div>
                    )}

                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <ShoppingBag className="text-[#4f46e5]" size={20} />
                            <h3 className="text-xl font-bold text-slate-900">7 Produk Paling Laku</h3>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Berdasarkan volume penjualan aktual bulan ini.</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8 bg-slate-50 p-1.5 rounded-[20px] border border-slate-100 w-fit">
                        {['Semua Kota', 'Medan', 'Binjai'].map((city) => (
                            <button
                                key={city}
                                onClick={() => handleCityClick(city)}
                                className={`px-4 py-2 rounded-[16px] text-xs font-bold transition-all ${selectedCity === city
                                    ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-md border-transparent'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 border border-transparent'
                                    }`}
                            >
                                {city}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4 flex-1 flex flex-col justify-center overflow-y-auto custom-scrollbar pr-1">
                        {topProducts.map((prod, i) => (
                            <div key={i} className="group/item cursor-default">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="font-semibold text-slate-700 group-hover/item:text-[#4f46e5] transition-colors">{i + 1}. {prod.name}</span>
                                    <span className="font-bold text-slate-900 group-hover/item:text-[#4f46e5] transition-colors">{prod.val} Pcs</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                    <div className={`${prod.color} h-full rounded-full transition-all duration-1000 ease-out group-hover/item:brightness-110 opacity-90 group-hover/item:opacity-100`} style={{ width: prod.pct }}></div>
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
                                <p className="text-slate-500 text-xs mt-0.5">Tren waktu & efektivitas metode cabang</p>
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
                                <h3 className="text-xl font-bold text-slate-900">Portofolio Wilayah</h3>
                                <p className="text-slate-500 text-xs mt-0.5">Sebaran kategori & mitra lokal</p>
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

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
                .animate-float { animation: float 6s ease-in-out infinite; }
            `}} />
        </div>
    );
}