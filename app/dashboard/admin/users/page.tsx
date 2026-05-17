"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Edit, Trash2, ShieldAlert, Mail, MapPin, ShieldCheck, UserCog, Building2, Store, Lock, CheckCircle2 } from 'lucide-react';

export default function KelolaPenggunaPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('Semua Peran');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [openFilter, setOpenFilter] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    // Simulasi Database Pengguna
    const mockUsers = [
        { id: 'USR-001', name: 'Budi Santoso', email: 'budi.s@aksa.com', role: 'Super Admin', scope: 'Nasional (Semua Akses)', type: 'pusat', lastActive: 'Baru saja', status: 'aktif', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
        { id: 'USR-002', name: 'Andi Wijaya', email: 'andi.w@aksa.com', role: 'Kepala Cabang', scope: 'Jawa Timur', type: 'cabang', lastActive: '2 jam lalu', status: 'aktif', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
        { id: 'USR-003', name: 'Siti Aminah', email: 'siti.a@aksa.com', role: 'Manajer Retailer', scope: 'DKI Jakarta (Matahari)', type: 'retailer', lastActive: '1 hari lalu', status: 'aktif', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
        { id: 'USR-004', name: 'Reza Rahadian', email: 'reza.r@aksa.com', role: 'Kepala Cabang', scope: 'Sumatera Utara', type: 'cabang', lastActive: '5 hari lalu', status: 'suspend', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop' },
        { id: 'USR-005', name: 'Diana Putri', email: 'diana.p@aksa.com', role: 'Manajer Retailer', scope: 'Jawa Timur (Ramayana)', type: 'retailer', lastActive: '3 jam lalu', status: 'aktif', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
    ];

    // Sensor Klik Di Luar (Anti Bug Z-Index)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setOpenDropdownId(null);
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) setOpenFilter(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredUsers = mockUsers.filter(user => {
        const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = filterRole === 'Semua Peran' || user.role === filterRole;
        return matchSearch && matchRole;
    });

    const getRoleBadge = (role: string, type: string) => {
        if (type === 'pusat') return <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 bg-purple-100 text-purple-700 text-[11px] font-bold rounded-md"><ShieldCheck size={12} /> {role}</span>;
        if (type === 'cabang') return <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-md"><Building2 size={12} /> {role}</span>;
        return <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 bg-amber-100 text-amber-700 text-[11px] font-bold rounded-md"><Store size={12} /> {role}</span>;
    };

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-6">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">Manajemen Akses</h2>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">Kontrol otorisasi Kepala Cabang dan Manajer Retailer.</p>
                </div>
                <button className="bg-[#6A7BFA] hover:bg-[#5869E8] text-white px-6 py-3 rounded-[20px] font-bold text-sm transition-all shadow-[0_8px_20px_rgba(106,123,250,0.3)] flex items-center gap-2 active:scale-95">
                    <Plus size={18} /> Tambah Pengguna
                </button>
            </div>

            {/* CONTROL PANEL (SEARCH & FILTER) */}
            <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100 relative z-20">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text" placeholder="Cari nama atau email pengguna..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[16px] pl-12 pr-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6A7BFA]/20 transition-all placeholder:font-medium"
                    />
                </div>

                <div ref={filterRef} className="relative w-full sm:w-64">
                    <button onClick={() => setOpenFilter(!openFilter)} className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-[#6A7BFA]/50 rounded-[16px] px-5 py-3 text-sm font-bold text-slate-600 transition-all">
                        <div className="flex items-center gap-2"><Filter size={16} className="text-[#6A7BFA]" /> <span className="truncate">{filterRole}</span></div>
                    </button>
                    {openFilter && (
                        <div className="absolute top-[calc(100%+8px)] right-0 w-full bg-white border border-slate-100 rounded-[16px] shadow-xl z-[60] p-2 animate-in fade-in slide-in-from-top-2">
                            {['Semua Peran', 'Super Admin', 'Kepala Cabang', 'Manajer Retailer'].map((role) => (
                                <button key={role} onClick={() => { setFilterRole(role); setOpenFilter(false); }} className={`w-full text-left px-4 py-2.5 rounded-[10px] text-sm font-bold transition-colors ${filterRole === role ? 'bg-[#EDF2FE] text-[#6A7BFA]' : 'text-slate-600 hover:bg-slate-50'}`}>{role}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* TABEL PENGGUNA */}
            <div className="bg-white border border-slate-200 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200 relative z-10">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Profil Pengguna</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Peran & Wilayah Akses</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Aktivitas Terakhir</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform" />
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-[#6A7BFA] transition-colors">{user.name}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={12} /> {user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2">
                                            {getRoleBadge(user.role, user.type)}
                                            <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /> {user.scope}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">{user.lastActive}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.status === 'aktif' ? (
                                            <span className="flex items-center gap-1.5 w-fit px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100"><CheckCircle2 size={14} /> Aktif</span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 w-fit px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100"><Lock size={14} /> Suspended</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 relative text-center">
                                        <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === user.id ? null : user.id); }} className="p-2 text-slate-400 hover:text-[#6A7BFA] hover:bg-[#EDF2FE] rounded-xl transition-colors">
                                            <MoreVertical size={18} />
                                        </button>

                                        {/* DROPDOWN AKSI (ANTI-BUG Z-INDEX) */}
                                        {openDropdownId === user.id && (
                                            <div ref={dropdownRef} className="absolute right-10 top-1/2 -translate-y-1/2 w-48 bg-white border border-slate-100 rounded-[16px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] z-[60] p-1.5 animate-in fade-in zoom-in-95">
                                                <button onClick={() => setOpenDropdownId(null)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-[#6A7BFA] rounded-[10px] transition-colors"><UserCog size={14} /> Detail Profil</button>
                                                <button onClick={() => setOpenDropdownId(null)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-amber-600 rounded-[10px] transition-colors"><Edit size={14} /> Ubah Akses</button>
                                                <div className="h-px bg-slate-100 my-1"></div>
                                                <button onClick={() => setOpenDropdownId(null)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-[10px] transition-colors"><ShieldAlert size={14} /> Suspend Akun</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm font-semibold text-slate-400">Tidak ada pengguna yang cocok dengan pencarian.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}