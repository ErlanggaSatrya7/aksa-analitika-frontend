"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { MapPin, Target, Loader2, ChevronDown } from 'lucide-react';

export default function PetaDistribusiPage() {
    const echartsRef = useRef<ReactECharts>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    const [selectedProvince, setSelectedProvince] = useState('Nasional');
    const [isFiltering, setIsFiltering] = useState(false);

    const [activeTab, setActiveTab] = useState<'retailer' | 'produk'>('retailer');

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchProv, setSearchProv] = useState('');

    const [mapAnalytics, setMapAnalytics] = useState<any>(null);
    const [nationalMapData, setNationalMapData] = useState<any[]>([]);
    const [allProvinces, setAllProvinces] = useState<string[]>([]);

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const res = await fetch('/indonesia.geojson');
                if (!res.ok) throw new Error("File GeoJSON tidak ditemukan (404)");
                return await res.json();
            } catch (error) {
                console.error("Gagal memuat peta:", error);
                return null;
            }
        };

        const fetchDbData = async () => {
            try {
                // Endpoint ini harus sama dengan endpoint dashboard agar datanya konsisten
                // Mengambil secara khusus untuk analitik peta (filter berdasarkan Provinsi saja)
                const res = await fetch(`/api/admin/analytics/map?province=Nasional`);
                if (res.ok) {
                    return await res.json();
                }
                return null;
            } catch (error) {
                console.error("Gagal memuat analitik:", error);
                return null;
            }
        };

        Promise.all([fetchMapData(), fetchDbData()]).then(([geojson, dbData]) => {
            if (geojson && geojson.features) {
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

                geojson.features.forEach((feature: any) => {
                    let rawName = feature.properties.Propinsi || feature.properties.state || feature.properties.NAME_1 || "";
                    let pName = rawName.toUpperCase();
                    if (geojsonNameTranslator[pName]) {
                        pName = geojsonNameTranslator[pName];
                    }
                    feature.properties.Propinsi = pName;
                });

                echarts.registerMap('indonesia_interaktif', geojson);
                setIsMapLoaded(true);
            }

            if (dbData) {
                setMapAnalytics(dbData);
                // Menarik data sebaran provinsi dari backend API
                setNationalMapData(dbData.provinceDistribution || []);

                const uppercaseProvinces = (dbData.availableProvinces || []).map((p: string) => p.toUpperCase());
                setAllProvinces(uppercaseProvinces);

                // Set AI Context
                sessionStorage.setItem("ai_context_map_data", JSON.stringify({
                    type: "distribution_map",
                    total_volume: dbData.totalVolume,
                    top_retailers: dbData.topRetailers?.slice(0, 3),
                    last_updated: new Date().toISOString()
                }));
            }

            setIsLoading(false);
        });
    }, []);

    const filteredProvinces = allProvinces.filter(prov => prov.includes(searchProv.toUpperCase()));

    const triggerDataUpdate = async (provinceName: string) => {
        setIsFiltering(true);
        setSelectedProvince(provinceName);
        setIsDropdownOpen(false);
        setSearchProv('');

        try {
            // Hit API berdasarkan filter Provinsi
            const res = await fetch(`/api/admin/analytics/map?province=${encodeURIComponent(provinceName)}`);
            const newData = await res.json();

            setMapAnalytics(newData);

            sessionStorage.setItem("ai_context_map_data", JSON.stringify({
                type: "distribution_map",
                province: provinceName,
                total_volume: newData.totalVolume,
                top_retailers: newData.topRetailers?.slice(0, 3)
            }));

            if (echartsRef.current && provinceName !== 'Nasional') {
                const chart = echartsRef.current.getEchartsInstance();
                chart.dispatchAction({ type: 'select', name: provinceName });
            }
        } catch (error) {
            console.error("Gagal menarik data provinsi dari DB");
        } finally {
            setIsFiltering(false);
        }
    };

    const handleReset = () => {
        if (echartsRef.current) echartsRef.current.getEchartsInstance().dispatchAction({ type: 'unselect' });
        triggerDataUpdate('Nasional');
    };

    // Format Data untuk Map Echarts (Berdasarkan state dari API Database)
    const mapDataFormatted = useMemo(() => {
        return nationalMapData.map((d: any) => ({
            name: d.name.toUpperCase(),
            value: d.value,
            selected: d.name.toUpperCase() === selectedProvince.toUpperCase()
        })) || [];
    }, [nationalMapData, selectedProvince]);

    const formatNumber = (num: number) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toLocaleString('id-ID');
    };

    const mainMapOption = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: '#ffffff',
            borderWidth: 0,
            padding: [12, 16],
            extraCssText: 'border-radius: 12px; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.15);',
            formatter: (params: any) => `
                <div style="font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:#94A3B8; margin-bottom:6px;">Regional Analysis</div>
                <div style="color:#1E293B; font-weight:800; font-size:16px;">${params.name || 'Wilayah'}</div>
                <div style="color:#4F46E5; font-weight:700; margin-top:4px; font-size:14px;">Volume: ${(params.value || 0).toLocaleString('id-ID')} Unit</div>
            `
        },
        visualMap: {
            min: 0,
            max: 30000, // Disetel berdasarkan peak penjualan per region
            text: ['Tinggi', 'Rendah'],
            realtime: false,
            calculable: true,
            inRange: { color: ['#EDF2FE', '#818CF8', '#4F46E5'] },
            itemWidth: 12,
            itemHeight: 100,
            bottom: 25,
            left: 25,
            textStyle: { color: '#64748B', fontWeight: 'bold' }
        },
        series: [{
            name: 'Performa Provinsi',
            type: 'map',
            map: 'indonesia_interaktif',
            nameProperty: 'Propinsi',
            roam: true,
            label: { show: true, color: '#64748B', fontSize: 9, formatter: '{b}' },
            itemStyle: { areaColor: '#F8FAFC', borderColor: '#FFFFFF', borderWidth: 1.5 },
            emphasis: { itemStyle: { areaColor: '#A5B4FC' } },
            select: {
                itemStyle: {
                    areaColor: '#F59E0B',
                    borderColor: '#FFFFFF',
                    borderWidth: 3,
                    shadowColor: 'rgba(245, 158, 11, 0.5)',
                    shadowBlur: 15
                },
                label: { show: true, color: '#FFFFFF', fontWeight: '900', fontSize: 11 }
            },
            selectedMode: 'single',
            data: mapDataFormatted
        }]
    }), [mapDataFormatted]);

    const topProductsData = useMemo(() => (mapAnalytics?.topProducts || []).slice(0, 5), [mapAnalytics]);

    // Normalisasi Nama Retailer
    const topRetailersData = useMemo(() => {
        const rawData = (mapAnalytics?.topRetailers || []).slice(0, 5);
        return rawData.map((d: any) => {
            const isJustNumbers = /^\d+$/.test(String(d.name));
            return {
                ...d,
                name: isJustNumbers ? `Retailer ${d.name}` : d.name
            };
        });
    }, [mapAnalytics]);

    // Template Untuk Bar Chart (Top Retailer)
    const barOptionTemplate = (data: any[], colorStops: any[]) => ({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: '#ffffff',
            borderWidth: 0,
            extraCssText: 'border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);'
        },
        grid: { left: '2%', right: '15%', bottom: '0%', top: '5%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: {
            type: 'category',
            data: data.map(d => d.name).reverse(),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontWeight: '700', color: '#334155', fontSize: 11, margin: 12 }
        },
        series: [{
            type: 'bar',
            data: data.map(d => d.value).reverse(),
            itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, colorStops), borderRadius: [0, 8, 8, 0] },
            barWidth: '40%',
            label: {
                show: true,
                position: 'right',
                formatter: (params: any) => formatNumber(params.value),
                fontWeight: '800',
                fontSize: 11,
                color: '#475569',
                padding: [0, 0, 0, 8]
            }
        }]
    });

    if (isLoading) return (
        <div className="w-full h-[80vh] flex flex-col items-center justify-center text-indigo-500 gap-4">
            <Loader2 size={40} className="animate-spin" />
            <span className="font-bold tracking-widest uppercase text-sm text-slate-500">Memuat Peta Spasial...</span>
        </div>
    );

    return (
        <div className="pb-12 max-w-7xl mx-auto space-y-8 relative animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Peta Distribusi Regional</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Klik visual map wilayah untuk memfilter seluruh data performa.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    {/* CUSTOM DROPDOWN SELECTOR PROVINSI */}
                    <div className="relative w-full sm:w-[320px] z-[60]">
                        {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>}
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-indigo-300 rounded-full px-5 py-3.5 text-sm font-bold shadow-sm z-50 relative transition-all"
                        >
                            <div className="flex items-center gap-2.5 truncate">
                                <MapPin size={18} className="text-indigo-600" />
                                <span className="text-slate-700">{selectedProvince === 'Nasional' ? 'Nasional (Seluruh Wilayah)' : selectedProvince}</span>
                            </div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 rounded-[24px] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2">
                                <div className="p-3 bg-slate-50 border-b border-slate-100">
                                    <input
                                        type="text"
                                        placeholder="Cari area provinsi..."
                                        value={searchProv}
                                        onChange={e => setSearchProv(e.target.value)}
                                        className="w-full rounded-full px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 border border-slate-200 placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="max-h-[260px] overflow-y-auto p-2 custom-scrollbar">
                                    <button onClick={handleReset} className="w-full text-left px-4 py-3 rounded-[16px] text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 mb-1 transition-colors">
                                        Nasional (Semua Provinsi)
                                    </button>
                                    {filteredProvinces.map(prov => (
                                        <button key={prov} onClick={() => triggerDataUpdate(prov)} className="w-full text-left px-4 py-3 rounded-[16px] text-xs font-bold hover:bg-slate-50 text-slate-600 uppercase transition-colors">
                                            {prov}
                                        </button>
                                    ))}
                                    {filteredProvinces.length === 0 && (
                                        <p className="text-center text-xs font-semibold text-slate-400 py-4">Provinsi tidak ditemukan</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={handleReset} className="w-full sm:w-auto flex justify-center items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-6 py-3.5 rounded-full text-sm font-bold transition-all shadow-md active:scale-95">
                        <Target size={18} /> Reset Peta
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-auto lg:h-[600px]">
                {/* Bagian Kiri: ECharts Peta Indonesia */}
                <div className="lg:col-span-3 bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative flex flex-col p-3 overflow-hidden">
                    <div className="absolute top-8 left-8 z-10 flex items-center gap-2 bg-white/95 px-5 py-3 rounded-full shadow-sm text-sm font-bold border border-slate-200 backdrop-blur-md">
                        <MapPin size={18} className="text-[#4f46e5]" />
                        <span className="uppercase text-slate-800">{selectedProvince}</span>
                    </div>

                    <div className="w-full h-full min-h-[400px] bg-slate-50 rounded-[32px] overflow-hidden flex items-center justify-center relative">
                        {isMapLoaded ? (
                            <ReactECharts ref={echartsRef} option={mainMapOption} notMerge={true} style={{ height: '100%', width: '100%' }} onEvents={{ 'click': (p: any) => p.name && triggerDataUpdate(p.name) }} />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 font-semibold text-sm gap-3">
                                <Loader2 size={32} className="animate-spin text-[#4f46e5]" />
                                <span>Menyiapkan Peta Geografis...</span>
                            </div>
                        )}
                        <div className="absolute bottom-6 right-6 text-[10px] font-bold text-slate-500 bg-white/90 px-4 py-2.5 rounded-full backdrop-blur-md border border-slate-200 shadow-sm pointer-events-none uppercase tracking-widest">
                            💡 Geser & Scroll
                        </div>
                    </div>
                </div>

                {/* Bagian Kanan: Top Rank Metrics */}
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[40px] p-6 lg:p-8 flex flex-col relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.03)] h-full">
                    {isFiltering && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-[#4f46e5] gap-4">
                            <Loader2 size={36} className="animate-spin" />
                            <span className="font-bold text-xs tracking-widest uppercase">Memfilter Data Wilayah...</span>
                        </div>
                    )}

                    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100/50 p-6 rounded-[28px] flex justify-between items-center mb-6 shadow-sm shrink-0">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Volume Terpilih</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                {formatNumber(mapAnalytics?.totalVolume || 0)} <span className="text-lg text-slate-400 font-semibold">Unit</span>
                            </h3>
                        </div>
                    </div>

                    <div className="flex p-1.5 bg-slate-100 border border-slate-200 rounded-[20px] shrink-0 mb-6 shadow-inner">
                        <button
                            onClick={() => setActiveTab('retailer')}
                            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${activeTab === 'retailer' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Mitra Retailer
                        </button>
                        <button
                            onClick={() => setActiveTab('produk')}
                            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${activeTab === 'produk' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Kategori Produk
                        </button>
                    </div>

                    <div className="flex-1 w-full relative min-h-[300px]">
                        {activeTab === 'retailer' && (
                            <div className="absolute inset-0 animate-in fade-in zoom-in-95 duration-300">
                                <ReactECharts option={barOptionTemplate(topRetailersData, [{ offset: 0, color: '#818CF8' }, { offset: 1, color: '#4F46E5' }])} style={{ height: '100%', width: '100%' }} />
                            </div>
                        )}
                        {activeTab === 'produk' && (
                            <div className="absolute inset-0 animate-in fade-in zoom-in-95 duration-300 flex flex-col justify-center">
                                {/* Pie Chart Untuk Produk agar variasinya terlihat estetik */}
                                <ReactECharts
                                    option={{
                                        tooltip: {
                                            trigger: 'item',
                                            backgroundColor: '#ffffff',
                                            borderWidth: 0,
                                            padding: [12, 16],
                                            extraCssText: 'border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);',
                                            formatter: (params: any) => `
                                                <div style="font-weight:700; font-size:10px; text-transform:uppercase; color:#64748B; margin-bottom:6px;">${params.name}</div>
                                                <div style="color:#4F46E5; font-weight:800; font-size:16px;">${(params.value || 0).toLocaleString('id-ID')} Pcs</div>
                                                <div style="color:#94A3B8; font-weight:600; font-size:12px; margin-top:2px;">Kontribusi: ${params.percent}%</div>
                                            `
                                        },
                                        color: ['#3730A3', '#4F46E5', '#6366F1', '#818CF8', '#A5B4FC', '#E0E7FF'],
                                        series: [{
                                            type: 'pie',
                                            radius: ['45%', '80%'],
                                            center: ['50%', '50%'],
                                            itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
                                            data: topProductsData,
                                            label: { show: false }
                                        }]
                                    }}
                                    style={{ height: '100%', width: '100%' }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}