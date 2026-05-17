"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Database, FolderOpen, Eye, Download, FileText, Calendar, HardDrive, X, FileSpreadsheet, Trash2, CloudUpload, AlertTriangle, Loader2, Search, Filter, CheckSquare } from 'lucide-react';

export default function DatasetCatalogPage() {

    // State untuk Modals & Logika UI
    const [previewFile, setPreviewFile] = useState<string | null>(null);
    const [deleteTargets, setDeleteTargets] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // State untuk Fitur Baru: Search, Filter, & Checkbox
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    const rawFileList = [
        { name: 'sales_data_mei_2026.csv', date: '10 Mei 2026', size: '24.5 KB', rows: '9,600 Baris', status: 'Terhubung' },
        { name: 'sales_data_apr_2026.xlsx', date: '08 Apr 2026', size: '28.1 KB', rows: '12,100 Baris', status: 'Terhubung' },
        { name: 'sales_data_mar_2026.csv', date: '12 Mar 2026', size: '22.8 KB', rows: '8,890 Baris', status: 'Terhubung' },
        { name: 'sales_data_feb_2026.csv', date: '09 Feb 2026', size: '25.0 KB', rows: '9,300 Baris', status: 'Terhubung' },
        { name: 'sales_data_jan_2026.xlsx', date: '11 Jan 2026', size: '30.2 KB', rows: '11,420 Baris', status: 'Terhubung' },
        { name: 'sales_data_des_2025.csv', date: '10 Des 2025', size: '34.5 KB', rows: '14,000 Baris', status: 'Arsip Lama' },
        { name: 'sales_data_nov_2025.csv', date: '08 Nov 2025', size: '21.1 KB', rows: '7,500 Baris', status: 'Arsip Lama' },
    ];

    // Logika Filter & Search
    const filteredFiles = rawFileList.filter((file) => {
        const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'Semua' || file.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Logika Checkbox
    const handleSelectAll = () => {
        if (selectedFiles.length === filteredFiles.length) setSelectedFiles([]);
        else setSelectedFiles(filteredFiles.map(f => f.name));
    };

    const handleSelectFile = (fileName: string) => {
        if (selectedFiles.includes(fileName)) setSelectedFiles(selectedFiles.filter(f => f !== fileName));
        else setSelectedFiles([...selectedFiles, fileName]);
    };

    // Fungsi Eksekusi Hapus
    const executeDelete = () => {
        setIsDeleting(true);
        setTimeout(() => {
            setIsDeleting(false);
            setDeleteTargets([]);
            setSelectedFiles([]);
            alert(`${deleteTargets.length} file beserta datanya berhasil dihapus permanen.`);
        }, 1500);
    };

    const dummyRecentData = [
        { no: 1, retailer: 'Ramayana', id: '1185732', date: '2020-01-01 00:00:00', region: 'Sumatera', state: 'Sumatera Utara', city: 'Medan', product: "Men's Street Footwear", price: 842750, units: 1200, totalSales: 1011300000, profit: 505650000, margin: 0.5, method: 'Offline' },
        { no: 2, retailer: 'Ramayana', id: '1185732', date: '2020-01-02 00:00:00', region: 'Sumatera', state: 'Sumatera Utara', city: 'Medan', product: "Men's Athletic Footwear", price: 842750, units: 1000, totalSales: 842750000, profit: 252825000, margin: 0.3, method: 'Offline' },
        { no: 3, retailer: 'Ramayana', id: '1185732', date: '2020-01-03 00:00:00', region: 'Sumatera', state: 'Sumatera Utara', city: 'Medan', product: "Women's Street Footwear", price: 674200, units: 1000, totalSales: 674200000, profit: 235970000, margin: 0.35, method: 'Offline' },
        { no: 4, retailer: 'Matahari', id: '1185733', date: '2020-01-04 00:00:00', region: 'Sumatera', state: 'Riau', city: 'Pekanbaru', product: "Kids Footwear", price: 450000, units: 850, totalSales: 382500000, profit: 153000000, margin: 0.4, method: 'Offline' },
        { no: 5, retailer: 'Sport Station', id: '1185734', date: '2020-01-05 00:00:00', region: 'Sumatera', state: 'Sumatera Barat', city: 'Padang', product: "Men's Athletic Footwear", price: 950000, units: 600, totalSales: 570000000, profit: 228000000, margin: 0.4, method: 'Online' },
    ];

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-8 relative">

            {/* POP-UP KONFIRMASI HAPUS (DESTUCTIVE MODAL) */}
            {deleteTargets.length > 0 && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-8 text-center animate-in zoom-in-95 slide-in-from-bottom-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>

                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-white outline outline-1 outline-red-100">
                            <AlertTriangle size={36} />
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                            Hapus {deleteTargets.length > 1 ? `${deleteTargets.length} Data` : 'Data'} Permanen?
                        </h3>

                        <div className="text-sm text-slate-500 mb-8 leading-relaxed">
                            Anda akan menghapus: <br />
                            <div className="max-h-24 overflow-y-auto mt-2 mb-4 custom-scrollbar">
                                {deleteTargets.map((file, i) => (
                                    <span key={i} className="inline-block m-1 px-3 py-1 bg-slate-100 text-slate-700 font-mono text-xs rounded-lg">{file}</span>
                                ))}
                            </div>
                            <p className="bg-amber-50 text-amber-800 p-4 rounded-2xl border border-amber-100 text-left">
                                <strong className="font-bold block mb-1">⚠️ Peringatan Kritis:</strong>
                                Data di dalam file ini sebelumnya telah digunakan untuk <strong>melatih ulang (Retraining) model Machine Learning</strong>. Menghapusnya akan memengaruhi akurasi AI.
                            </p>
                        </div>

                        <div className="flex gap-3 w-full">
                            <button onClick={() => setDeleteTargets([])} disabled={isDeleting} className="flex-1 py-3.5 px-4 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-[40px] hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50 active:scale-95">
                                Batal
                            </button>
                            <button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-3.5 px-4 bg-red-500 border-2 border-red-500 text-white font-bold rounded-[40px] hover:bg-red-600 hover:border-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-[0_8px_20px_rgba(239,68,68,0.3)] active:scale-95">
                                {isDeleting ? <><Loader2 size={18} className="animate-spin" /> Menghapus...</> : <><Trash2 size={18} /> Ya, Hapus Data</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER HALAMAN */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Arsip Dataset</h2>
                    <p className="text-sm text-slate-500">Katalog file transaksi bulanan yang telah berhasil masuk ke dalam sistem Database.</p>
                </div>
                <Link href="/dashboard/data-engineer/upload">
                    {/* UPDATE: Tombol menggunakan Gradasi Premium */}
                    <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white font-bold text-sm rounded-[40px] hover:shadow-lg transition-all shadow-md active:scale-95">
                        <CloudUpload size={18} /> Upload Data Baru
                    </button>
                </Link>
            </div>

            {/* TABEL DAFTAR FILE ARSIP */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">

                {/* TOOLBAR: SEARCH & FILTER & BULK ACTION */}
                <div className="p-6 lg:p-8 border-b border-slate-100">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#EDF2FE] rounded-2xl text-[#4f46e5]"><FolderOpen size={20} /></div>
                            <h3 className="font-bold text-xl text-slate-900">Manajemen File</h3>
                        </div>

                        {/* Search & Filter Component */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                            {/* Kondisional: Jika ada file dipilih, munculkan Bulk Action Bar */}
                            {selectedFiles.length > 0 ? (
                                <div className="flex items-center justify-between sm:justify-start gap-4 bg-[#EDF2FE] px-4 py-2.5 rounded-[20px] animate-in fade-in slide-in-from-right-4 border border-[#6A7BFA]/20">
                                    <span className="text-sm font-bold text-[#4f46e5]">{selectedFiles.length} file terpilih</span>
                                    <button onClick={() => setDeleteTargets(selectedFiles)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full transition-colors shadow-sm active:scale-95">
                                        <Trash2 size={14} /> Hapus Massal
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-[20px] px-4 py-2.5 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-[#4f46e5]/20 transition-all flex-1 sm:w-64">
                                        <Search size={16} className="text-slate-400 mr-2 shrink-0" />
                                        <input
                                            type="text"
                                            placeholder="Cari nama file..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none w-full placeholder:font-medium"
                                        />
                                    </div>
                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-[20px] px-4 py-2.5 shrink-0 hover:border-[#4f46e5] transition-colors cursor-pointer relative">
                                        <Filter size={16} className="text-slate-400 mr-2" />
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer appearance-none pr-4"
                                        >
                                            <option value="Semua">Semua Status</option>
                                            <option value="Terhubung">Terhubung</option>
                                            <option value="Arsip Lama">Arsip Lama</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar min-h-[300px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-slate-50/80">
                            <tr>
                                {/* Checkbox Select All */}
                                <th className="p-5 pl-8 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-[#4f46e5] bg-white border-slate-300 rounded focus:ring-[#4f46e5] cursor-pointer"
                                    />
                                </th>
                                <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Nama File</th>
                                <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Tanggal Upload</th>
                                <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest text-right">Kapasitas</th>
                                <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Status DB</th>
                                <th className="p-5 pr-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredFiles.length > 0 ? (
                                filteredFiles.map((file, idx) => (
                                    <tr key={idx} className={`border-b border-slate-50 transition-colors ${selectedFiles.includes(file.name) ? 'bg-[#EDF2FE]/50' : 'hover:bg-[#EDF2FE]/30'}`}>
                                        {/* Checkbox Single */}
                                        <td className="p-5 pl-8">
                                            <input
                                                type="checkbox"
                                                checked={selectedFiles.includes(file.name)}
                                                onChange={() => handleSelectFile(file.name)}
                                                className="w-4 h-4 text-[#4f46e5] bg-white border-slate-300 rounded focus:ring-[#4f46e5] cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-5 flex items-center gap-3">
                                            <FileText size={18} className={file.name.includes('xlsx') ? 'text-emerald-500' : 'text-blue-500'} />
                                            <span className="font-semibold text-slate-800">{file.name}</span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 text-slate-500"><Calendar size={14} /> {file.date}</div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <p className="font-bold text-slate-700">{file.size}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{file.rows}</p>
                                        </td>
                                        <td className="p-5">
                                            {file.status === 'Terhubung' ? (
                                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                                                    <Database size={12} /> {file.status}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border border-slate-200">
                                                    <HardDrive size={12} /> {file.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5 pr-8">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button onClick={() => setPreviewFile(file.name)} className="p-2 text-slate-400 hover:text-[#4f46e5] hover:bg-[#EDF2FE] rounded-xl transition-all" title="Preview 10 Baris"><Eye size={18} /></button>
                                                <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Download File Original"><Download size={18} /></button>
                                                <button onClick={() => setDeleteTargets([file.name])} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Hapus File & Data"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                /* EMPTY STATE JIKA PENCARIAN TIDAK DITEMUKAN */
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4"><Search size={32} /></div>
                                            <h4 className="font-bold text-lg text-slate-800 mb-1">Data tidak ditemukan</h4>
                                            <p className="text-sm text-slate-500 max-w-sm">Kami tidak menemukan file dengan kata kunci atau filter tersebut. Coba gunakan kata kunci lain.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL POP-UP PREVIEW DATA (Tetap Sama) */}
            {previewFile && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-[90vw] lg:max-w-6xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#EDF2FE] rounded-xl text-[#4f46e5]"><FileSpreadsheet size={20} /></div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 leading-tight">Preview Data: <span className="text-[#4f46e5]">{previewFile}</span></h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Menampilkan 10 baris pertama dari dataset.</p>
                                </div>
                            </div>
                            <button onClick={() => setPreviewFile(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors active:scale-90"><X size={24} /></button>
                        </div>

                        <div className="overflow-x-auto overflow-y-auto custom-scrollbar p-6">
                            <table className="w-max min-w-full text-left border-collapse whitespace-nowrap">
                                <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-md shadow-sm outline outline-1 outline-slate-100">
                                    <tr>
                                        <th className="p-4 pl-6 font-bold text-slate-500 text-[11px] uppercase tracking-widest">No</th>
                                        <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Retailer</th>
                                        <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Retailer ID</th>
                                        <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Invoice Date</th>
                                        <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Price per Unit</th>
                                        <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Units Sold</th>
                                        <th className="p-4 pr-6 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Sales Method</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {dummyRecentData.map((row) => (
                                        <tr key={row.no} className="border-b border-slate-50 hover:bg-[#EDF2FE]/30 transition-colors">
                                            <td className="p-4 pl-6 font-bold text-slate-400">{row.no}</td>
                                            <td className="p-4 font-semibold text-slate-900">{row.retailer}</td>
                                            <td className="p-4 text-slate-500 font-mono text-xs">{row.id}</td>
                                            <td className="p-4"><span className="text-xs text-[#4f46e5] bg-[#EDF2FE] px-2 py-1 rounded-md font-medium">{row.date}</span></td>
                                            <td className="p-4 text-slate-600 font-medium text-right">Rp {row.price.toLocaleString('id-ID')}</td>
                                            <td className="p-4 font-semibold text-slate-800 text-right">{row.units.toLocaleString('id-ID')}</td>
                                            <td className="p-4 pr-6 text-slate-500 text-xs">{row.method}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}