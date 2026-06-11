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
    const [activeTab, setActiveTab] = useState<'kota' | 'retailer' | 'produk'>('kota');
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
                const res = await fetch(`/api/admin/analytics/map?province=Nasional`);
                return await res.json();
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
                setNationalMapData(dbData.provinceDistribution || []);

                const uppercaseProvinces = (dbData.availableProvinces || []).map((p: string) => p.toUpperCase());
                setAllProvinces(uppercaseProvinces);

                sessionStorage.setItem("ai_context_map_data", JSON.stringify({
                    type: "distribution_map",
                    total_volume: dbData.totalVolume,
                    top_cities: dbData.topCities?.slice(0, 3),
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
            const res = await fetch(`/api/admin/analytics/map?province=${encodeURIComponent(provinceName)}`);
            const newData = await res.json();

            setMapAnalytics(newData);

            sessionStorage.setItem("ai_context_map_data", JSON.stringify({
                type: "distribution_map",
                province: provinceName,
                total_volume: newData.totalVolume,
                top_cities: newData.topCities?.slice(0, 3),
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

    const mapDataFormatted = useMemo(() => {
        return nationalMapData.map((d: any) => ({
            name: d.name.toUpperCase(),
            value: d.value,
            selected: d.name.toUpperCase() === selectedProvince.toUpperCase()
        })) || [];
    }, [nationalMapData, selectedProvince]);

    const mainMapOption = useMemo(() => ({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: (params: any) => `<div style="font-weight:600; font-size:13px; color:#0F172A; text-transform:uppercase;">${params.name}</div><div style="color:#6A7BFA; font-weight:bold; margin-top:4px;">Volume: ${(params.value || 0).toLocaleString('id-ID')} Unit</div>`, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E2E8F0', padding: [12, 16] },
        visualMap: { min: 0, max: 50000, text: ['Tinggi', 'Rendah'], realtime: false, calculable: true, inRange: { color: ['#EDF2FE', '#818CF8', '#4f46e5'] }, itemWidth: 10, itemHeight: 80, bottom: 20, left: 20 },
        series: [{
            name: 'Performa Provinsi',
            type: 'map',
            map: 'indonesia_interaktif',
            nameProperty: 'Propinsi',
            roam: true,
            label: { show: true, color: '#64748B', fontSize: 8, formatter: '{b}' },
            itemStyle: { areaColor: '#E2E8F0', borderColor: '#FFFFFF', borderWidth: 1.5 },
            emphasis: { itemStyle: { areaColor: '#818CF8' } },
            select: {
                itemStyle: {
                    areaColor: '#F59E0B',
                    borderColor: '#FFFFFF',
                    borderWidth: 3,
                    shadowColor: 'rgba(245, 158, 11, 0.7)',
                    shadowBlur: 15
                },
                label: { show: true, color: '#FFFFFF', fontWeight: '900', fontSize: 10 }
            },
            selectedMode: 'single',
            data: mapDataFormatted
        }]
    }), [mapDataFormatted]);

    // FILTER TOP 5 DAN FORMAT NAMA RETAILER
    const topCitiesData = useMemo(() => (mapAnalytics?.topCities || []).slice(0, 5), [mapAnalytics]);
    const topProductsData = useMemo(() => (mapAnalytics?.topProducts || []).slice(0, 5), [mapAnalytics]);
    const topRetailersData = useMemo(() => {
        const rawData = (mapAnalytics?.topRetailers || []).slice(0, 5);
        return rawData.map((d: any) => {
            // Jika nama dideteksi murni angka (ID), tambahkan label "Retailer "
            const isJustNumbers = /^\d+$/.test(String(d.name));
            return {
                ...d,
                name: isJustNumbers ? `Retailer ${d.name}` : d.name
            };
        });
    }, [mapAnalytics]);

    const barOptionTemplate = (data: any[], colorStops: any[]) => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '2%', right: '15%', bottom: '0%', top: '5%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: data.map(d => d.name).reverse(), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontWeight: '600', color: '#0F172A', fontSize: 10 } },
        series: [{ type: 'bar', data: data.map(d => d.value).reverse(), itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, colorStops), borderRadius: [0, 6, 6, 0] }, barWidth: '45%', label: { show: true, position: 'right', formatter: '{c}', fontWeight: '700', fontSize: 10 } }]
    });

    if (isLoading) return <div className="w-full h-full flex flex-col items-center justify-center text-[#6A7BFA] gap-4"><Loader2 size={36} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm">Memuat Peta Spasial...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8 relative">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 animate-in fade-in">
                <div><h2 className="text-3xl font-bold text-slate-900 tracking-tight">Peta Distribusi Interaktif</h2><p className="text-sm text-slate-500 mt-1">Klik wilayah pada peta untuk membedah data aktual database.</p></div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-72 z-[60]">
                        {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>}
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-[40px] px-5 py-3 text-sm font-bold shadow-sm z-50 relative"><div className="flex items-center gap-2 truncate"><MapPin size={16} className="text-[#4f46e5]" /><span>{selectedProvince === 'Nasional' ? 'Nasional (Semua Provinsi)' : selectedProvince}</span></div><ChevronDown size={16} /></button>
                        {isDropdownOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 rounded-[24px] shadow-xl z-50 overflow-hidden">
                                <div className="p-3 bg-slate-50 border-b border-slate-100"><input type="text" placeholder="Cari..." value={searchProv} onChange={e => setSearchProv(e.target.value)} className="w-full rounded-full px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6A7BFA]" /></div>
                                <div className="max-h-[260px] overflow-y-auto p-2">
                                    <button onClick={handleReset} className="w-full text-left px-4 py-3 rounded-[16px] text-sm font-bold bg-[#EDF2FE] text-[#6A7BFA] mb-1">Nasional (Semua Provinsi)</button>
                                    {filteredProvinces.map(prov => <button key={prov} onClick={() => triggerDataUpdate(prov)} className="w-full text-left px-4 py-3 rounded-[16px] text-sm font-bold hover:bg-slate-50 text-slate-600 uppercase">{prov}</button>)}
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={handleReset} className="w-full sm:w-auto flex justify-center items-center gap-2 bg-white text-slate-600 border border-slate-200 hover:bg-[#6A7BFA] hover:text-white px-6 py-3 rounded-[40px] text-sm font-bold transition-all"><Target size={18} /> Reset</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative flex flex-col p-4 min-h-[500px]">
                    <div className="absolute top-8 left-8 z-10 flex items-center gap-2 bg-white/90 px-5 py-3 rounded-[20px] shadow-lg text-sm font-bold border border-slate-200"><MapPin size={18} className="text-[#4f46e5]" /> {selectedProvince.toUpperCase()}</div>

                    <div className="w-full h-full min-h-[500px] bg-[#F8FAFC] rounded-[32px] overflow-hidden flex items-center justify-center">
                        {isMapLoaded ? (
                            <ReactECharts ref={echartsRef} option={mainMapOption} notMerge={true} style={{ height: '100%', width: '100%' }} onEvents={{ 'click': (p: any) => p.name && triggerDataUpdate(p.name) }} />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 font-semibold text-sm gap-3">
                                <Loader2 size={32} className="animate-spin text-[#6A7BFA]" />
                                <span className="text-slate-500">Menyinkronkan Peta Interaktif...</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[40px] p-6 lg:p-8 flex flex-col relative overflow-hidden">
                    {isFiltering && <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center text-[#4f46e5] gap-4"><Loader2 size={32} className="animate-spin" /><span className="font-bold">Mengekstrak Data DB...</span></div>}

                    <div className="bg-slate-50 p-5 rounded-[24px] flex justify-between items-center mb-6">
                        <div><p className="text-[11px] font-bold text-slate-500 uppercase">Total Volume Wilayah</p><h3 className="text-2xl font-black">{mapAnalytics?.totalVolume?.toLocaleString('id-ID') || 0} <span className="text-sm text-slate-500 font-semibold">Unit</span></h3></div>
                    </div>

                    <div className="flex p-1.5 bg-slate-50 border border-slate-200 rounded-[20px] shrink-0 mb-4">
                        <button onClick={() => setActiveTab('kota')} className={`flex-1 py-2.5 rounded-[16px] text-xs font-bold ${activeTab === 'kota' ? 'bg-[#6A7BFA] text-white' : 'text-slate-500'}`}>Kota</button>
                        <button onClick={() => setActiveTab('retailer')} className={`flex-1 py-2.5 rounded-[16px] text-xs font-bold ${activeTab === 'retailer' ? 'bg-[#6A7BFA] text-white' : 'text-slate-500'}`}>Retailer</button>
                        <button onClick={() => setActiveTab('produk')} className={`flex-1 py-2.5 rounded-[16px] text-xs font-bold ${activeTab === 'produk' ? 'bg-[#6A7BFA] text-white' : 'text-slate-500'}`}>Produk</button>
                    </div>

                    <div className="flex-1 w-full relative min-h-[250px]">
                        {activeTab === 'kota' && <ReactECharts option={barOptionTemplate(topCitiesData, [{ offset: 0, color: '#6A7BFA' }, { offset: 1, color: '#4f46e5' }])} style={{ height: '100%', width: '100%' }} />}
                        {activeTab === 'retailer' && <ReactECharts option={barOptionTemplate(topRetailersData, [{ offset: 0, color: '#818CF8' }, { offset: 1, color: '#6A7BFA' }])} style={{ height: '100%', width: '100%' }} />}
                        {activeTab === 'produk' && <ReactECharts option={{ tooltip: { trigger: 'item', formatter: (params: any) => `<div style="font-weight:bold; margin-bottom:4px;">${params.name}</div><div style="color:#6A7BFA; font-weight:bold;">${(params.value).toLocaleString('id-ID')} Unit (${params.percent}%)</div>` }, series: [{ type: 'pie', radius: ['45%', '70%'], data: topProductsData }] }} style={{ height: '100%', width: '100%' }} />}
                    </div>
                </div>
            </div>
        </div>
    );
}