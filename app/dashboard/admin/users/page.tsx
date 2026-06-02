"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Edit, ShieldAlert, Mail, MapPin, ShieldCheck, UserCog, Building2, Store, Lock, CheckCircle2, X, Loader2, ChevronDown, Trash2 } from 'lucide-react';

interface DBUser {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    assignedState?: string | null;
    assignedCity?: string | null;
    retailerId?: string | null;
}

interface CityData { name: string; provinceName: string; }
interface RetailerData { id: string; name: string; cityName: string; }

export default function KelolaPenggunaPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('Semua Peran');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [openFilter, setOpenFilter] = useState(false);

    // STATE UTAMA DATA DATABASE
    const [users, setUsers] = useState<DBUser[]>([]);
    const [isFetchLoading, setIsFetchLoading] = useState(true);

    const [masterStates, setMasterStates] = useState<string[]>([]);
    const [masterCities, setMasterCities] = useState<CityData[]>([]);
    const [masterRetailers, setMasterRetailers] = useState<RetailerData[]>([]);

    // STATE MODAL
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // FORM STATE
    const [formData, setFormData] = useState({ fullName: '', email: '', role: 'CITY_ADMIN', state: '', city: '', retailer: '' });

    // CRUD STATE (DETAIL, EDIT, SUSPEND, DELETE)
    const [selectedUser, setSelectedUser] = useState<DBUser | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Edit Form sekarang menampung Nama dan Email juga
    const [editFormData, setEditFormData] = useState({ fullName: '', email: '', role: '', state: '', city: '', retailer: '' });

    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    const loadAllData = async () => {
        try {
            const resUsers = await fetch('/api/admin/users');
            if (resUsers.ok) setUsers(await resUsers.json());

            const resLocations = await fetch('/api/admin/locations');
            if (resLocations.ok) {
                const dataLoc = await resLocations.json();
                setMasterStates(dataLoc.states);
                setMasterCities(dataLoc.cities);
                setMasterRetailers(dataLoc.retailers);
            }
        } catch (error) {
            console.error("Gagal sinkronisasi:", error);
        } finally {
            setIsFetchLoading(false);
        }
    };

    useEffect(() => { loadAllData(); }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setOpenDropdownId(null);
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) setOpenFilter(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // FILTER KOTA & RETAILER
    const availableCities = masterCities.filter(c => c.provinceName === formData.state);
    const availableRetailers = masterRetailers.filter(r => r.cityName && formData.city && r.cityName.trim().toLowerCase() === formData.city.trim().toLowerCase());

    const availableEditCities = masterCities.filter(c => c.provinceName === editFormData.state);
    const availableEditRetailers = masterRetailers.filter(r => r.cityName && editFormData.city && r.cityName.trim().toLowerCase() === editFormData.city.trim().toLowerCase());

    const filteredUsers = users.filter(user => {
        const matchSearch = (user.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        let normalizedRole = 'Semua Peran';
        if (user.role === 'SUPER_ADMIN') normalizedRole = 'Super Admin';
        if (user.role === 'STATE_ADMIN') normalizedRole = 'Admin Provinsi';
        if (user.role === 'CITY_ADMIN') normalizedRole = 'Kepala Cabang';
        if (user.role === 'RETAILER_ADMIN') normalizedRole = 'Manajer Retailer';
        if (user.role === 'DATA_ENGINEER') normalizedRole = 'Data Engineer';
        return matchSearch && (filterRole === 'Semua Peran' || normalizedRole === filterRole);
    });

    const getRoleComponents = (user: DBUser) => {
        if (user.role === 'SUPER_ADMIN') return { badge: <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 bg-purple-100 text-purple-700 text-[11px] font-bold rounded-md"><ShieldCheck size={12} /> Super Admin</span>, scope: 'Nasional (Semua Akses)' };
        if (user.role === 'STATE_ADMIN') return { badge: <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 bg-teal-100 text-teal-700 text-[11px] font-bold rounded-md"><Building2 size={12} /> Admin Provinsi</span>, scope: user.assignedState ? `Provinsi ${user.assignedState}` : 'Provinsi Belum Diatur' };
        if (user.role === 'CITY_ADMIN') return { badge: <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-md"><Building2 size={12} /> Kepala Cabang</span>, scope: user.assignedCity ? `${user.assignedCity} (${user.assignedState || '-'})` : 'Cabang Belum Diatur' };
        if (user.role === 'RETAILER_ADMIN') {
            const foundRetailer = masterRetailers.find(r => r.id === user.retailerId);
            // PERBAIKAN: Menampilkan nama dan kota retailer secara penuh
            return { badge: <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 bg-amber-100 text-amber-700 text-[11px] font-bold rounded-md"><Store size={12} /> Manajer Retailer</span>, scope: foundRetailer ? `${foundRetailer.name.toUpperCase()} - ${foundRetailer.cityName.toUpperCase()}` : 'Mitra Toko Belum Diatur' };
        }
        return { badge: <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-md"><UserCog size={12} /> Data Engineer</span>, scope: 'Infrastruktur Data' };
    };

    // --- FUNGSI API TAMBAH USER ---
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault(); setIsLoading(true); setToast(null);
        try {
            const res = await fetch('/api/admin/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const data = await res.json();
            if (res.ok) {
                setToast({ type: 'success', message: 'Pengguna baru berhasil ditambahkan! Password default: 123' });
                setFormData({ fullName: '', email: '', role: 'CITY_ADMIN', state: '', city: '', retailer: '' });
                loadAllData(); setTimeout(() => setIsInviteModalOpen(false), 2200);
            } else setToast({ type: 'error', message: data.error || 'Gagal menambahkan pengguna.' });
        } catch (error) { setToast({ type: 'error', message: 'Terjadi kesalahan sistem.' }); } finally { setIsLoading(false); }
    };

    // --- FUNGSI API UPDATE USER (NAMA, EMAIL, & AKSES) ---
    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault(); if (!selectedUser) return;
        setIsLoading(true); setToast(null);
        try {
            const res = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedUser.id, ...editFormData }) });
            const data = await res.json();
            if (res.ok) {
                setToast({ type: 'success', message: 'Data dan Hak Akses pengguna berhasil diperbarui.' });
                loadAllData(); setTimeout(() => setIsEditModalOpen(false), 2000);
            } else setToast({ type: 'error', message: data.error || 'Gagal memperbarui data.' });
        } catch (error) { setToast({ type: 'error', message: 'Terjadi kesalahan sistem.' }); } finally { setIsLoading(false); }
    };

    // --- FUNGSI API HAPUS USER ---
    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        setIsLoading(true); setToast(null);
        try {
            const res = await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedUser.id }) });
            if (res.ok) {
                setToast({ type: 'success', message: 'Akun pengguna berhasil dihapus permanen.' });
                loadAllData(); setTimeout(() => setIsDeleteModalOpen(false), 2000);
            } else setToast({ type: 'error', message: 'Gagal menghapus pengguna.' });
        } catch (error) { setToast({ type: 'error', message: 'Terjadi kesalahan sistem.' }); } finally { setIsLoading(false); }
    };

    // --- FUNGSI API UBAH STATUS ---
    const handleToggleStatus = async () => {
        if (!selectedUser) return;
        setIsLoading(true); setToast(null);
        const newStatus = selectedUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        try {
            const res = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedUser.id, status: newStatus }) });
            if (res.ok) {
                setToast({ type: 'success', message: `Status akun berhasil menjadi ${newStatus}.` });
                loadAllData(); setTimeout(() => setIsSuspendModalOpen(false), 2000);
            } else setToast({ type: 'error', message: 'Gagal mengubah status.' });
        } catch (error) { setToast({ type: 'error', message: 'Terjadi kesalahan sistem.' }); } finally { setIsLoading(false); }
    };

    const openEditModal = (user: DBUser) => {
        setSelectedUser(user);
        setEditFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            role: user.role,
            state: user.assignedState || '',
            city: user.assignedCity || '',
            retailer: user.retailerId || ''
        });
        setIsEditModalOpen(true); setOpenDropdownId(null);
    };

    return (
        <div className="pb-10 max-w-7xl mx-auto space-y-6 relative">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div><h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">Manajemen Akses</h2><p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">Kontrol otorisasi Kepala Cabang dan Manajer Retailer.</p></div>
                <button onClick={() => setIsInviteModalOpen(true)} className="bg-[#6A7BFA] hover:bg-[#5869E8] text-white px-6 py-3 rounded-[20px] font-bold text-sm transition-all shadow-[0_8px_20px_rgba(106,123,250,0.3)] flex items-center gap-2 active:scale-95"><Plus size={18} /> Tambah Pengguna</button>
            </div>

            {/* CONTROL PANEL */}
            <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 relative z-20">
                <div className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Cari nama atau email pengguna..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] pl-12 pr-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6A7BFA]/20 transition-all placeholder:font-medium" /></div>
                <div ref={filterRef} className="relative w-full sm:w-64">
                    <button onClick={() => setOpenFilter(!openFilter)} className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-[#6A7BFA]/50 rounded-[16px] px-5 py-3 text-sm font-bold text-slate-600 transition-all"><div className="flex items-center gap-2"><Filter size={16} className="text-[#6A7BFA]" /> <span className="truncate">{filterRole}</span></div></button>
                    {openFilter && (<div className="absolute top-[calc(100%+8px)] right-0 w-full bg-white border border-slate-100 rounded-[16px] shadow-xl z-[60] p-2 animate-in fade-in slide-in-from-top-2">{['Semua Peran', 'Super Admin', 'Admin Provinsi', 'Kepala Cabang', 'Manajer Retailer', 'Data Engineer'].map((role) => (<button key={role} onClick={() => { setFilterRole(role); setOpenFilter(false); }} className={`w-full text-left px-4 py-2.5 rounded-[10px] text-sm font-bold transition-colors ${filterRole === role ? 'bg-[#EDF2FE] text-[#6A7BFA]' : 'text-slate-600 hover:bg-slate-50'}`}>{role}</button>))}</div>)}
                </div>
            </div>

            {/* TABEL PENGGUNA */}
            <div className="bg-white border border-slate-200 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden relative z-10">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead><tr className="bg-slate-50 border-b border-slate-100"><th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Profil Pengguna</th><th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Peran & Wilayah Akses</th><th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th><th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Aksi</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {isFetchLoading ? (<tr><td colSpan={4} className="px-6 py-12 text-center text-sm font-semibold text-slate-400"><div className="flex items-center justify-center gap-2 text-[#6A7BFA]"><Loader2 size={18} className="animate-spin" /> Memuat data Supabase...</div></td></tr>) : filteredUsers.length > 0 ? filteredUsers.map((user) => {
                                const roleInfo = getRoleComponents(user);
                                return (
                                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4"><div className="flex items-center gap-4"><img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.email}`} alt={user.fullName} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm bg-slate-100" /><div><p className="text-sm font-bold text-slate-900 group-hover:text-[#6A7BFA] transition-colors">{user.fullName}</p><p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={12} /> {user.email}</p></div></div></td>
                                        <td className="px-6 py-4"><div className="flex flex-col gap-2">{roleInfo.badge}<p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /> {roleInfo.scope}</p></div></td>
                                        <td className="px-6 py-4">{user.status === 'ACTIVE' ? (<span className="flex items-center gap-1.5 w-fit px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100"><CheckCircle2 size={14} /> Aktif</span>) : (<span className="flex items-center gap-1.5 w-fit px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100"><Lock size={14} /> Suspended</span>)}</td>
                                        <td className="px-6 py-4 relative text-center">
                                            <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === user.id ? null : user.id); }} className="p-2 text-slate-400 hover:text-[#6A7BFA] hover:bg-[#EDF2FE] rounded-xl transition-colors"><MoreVertical size={18} /></button>

                                            {/* DROPDOWN MENU MASTER LENGKAP */}
                                            {openDropdownId === user.id && (
                                                <div ref={dropdownRef} className="absolute right-10 top-1/2 -translate-y-1/2 w-52 bg-white border border-slate-100 rounded-[16px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] z-[60] p-1.5 animate-in fade-in zoom-in-95">
                                                    <button onClick={() => { setSelectedUser(user); setIsDetailModalOpen(true); setOpenDropdownId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-[#6A7BFA] rounded-[10px] transition-colors"><UserCog size={14} /> Detail Profil</button>
                                                    <button onClick={() => openEditModal(user)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-amber-600 rounded-[10px] transition-colors"><Edit size={14} /> Edit Profil & Akses</button>

                                                    <div className="h-px bg-slate-100 my-1"></div>

                                                    <button onClick={() => { setSelectedUser(user); setIsSuspendModalOpen(true); setOpenDropdownId(null); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-[10px] transition-colors ${user.status === 'ACTIVE' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                                                        {user.status === 'ACTIVE' ? <><ShieldAlert size={14} /> Suspend Akun</> : <><CheckCircle2 size={14} /> Aktifkan Akun</>}
                                                    </button>

                                                    <button onClick={() => { setSelectedUser(user); setIsDeleteModalOpen(true); setOpenDropdownId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-[10px] transition-colors mt-0.5">
                                                        <Trash2 size={14} /> Hapus Permanen
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (<tr><td colSpan={4} className="px-6 py-12 text-center text-sm font-semibold text-slate-400">Tidak ada pengguna yang cocok.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL EDIT DATA & AKSES PENGGUNA */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 flex flex-col relative border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-[#6A7BFA] hover:bg-[#EDF2FE] rounded-full transition-colors"><X size={20} strokeWidth={2.5} /></button>
                        <div className="mb-6"><h3 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Data Pengguna</h3><p className="text-sm text-slate-500 mt-1">Ubah identitas dan otorisasi untuk <span className="font-bold">{selectedUser.fullName}</span>.</p></div>
                        {toast && <div className={`p-4 mb-6 rounded-[16px] border text-sm font-bold flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>{toast.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}{toast.message}</div>}

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">Nama Lengkap</label>
                                <input type="text" required value={editFormData.fullName} onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })} className="w-full bg-white border border-slate-200 rounded-[16px] px-5 py-3.5 text-sm font-semibold text-slate-800 focus:border-[#6A7BFA]" />
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">Email Perusahaan</label>
                                <input type="email" required value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full bg-white border border-slate-200 rounded-[16px] px-5 py-3.5 text-sm font-semibold text-slate-800 focus:border-[#6A7BFA]" />
                            </div>

                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">Tingkat Akses (Role)</label>
                                <div className="relative">
                                    <select value={editFormData.role} onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value, state: '', city: '', retailer: '' })} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-5 py-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#6A7BFA] appearance-none cursor-pointer pr-12">
                                        <option value="STATE_ADMIN">Admin Provinsi (State)</option><option value="CITY_ADMIN">Kepala Cabang (City)</option><option value="RETAILER_ADMIN">Manajer Retailer (Store)</option>
                                    </select>
                                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-4 pt-1 p-4 bg-slate-50 rounded-[20px] border border-slate-100">
                                <p className="text-[11px] font-bold text-[#6A7BFA] uppercase tracking-wider mb-1">Cakupan Wilayah Operasional</p>
                                <div>
                                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5 ml-1">Provinsi Penugasan</label>
                                    <div className="relative"><select required value={editFormData.state} onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value, city: '', retailer: '' })} className="w-full bg-white border border-slate-200 rounded-[14px] px-4 py-3 text-sm font-semibold text-slate-800 focus:border-[#6A7BFA] appearance-none cursor-pointer pr-12"><option value="">Pilih Provinsi...</option>{masterStates.map((st, idx) => <option key={idx} value={st}>{st}</option>)}</select><ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                                </div>
                                {(editFormData.role === 'CITY_ADMIN' || editFormData.role === 'RETAILER_ADMIN') && (
                                    <div>
                                        <label className="block text-[12px] font-bold text-slate-600 mb-1.5 ml-1">Kota / Cabang</label>
                                        <div className="relative"><select required disabled={!editFormData.state} value={editFormData.city} onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value, retailer: '' })} className="w-full bg-white border border-slate-200 rounded-[14px] px-4 py-3 text-sm font-semibold text-slate-800 focus:border-[#6A7BFA] appearance-none cursor-pointer pr-12"><option value="">Pilih Kota...</option>{availableEditCities.map((ct, idx) => <option key={idx} value={ct.name}>{ct.name}</option>)}</select><ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                                    </div>
                                )}
                                {editFormData.role === 'RETAILER_ADMIN' && (
                                    <div>
                                        <label className="block text-[12px] font-bold text-slate-600 mb-1.5 ml-1">Nama Retailer</label>
                                        {/* PERBAIKAN: Menampilkan nama dan kota dengan huruf kapital agar informatif */}
                                        <div className="relative"><select required disabled={!editFormData.city} value={editFormData.retailer} onChange={(e) => setEditFormData({ ...editFormData, retailer: e.target.value })} className="w-full bg-white border border-slate-200 rounded-[14px] px-4 py-3 text-sm font-semibold text-slate-800 focus:border-[#6A7BFA] appearance-none cursor-pointer pr-12"><option value="">{!editFormData.city ? "Pilih Kota Terlebih Dahulu" : availableEditRetailers.length === 0 ? "Belum ada data toko" : "Pilih Mitra Toko..."}</option>{availableEditRetailers.map((rt) => <option key={rt.id} value={rt.id}>{`${rt.name.toUpperCase()} - ${rt.cityName.toUpperCase()}`}</option>)}</select><ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-50 text-slate-600 font-bold text-sm rounded-[20px] hover:bg-slate-100 transition-colors border border-slate-200">Batal</button>
                                <button type="submit" disabled={isLoading} className="flex-[2] px-4 py-3 bg-[#6A7BFA] text-white font-bold text-sm rounded-[20px] hover:bg-[#5869E8] shadow-[0_8px_20px_rgba(106,123,250,0.3)] transition-all flex items-center justify-center gap-2">{isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Simpan Perubahan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL MENGHAPUS USER (DANGER ZONE) */}
            {isDeleteModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl relative border border-slate-100 text-center animate-in zoom-in-95">
                        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-red-50 text-red-500 border border-red-100">
                            <Trash2 size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Pengguna?</h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            Aksi ini bersifat permanen. Semua data akses, riwayat, dan profil milik <span className="font-bold text-slate-700">{selectedUser.fullName}</span> akan dihapus dari sistem.
                        </p>

                        {toast && <div className="mb-4 text-sm font-bold text-center text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">{toast.message}</div>}

                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-50 text-slate-600 font-bold text-sm rounded-[20px] hover:bg-slate-100 border border-slate-200 transition-colors">Batal</button>
                            <button onClick={handleDeleteUser} disabled={isLoading} className="flex-1 px-4 py-3 text-white font-bold text-sm rounded-[20px] shadow-lg transition-all flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 shadow-red-500/30">
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SUSPEND / AKTIFKAN */}
            {isSuspendModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl relative border border-slate-100 text-center animate-in zoom-in-95">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 ${selectedUser.status === 'ACTIVE' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                            {selectedUser.status === 'ACTIVE' ? <ShieldAlert size={32} /> : <CheckCircle2 size={32} />}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedUser.status === 'ACTIVE' ? 'Suspend Akun?' : 'Aktifkan Akun?'}</h3>
                        <p className="text-sm text-slate-500 mb-6">Apakah Anda yakin ingin {selectedUser.status === 'ACTIVE' ? 'menangguhkan' : 'mengaktifkan kembali'} akses untuk <span className="font-bold text-slate-700">{selectedUser.fullName}</span>?</p>

                        {toast && <div className="mb-4 text-sm font-bold text-center text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">{toast.message}</div>}

                        <div className="flex gap-3">
                            <button onClick={() => setIsSuspendModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-50 text-slate-600 font-bold text-sm rounded-[20px] hover:bg-slate-100 border border-slate-200 transition-colors">Batal</button>
                            <button onClick={handleToggleStatus} disabled={isLoading} className={`flex-1 px-4 py-3 text-white font-bold text-sm rounded-[20px] shadow-lg transition-all flex items-center justify-center gap-2 ${selectedUser.status === 'ACTIVE' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'}`}>
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Ya, Lanjutkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DETAIL PROFIL */}
            {isDetailModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative border border-slate-100 animate-in zoom-in-95">
                        <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-[#6A7BFA] hover:bg-[#EDF2FE] rounded-full transition-colors"><X size={20} strokeWidth={2.5} /></button>
                        <div className="flex flex-col items-center mb-6 text-center">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedUser.email}`} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-slate-50 shadow-md mb-4 bg-slate-100" />
                            <h3 className="text-xl font-bold text-slate-900">{selectedUser.fullName}</h3>
                            <p className="text-sm text-slate-500">{selectedUser.email}</p>
                            <div className="mt-3">{getRoleComponents(selectedUser).badge}</div>
                        </div>
                        <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-100 space-y-4">
                            <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Akun</p><p className="text-sm font-bold text-slate-700">{selectedUser.status === 'ACTIVE' ? 'Aktif Beroperasi' : 'Ditangguhkan (Suspended)'}</p></div>
                            <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cakupan Wilayah</p><p className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin size={14} className="text-[#6A7BFA]" /> {getRoleComponents(selectedUser).scope}</p></div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TAMBAH (INVITE) TETAP ADA UTUH */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 flex flex-col relative border border-slate-100 max-h-[90vh] overflow-y-auto hide-scrollbar-on-mobile">
                        <button onClick={() => setIsInviteModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-[#6A7BFA] hover:bg-[#EDF2FE] rounded-full transition-colors"><X size={20} strokeWidth={2.5} /></button>
                        <div className="mb-6"><h3 className="text-2xl font-bold text-slate-900 tracking-tight">Tambah Pengguna Baru</h3><p className="text-sm text-slate-500 mt-1">Berikan wilayah penugasan khusus pada sistem.</p></div>
                        {toast && <div className={`p-4 mb-6 rounded-[16px] border text-sm font-bold flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>{toast.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}{toast.message}</div>}
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div><label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">Nama Lengkap</label><input type="text" required placeholder="Masukkan nama lengkap..." value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-5 py-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6A7BFA]/20 focus:border-[#6A7BFA] transition-all" /></div>
                            <div><label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">Email Perusahaan</label><input type="email" required placeholder="nama@aksa.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-5 py-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6A7BFA]/20 focus:border-[#6A7BFA] transition-all" /></div>
                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">Tingkat Akses (Role)</label>
                                <div className="relative"><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value, state: '', city: '', retailer: '' })} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-5 py-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6A7BFA]/20 focus:border-[#6A7BFA] transition-all appearance-none cursor-pointer pr-12 font-sans"><option value="STATE_ADMIN">Admin Provinsi (State)</option><option value="CITY_ADMIN">Kepala Cabang (City)</option><option value="RETAILER_ADMIN">Manajer Retailer (Store)</option><option value="DATA_ENGINEER">Data Engineer</option></select><ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                            </div>
                            {formData.role !== 'SUPER_ADMIN' && formData.role !== 'DATA_ENGINEER' && (
                                <div className="space-y-4 pt-1 p-4 bg-slate-50 rounded-[20px] border border-slate-100 animate-in fade-in slide-in-from-top-3 duration-300">
                                    <p className="text-[11px] font-bold text-[#6A7BFA] uppercase tracking-wider mb-1">Cakupan Wilayah Operasional</p>
                                    <div><label className="block text-[12px] font-bold text-slate-600 mb-1.5 ml-1">Provinsi Penugasan</label><div className="relative"><select required value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '', retailer: '' })} className="w-full bg-white border border-slate-200 rounded-[14px] px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#6A7BFA] appearance-none cursor-pointer pr-12"><option value="">Pilih Provinsi...</option>{masterStates.map((st, idx) => <option key={idx} value={st}>{st}</option>)}</select><ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div></div>
                                    {(formData.role === 'CITY_ADMIN' || formData.role === 'RETAILER_ADMIN') && (<div><label className="block text-[12px] font-bold text-slate-600 mb-1.5 ml-1">Kota / Cabang</label><div className="relative"><select required disabled={!formData.state} value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value, retailer: '' })} className="w-full bg-white border border-slate-200 rounded-[14px] px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#6A7BFA] disabled:opacity-60 appearance-none cursor-pointer pr-12"><option value="">{formData.state ? "Pilih Kota..." : "Pilih Provinsi Terlebih Dahulu"}</option>{availableCities.map((ct, idx) => <option key={ct.name} value={ct.name}>{ct.name}</option>)}</select><ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div></div>)}
                                    {formData.role === 'RETAILER_ADMIN' && (<div><label className="block text-[12px] font-bold text-slate-600 mb-1.5 ml-1">Nama Retailer</label>
                                        {/* PERBAIKAN: Menampilkan nama dan kota dengan huruf kapital agar informatif */}
                                        <div className="relative"><select required disabled={!formData.city} value={formData.retailer} onChange={(e) => setFormData({ ...formData, retailer: e.target.value })} className="w-full bg-white border border-slate-200 rounded-[14px] px-4 py-3 text-sm font-semibold text-slate-800 focus:border-[#6A7BFA] disabled:opacity-60 appearance-none cursor-pointer pr-12"><option value="">{!formData.city ? "Pilih Kota Terlebih Dahulu" : availableRetailers.length === 0 ? "Belum ada data toko di kota ini" : "Pilih Mitra Toko..."}</option>{availableRetailers.map((rt) => (<option key={rt.id} value={rt.id}>{`${rt.name.toUpperCase()} - ${rt.cityName.toUpperCase()}`}</option>))}</select><ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div></div>)}
                                </div>
                            )}
                            <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-[16px] flex items-start gap-3"><Lock size={16} className="text-blue-600 shrink-0 mt-0.5" /><p className="text-xs font-semibold text-blue-800 leading-relaxed">Kata sandi awal pengguna baru diset otomatis menjadi <span className="font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">123</span>.</p></div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-50 text-slate-600 font-bold text-sm rounded-[20px] hover:bg-slate-100 border border-slate-200 transition-colors">Batal</button>
                                <button type="submit" disabled={isLoading} className="flex-[2] px-4 py-3 bg-[#6A7BFA] text-white font-bold text-sm rounded-[20px] hover:bg-[#5869E8] shadow-[0_8px_20px_rgba(106,123,250,0.3)] transition-all flex items-center justify-center gap-2">{isLoading ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</> : 'Buat Akun'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}