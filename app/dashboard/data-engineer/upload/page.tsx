"use client";
import React, { useState, useRef } from 'react';
import { CloudUpload, FileSpreadsheet, CheckCircle2, Loader2, AlertCircle, XCircle, UploadCloud, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import * as xlsx from 'xlsx';

export default function UploadDatasetPage() {
    const { data: session } = useSession();
    const user = session?.user as any;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [uploadState, setUploadState] = useState<'idle' | 'previewing' | 'uploading' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [displayData, setDisplayData] = useState<any[]>([]);
    const [uploadStats, setUploadStats] = useState({ fileName: '', totalRows: 0 });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await generateLocalPreview(file);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) await generateLocalPreview(file);
    };

    const generateLocalPreview = async (file: File) => {
        const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        const isExtensionValid = file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

        if (!validTypes.includes(file.type) && !isExtensionValid) {
            setErrorMessage('❌ Format file dilarang! Harap upload file berektensi .csv atau .xlsx saja.');
            setUploadState('error');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            setSelectedFile(file);
            setUploadStats({ fileName: file.name, totalRows: 0 });

            const buffer = await file.arrayBuffer();
            const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
            const sheetName = workbook.SheetNames[0];

            const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
                raw: false,
                dateNF: 'yyyy-mm-dd'
            });

            setDisplayData(rawData.slice(0, 10));
            setUploadState('previewing');
        } catch (error) {
            setErrorMessage('Gagal membaca file secara lokal. Pastikan file tidak rusak.');
            setUploadState('error');
        }
    };

    const executeUploadToDatabase = async () => {
        if (!selectedFile) return;

        setUploadState('uploading');
        setErrorMessage('');

        let currentProgress = 0;
        const progressInterval = setInterval(() => {
            currentProgress += Math.floor(Math.random() * 15) + 5;
            if (currentProgress > 90) currentProgress = 90;
            setProgress(currentProgress);
        }, 400);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('uploadedBy', user?.name || user?.email || 'Data Engineer');

        try {
            const res = await fetch('/api/data-engineer/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            clearInterval(progressInterval);

            if (res.ok) {
                setProgress(100);
                setDisplayData(data.previewData || []);
                setUploadStats({ fileName: selectedFile.name, totalRows: data.totalRowsInserted || 0 });
                setTimeout(() => setUploadState('success'), 500);
            } else {
                setErrorMessage(data.error || 'Terjadi kesalahan saat menyimpan data ke server.');
                setUploadState('error');
            }
        } catch (error) {
            clearInterval(progressInterval);
            setErrorMessage('Gagal terhubung ke server database.');
            setUploadState('error');
        }
    };

    const resetUpload = () => {
        setUploadState('idle');
        setProgress(0);
        setDisplayData([]);
        setSelectedFile(null);
        setErrorMessage('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const renderTableData = () => {
        const isLocalPreview = uploadState === 'previewing';

        return displayData.map((row, idx) => {
            const retailerName = isLocalPreview ? row['Retailer'] : row.retailer?.name;
            const retailerId = isLocalPreview ? row['Retailer ID'] : row.retailerId;
            const invoiceDate = isLocalPreview ? row['Invoice Date'] : row.invoiceDate;
            const region = isLocalPreview ? row['Region'] : row.retailer?.region;
            const state = isLocalPreview ? row['State'] : row.retailer?.state;
            const city = isLocalPreview ? row['City'] : row.retailer?.city;
            const product = isLocalPreview ? row['Product'] : row.product;
            const price = isLocalPreview ? row['Price per Unit'] : row.pricePerUnit;
            const units = isLocalPreview ? row['Units Sold'] : row.unitsSold;
            const totalSales = isLocalPreview ? row['Total Sales'] : row.totalSales;
            const opProfit = isLocalPreview ? row['Operating Profit'] : row.operatingProfit;
            const opMargin = isLocalPreview ? row['Operating Margin'] : row.operatingMargin;
            const salesMethod = isLocalPreview ? row['Sales Method'] : row.salesMethod;

            return (
                <tr key={idx} className={`border-b border-slate-50 transition-colors ${isLocalPreview ? 'hover:bg-amber-50/50' : 'hover:bg-[#EDF2FE]/50'}`}>
                    <td className="p-4 pl-6 font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-4 font-semibold text-slate-900">{retailerName || '-'}</td>
                    <td className="p-4 text-slate-500 font-mono text-xs">{retailerId || '-'}</td>
                    <td className="p-4"><span className={`text-xs px-2 py-1 rounded-md font-bold ${isLocalPreview ? 'bg-amber-100 text-amber-700' : 'bg-[#EDF2FE] text-[#4f46e5]'}`}>{new Date(invoiceDate).toLocaleDateString('id-ID')}</span></td>
                    <td className="p-4 text-slate-600">{region || '-'}</td>
                    <td className="p-4 text-slate-600 font-medium">{state || '-'}</td>
                    <td className="p-4 text-slate-600">{city || '-'}</td>
                    <td className="p-4 font-semibold text-slate-700">{product || '-'}</td>
                    <td className="p-4 text-slate-600 font-medium text-right">Rp {Number(price || 0).toLocaleString('id-ID')}</td>
                    <td className="p-4 font-bold text-slate-800 text-right bg-slate-50/50">{Number(units || 0).toLocaleString('id-ID')}</td>
                    <td className="p-4 text-emerald-600 font-bold text-right">Rp {Number(totalSales || 0).toLocaleString('id-ID')}</td>
                    <td className="p-4 text-[#4f46e5] font-bold text-right bg-[#EDF2FE]/30">Rp {Number(opProfit || 0).toLocaleString('id-ID')}</td>
                    <td className="p-4 text-amber-600 font-bold text-right">{(Number(opMargin || 0) * 100).toFixed(0)}%</td>
                    <td className="p-4 pr-6 text-slate-500 text-xs">{salesMethod || '-'}</td>
                </tr>
            );
        });
    };

    return (
        <div className="pb-10 max-w-7xl mx-auto">
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Upload Dataset</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">Suntikkan data transaksi mentah untuk dinormalisasi ke database PostgreSQL.</p>
            </div>

            <div className="space-y-8">
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 lg:p-10 transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 fill-mode-both">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        className="hidden"
                    />

                    {uploadState === 'idle' && (
                        <div className={`border-2 border-dashed rounded-[32px] p-12 lg:p-20 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${isDragging ? 'border-[#4f46e5] bg-[#EDF2FE] scale-[1.01]' : 'border-slate-200 hover:border-[#6A7BFA] hover:bg-slate-50'}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="p-4 bg-[#EDF2FE] rounded-full text-[#4f46e5] mb-6 shadow-sm"><CloudUpload size={48} /></div>
                            <h3 className="font-bold text-2xl text-slate-900 mb-2">Tarik & Lepas File Di Sini</h3>
                            <p className="text-slate-400 mb-8 text-center max-w-sm text-sm font-medium">Format: <strong>.csv, .xlsx</strong> (Maks 100MB)</p>
                            <button className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] hover:shadow-lg text-white font-bold py-3.5 px-10 rounded-[40px] transition-all shadow-md active:scale-95 text-sm pointer-events-none">
                                Pilih File dari Perangkat
                            </button>
                        </div>
                    )}

                    {uploadState === 'previewing' && (
                        <div className="py-10 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-amber-50 text-amber-500 border-4 border-amber-100 rounded-full flex items-center justify-center mb-6 shadow-sm"><FileSpreadsheet size={40} /></div>
                            <h3 className="font-bold text-2xl text-slate-900 mb-3 tracking-tight">File Siap Di-Upload</h3>
                            <p className="text-slate-500 mb-8 max-w-md text-sm font-medium">
                                File <strong className="text-slate-800">{uploadStats.fileName}</strong> berhasil dibaca. Silakan periksa tabel preview di bawah sebelum menyimpannya secara permanen ke Database.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                <button onClick={resetUpload} className="bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-500 font-bold py-3.5 px-8 rounded-[40px] transition-all text-sm flex items-center justify-center gap-2 active:scale-95"><Trash2 size={18} /> Batal</button>
                                <button onClick={executeUploadToDatabase} className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] hover:shadow-lg text-white font-bold py-3.5 px-10 rounded-[40px] transition-all text-sm shadow-[0_8px_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 active:scale-95"><UploadCloud size={20} /> Konfirmasi & Simpan ke DB</button>
                            </div>
                        </div>
                    )}

                    {uploadState === 'uploading' && (
                        <div className="py-20 flex flex-col items-center justify-center animate-in fade-in">
                            <Loader2 size={48} className="text-[#4f46e5] animate-spin mb-6" />
                            <h3 className="font-bold text-2xl text-slate-900 mb-2">Menyuntikkan Data ke Database...</h3>
                            <div className="w-full max-w-md bg-[#EDF2FE] rounded-full h-3 overflow-hidden shadow-inner mt-8">
                                <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-xs font-bold text-[#4f46e5] mt-4">{progress}% Selesai</p>
                        </div>
                    )}

                    {uploadState === 'error' && (
                        <div className="py-16 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-red-50 text-red-500 border-4 border-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm"><XCircle size={40} /></div>
                            <h3 className="font-bold text-2xl text-slate-900 mb-3 tracking-tight">Upload Gagal</h3>
                            <p className="text-red-500 mb-8 max-w-md text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100">{errorMessage}</p>
                            <button onClick={resetUpload} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-[40px] transition-all text-sm shadow-sm active:scale-95">Coba Lagi</button>
                        </div>
                    )}

                    {uploadState === 'success' && (
                        <div className="py-16 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 border-4 border-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-sm"><CheckCircle2 size={40} /></div>
                            <h3 className="font-bold text-3xl text-slate-900 mb-3 tracking-tight">Data Berhasil Tersimpan!</h3>
                            <p className="text-slate-500 mb-8 max-w-md text-sm font-medium">
                                <strong>{uploadStats.totalRows.toLocaleString('id-ID')} baris</strong> dari file <span className="text-[#4f46e5] font-mono">{uploadStats.fileName}</span> telah masuk ke database utama.
                            </p>
                            <button onClick={resetUpload} className="bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50 font-bold py-3 px-8 rounded-[40px] transition-all text-sm shadow-sm active:scale-95">Upload File Lainnya</button>
                        </div>
                    )}
                </div>

                {(uploadState === 'previewing' || uploadState === 'success') && displayData.length > 0 && (
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-2xl ${uploadState === 'previewing' ? 'bg-amber-50 text-amber-500' : 'bg-[#EDF2FE] text-[#4f46e5]'}`}><FileSpreadsheet size={20} /></div>
                                <div>
                                    <h3 className="font-bold text-xl text-slate-900">
                                        {uploadState === 'previewing' ? 'Preview File (Belum Disimpan)' : 'Preview Database Aktual'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {uploadState === 'previewing'
                                            ? 'Menampilkan 10 baris pertama persis sesuai urutan dari file asli Anda.'
                                            : 'Menampilkan data yang telah berhasil tersimpan dan masuk ke tabel PostgreSQL.'}
                                    </p>
                                </div>
                            </div>
                            <span className={`${uploadState === 'previewing' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'} text-xs font-bold px-4 py-2 rounded-[40px] border flex items-center gap-2 shadow-sm`}><AlertCircle size={14} /> Geser horizontal untuk melihat 13 kolom</span>
                        </div>

                        <div className={`overflow-x-auto rounded-2xl border ${uploadState === 'previewing' ? 'border-amber-100' : 'border-slate-100'} custom-scrollbar pb-2`}>
                            <table className="w-max min-w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className={`${uploadState === 'previewing' ? 'bg-amber-50/50' : 'bg-slate-50'} border-b border-slate-100`}>
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
                                    {renderTableData()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}