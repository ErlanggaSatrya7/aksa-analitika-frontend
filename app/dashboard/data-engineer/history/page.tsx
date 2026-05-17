import React from 'react';
import { Database, BrainCircuit } from 'lucide-react';

export default function HistoryPage() {
    return (
        <div className="pb-10 max-w-7xl mx-auto">
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Riwayat Sistem</h2>
                <p className="text-sm text-slate-500 mt-1">Log audit untuk pipeline ingest data dan pembaruan Machine Learning.</p>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out delay-100 fill-mode-both hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Log Pipeline Data & ML</h3>

                <div className="overflow-x-auto rounded-2xl border border-slate-100 pb-2 custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-5 pl-6 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Tanggal & Waktu</th>
                                <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Nama File</th>
                                <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Baris Terproses</th>
                                <th className="p-5 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Status Database</th>
                                <th className="p-5 pr-6 font-bold text-slate-400 text-[11px] uppercase tracking-widest">Status Machine Learning</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            <tr className="border-b border-slate-50 hover:bg-[#EDF2FE]/50 transition-colors">
                                <td className="p-5 pl-6 text-slate-500 font-medium">10 Mei 2026, 08:00</td>
                                <td className="p-5 font-semibold text-slate-900">ramayana_q1_sales.xlsx</td>
                                <td className="p-5 text-slate-600 font-medium">9,600 rows</td>
                                <td className="p-5">
                                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                                        <Database size={14} /> Upload Success
                                    </span>
                                </td>
                                <td className="p-5 pr-6">
                                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full shadow-sm">
                                        <BrainCircuit size={14} /> Model Retrained
                                    </span>
                                </td>
                            </tr>
                            <tr className="border-b border-slate-50 hover:bg-red-50/40 transition-colors">
                                <td className="p-5 pl-6 text-slate-500 font-medium">09 Mei 2026, 14:30</td>
                                <td className="p-5 font-semibold text-slate-900">error_data_test.csv</td>
                                <td className="p-5 text-slate-400 font-medium italic">0 rows (Failed)</td>
                                <td className="p-5">
                                    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border border-red-200">
                                        <Database size={14} /> Format Corrupted
                                    </span>
                                </td>
                                <td className="p-5 pr-6">
                                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border border-slate-200">
                                        <BrainCircuit size={14} /> Canceled
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}