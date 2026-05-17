"use client";
import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { MapPin, Target, Loader2, Info, Building2, PackageSearch, Search, ChevronDown, Package, TrendingUp, TrendingDown, Store } from 'lucide-react';

export default function PetaDistribusiPage() {
    const echartsRef = useRef<ReactECharts>(null);
    const [isLoading, setIsLoading] = useState(true);

    // State Interaksi
    const [selectedProvince, setSelectedProvince] = useState('Nasional');
    const [isFiltering, setIsFiltering] = useState(false);

    // State Tab Navigasi
    const [activeTab, setActiveTab] = useState<'kota' | 'retailer' | 'produk'>('kota');

    // State Custom Dropdown
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchProv, setSearchProv] = useState('');

    // State Data Dinamis
    const [dynamicCityData, setDynamicCityData] = useState<{ name: string, value: number }[]>([]);
    const [dynamicProductData, setDynamicProductData] = useState<{ name: string, value: number }[]>([]);
    const [dynamicRetailerData, setDynamicRetailerData] = useState<{ name: string, value: number }[]>([]);
    const [localTrend, setLocalTrend] = useState({ isUp: true, value: 12.5 });

    const provincesList = [
        "DKI Jakarta", "Jawa Timur", "Jawa Barat", "Sumatera Utara",
        "Sulawesi Selatan", "Bali", "Kalimantan Selatan"
    ];

    const filteredProvinces = provincesList.filter(prov => prov.toLowerCase().includes(searchProv.toLowerCase()));
    const NATIONAL_TOTAL = 13500;

    useEffect(() => {
        fetch('/indonesia.json')
            .then((response) => response.json())
            .then((data) => {
                echarts.registerMap('indonesia_interaktif', data);
                setDynamicCityData(getCityData('Nasional'));
                setDynamicProductData(getProductData('Nasional'));
                setDynamicRetailerData(getRetailerData('Nasional'));
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const getCityData = (province: string) => {
        const provLower = province.toLowerCase();
        if (provLower === 'nasional') return [{ name: 'Jakarta', value: 4500 }, { name: 'Surabaya', value: 3100 }, { name: 'Bandung', value: 2800 }, { name: 'Medan', value: 1900 }, { name: 'Makassar', value: 1200 }];
        if (provLower.includes('jawa timur')) return [{ name: 'Surabaya', value: 1800 }, { name: 'Malang', value: 800 }, { name: 'Sidoarjo', value: 300 }, { name: 'Gresik', value: 200 }];
        if (provLower.includes('sumatera utara')) return [{ name: 'Medan', value: 1200 }, { name: 'Pematangsiantar', value: 350 }, { name: 'Binjai', value: 200 }, { name: 'Tebing Tinggi', value: 150 }];
        if (provLower.includes('jakarta')) return [{ name: 'Jaksel', value: 1500 }, { name: 'Jakpus', value: 1200 }, { name: 'Jakbar', value: 1000 }, { name: 'Jakut', value: 800 }];

        return [{ name: `Kota Utama`, value: Math.floor(Math.random() * 800) + 400 }, { name: `Kota B`, value: Math.floor(Math.random() * 400) + 200 }, { name: `Kota C`, value: Math.floor(Math.random() * 200) + 100 }].sort((a, b) => b.value - a.value);
    };

    const getProductData = (province: string) => {
        const provLower = province.toLowerCase();
        const products = ["Men's Street", "Women's Athletic", "Kids Footwear", "Men's Athletic"];
        if (provLower === 'nasional') return [{ value: 4200, name: products[0] }, { value: 3100, name: products[1] }, { value: 2800, name: products[2] }, { value: 1900, name: products[3] }];
        if (provLower.includes('jawa timur')) return [{ value: 1200, name: products[1] }, { value: 900, name: products[0] }, { value: 600, name: products[3] }, { value: 400, name: products[2] }];

        return [
            { value: Math.floor(Math.random() * 1000) + 500, name: products[0] },
            { value: Math.floor(Math.random() * 800) + 300, name: products[1] },
            { value: Math.floor(Math.random() * 600) + 200, name: products[2] }
        ].sort((a, b) => b.value - a.value);
    };

    const getRetailerData = (province: string) => {
        const provLower = province.toLowerCase();
        if (provLower === 'nasional') return [{ name: 'Ramayana', value: 6800 }, { name: 'Matahari', value: 5200 }, { name: 'Sport Station', value: 3400 }];
        if (provLower.includes('jawa timur')) return [{ name: 'Matahari', value: 1600 }, { name: 'Ramayana', value: 900 }, { name: 'Sport Station', value: 600 }];
        if (provLower.includes('sumatera utara')) return [{ name: 'Ramayana', value: 1200 }, { name: 'Sport Station', value: 400 }, { name: 'Matahari', value: 300 }];

        return [
            { name: 'Ramayana', value: Math.floor(Math.random() * 800) + 300 },
            { name: 'Matahari', value: Math.floor(Math.random() * 600) + 200 },
            { name: 'Sport Station', value: Math.floor(Math.random() * 400) + 100 }
        ].sort((a, b) => b.value - a.value);
    };

    const getLocalTrend = (province: string) => {
        if (province === 'Nasional') return { isUp: true, value: 12.5 };
        const isUp = Math.random() > 0.3;
        const value = parseFloat((Math.random() * 15).toFixed(1));
        return { isUp, value };
    };

    const totalRegionVolume = dynamicCityData.reduce((acc, curr) => acc + curr.value, 0);
    const marketShare = (province: string) => province === 'Nasional' ? 100 : ((totalRegionVolume / NATIONAL_TOTAL) * 100).toFixed(1);

    const triggerDataUpdate = (provinceName: string) => {
        setIsFiltering(true);
        setSelectedProvince(provinceName);
        setIsDropdownOpen(false);
        setSearchProv('');

        setTimeout(() => {
            setDynamicCityData(getCityData(provinceName));
            setDynamicProductData(getProductData(provinceName));
            setDynamicRetailerData(getRetailerData(provinceName));
            setLocalTrend(getLocalTrend(provinceName));
            setIsFiltering(false);

            if (echartsRef.current && provinceName !== 'Nasional') {
                const chart = echartsRef.current.getEchartsInstance();
                chart.dispatchAction({ type: 'select', name: provinceName });
            }
        }, 600);
    };

    const onChartClick = (params: any) => {
        if (params.name) triggerDataUpdate(params.name);
    };

    const handleReset = () => {
        setIsFiltering(true);
        setSelectedProvince('Nasional');
        setIsDropdownOpen(false);
        setSearchProv('');

        if (echartsRef.current) echartsRef.current.getEchartsInstance().dispatchAction({ type: 'unselect' });

        setTimeout(() => {
            setDynamicCityData(getCityData('Nasional'));
            setDynamicProductData(getProductData('Nasional'));
            setDynamicRetailerData(getRetailerData('Nasional'));
            setLocalTrend(getLocalTrend('Nasional'));
            setIsFiltering(false);
        }, 500);
    };

    // --- CHART OPTIONS (UPDATE: WARNA SELARAS PREMIUM) ---
    const mainMapOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => `<div style="font-weight:600; font-size:13px; color:#0F172A; text-transform:capitalize;">${params.name}</div><div style="color:#6A7BFA; font-weight:bold; margin-top:4px; font-size:11px; background:#EDF2FE; padding:4px 8px; border-radius:12px; display:inline-block;">Klik untuk Detail Wilayah</div>`,
            backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0', padding: [12, 16], extraCssText: 'border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);'
        },
        visualMap: {
            min: 0, max: 5000, text: ['Tinggi', 'Rendah'], realtime: false, calculable: true,
            inRange: { color: ['#EDF2FE', '#818CF8', '#4f46e5'] }, // Gradasi map lebih dalam
            textStyle: { color: '#64748B', fontSize: 11, fontWeight: '500' },
            itemWidth: 10, itemHeight: 80, bottom: 20, left: 20,
        },
        series: [{
            name: 'Performa Provinsi', type: 'map', map: 'indonesia_interaktif', nameProperty: 'Propinsi', roam: true, scaleLimit: { min: 1, max: 6 },
            label: { show: true, color: '#64748B', fontSize: 8, formatter: '{b}' },
            itemStyle: { areaColor: '#E2E8F0', borderColor: '#FFFFFF', borderWidth: 1.5 },
            emphasis: { itemStyle: { areaColor: '#818CF8', borderColor: '#4f46e5', borderWidth: 1 }, label: { show: true, color: '#1E1B4B', fontSize: 12, fontWeight: 'bold' } },
            select: { itemStyle: { areaColor: '#4f46e5' }, label: { show: true, color: '#FFFFFF', fontWeight: 'bold' } }, // Warna klik diselaraskan
            selectedMode: 'single', data: [
                { name: 'SUMATERA UTARA', value: 1900 }, { name: 'DKI JAKARTA', value: 4500 },
                { name: 'JAWA TIMUR', value: 3100 }, { name: 'JAWA BARAT', value: 2800 },
                { name: 'SULAWESI SELATAN', value: 1200 }, { name: 'BALI', value: 1500 },
                { name: 'KALIMANTAN SELATAN', value: 800 },
            ]
        }]
    };

    const cityBarOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (params: any) => `<div style="font-weight:bold;">${params[0].name}</div><div style="color:#6A7BFA; font-weight:bold; margin-top:2px;">${(params[0].value * 1000).toLocaleString('id-ID')} Unit</div>` },
        grid: { left: '2%', right: '15%', bottom: '0%', top: '5%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: dynamicCityData.map(d => d.name).reverse(), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontWeight: '600', color: '#0F172A', fontSize: 12 } },
        series: [{
            name: 'Volume', type: 'bar', data: dynamicCityData.map(d => d.value).reverse(),
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#6A7BFA' }, { offset: 1, color: '#4f46e5' }]), // Linear Gradient
                borderRadius: [0, 6, 6, 0]
            },
            barWidth: '45%', label: { show: true, position: 'right', formatter: '{c}k', color: '#64748B', fontWeight: '700', fontSize: 12 }
        }]
    };

    const retailerBarOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (params: any) => `<div style="font-weight:bold;">${params[0].name}</div><div style="color:#4f46e5; font-weight:bold; margin-top:2px;">${(params[0].value * 1000).toLocaleString('id-ID')} Unit</div>` },
        grid: { left: '2%', right: '15%', bottom: '0%', top: '5%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: dynamicRetailerData.map(d => d.name).reverse(), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontWeight: '600', color: '#0F172A', fontSize: 12 } },
        series: [{
            name: 'Retailer', type: 'bar', data: dynamicRetailerData.map(d => d.value).reverse(),
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#818CF8' }, { offset: 1, color: '#6A7BFA' }]), // Linear Gradient Soft
                borderRadius: [0, 6, 6, 0]
            },
            barWidth: '45%', label: { show: true, position: 'right', formatter: '{c}k', color: '#64748B', fontWeight: '700', fontSize: 12 }
        }]
    };

    const productDonutOption = {
        tooltip: { trigger: 'item', formatter: (params: any) => `<div style="font-weight:bold; margin-bottom:4px;">${params.name}</div><div style="color:#6A7BFA; font-weight:bold;">${(params.value * 1000).toLocaleString('id-ID')} Unit (${params.percent}%)</div>`, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0', padding: [10, 14], extraCssText: 'border-radius: 12px;' },
        legend: { bottom: '0%', left: 'center', icon: 'circle', itemGap: 12, textStyle: { color: '#475569', fontWeight: '500', fontSize: 11 } },
        series: [{
            name: 'Kategori', type: 'pie', radius: ['45%', '70%'], center: ['50%', '40%'], avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 }, label: { show: false },
            color: ['#312E81', '#4f46e5', '#6A7BFA', '#A3B1FF'], // Kombinasi palet warna baru
            data: dynamicProductData
        }]
    };

    if (isLoading) return <div className="w-full h-full flex items-center justify-center text-[#6A7BFA] gap-3"><Loader2 size={24} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm">Memuat Peta Spasial...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8 relative">

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Peta Distribusi Interaktif</h2>
                    <p className="text-sm text-slate-500 mt-1">Klik wilayah pada peta atau cari via *Dropdown* untuk membedah data.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-72 z-[60]">
                        {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>}
                        {/* UPDATE DROPDOWN STYLE */}
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`w-full flex items-center justify-between bg-white border ${isDropdownOpen ? 'border-[#6A7BFA] ring-4 ring-[#6A7BFA]/10' : 'border-slate-200'} rounded-[40px] px-5 py-3 text-sm font-bold text-slate-700 hover:border-[#6A7BFA]/50 transition-all shadow-sm z-50 relative`}>
                            <div className="flex items-center gap-2 truncate">
                                <MapPin size={16} className="text-[#4f46e5] shrink-0" />
                                <span className="truncate uppercase tracking-wide">{selectedProvince === 'Nasional' ? 'Nasional (Semua Provinsi)' : selectedProvince}</span>
                            </div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 rounded-[24px] shadow-[0_20px_50px_-15px_rgba(79,70,229,0.25)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-3 border-b border-slate-100 bg-slate-50">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" placeholder="Cari provinsi..." value={searchProv} onChange={(e) => setSearchProv(e.target.value)} className="w-full bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#6A7BFA] focus:ring-2 focus:ring-[#6A7BFA]/20 transition-all placeholder:font-medium shadow-inner" autoFocus />
                                    </div>
                                </div>
                                <div className="max-h-[260px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                                    <button onClick={() => handleReset()} className={`w-full text-left px-4 py-3 rounded-[16px] text-sm font-bold transition-colors ${selectedProvince === 'Nasional' ? 'bg-[#EDF2FE] text-[#6A7BFA]' : 'text-slate-600 hover:bg-slate-50'}`}>Nasional (Semua Provinsi)</button>
                                    {filteredProvinces.length > 0 ? (
                                        <>
                                            <div className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tersedia di Database</div>
                                            {filteredProvinces.map(prov => {
                                                const provUpper = prov.toUpperCase();
                                                const isSelected = selectedProvince.toUpperCase() === provUpper;
                                                return <button key={prov} onClick={() => triggerDataUpdate(provUpper)} className={`w-full text-left px-4 py-3 rounded-[16px] text-sm font-bold transition-colors ${isSelected ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>{prov}</button>;
                                            })}
                                        </>
                                    ) : (
                                        <div className="px-4 py-6 text-center text-xs text-slate-500 font-medium">
                                            <Search size={20} className="mx-auto mb-2 text-slate-300" /> Provinsi tidak ditemukan
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* UPDATE RESET BUTTON STYLE */}
                    <button onClick={handleReset} className="w-full sm:w-auto flex justify-center items-center gap-2 bg-white text-slate-600 border border-slate-200 hover:border-transparent px-6 py-3 rounded-[40px] text-sm font-bold hover:bg-gradient-to-r hover:from-[#6A7BFA] hover:to-[#4f46e5] hover:text-white transition-all shadow-sm active:scale-95 group">
                        <Target size={18} className="text-[#6A7BFA] group-hover:text-white transition-colors" /> Reset
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* PETA INTERAKTIF */}
                <div className="lg:col-span-3 bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col p-4 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out delay-100 fill-mode-both min-h-[500px]">
                    <div className="absolute top-8 left-8 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md text-slate-800 px-5 py-3 rounded-[20px] shadow-lg text-sm font-bold tracking-wide border border-slate-200">
                        <MapPin size={18} className="text-[#4f46e5]" />
                        {selectedProvince === 'Nasional' ? 'Seluruh Indonesia' : selectedProvince.toUpperCase()}
                    </div>
                    <div className="w-full h-full min-h-[500px] bg-[#F8FAFC] rounded-[32px] border border-slate-100 overflow-hidden relative">
                        <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm text-xs font-semibold text-slate-500">
                            <Info size={14} className="text-[#6A7BFA]" /> Bisa di-*zoom* & digeser
                        </div>
                        <ReactECharts ref={echartsRef} option={mainMapOption} style={{ height: '100%', width: '100%', minHeight: '500px' }} opts={{ renderer: 'svg' }} onEvents={{ 'click': onChartClick }} />
                    </div>
                </div>

                {/* PANEL DRILL-DOWN */}
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 lg:p-8 flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out delay-200 fill-mode-both">

                    {isFiltering && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-20 flex flex-col items-center justify-center text-[#4f46e5] gap-4 animate-in fade-in duration-300">
                            <Loader2 size={32} className="animate-spin" />
                            <div className="text-center px-4">
                                <span className="font-bold text-lg text-slate-800 block mb-1">Mengekstrak Data...</span>
                                <span className="text-sm font-medium text-slate-500">Menarik insight dari wilayah {selectedProvince === 'Nasional' ? 'seluruh Indonesia' : selectedProvince}</span>
                            </div>
                        </div>
                    )}

                    <div className="mb-6 border-b border-slate-100 pb-4 shrink-0">
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-2">Insight Wilayah</h3>
                        <p className="text-sm font-semibold text-[#6A7BFA] uppercase tracking-widest">{selectedProvince}</p>
                    </div>

                    <div className="flex-1 flex flex-col gap-6">

                        {/* KARTU METRIK TOTAL */}
                        <div className="bg-slate-50 border border-slate-200 p-5 rounded-[24px] relative overflow-hidden group shrink-0">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#EDF2FE] rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform"></div>
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-white text-[#4f46e5] rounded-xl shadow-sm border border-slate-100"><Package size={16} /></div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total Volume</p>
                                </div>
                                <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${localTrend.isUp ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {localTrend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {localTrend.value}%
                                </span>
                            </div>
                            <div className="flex items-end justify-between relative z-10">
                                <p className="text-2xl font-black text-slate-900 tracking-tight">{(totalRegionVolume * 1000).toLocaleString('id-ID')} <span className="text-sm font-semibold text-slate-500">Unit</span></p>
                                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl shadow-sm">
                                    🔥 {marketShare(selectedProvince)}% Nasional
                                </span>
                            </div>
                        </div>

                        {/* SISTEM TAB NAVIGASI (UPDATE: PREMIUM GRADIENT ON ACTIVE) */}
                        <div className="flex p-1.5 bg-slate-50 border border-slate-200 rounded-[20px] shrink-0">
                            <button
                                onClick={() => setActiveTab('kota')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[16px] text-xs font-bold transition-all ${activeTab === 'kota' ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
                            >
                                <Building2 size={14} /> Kota
                            </button>
                            <button
                                onClick={() => setActiveTab('retailer')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[16px] text-xs font-bold transition-all ${activeTab === 'retailer' ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
                            >
                                <Store size={14} /> Retailer
                            </button>
                            <button
                                onClick={() => setActiveTab('produk')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[16px] text-xs font-bold transition-all ${activeTab === 'produk' ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
                            >
                                <PackageSearch size={14} /> Produk
                            </button>
                        </div>

                        {/* AREA CHART YANG DITAMPILKAN BERDASARKAN TAB */}
                        <div className="flex-1 w-full min-h-[220px] relative">
                            {activeTab === 'kota' && (
                                <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <ReactECharts option={cityBarOption} style={{ height: '100%', width: '100%' }} />
                                </div>
                            )}
                            {activeTab === 'retailer' && (
                                <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <ReactECharts option={retailerBarOption} style={{ height: '100%', width: '100%' }} />
                                </div>
                            )}
                            {activeTab === 'produk' && (
                                <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <ReactECharts option={productDonutOption} style={{ height: '100%', width: '100%' }} />
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

        </div>
    );
}