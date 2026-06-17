"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ReactECharts from 'echarts-for-react';
import { PieChart, TrendingUp, Users, CreditCard, ChevronDown, CheckCircle2, BarChart3, Activity, Loader2, AlertTriangle } from 'lucide-react';

export default function StoreSalesAnalysis() {
    const { data: session } = useSession();
    const user = session?.user as any;
    const retailerId = user?.retailerId || '';

    // --- HELPER: MENDAPATKAN NAMA BRAND DARI ID ---
    const getRetailerBrand = (id: string) => {
        if (!id) return "Mitra Toko";
        const brands: Record<string, string> = {
            '1000001': 'RAMAYANA',
            '1000002': 'ADIDAS OFFICIAL STORE',
            '1000003': 'SPORTS STATION',
            '1000004': 'PLANET SPORTS',
            '1000005': 'TRANSMART',
            '1000006': 'MATAHARI'
        };
        return brands[id] || `Brand (${id})`;
    };

    const storeName = getRetailerBrand(retailerId);

    const [isLoading, setIsLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('Semua Kategori');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    const [salesData, setSalesData] = useState({
        kpi: { volume: 0, avgTicket: 0, topDay: '-' },
        dailyTrend: [] as number[],
        pieChart: [] as { name: string, value: number, itemStyle?: any }[],
        availableCategories: ['Semua Kategori']
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) setOpenDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!retailerId) {
            const timer = setTimeout(() => setIsLoading(false), 800);
            return () => clearTimeout(timer);
        }

        setIsLoading(true);
        const fetchSales = async () => {
            try {
                const res = await fetch(`/api/store/sales?retailerId=${retailerId}&category=${encodeURIComponent(filterCategory)}`);
                if (!res.ok) throw new Error("Gagal mengambil data");
                const data = await res.json();

                const colors = ['#6A7BFA', '#312E81', '#A3B1FF', '#4f46e5', '#C7D2FE'];
                const coloredPie = (data.pieChart || []).map((item: any, i: number) => ({
                    ...item,
                    itemStyle: { color: colors[i % colors.length] }
                }));

                setSalesData({
                    kpi: data.kpi || { volume: 0, avgTicket: 0, topDay: '-' },
                    dailyTrend: data.dailyTrend || [],
                    pieChart: coloredPie,
                    availableCategories: data.availableCategories && data.availableCategories.length > 0 ? data.availableCategories : ['Semua Kategori']
                });
            } catch (error) {
                console.error("Sales Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSales();
    }, [retailerId, filterCategory]);

    const formatRupiah = (val: number) => {
        const num = Number(val) || 0;
        if (num >= 1_000_000_000_000) return `Rp ${(num / 1_000_000_000_000).toFixed(2)}T`;
        if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(2)}M`;
        if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}Jt`;
        return `Rp ${num.toLocaleString('id-ID')}`;
    };

    const hasDailyTrend = salesData.dailyTrend && salesData.dailyTrend.some(v => v > 0);
    const hasPieChart = salesData.pieChart && salesData.pieChart.length > 0;

    const dailyTrendOption = {
        tooltip: { trigger: 'axis', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDF2FE', padding: [12, 16], extraCssText: 'border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);' },
        grid: { left: '4%', right: '4%', bottom: '5%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#64748B', fontWeight: '600', margin: 12 } },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } }, axisLabel: { formatter: '{value}', color: '#94A3B8', fontWeight: '500' } },
        series: [{
            name: 'Volume Harian', type: 'line', smooth: true, symbolSize: 8,
            itemStyle: { color: '#4f46e5', borderWidth: 2, borderColor: '#fff' }, lineStyle: { width: 4, shadowColor: 'rgba(79, 70, 229, 0.3)', shadowBlur: 10, shadowOffsetY: 5 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(79, 70, 229, 0.2)' }, { offset: 1, color: 'rgba(79, 70, 229, 0)' }] } },
            data: salesData.dailyTrend
        }]
    };

    const paymentOption = {
        tooltip: { trigger: 'item', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDF2FE', padding: [12, 16], extraCssText: 'border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);' },
        legend: { bottom: '0%', left: 'center', icon: 'circle', textStyle: { color: '#475569', fontWeight: '600' }, itemGap: 20 },
        series: [{
            name: 'Metode Transaksi', type: 'pie', radius: ['45%', '70%'], center: ['50%', '42%'], avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 4 },
            label: { show: false },
            data: salesData.pieChart
        }]
    };

    if (isLoading) return <div className="w-full h-full flex flex-col items-center justify-center text-[#4f46e5] gap-4 min-h-[70vh]"><Loader2 size={36} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm text-slate-500">Menyinkronkan Analitik...</span></div>;

    return (
        <div className="pb-12 max-w-7xl mx-auto space-y-8 relative">
            {openDropdown && <div className="fixed inset-0 z-[30]" onClick={() => setOpenDropdown(null)}></div>}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">Analisis Penjualan Toko</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium flex items-center gap-1.5"><Activity size={16} className="text-[#4f46e5]" /> Pantau tren harian dan perilaku pembeli di <span className="font-bold text-[#4f46e5]">{storeName}</span>.</p>
                </div>
            </div>

            {/* FILTER KATEGORI */}
            <div className="bg-white rounded-[40px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 relative z-[40]">
                <div ref={filterRef} className="w-full md:w-1/3">
                    <div className={`flex flex-col gap-2 relative transition-all ${openDropdown === 'category' ? 'z-[60]' : 'z-10'}`}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Filter Berdasarkan Kategori</label>
                        <button onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-[24px] px-5 py-3.5 text-sm font-bold text-slate-700 hover:border-[#6A7BFA]/60 transition-all group relative z-[50]">
                            <div className="flex items-center gap-2 truncate"><BarChart3 size={18} className="text-[#4f46e5] group-hover:scale-110 transition-transform" /><span className="truncate group-hover:text-[#4f46e5]">{filterCategory}</span></div>
                            <ChevronDown size={18} className={`text-slate-400 group-hover:text-[#4f46e5] transition-transform ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
                        </button>
                        {openDropdown === 'category' && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-60 overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                {salesData.availableCategories.map((item) => (
                                    <button key={item} onClick={() => { setFilterCategory(item); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-[16px] text-sm font-bold transition-all duration-200 ${filterCategory === item ? 'bg-[#EDF2FE] text-[#4f46e5]' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5]'}`}>
                                        {item} {filterCategory === item && <CheckCircle2 size={18} className="text-[#4f46e5]" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 relative z-10">
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_20px_40px_-15px_rgba(106,123,250,0.2)] hover:-translate-y-1.5 transition-all duration-300 group">
                    <div className="p-4 bg-[#EDF2FE] text-[#4f46e5] rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Volume Unit Terjual</p>
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">{salesData.kpi.volume.toLocaleString('id-ID')} <span className="text-xl lg:text-2xl text-slate-400 font-semibold tracking-normal">Pcs</span></h3>
                    </div>
                </div>
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_20px_40px_-15px_rgba(106,123,250,0.2)] hover:-translate-y-1.5 transition-all duration-300 group">
                    <div className="p-4 bg-[#EDF2FE] text-[#4f46e5] rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><Users size={24} /></div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Avg. Belanja / Transaksi</p>
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">{formatRupiah(salesData.kpi.avgTicket)}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_20px_40px_-15px_rgba(106,123,250,0.2)] hover:-translate-y-1.5 transition-all duration-300 group">
                    <div className="p-4 bg-[#EDF2FE] text-[#4f46e5] rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:text-white transition-all"><CreditCard size={24} /></div>
                    <div>
                        <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-[#4f46e5] transition-colors">Hari Transaksi Tertinggi</p>
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">{salesData.kpi.topDay}</h3>
                    </div>
                </div>
            </div>

            {/* CHART ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 relative z-10">
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col group">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Tren Penjualan Harian</h3>
                    <p className="text-sm text-slate-500 font-medium mb-6">Distribusi volume penjualan di <span className="font-bold text-slate-600">{storeName}</span> per hari.</p>
                    <div className="w-full h-[350px]">
                        {hasDailyTrend ? (
                            <ReactECharts option={dailyTrendOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-[24px] bg-slate-50/50">
                                <AlertTriangle className="opacity-50 text-[#4f46e5]" size={36} />
                                <span className="font-bold text-sm tracking-widest uppercase">Belum ada transaksi</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col group">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Metode Transaksi</h3>
                    <p className="text-sm text-slate-500 font-medium mb-6">Preferensi pembayaran pelanggan {filterCategory !== 'Semua Kategori' ? `kategori ${filterCategory}` : 'secara umum'}.</p>
                    <div className="w-full h-[350px] group-hover:scale-[1.02] transition-transform duration-500">
                        {hasPieChart ? (
                            <ReactECharts option={paymentOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-[24px] bg-slate-50/50">
                                <PieChart className="opacity-50 text-[#4f46e5]" size={36} />
                                <span className="font-bold text-sm tracking-widest uppercase">Data Kosong</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}