"use client";
import React, { useState } from 'react';
import { CloudUpload, FileSpreadsheet, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function UploadDatasetPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success'>('idle');
    const [progress, setProgress] = useState(0);

    // DATA DUMMY 10 BARIS (Sesuai Excel)
    const dummyPreviewData = [
        { no: 1, retailer: 'Ramayana', id: '1185732', date: '2020-01-01 00:00:00', region: 'Sumatera', state: 'Sumatera Utara', city: 'Medan', product: "Men's Street Footwear", price: 842750, units: 1200, totalSales: 1011300000, profit: 505650000, margin: 0.5, method: 'Offline (Toko Fisik)' },
        { no: 2, retailer: 'Ramayana', id: '1185732', date: '2020-01-02 00:00:00', region: 'Sumatera', state: 'Sumatera Utara', city: 'Medan', product: "Men's Athletic Footwear", price: 842750, units: 1000, totalSales: 842750000, profit: 252825000, margin: 0.3, method: 'Offline (Toko Fisik)' },
        { no: 3, retailer: 'Ramayana', id: '1185732', date: '2020-01-03 00:00:00', region: 'Sumatera', state: 'Sumatera Utara', city: 'Medan', product: "Women's Street Footwear", price: 674200, units: 1000, totalSales: 674200000, profit: 235970000, margin: 0.35, method: 'Offline (Toko Fisik)' },
        { no: 4, retailer: 'Matahari', id: '1185733', date: '2020-01-04 00:00:00', region: 'Sumatera', state: 'Riau', city: 'Pekanbaru', product: "Kids Footwear", price: 450000, units: 850, totalSales: 382500000, profit: 153000000, margin: 0.4, method: 'Offline (Toko Fisik)' },
        { no: 5, retailer: 'Sport Station', id: '1185734', date: '2020-01-05 00:00:00', region: 'Sumatera', state: 'Sumatera Barat', city: 'Padang', product: "Men's Athletic Footwear", price: 950000, units: 600, totalSales: 570000000, profit: 228000000, margin: 0.4, method: 'Online (Website)' },
        { no: 6, retailer: 'Ramayana', id: '1185732', date: '2020-01-06 00:00:00', region: 'Sumatera', state: 'Sumatera Selatan', city: 'Palembang', product: "Women's Athletic", price: 720000, units: 1100, totalSales: 792000000, profit: 316800000, margin: 0.4, method: 'Offline (Toko Fisik)' },
        { no: 7, retailer: 'Matahari', id: '1185733', date: '2020-01-07 00:00:00', region: 'Sumatera', state: 'Lampung', city: 'Bandar Lampung', product: "Men's Street Footwear", price: 842750, units: 950, totalSales: 800612500, profit: 280214375, margin: 0.35, method: 'Offline (Toko Fisik)' },
        { no: 8, retailer: 'Sport Station', id: '1185734', date: '2020-01-08 00:00:00', region: 'Sumatera', state: 'Aceh', city: 'Banda Aceh', product: "Kids Footwear", price: 450000, units: 500, totalSales: 225000000, profit: 67500000, margin: 0.3, method: 'Online (App)' },
        { no: 9, retailer: 'Ramayana', id: '1185732', date: '2020-01-09 00:00:00', region: 'Sumatera', state: 'Jambi', city: 'Jambi', product: "Women's Street Footwear", price: 674200, units: 800, totalSales: 539360000, profit: 215744000, margin: 0.4, method: 'Offline (Toko Fisik)' },
        { no: 10, retailer: 'Matahari', id: '1185733', date: '2020-01-10 00:00:00', region: 'Sumatera', state: 'Sumatera Utara', city: 'Medan', product: "Men's Athletic Footwear", price: 842750, units: 1500, totalSales: 1264125000, profit: 505650000, margin: 0.4, method: 'Offline (Toko Fisik)' }
    ];

    const handleUploadClick = () => {
        setUploadState('uploading');
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += 20;
            setProgress(currentProgress);
            if (currentProgress >= 100) { clearInterval(interval); setTimeout(() => setUploadState('success'), 500); }
        }, 300);
    };

    return (
        <div className="pb-10 max-w-7xl mx-auto">
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Upload Dataset</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">Suntikkan data transaksi mentah untuk dinormalisasi ke database.</p>
            </div>

            <div className="space-y-8">
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 lg:p-10 transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 fill-mode-both">
                    {uploadState === 'idle' && (
                        <div className={`border-2 border-dashed rounded-[32px] p-12 lg:p-20 flex flex-col items-center justify-center transition-all duration-300 ${isDragging ? 'border-[#4f46e5] bg-[#EDF2FE] scale-[1.01]' : 'border-slate-200 hover:border-[#6A7BFA] hover:bg-slate-50'}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUploadClick(); }}>
                            <div className="p-4 bg-[#EDF2FE] rounded-full text-[#4f46e5] mb-6 shadow-sm"><CloudUpload size={48} /></div>
                            <h3 className="font-bold text-2xl text-slate-900 mb-2">Tarik & Lepas File Di Sini</h3>
                            <p className="text-slate-400 mb-8 text-center max-w-sm text-sm font-medium">Format: <strong>.csv, .xlsx</strong> (Maks 50MB)</p>
                            {/* UPDATE: Tombol Pilih File memakai Gradasi Premium */}
                            <button onClick={handleUploadClick} className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] hover:shadow-lg text-white font-bold py-3.5 px-10 rounded-[40px] transition-all shadow-md active:scale-95 text-sm">Pilih File dari Perangkat</button>
                        </div>
                    )}

                    {uploadState === 'uploading' && (
                        <div className="py-20 flex flex-col items-center justify-center animate-in fade-in">
                            <Loader2 size={48} className="text-[#4f46e5] animate-spin mb-6" />
                            <h3 className="font-bold text-2xl text-slate-900 mb-2">Memproses Dataset...</h3>
                            <div className="w-full max-w-md bg-[#EDF2FE] rounded-full h-3 overflow-hidden shadow-inner mt-8">
                                <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-xs font-bold text-[#4f46e5] mt-4">{progress}% Selesai</p>
                        </div>
                    )}

                    {uploadState === 'success' && (
                        <div className="py-16 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 border-4 border-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-sm"><CheckCircle2 size={40} /></div>
                            <h3 className="font-bold text-3xl text-slate-900 mb-3 tracking-tight">Data Berhasil Diperbarui!</h3>
                            <p className="text-slate-400 mb-8 max-w-md text-sm font-medium">Data bersih telah masuk ke database utama.</p>
                            <button onClick={() => { setUploadState('idle'); setProgress(0); }} className="bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50 font-bold py-3 px-8 rounded-[40px] transition-all text-sm shadow-sm active:scale-95">Upload File Lainnya</button>
                        </div>
                    )}
                </div>

                {uploadState === 'success' && (
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#EDF2FE] rounded-2xl text-[#4f46e5]"><FileSpreadsheet size={20} /></div>
                                <h3 className="font-bold text-xl text-slate-900">Preview Data Terproses</h3>
                            </div>
                            <span className="bg-amber-50 text-amber-700 text-xs font-bold px-4 py-2 rounded-[40px] border border-amber-200 flex items-center gap-2 shadow-sm"><AlertCircle size={14} /> Geser horizontal untuk lihat kolom</span>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-slate-100 custom-scrollbar pb-2">
                            <table className="w-max min-w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="p-4 pl-6 font-bold text-slate-400 text-[11px] uppercase tracking-widest">No</th>
                                        <th className="p-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Retailer</th>
                                        <th className="p-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Retailer ID</th>
                                        <th className="p-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Invoice Date</th>
                                        <th className="p-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Region</th>
                                        <th className="p-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest">State</th>
                                        <th className="p-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest">City</th>
                                        <th className="p-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Product</th>
                                        <th className="p-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest text-right">Price per Unit</th>
                                        <th className="p-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest text-right">Units Sold</th>
                                        <th className="p-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest text-right">Total Sales</th>
                                        <th className="p-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest text-right">Operating Profit</th>
                                        <th className="p-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest text-right">Operating Margin</th>
                                        <th className="p-4 pr-6 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Sales Method</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {dummyPreviewData.map((row) => (
                                        <tr key={row.no} className="border-b border-slate-50 hover:bg-[#EDF2FE]/50 transition-colors">
                                            <td className="p-4 pl-6 font-bold text-slate-400">{row.no}</td>
                                            <td className="p-4 font-semibold text-slate-900">{row.retailer}</td>
                                            <td className="p-4 text-slate-500 font-mono text-xs">{row.id}</td>
                                            <td className="p-4"><span className="text-xs text-[#4f46e5] bg-[#EDF2FE] px-2 py-1 rounded-md font-bold">{row.date}</span></td>
                                            <td className="p-4 text-slate-600">{row.region}</td>
                                            <td className="p-4 text-slate-600 font-medium">{row.state}</td>
                                            <td className="p-4 text-slate-600">{row.city}</td>
                                            <td className="p-4 font-semibold text-slate-700">{row.product}</td>
                                            <td className="p-4 text-slate-600 font-medium text-right">Rp {row.price.toLocaleString('id-ID')}</td>
                                            <td className="p-4 font-bold text-slate-800 text-right bg-slate-50/50">{row.units.toLocaleString('id-ID')}</td>
                                            <td className="p-4 text-emerald-600 font-bold text-right">Rp {row.totalSales.toLocaleString('id-ID')}</td>
                                            <td className="p-4 text-[#4f46e5] font-bold text-right bg-[#EDF2FE]/30">Rp {row.profit.toLocaleString('id-ID')}</td>
                                            <td className="p-4 text-amber-600 font-bold text-right">{(row.margin * 100).toFixed(0)}%</td>
                                            <td className="p-4 pr-6 text-slate-500 text-xs">{row.method}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}