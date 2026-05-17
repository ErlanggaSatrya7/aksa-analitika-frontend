// Lokasi: components/GlobalDatePicker.tsx
import React from 'react';
import { Calendar } from 'lucide-react';

export default function GlobalDatePicker() {
    return (
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm hover:border-primary transition-colors group cursor-pointer hidden md:flex">
            <Calendar size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
            <select className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer appearance-none pr-4">
                <option value="this_month">Bulan Ini (Mei 2026)</option>
                <option value="last_7_days">7 Hari Terakhir</option>
                <option value="last_month">Bulan Lalu (Apr 2026)</option>
                <option value="ytd">Tahun Ini (YTD)</option>
            </select>
        </div>
    );
}