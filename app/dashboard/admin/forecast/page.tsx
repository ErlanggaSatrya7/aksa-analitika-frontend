"use client";
import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { BrainCircuit, AlertCircle, Loader2, Info, MapPin, Building2, Store, PackageSearch, Sparkles, ChevronDown, Lightbulb, Clock, CheckCircle2, ChevronUp, Send, History } from 'lucide-react';

export default function AIForecastingPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isPredicting, setIsPredicting] = useState(false);

    // FETCH DYNAMIC FILTER DATA DARI DATABASE
    const [filters, setFilters] = useState({ prov: 'Semua Provinsi', city: 'Semua Kota', retailer: 'Semua Retailer', product: 'Semua Kategori Produk' });
    const [dbOptions, setDbOptions] = useState({ provinces: [], cities: [], retailers: [], products: [] });
    const [forecastData, setForecastData] = useState<any>(null);

    useEffect(() => {
        fetch('/api/admin/analytics/forecast-options').then(res => res.json()).then(data => {
            setDbOptions(data);
            setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }, []);

    const handleGenerateForecast = async () => {
        setIsPredicting(true);
        try {
            // POST request parameter AI ke API Server Action Database
            const res = await fetch('/api/admin/analytics/forecast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });
            const data = await res.json();
            setForecastData(data);
        } catch (error) {
            console.error("Gagal menarik AI Prediksi DB");
        } finally {
            setIsPredicting(false);
        }
    };

    const forecastOption = {
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0 },
        grid: { left: '4%', right: '6%', bottom: '15%', top: '10%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: forecastData?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun W1', 'Jun W2'] },
        yAxis: { type: 'value' },
        series: [
            { name: 'Data Aktual DB', type: 'line', smooth: true, itemStyle: { color: '#4f46e5' }, lineStyle: { width: 4 }, data: forecastData?.actual || [1.2, 1.5, 1.3, 1.8, 2.1, null, null] },
            { name: 'Prediksi AI Utama', type: 'line', smooth: true, itemStyle: { color: '#F59E0B' }, lineStyle: { width: 3, type: 'dashed' }, data: forecastData?.predicted || [null, null, null, null, 2.1, 2.4, 2.6] }
        ]
    };

    if (isLoading) return <div className="w-full h-full flex items-center justify-center text-[#6A7BFA] gap-3"><Loader2 size={24} className="animate-spin" /><span className="font-bold tracking-widest uppercase text-sm">Menghubungkan Engine AI DB...</span></div>;

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div><h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">AI Forecasting & Proyeksi</h2><p className="text-sm text-slate-500 mt-1">Analisis proyeksi cerdas langsung dari rekaman Database Prisma.</p></div>
            </div>

            <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                {/* FILTER DROPDOWN SIMPLE (Asumsi desain minimalis) */}
                <select className="border border-slate-200 rounded-xl px-4 py-3 w-full" value={filters.prov} onChange={e => setFilters({ ...filters, prov: e.target.value })}>
                    <option value="Semua Provinsi">Semua Provinsi</option>
                    {dbOptions.provinces.map((p: string) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select className="border border-slate-200 rounded-xl px-4 py-3 w-full" value={filters.retailer} onChange={e => setFilters({ ...filters, retailer: e.target.value })}>
                    <option value="Semua Retailer">Semua Retailer</option>
                    {dbOptions.retailers.map((r: string) => <option key={r} value={r}>{r}</option>)}
                </select>

                <button onClick={handleGenerateForecast} disabled={isPredicting} className="w-full md:w-auto shrink-0 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white px-8 py-3.5 rounded-[20px] font-bold text-sm transition-all flex justify-center gap-2 active:scale-95">
                    {isPredicting ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={18} /> Komparasi Data DB</>}
                </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 relative">
                {isPredicting && <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-[#4f46e5] gap-4"><Loader2 size={36} className="animate-spin" /><span className="font-bold text-xl">Query Prediksi Prisma...</span></div>}
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full text-emerald-600 text-xs font-bold border border-emerald-100 w-fit mb-4"><CheckCircle2 size={14} /> DB Tersinkronisasi</div>
                <div className="w-full h-[400px]"><ReactECharts option={forecastOption} style={{ height: '100%', width: '100%' }} /></div>

                {forecastData?.insight && (
                    <div className="mt-8 p-6 bg-[#F8FAFC] border-slate-200 rounded-[32px] border">
                        <div className="flex items-center gap-3 mb-4"><Lightbulb size={24} className="text-amber-500" /><h4 className="font-bold text-xl">Insight Eksekutif DB</h4></div>
                        <p className="text-slate-700 font-medium">{forecastData.insight}</p>
                    </div>
                )}
            </div>
        </div>
    );
}