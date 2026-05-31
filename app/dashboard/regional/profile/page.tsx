"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, BellRing, ShieldCheck, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegionalProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const user = session?.user as any;

    const email = user?.email || 'Memuat...';
    const userState = user?.assignedState || 'Memuat...';
    const avatarSeed = user?.email || 'default-user';

    const [activeTab, setActiveTab] = useState('profil');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'warning' } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // State untuk form edit
    const [newName, setNewName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Isi default form nama saat halaman dimuat
    useEffect(() => {
        if (user?.name) setNewName(user.name);
    }, [user?.name]);

    const handleSave = async () => {
        if (email === 'Memuat...') return;
        setIsSaving(true);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, fullName: newName, currentPassword, newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                setToast({ message: data.message, type: 'success' });
                setCurrentPassword(''); // Kosongkan form password setelah berhasil
                setNewPassword('');
                await update({ name: newName }); // Update sesi nama di frontend
                router.refresh();
            } else {
                setToast({ message: data.error, type: 'warning' });
            }
        } catch (error) {
            setToast({ message: "Terjadi kesalahan jaringan", type: 'warning' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setToast(null), 4000);
        }
    };

    return (
        <div className="pb-10 max-w-6xl mx-auto animate-in fade-in duration-500 relative">
            {toast && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-[40px] shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-top-5 duration-300 font-bold border text-sm ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />} {toast.message}
                </div>
            )}

            <div className="mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola profil manajerial dan pengaturan keamanan Anda.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                <div className="w-full md:w-[280px] shrink-0">
                    <div className="bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] p-2 md:p-4 grid grid-cols-3 md:flex md:flex-col gap-2 shadow-sm md:shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
                        <button onClick={() => setActiveTab('profil')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 py-3 md:px-4 md:py-3.5 rounded-xl md:rounded-2xl transition-all ${activeTab === 'profil' ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-md border-transparent' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}><User size={18} /><span className="text-[11px] md:text-sm font-bold">Profil</span></button>
                        <button onClick={() => setActiveTab('notifikasi')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 py-3 md:px-4 md:py-3.5 rounded-xl md:rounded-2xl transition-all ${activeTab === 'notifikasi' ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-md border-transparent' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}><BellRing size={18} /><span className="text-[11px] md:text-sm font-bold">Notifikasi</span></button>
                        <button onClick={() => setActiveTab('keamanan')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 px-2 py-3 md:px-4 md:py-3.5 rounded-xl md:rounded-2xl transition-all ${activeTab === 'keamanan' ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-md border-transparent' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}><ShieldCheck size={18} /><span className="text-[11px] md:text-sm font-bold">Keamanan</span></button>
                    </div>
                </div>

                <div className="flex-1 bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 md:p-8 lg:p-10 min-h-[500px] flex flex-col justify-between">
                    <div>
                        {activeTab === 'profil' && (
                            <div className="animate-in fade-in slide-in-from-right-4">
                                <h4 className="font-bold text-xl md:text-2xl text-slate-900 mb-6 md:mb-8">Informasi Dasar</h4>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 md:mb-10 pb-8 md:pb-10 border-b border-slate-100">
                                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}`} alt="Profile" className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover shadow-md border-4 border-[#EDF2FE] bg-slate-50" />
                                    <div className="flex flex-wrap gap-2 sm:gap-3">
                                        <button className="text-xs md:text-sm font-bold text-white bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] px-5 md:px-6 py-2.5 md:py-3 rounded-full transition-all shadow-md hover:shadow-lg active:scale-95">Ganti Foto</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                                    <div>
                                        <label className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Nama Lengkap</label>
                                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Email Perusahaan</label>
                                        <input type="email" value={email} readOnly disabled className="w-full mt-2 bg-slate-100 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-400 cursor-not-allowed" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Area Otorisasi (Region)</label>
                                        <input type="text" value={`Manager Provinsi (${userState})`} readOnly disabled className="w-full mt-2 bg-slate-100 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-400 cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifikasi' && (
                            <div className="animate-in fade-in slide-in-from-right-4 max-w-3xl">
                                <h4 className="font-bold text-xl md:text-2xl text-slate-900 mb-6 md:mb-8">Preferensi Alert Sistem</h4>
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-slate-50 border border-slate-200 rounded-3xl gap-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="p-3.5 bg-red-100 text-red-600 rounded-2xl hidden sm:block"><AlertTriangle size={24} /></div>
                                            <div>
                                                <p className="font-bold text-sm md:text-base text-slate-900">Alert Cabang Kritis</p>
                                                <p className="text-xs md:text-sm text-slate-500 mt-1">Kirim peringatan jika salah satu kota di region mengalami Out-of-Stock parah.</p>
                                            </div>
                                        </div>
                                        <div className="w-14 h-8 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] rounded-full relative cursor-pointer shadow-inner shrink-0"><div className="w-6 h-6 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'keamanan' && (
                            <div className="animate-in fade-in slide-in-from-right-4 max-w-3xl">
                                <h4 className="font-bold text-xl md:text-2xl text-slate-900 mb-6 md:mb-8">Keamanan Akun</h4>
                                <div className="space-y-5 md:space-y-6">
                                    <div>
                                        <label className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Kata Sandi Saat Ini</label>
                                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Masukkan kata sandi lama" className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Kata Sandi Baru</label>
                                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Biarkan kosong jika tidak ingin ganti password" className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-[20px] px-5 py-3.5 md:py-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] transition-all" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-slate-100 flex justify-end">
                        <button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white font-bold text-sm rounded-[40px] shadow-xl shadow-[#4f46e5]/20 hover:shadow-[#4f46e5]/40 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2">
                            {isSaving ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}