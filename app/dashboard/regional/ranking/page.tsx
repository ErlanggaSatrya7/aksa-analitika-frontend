"use client";
import React, { useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Trophy, Medal, Building2, Store, PackageSearch, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function PeringkatKotaPage() {
    const [filterRetailer, setFilterRetailer] = useState('Semua Retailer');
    const [filterProduct, setFilterProduct] = useState('Semua Kategori');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) setOpenDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const chartOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '8%', bottom: '5%', top: '5%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: {
            type: 'category',
            data: ['Tebing Tinggi', 'Pematangsiantar', 'Binjai', 'Medan'].reverse(),
            axisLine: { show: false }, axisTick: { show: false },
            axisLabel: { fontWeight: '700', color: '#475569', fontSize: 13 }
        },
        series: [{
            name: 'Volume Terjual', type: 'bar',
            data: [
                { value: 1250, itemStyle: { color: '#818CF8', borderRadius: [0, 8, 8, 0] } },
                { value: 2100, itemStyle: { color: '#6A7BFA', borderRadius: [0, 8, 8, 0] } },
                { value: 3400, itemStyle: { color: '#4f46e5', borderRadius: [0, 8, 8, 0] } },
                { value: 5800, itemStyle: { color: '#312E81', borderRadius: [0, 8, 8, 0] } } // Rank 1 color
            ].reverse(),
            barWidth: '40%',
            label: { show: true, position: 'right', formatter: '{c} Pcs', fontWeight: 'bold', fontSize: 13, color: '#1E1B4B' }
        }]
    };

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-6 relative">

            {openDropdown && <div className="fixed inset-0 z-[30]" onClick={() => setOpenDropdown(null)}></div>}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">City Ranks</h2>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><Building2 size={16} className="text-[#6A7BFA]" /> Peringkat performa penjualan di wilayah Sumatera Utara.</p>
                </div>
            </div>

            <div className="bg-white rounded-[32px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 relative z-[40]">
                <div ref={filterRef} className="flex flex-col sm:flex-row gap-4">

                    <div className={`flex-1 flex flex-col gap-1.5 relative transition-all ${openDropdown === 'retailer' ? 'z-[60]' : 'z-10'}`}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Filter Retailer</label>
                        <button onClick={() => setOpenDropdown(openDropdown === 'retailer' ? null : 'retailer')} className={`flex items-center justify-between bg-slate-50 border ${openDropdown === 'retailer' ? 'border-[#4f46e5] ring-4 ring-[#6A7BFA]/10 shadow-sm' : 'border-slate-200 hover:border-[#6A7BFA]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-4 py-3.5 text-sm font-bold text-slate-700 transition-all duration-300 group relative z-[50]`}>
                            <div className="flex items-center gap-2 truncate"><Store size={16} className="text-[#6A7BFA] group-hover:scale-110 group-hover:text-[#4f46e5] transition-all" /><span className="truncate group-hover:text-[#4f46e5]">{filterRetailer}</span></div>
                            <ChevronDown size={16} className={`text-slate-400 group-hover:text-[#4f46e5] transition-transform ${openDropdown === 'retailer' ? 'rotate-180' : ''}`} />
                        </button>
                        {openDropdown === 'retailer' && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                {['Semua Retailer', 'Ramayana', 'Matahari', 'Sport Station'].map((item) => (
                                    <button key={item} onClick={() => { setFilterRetailer(item); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterRetailer === item ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-sm' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5]'}`}>
                                        {item} {filterRetailer === item && <CheckCircle2 size={16} className="text-white" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={`flex-1 flex flex-col gap-1.5 relative transition-all ${openDropdown === 'product' ? 'z-[60]' : 'z-10'}`}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Filter Produk</label>
                        <button onClick={() => setOpenDropdown(openDropdown === 'product' ? null : 'product')} className={`flex items-center justify-between bg-slate-50 border ${openDropdown === 'product' ? 'border-[#4f46e5] ring-4 ring-[#6A7BFA]/10 shadow-sm' : 'border-slate-200 hover:border-[#6A7BFA]/50 hover:shadow-md hover:-translate-y-0.5'} rounded-[20px] px-4 py-3.5 text-sm font-bold text-slate-700 transition-all duration-300 group relative z-[50]`}>
                            <div className="flex items-center gap-2 truncate"><PackageSearch size={16} className="text-[#6A7BFA] group-hover:scale-110 group-hover:text-[#4f46e5] transition-all" /><span className="truncate group-hover:text-[#4f46e5]">{filterProduct}</span></div>
                            <ChevronDown size={16} className={`text-slate-400 group-hover:text-[#4f46e5] transition-transform ${openDropdown === 'product' ? 'rotate-180' : ''}`} />
                        </button>
                        {openDropdown === 'product' && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                                {['Semua Kategori', "Men's Athletic", "Kids Apparel"].map((item) => (
                                    <button key={item} onClick={() => { setFilterProduct(item); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${filterProduct === item ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-sm' : 'text-slate-600 hover:bg-[#F4F7FE] hover:text-[#4f46e5]'}`}>
                                        {item} {filterProduct === item && <CheckCircle2 size={16} className="text-white" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 relative z-10">
                <div className="bg-gradient-to-br from-[#312E81] to-[#4f46e5] rounded-[40px] p-8 shadow-xl text-white flex flex-col items-center justify-center text-center relative overflow-hidden group hover:-translate-y-2 transition-transform">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <Trophy size={48} className="text-amber-400 mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full mb-3 backdrop-blur-sm">Peringkat 1</span>
                    <h3 className="text-3xl font-black mb-1">Medan</h3>
                    <p className="text-white/80 font-medium mb-4">5.800 Pcs Terjual</p>
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:-translate-y-2 transition-transform group">
                    <Medal size={40} className="text-slate-400 mb-4 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-3 py-1 rounded-full mb-3">Peringkat 2</span>
                    <h3 className="text-2xl font-black text-slate-800 mb-1">Binjai</h3>
                    <p className="text-slate-500 font-medium mb-4">3.400 Pcs Terjual</p>
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:-translate-y-2 transition-transform group">
                    <Medal size={40} className="text-amber-700 mb-4 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 px-3 py-1 rounded-full mb-3 border border-amber-100">Peringkat 3</span>
                    <h3 className="text-2xl font-black text-slate-800 mb-1">Pematangsiantar</h3>
                    <p className="text-slate-500 font-medium mb-4">2.100 Pcs Terjual</p>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 relative z-10">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">Grafik Komparasi Volume</h3>
                <div className="w-full h-[350px]">
                    <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                </div>
            </div>

        </div>
    );
}