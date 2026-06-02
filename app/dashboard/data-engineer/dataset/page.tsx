"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, FolderOpen, Eye, Download, FileText, Calendar, HardDrive, X, FileSpreadsheet, Trash2, CloudUpload, AlertTriangle, Loader2, Search, Filter, Clock } from 'lucide-react';

export default function DatasetCatalogPage() {
    // State Logika UI
    const [previewFile, setPreviewFile] = useState<any | null>(null);
    const [deleteTargets, setDeleteTargets] = useState<any[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // State Data Dinamis dari API
    const [rawFileList, setRawFileList] = useState<any[]>([]);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    // State Filter & Checkbox
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

    // MENGAMBIL DAFTAR FILE DARI DATABASE
    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const res = await fetch('/api/data-engineer/dataset');
                if (res.ok) {
                    const data = await res.json();
                    setRawFileList(data.files || []);
                }
            } catch (error) {
                console.error("Gagal mengambil daftar file:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFiles();
    }, []);

    // FUNGSI PREVIEW DATA (10 Baris Pertama dari DB)
    const handlePreview = async (file: any) => {
        setPreviewFile(file);
        setIsLoadingPreview(true);
        try {
            const res = await fetch(`/api/data-engineer/dataset/preview?uploadId=${file.id}`);
            if (res.ok) {
                const data = await res.json();
                setPreviewData(data.previewData || []);
            } else {
                setPreviewData([]);
            }
        } catch (error) {
            console.error("Gagal mengambil preview data:", error);
            setPreviewData([]);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    // Logika Filter & Search
    const filteredFiles = rawFileList.filter((file) => {
        return file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Logika Checkbox
    const handleSelectAll = () => {
        if (selectedFileIds.length === filteredFiles.length) setSelectedFileIds([]);
        else setSelectedFileIds(filteredFiles.map(f => f.id));
    };

    const handleSelectFile = (fileId: string) => {
        if (selectedFileIds.includes(fileId)) setSelectedFileIds(selectedFileIds.filter(id => id !== fileId));
        else setSelectedFileIds([...selectedFileIds, fileId]);
    };

    // Fungsi Eksekusi Hapus Permanen (Cascade Delete)
    const executeDelete = async () => {
        setIsDeleting(true);
        try {
            const idsToDelete = deleteTargets.map(f => f.id);
            const res = await fetch('/api/data-engineer/dataset', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: idsToDelete })
            });

            if (res.ok) {
                setRawFileList(prev => prev.filter(f => !idsToDelete.includes(f.id)));
                setDeleteTargets([]);
                setSelectedFileIds([]);
            } else {
                alert("Gagal menghapus data dari server.");
            }
        } catch (error) {
            console.error("Error menghapus file:", error);
        } finally {
            setIsDeleting(false);
        }
    };

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
                            Hapus {deleteTargets.length > 1 ? `${deleteTargets.length} File` : 'File'} Permanen?
                        </h3>

                        <div className="text-sm text-slate-500 mb-8 leading-relaxed">
                            Anda akan menghapus: <br />
                            <div className="max-h-24 overflow-y-auto mt-2 mb-4 custom-scrollbar">
                                {deleteTargets.map((file) => (
                                    <span key={file.id} className="inline-block m-1 px-3 py-1 bg-slate-100 text-slate-700 font-mono text-xs rounded-lg truncate max-w-[90%]">
                                        {file.fileName}
                                    </span>
                                ))}
                            </div>
                            <p className="bg-amber-50 text-amber-800 p-4 rounded-2xl border border-amber-100 text-left">
                                <strong className="font-bold block mb-1">⚠️ Peringatan Kritis (Cascade Delete):</strong>
                                Menghapus file ini juga akan otomatis menghancurkan seluruh <strong>baris data penjualan</strong> yang terkait di Database (Tabel Sales Data). Tindakan ini tidak dapat dibatalkan.
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
                    <p className="text-sm text-slate-500">Katalog file transaksi bulanan yang telah berhasil di-ingest ke sistem.</p>
                </div>
                <Link href="/dashboard/data-engineer/upload">
                    <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white font-bold text-sm rounded-[40px] hover:shadow-lg transition-all shadow-md active:scale-95">
                        <CloudUpload size={18} /> Upload Data Baru
                    </button>
                </Link>
            </div>

            {/* TABEL DAFTAR FILE ARSIP */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
                <div className="p-6 lg:p-8 border-b border-slate-100">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#EDF2FE] rounded-2xl text-[#4f46e5]"><FolderOpen size={20} /></div>
                            <h3 className="font-bold text-xl text-slate-900">Manajemen File Database</h3>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                            {selectedFileIds.length > 0 ? (
                                <div className="flex items-center justify-between sm:justify-start gap-4 bg-[#EDF2FE] px-4 py-2.5 rounded-[20px] animate-in fade-in slide-in-from-right-4 border border-[#6A7BFA]/20">
                                    <span className="text-sm font-bold text-[#4f46e5]">{selectedFileIds.length} file terpilih</span>
                                    <button onClick={() => setDeleteTargets(rawFileList.filter(f => selectedFileIds.includes(f.id)))} className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full transition-colors shadow-sm active:scale-95">
                                        <Trash2 size={14} /> Hapus Massal
                                    </button>
                                </div>
                            ) : (
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
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar min-h-[300px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-slate-50/80">
                            <tr>
                                <th className="p-5 pl-8 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedFileIds.length === filteredFiles.length && filteredFiles.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-[#4f46e5] bg-white border-slate-300 rounded focus:ring-[#4f46e5] cursor-pointer"
                                    />
                                </th>
                                <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Nama File</th>
                                <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Tanggal & Jam Upload</th>
                                <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest text-right">Kapasitas DB</th>
                                <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest text-center">Uploader</th>
                                <th className="p-5 pr-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500 font-medium animate-pulse">Memuat daftar file dari server...</td>
                                </tr>
                            ) : filteredFiles.length > 0 ? (
                                filteredFiles.map((file) => (
                                    <tr key={file.id} className={`border-b border-slate-50 transition-colors ${selectedFileIds.includes(file.id) ? 'bg-[#EDF2FE]/50' : 'hover:bg-[#EDF2FE]/30'}`}>
                                        <td className="p-5 pl-8">
                                            <input
                                                type="checkbox"
                                                checked={selectedFileIds.includes(file.id)}
                                                onChange={() => handleSelectFile(file.id)}
                                                className="w-4 h-4 text-[#4f46e5] bg-white border-slate-300 rounded focus:ring-[#4f46e5] cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-5 flex items-center gap-3">
                                            <FileText size={18} className={file.fileName.includes('xlsx') ? 'text-emerald-500' : 'text-blue-500'} />
                                            <span className="font-semibold text-slate-800">{file.fileName}</span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                                    <Calendar size={14} className="text-[#6A7BFA]" />
                                                    {new Date(file.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                {/* MODIFIKASI: Menambahkan info Jam di sini */}
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 pl-[22px] font-semibold">
                                                    <Clock size={10} />
                                                    {new Date(file.uploadedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <p className="font-bold text-slate-700">{file.fileSize || 'N/A'}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{file.totalRows?.toLocaleString('id-ID')} Baris</p>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className="inline-flex items-center bg-slate-100 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-full border border-slate-200">
                                                {file.uploadedBy || 'Admin'}
                                            </span>
                                        </td>
                                        <td className="p-5 pr-8">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button onClick={() => handlePreview(file)} className="p-2 text-slate-400 hover:text-[#4f46e5] hover:bg-[#EDF2FE] rounded-xl transition-all" title="Preview Data Lengkap"><Eye size={18} /></button>
                                                <button onClick={() => setDeleteTargets([file])} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Hapus File & Seluruh Datanya"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4"><Search size={32} /></div>
                                            <h4 className="font-bold text-lg text-slate-800 mb-1">Data tidak ditemukan</h4>
                                            <p className="text-sm text-slate-500 max-w-sm">Belum ada file dataset yang diupload ke dalam database.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL POP-UP PREVIEW DATA FULL 13 KOLOM */}
            {previewFile && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-[95vw] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#EDF2FE] rounded-2xl text-[#4f46e5]"><FileSpreadsheet size={24} /></div>
                                <div>
                                    <h3 className="font-bold text-xl text-slate-900 leading-tight">Preview Data: <span className="text-[#4f46e5]">{previewFile.fileName}</span></h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Menampilkan 10 baris pertama dengan struktur penuh 13 kolom aktual dari PostgreSQL.</p>
                                </div>
                            </div>
                            <button onClick={() => setPreviewFile(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors active:scale-90"><X size={28} /></button>
                        </div>

                        <div className="overflow-x-auto overflow-y-auto custom-scrollbar p-6 bg-[#F8FAFC]">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <table className="w-max min-w-full text-left border-collapse whitespace-nowrap">
                                    <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                                        <tr>
                                            <th className="p-4 pl-6 font-bold text-slate-500 text-[11px] uppercase tracking-widest">No</th>
                                            <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Retailer</th>
                                            <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Retailer ID</th>
                                            <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Invoice Date</th>
                                            <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Region</th>
                                            <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">State</th>
                                            <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">City</th>
                                            <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Product</th>
                                            <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Price per Unit</th>
                                            <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Units Sold</th>
                                            <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Total Sales</th>
                                            <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Op. Profit</th>
                                            <th className="p-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">Op. Margin</th>
                                            <th className="p-4 pr-6 font-bold text-slate-500 text-[11px] uppercase tracking-widest">Sales Method</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {isLoadingPreview ? (
                                            <tr><td colSpan={14} className="p-12 text-center text-slate-500 animate-pulse font-medium"><Loader2 size={24} className="animate-spin inline-block mr-2" /> Memuat data baris...</td></tr>
                                        ) : previewData.length > 0 ? previewData.map((row, index) => (
                                            <tr key={row.id} className="border-b border-slate-50 hover:bg-[#EDF2FE]/30 transition-colors">
                                                <td className="p-4 pl-6 font-bold text-slate-400">{index + 1}</td>
                                                <td className="p-4 font-semibold text-slate-900">{row.retailer?.name || '-'}</td>
                                                <td className="p-4 text-slate-500 font-mono text-[10px]">{row.retailerId || '-'}</td>
                                                <td className="p-4"><span className="text-xs text-[#4f46e5] bg-[#EDF2FE] px-2 py-1 rounded-md font-bold">{new Date(row.invoiceDate).toLocaleDateString('id-ID')}</span></td>
                                                <td className="p-4 text-slate-600">{row.retailer?.region || '-'}</td>
                                                <td className="p-4 text-slate-600 font-medium">{row.retailer?.state || '-'}</td>
                                                <td className="p-4 text-slate-600">{row.retailer?.city || '-'}</td>
                                                <td className="p-4 font-semibold text-slate-700">{row.product || '-'}</td>
                                                <td className="p-4 text-slate-600 font-medium text-right">Rp {Number(row.pricePerUnit || 0).toLocaleString('id-ID')}</td>
                                                <td className="p-4 font-bold text-slate-800 text-right bg-slate-50/50">{Number(row.unitsSold || 0).toLocaleString('id-ID')}</td>
                                                <td className="p-4 text-emerald-600 font-bold text-right">Rp {Number(row.totalSales || 0).toLocaleString('id-ID')}</td>
                                                <td className="p-4 text-[#4f46e5] font-bold text-right bg-[#EDF2FE]/30">Rp {Number(row.operatingProfit || 0).toLocaleString('id-ID')}</td>
                                                <td className="p-4 text-amber-600 font-bold text-right">{(Number(row.operatingMargin || 0) * 100).toFixed(0)}%</td>
                                                <td className="p-4 pr-6 text-slate-500 text-xs">{row.salesMethod || '-'}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={14} className="p-12 text-center text-slate-500 font-medium">Data kosong atau tidak ditemukan.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}