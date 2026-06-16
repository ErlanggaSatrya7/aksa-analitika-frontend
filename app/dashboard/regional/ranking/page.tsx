"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Trophy, Medal, Store, PackageSearch, ChevronDown, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function PeringkatRetailerPage() {
    const { data: session } = useSession();
    const userState = (session?.user as any)?.assignedState || '';

    const [isLoading, setIsLoading] = useState(true);
    const [filterProduct, setFilterProduct] = useState('Semua Kategori');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    const [rankingData, setRankingData] = useState<{ name: string, value: number }[]>([]);
    const [availableProducts, setAvailableProducts] = useState<string[]>([]);

    useEffect(() => {
        if (!userState) return;
        setIsLoading(true);

        let url = `/api/regional/analytics/ranking?state=${encodeURIComponent(userState)}`;
        if (filterProduct !== 'Semua Kategori') {
            url += `&product=${encodeURIComponent(filterProduct)}`;
        }

        fetch(url, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setRankingData(data.rankings || []);
                if (availableProducts.length === 0) {
                    setAvailableProducts(data.products || []);
                }
                setIsLoading(false);
            })
            .catch(() => {
                setIsLoading(false);
            });
    }, [userState, filterProduct]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) setOpenDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const colorPalette = ['#C7D2FE', '#A3B1FF', '#818CF8', '#6A7BFA', '#4F46E5', '#312E81'];

    // Membalik data karena Echarts Horizontal Bar menggambar dari bawah ke atas
    const reversedData = [...rankingData].reverse();

    // Kalkulasi tinggi dinamis: Minimal 400px, dan akan bertambah 50px untuk setiap Retailer baru
    const dynamicHeight = Math.max(400, reversedData.length * 50);

    const chartSeriesData = reversedData.map((item, index) => {
        const colorIndex = Math.min(index, colorPalette.length - 1);
        return {
            value: item.value,
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#818CF8' },
                    { offset: 1, color: '#4F46E5' }
                ]),
                borderRadius: [0, 8, 8, 0]
            }
        };
    });

    const chartOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: '#ffffff',
            borderWidth: 0,
            padding: [12, 16],
            extraCssText: 'border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);'
        },
        grid: { left: '2%', right: '10%', bottom: '2%', top: '2%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: {
            type: 'category',
            data: reversedData.map(d => d.name),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                fontWeight: '700',
                color: '#475569',
                fontSize: 12,
                margin: 16,
                interval: 0, // PERBAIKAN: Memaksa 100% label nama Retailer muncul
                width: 140,
                overflow: 'truncate'
            }
        },
        series: [{
            name: 'Volume Terjual', type: 'bar',
            data: chartSeriesData,
            barWidth: '45%',
            label: {
                show: true,
                position: 'right',
                formatter: '{c} Pcs',
                fontWeight: '800',
                fontSize: 12,
                color: '#334155',
                padding: [0, 0, 0, 8]
            }
        }]
    };

    const rank1 = rankingData[0];
    const rank2 = rankingData[1];
    const rank3 = rankingData[2];

    return (
        <div className="pb-12 max-w-7xl mx-auto space-y-8 relative">
            {openDropdown && <div className="fixed inset-0 z-[30]" onClick={() => setOpenDropdown(null)}></div>}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">Retailer Ranks</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                        <Store size={16} className="text-[#4f46e5]" /> Peringkat performa volume penjualan mitra retailer di {userState || 'wilayah Anda'}.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 relative z-[40]">
                <div ref={filterRef} className="flex flex-col sm:flex-row gap-4 max-w-md">
                    <div className={`flex-1 flex flex-col gap-1.5 relative transition-all ${openDropdown === 'product' ? 'z-[60]' : 'z-10'}`}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Filter Kategori Produk</label>
                        <button
                            onClick={() => setOpenDropdown(openDropdown === 'product' ? null : 'product')}
                            className={`flex items-center justify-between bg-white border ${openDropdown === 'product' ? 'border-[#4f46e5] shadow-sm' : 'border-slate-200 hover:border-[#6A7BFA] hover:shadow-sm'} rounded-full px-5 py-3.5 text-sm font-bold text-slate-700 transition-all duration-300 group relative z-[50]`}
                        >
                            <div className="flex items-center gap-2.5 truncate">
                                <PackageSearch size={18} className="text-[#4f46e5] group-hover:scale-110 transition-transform" />
                                <span>{filterProduct}</span>
                            </div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${openDropdown === 'product' ? 'rotate-180' : ''}`} />
                        </button>
                        {openDropdown === 'product' && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-[24px] shadow-2xl z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                {['Semua Kategori', ...availableProducts].map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => { setFilterProduct(item); setOpenDropdown(null); }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-[16px] text-xs font-bold transition-all duration-200 ${filterProduct === item ? 'bg-[#EDF2FE] text-[#4f46e5] shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-[#4f46e5]'}`}
                                    >
                                        {item} {filterProduct === item && <CheckCircle2 size={16} className="text-[#4f46e5]" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TOP 3 CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 relative z-10">
                <div className="bg-gradient-to-br from-[#312E81] to-[#4f46e5] rounded-[40px] p-8 shadow-[0_20px_50px_-15px_rgba(79,70,229,0.5)] text-white flex flex-col items-center justify-center text-center relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300 min-h-[240px]">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <Trophy size={56} className="text-amber-400 mb-5 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)] group-hover:scale-110 transition-transform duration-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 border border-white/30 px-4 py-1.5 rounded-full mb-3 backdrop-blur-md">Peringkat 1</span>
                    {isLoading ? <Loader2 className="animate-spin mt-2" /> : (
                        <>
                            <h3 className="text-3xl font-black mb-1.5 tracking-tight">{rank1 ? rank1.name : '-'}</h3>
                            <p className="text-indigo-100 font-medium mb-2">{rank1 ? rank1.value.toLocaleString('id-ID') : 0} Pcs Terjual</p>
                        </>
                    )}
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col items-center justify-center text-center hover:-translate-y-2 transition-transform duration-300 group min-h-[240px]">
                    <Medal size={48} className="text-slate-400 mb-5 group-hover:scale-110 transition-transform duration-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full mb-3">Peringkat 2</span>
                    {isLoading ? <Loader2 className="animate-spin mt-2 text-slate-400" /> : (
                        <>
                            <h3 className="text-2xl font-black text-slate-800 mb-1.5 tracking-tight">{rank2 ? rank2.name : '-'}</h3>
                            <p className="text-slate-500 font-medium mb-2">{rank2 ? rank2.value.toLocaleString('id-ID') : 0} Pcs Terjual</p>
                        </>
                    )}
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col items-center justify-center text-center hover:-translate-y-2 transition-transform duration-300 group min-h-[240px]">
                    <Medal size={48} className="text-amber-600 mb-5 group-hover:scale-110 transition-transform duration-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full mb-3 border border-amber-100">Peringkat 3</span>
                    {isLoading ? <Loader2 className="animate-spin mt-2 text-amber-500" /> : (
                        <>
                            <h3 className="text-2xl font-black text-slate-800 mb-1.5 tracking-tight">{rank3 ? rank3.name : '-'}</h3>
                            <p className="text-slate-500 font-medium mb-2">{rank3 ? rank3.value.toLocaleString('id-ID') : 0} Pcs Terjual</p>
                        </>
                    )}
                </div>
            </div>

            {/* DAFTAR PERINGKAT KESELURUHAN */}
            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 relative z-10 overflow-hidden">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 tracking-tight">Grafik Komparasi Peringkat Keseluruhan</h3>

                {/* Tinggi grafik dibuat dinamis agar memuat seluruh retailer */}
                <div className="w-full relative transition-all duration-500" style={{ height: isLoading || rankingData.length === 0 ? '400px' : `${dynamicHeight}px` }}>
                    {isLoading ? (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm text-[#4f46e5] gap-3">
                            <Loader2 size={40} className="animate-spin" />
                            <span className="font-bold text-sm tracking-widest uppercase">Merekap Data Retailer...</span>
                        </div>
                    ) : rankingData.length === 0 ? (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white text-slate-400 gap-3 border border-dashed border-slate-200 rounded-3xl">
                            <AlertCircle size={40} className="opacity-50" />
                            <span className="font-bold text-sm tracking-wide">Tidak ada data penjualan untuk kategori tersebut.</span>
                        </div>
                    ) : (
                        <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                    )}
                </div>
            </div>
        </div>
    );
}