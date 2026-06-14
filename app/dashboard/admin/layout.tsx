"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    BarChart3, Map as MapIcon, TrendingUp, Users, LogOut, ShieldCheck,
    Bot, X, Send, AlertTriangle, CheckCircle2, Menu, Settings,
    Inbox, Bell, BrainCircuit, ServerCrash, Activity, Database, MessagesSquare, ChevronDown, ChevronUp
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const { data: session } = useSession();
    const user = session?.user as any;
    const userName = user?.name || 'Admin';
    const firstName = userName.split(' ')[0];
    const avatarSeed = user?.email || 'admin-user';
    const userRole = user?.role;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
    const [systemStatus, setSystemStatus] = useState({
        fastApi: 'checking',
        supabase: 'checking'
    });

    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [showAllPrompts, setShowAllPrompts] = useState(false);

    const [toast, setToast] = useState<{ message: string, type: 'success' | 'warning' } | null>(null);
    const [currentDate, setCurrentDate] = useState('Memuat...');
    const [currentLocation, setCurrentLocation] = useState('Memuat...');
    const [greeting, setGreeting] = useState('Halo');

    const superAdminPrompts = [
        "Bagaimana performa penjualan total di seluruh provinsi bulan ini?",
        "Tolong bandingkan margin profit rata-rata antar retailer.",
        "Provinsi mana yang memiliki volume penjualan paling rendah?",
        "Apa kategori produk yang menyumbang pendapatan terbesar?",
        "Berapa banyak stok barang yang berhasil diprediksi AI untuk bulan depan?",
        "Apa strategi terbaik untuk meningkatkan efisiensi penjualan di wilayah urban?",
        "Apakah ada tren penurunan metrik yang harus saya waspadai saat ini?",
        "Sebutkan 3 retailer dengan performa paling lambat.",
        "Metode penjualan apa (In-store vs Online) yang paling efektif sekarang?",
        "Berapa total data transaksi yang sedang diolah oleh engine analitik kita?"
    ];

    const showToast = (message: string, type: 'success' | 'warning') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, isAiTyping, isChatOpen, showAllPrompts]);

    const fetchNotifications = async () => {
        if (!session?.user?.email) return;
        try {
            const res = await fetch(`/api/admin/notifications?email=${session.user.email}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: any) => !n.isRead).length);
            }
        } catch (error) {
            console.error("Gagal menarik notifikasi:", error);
        }
    };

    useEffect(() => {
        if (session?.user?.email) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [session?.user?.email]);

    const markAllAsRead = async () => {
        if (!session?.user?.email || unreadCount === 0) return;
        try {
            const res = await fetch('/api/admin/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: session.user.email })
            });
            if (res.ok) {
                fetchNotifications();
                setIsNotifOpen(false);
            }
        } catch (error) {
            console.error("Gagal update notifikasi:", error);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.round(diffMs / 60000);
        const diffHours = Math.round(diffMins / 60);
        const diffDays = Math.round(diffHours / 24);

        if (diffMins < 60) return `${diffMins} Menit`;
        if (diffHours < 24) return `${diffHours} Jam`;
        if (diffDays === 1) return `Kemarin`;
        return `${diffDays} Hari`;
    };

    const getNotifStyle = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('memo') || t.includes('target') || t.includes('ai')) {
            return { icon: <BrainCircuit size={16} className="text-[#4f46e5]" />, bg: 'bg-[#EDF2FE]' };
        }
        if (t.includes('eskalasi') || t.includes('krisis') || t.includes('defisit')) {
            return { icon: <AlertTriangle size={16} className="text-red-500" />, bg: 'bg-red-50' };
        }
        return { icon: <CheckCircle2 size={16} className="text-emerald-500" />, bg: 'bg-emerald-50' };
    };

    useEffect(() => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        setCurrentDate(now.toLocaleDateString('id-ID', options).toUpperCase());

        const hour = now.getHours();
        if (hour >= 5 && hour < 12) setGreeting('Selamat Pagi');
        else if (hour >= 12 && hour < 15) setGreeting('Selamat Siang');
        else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore');
        else setGreeting('Selamat Malam');

        setCurrentLocation('HQ Pusat, ID');
    }, []);

    useEffect(() => {
        const runSystemDiagnostic = async () => {
            setIsSystemModalOpen(true);
            let apiState = 'offline';
            let dbState = 'offline';

            try {
                const resApi = await fetch('http://localhost:8000/api/health');
                if (resApi.ok) apiState = 'online';
            } catch (error) { apiState = 'offline'; }

            try {
                const resDb = await fetch('/api/admin/analytics/dashboard');
                if (resDb.ok) dbState = 'online';
            } catch (error) { dbState = 'offline'; }

            setSystemStatus({ fastApi: apiState, supabase: dbState });
        };
        runSystemDiagnostic();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsLogoutModalOpen(false); // Tutup modal dulu
        // Menggunakan window.location untuk memaksa reload dan membersihkan cache session
        await signOut({ redirect: false });
        window.location.href = '/';
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => setIsScrolled(e.currentTarget.scrollTop > 10);

    const cleanAiResponse = (text: string) => {
        if (!text) return "";
        let cleanedText = text.replace(/[*#$/\\_~`>]/g, '');
        cleanedText = cleanedText.replace(/\s{2,}/g, ' ').trim();
        return cleanedText;
    };

    const handleSendMessage = async (e?: React.FormEvent, directMessage?: string) => {
        if (e) e.preventDefault();

        const messageToSend = directMessage || chatInput.trim();
        if (!messageToSend) return;

        setChatMessages(prev => [...prev, { role: 'user', text: messageToSend }]);
        setChatInput('');
        setIsAiTyping(true);
        setShowAllPrompts(false);

        try {
            const response = await fetch('http://localhost:8000/api/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageToSend,
                    user_context: user?.name || "Pengguna",
                    user_role: userRole || "SUPER_ADMIN"
                })
            });

            if (response.ok) {
                const data = await response.json();
                const sanitizedReply = cleanAiResponse(data.reply);
                setChatMessages(prev => [...prev, { role: 'ai', text: sanitizedReply }]);
            } else {
                setChatMessages(prev => [...prev, { role: 'ai', text: "⚠️ Maaf, gagal memproses respons AI (Error 500)." }]);
            }
        } catch (error) {
            setChatMessages(prev => [...prev, { role: 'ai', text: "❌ Koneksi ke FastAPI terputus. Pastikan server backend berjalan." }]);
        } finally {
            setIsAiTyping(false);
        }
    };

    const isSystemOnline = systemStatus.fastApi === 'online' && systemStatus.supabase === 'online';
    const isSystemChecking = systemStatus.fastApi === 'checking' || systemStatus.supabase === 'checking';
    const isFastApiConnected = systemStatus.fastApi === 'online';

    const formatRole = (role?: string) => {
        if (role === 'SUPER_ADMIN') return 'Super Admin';
        if (role === 'STATE_ADMIN') return 'Admin Provinsi';
        if (role === 'RETAILER_ADMIN') return 'Manajer Retailer';
        if (role === 'DATA_ENGINEER') return 'Data Engineer';
        return 'Pengguna Eksekutif';
    };

    const visiblePrompts = showAllPrompts ? superAdminPrompts : superAdminPrompts.slice(0, 3);

    return (
        <div className="flex h-[100dvh] w-full bg-[#F4F7FE] overflow-hidden font-sans text-slate-600 relative">

            {toast && (
                <div className={`absolute top-6 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-[40px] shadow-xl flex items-center gap-3 z-[150] animate-in slide-in-from-top-5 duration-300 font-bold border text-sm w-[90%] max-w-sm ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertTriangle size={20} className="shrink-0" />}
                    <p className="leading-tight">{toast.message}</p>
                </div>
            )}

            {isSystemModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[130] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 flex flex-col items-center border border-slate-100">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight text-center">Diagnostik Sistem</h3>
                        <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed text-center">
                            Memeriksa konektivitas infrastruktur sebelum Anda memantau Dashboard.
                        </p>

                        <div className="w-full space-y-4 mb-8">
                            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <Activity size={20} className="text-indigo-500" />
                                    <span className="font-bold text-slate-700 text-sm">AI Engine (FastAPI)</span>
                                </div>
                                {systemStatus.fastApi === 'checking' ? (
                                    <span className="text-xs font-bold text-slate-400 animate-pulse">Menghubungkan...</span>
                                ) : systemStatus.fastApi === 'online' ? (
                                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle2 size={12} /> Online</span>
                                ) : (
                                    <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full flex items-center gap-1"><ServerCrash size={12} /> Offline</span>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <Database size={20} className="text-indigo-500" />
                                    <span className="font-bold text-slate-700 text-sm">Database (Supabase)</span>
                                </div>
                                {systemStatus.supabase === 'checking' ? (
                                    <span className="text-xs font-bold text-slate-400 animate-pulse">Menghubungkan...</span>
                                ) : systemStatus.supabase === 'online' ? (
                                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle2 size={12} /> Online</span>
                                ) : (
                                    <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full flex items-center gap-1"><AlertTriangle size={12} /> Offline</span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsSystemModalOpen(false)}
                            disabled={isSystemChecking}
                            className="w-full py-4 px-4 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white font-bold text-sm rounded-[24px] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
                        >
                            {isSystemChecking ? 'Menunggu Hasil...' : 'Masuk Dashboard'}
                        </button>
                    </div>
                </div>
            )}

            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] lg:hidden transition-opacity duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            <aside className={`fixed lg:relative top-0 left-0 h-[100dvh] w-[280px] bg-[#ffffff] flex flex-col py-6 px-5 z-[100] rounded-r-[32px] lg:rounded-none lg:rounded-br-[40px] lg:border-r lg:border-slate-100 shadow-[20px_0_40px_rgba(0,0,0,0.1)] lg:shadow-none transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex items-center justify-between mb-8 px-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <img src="/Logo-AksaAnalitika-BgWhite.png" alt="AKSA Analitika" className="h-14 lg:h-16 w-auto object-contain" />
                    </div>
                    <button className="lg:hidden p-2 text-slate-400 hover:text-[#4f46e5] hover:bg-slate-50 rounded-full transition-all active:scale-90" onClick={() => setIsMobileMenuOpen(false)}>
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-4 shrink-0">Main Menu</div>

                <nav className="flex-1 min-h-0 space-y-1.5 overflow-y-auto custom-scrollbar px-1">
                    {[
                        { href: '/dashboard/admin', label: 'Dashboard', icon: <BarChart3 size={20} />, exact: true },
                        { href: '/dashboard/admin/map', label: 'Distribution Map', icon: <MapIcon size={20} />, exact: false },
                        { href: '/dashboard/admin/forecast', label: 'AI Forecast', icon: <TrendingUp size={20} />, exact: false },
                        { href: '/dashboard/admin/inbox', label: 'Command Center', icon: <Inbox size={20} />, exact: false },
                    ].map((item) => {
                        const isActive = item.exact ? pathname === item.href : pathname.includes(item.href);
                        return (
                            <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[40px] text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-md shadow-[#4f46e5]/30' : 'text-slate-500 hover:bg-[#EDF2FE] hover:text-[#4f46e5]'}`}>
                                <div className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#4f46e5] transition-colors'}>{item.icon}</div>
                                {item.label}
                            </Link>
                        );
                    })}

                    {userRole === 'SUPER_ADMIN' && (
                        <div className="pt-6 mt-6 border-t border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3">Management</div>
                            <Link href="/dashboard/admin/users" onClick={() => setIsMobileMenuOpen(false)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[40px] text-sm font-semibold transition-colors duration-200 ${pathname.includes('/users') ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-md shadow-[#4f46e5]/30' : 'text-slate-500 hover:bg-[#EDF2FE] hover:text-[#4f46e5] group'}`}>
                                <div className={pathname.includes('/users') ? 'text-white' : 'text-slate-400 group-hover:text-[#4f46e5] transition-colors'}><Users size={20} /></div>
                                User Management
                            </Link>
                        </div>
                    )}
                </nav>

                <div className="px-2 mt-4 mb-2 shrink-0">
                    <button onClick={() => setIsLogoutModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 text-sm font-bold hover:bg-red-50 hover:text-red-600 rounded-[40px] transition-colors group">
                        <LogOut size={20} className="group-hover:translate-x-1 transition-transform" /> Sign Out
                    </button>
                </div>

                <div className="relative px-2 pt-4 border-t border-slate-100 shrink-0">
                    <Link href="/dashboard/admin/profile" onClick={() => setIsMobileMenuOpen(false)}
                        className={`w-full flex items-center justify-between p-3 rounded-[24px] transition-all duration-200 group text-left ${pathname.includes('/profile') ? 'bg-[#EDF2FE]' : 'bg-transparent hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}`} alt="Profile" className="w-10 h-10 rounded-full object-cover bg-slate-200 shadow-sm border-2 border-white group-hover:scale-105 transition-transform" />
                            <div className="overflow-hidden">
                                <p className={`text-sm font-bold leading-tight truncate transition-colors group-hover:text-[#4f46e5] ${pathname.includes('/profile') ? 'text-[#4f46e5]' : 'text-slate-900'}`}>
                                    {userName}
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium truncate">
                                    {formatRole(userRole)}
                                </p>
                            </div>
                        </div>
                        <Settings size={16} className={`transition-all duration-300 ${pathname.includes('/profile') ? 'text-[#4f46e5] rotate-45' : 'text-slate-400 group-hover:text-[#4f46e5] group-hover:rotate-45'}`} />
                    </Link>
                </div>
            </aside>

            <div className="flex-1 h-full overflow-y-auto relative custom-scrollbar bg-[#F4F7FE]" onScroll={handleScroll}>

                <header className={`sticky top-0 z-[70] w-full transition-all duration-300 rounded-b-[32px] lg:rounded-b-none lg:rounded-br-[40px] ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]' : 'bg-white/80 backdrop-blur-md border-b border-slate-200/50'}`}>
                    <div className="flex lg:hidden items-center justify-between px-4 sm:px-6 h-[72px]">
                        <button className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 shadow-sm text-slate-700 hover:text-[#4f46e5] hover:bg-[#EDF2FE] hover:border-[#EDF2FE] rounded-2xl transition-all active:scale-95" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu size={22} strokeWidth={2.5} />
                        </button>
                        <img src="/Logo-AksaAnalitika-BgWhite.png" alt="AKSA" className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" />
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-500 hover:bg-[#EDF2FE] hover:text-[#4f46e5] transition-colors active:scale-95 border border-slate-200 shadow-sm">
                                <Bell size={16} />
                                {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                            </button>
                            <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-slate-50 active:scale-90 transition-all cursor-pointer hidden sm:block">
                                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}`} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center justify-between px-10 h-20">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                                {pathname.includes('/profile') ? 'Pengaturan Akun' : `${greeting}, ${firstName}! 👋`}
                            </h2>
                            <p className="text-xs font-medium text-slate-500 mt-1">Akses Penuh Portal Eksekutif</p>
                        </div>

                        <div className="flex items-center gap-6 relative" ref={notifRef}>
                            <div className="text-right border-r border-slate-200 pr-6">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{currentDate}</p>
                                <p className="text-xs font-semibold text-slate-600">{currentLocation}</p>
                            </div>

                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-sm cursor-help transition-all duration-300 ${isSystemChecking ? 'bg-amber-50 border border-amber-100 text-amber-700' :
                                isSystemOnline ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' :
                                    'bg-red-50 border border-red-100 text-red-700'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${isSystemChecking ? 'bg-amber-500 animate-pulse' :
                                    isSystemOnline ? 'bg-emerald-500 animate-pulse' :
                                        'bg-red-500'
                                    }`}></span>
                                {isSystemChecking ? 'Memeriksa Sistem...' : isSystemOnline ? 'Sistem Optimal' : 'Koneksi Terputus'}
                            </div>

                            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="w-10 h-10 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-[#4f46e5] hover:bg-slate-50 transition-colors relative">
                                <Bell size={18} />
                                {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                            </button>

                            {isNotifOpen && (
                                <div className="absolute right-0 top-[calc(100%+8px)] w-[300px] sm:w-[340px] bg-white rounded-[24px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 z-[100]">
                                    <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                        <span className="font-bold text-slate-800 text-sm">Notifikasi Masuk</span>
                                        {unreadCount > 0 && <span className="text-[10px] font-bold text-[#4f46e5] bg-[#EDF2FE] px-2 py-1 rounded-full">{unreadCount} Baru</span>}
                                    </div>
                                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-slate-400 text-xs font-semibold">Belum ada notifikasi.</div>
                                        ) : notifications.map((n) => {
                                            const style = getNotifStyle(n.title);
                                            return (
                                                <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!n.isRead ? 'bg-slate-50/50' : ''}`}>
                                                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${style.bg}`}>
                                                        {style.icon}
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className={`text-sm ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{n.title}</h4>
                                                        </div>
                                                        <p className="text-xs text-slate-500 leading-relaxed mb-1.5 line-clamp-2">{n.description}</p>
                                                        <span className="text-[10px] font-semibold text-slate-400">{formatTimeAgo(n.createdAt)}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} className="w-full p-3 text-xs font-bold text-[#4f46e5] hover:bg-[#EDF2FE] transition-colors border-t border-slate-50 text-center">
                                            Tandai Dibaca Semua
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-10 lg:pt-8 min-h-[calc(100vh-80px)]">
                    {children}
                </main>

                {/* AI CHATBOT KHUSUS SUPER ADMIN */}
                <div className="fixed bottom-6 right-4 sm:right-6 lg:bottom-10 lg:right-10 z-[80] flex flex-col items-end">
                    {isChatOpen && (
                        <div className="bg-white w-[calc(100vw-32px)] sm:w-[340px] lg:w-[380px] rounded-[32px] lg:rounded-[40px] shadow-2xl border border-slate-200 mb-4 overflow-hidden flex flex-col h-[480px] lg:h-[520px] animate-in slide-in-from-bottom-8 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] p-5 flex items-center justify-between text-white shadow-md shrink-0">
                                <div className="flex items-center gap-3">
                                    <Bot size={24} />
                                    <div>
                                        <span className="font-bold text-base tracking-tight block leading-tight">AKSA COPILOT</span>
                                        {!isFastApiConnected && <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1 mt-0.5"><ServerCrash size={10} /> Offline</span>}
                                    </div>
                                </div>
                                <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors active:scale-95"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 lg:p-5 bg-slate-50 space-y-4 text-sm custom-scrollbar flex flex-col">
                                <div className="bg-white border border-slate-200 text-slate-700 p-4 rounded-[20px] rounded-tl-none max-w-[85%] leading-relaxed shadow-sm font-medium self-start">
                                    {isFastApiConnected
                                        ? `Akses Eksekutif terhubung. Ada yang bisa saya analisis hari ini, ${firstName}?`
                                        : `Halo ${firstName}. Sayangnya model AKSA AI tidak terhubung ke server. Hubungi Data Engineer Anda.`}
                                </div>

                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                        <div className={`p-4 max-w-[85%] shadow-sm leading-relaxed font-medium ${msg.role === 'user' ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white rounded-[20px] rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-[20px] rounded-tl-none'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isAiTyping && (
                                    <div className="flex justify-start">
                                        <div className="p-4 bg-white border border-slate-200 text-slate-400 rounded-[20px] rounded-tl-none flex gap-1.5 shadow-sm">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* --- UX: EXPANDABLE QUICK PROMPTS --- */}
                            {isFastApiConnected && (
                                <div className="bg-slate-50/80 border-t border-slate-200 p-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-10 transition-all duration-300">
                                    <div className="flex items-center justify-between ml-1 mb-3">
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><MessagesSquare size={14} /> Prompt Eksekutif:</p>
                                        <button
                                            onClick={() => setShowAllPrompts(!showAllPrompts)}
                                            className="text-[10px] font-bold text-[#4f46e5] flex items-center gap-1 hover:underline active:scale-95"
                                        >
                                            {showAllPrompts ? <><ChevronUp size={12} /> Sembunyikan</> : <><ChevronDown size={12} /> Lihat Semua ({superAdminPrompts.length})</>}
                                        </button>
                                    </div>
                                    <div className={`flex flex-wrap gap-2 transition-all duration-300 overflow-y-auto custom-scrollbar ${showAllPrompts ? 'max-h-40' : 'max-h-20'}`}>
                                        {visiblePrompts.map((prompt, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSendMessage(undefined, prompt)}
                                                className="text-left bg-white hover:bg-[#EDF2FE] text-[#4f46e5] px-4 py-2 rounded-2xl text-[11px] font-bold transition-all border border-slate-200 hover:border-[#6A7BFA] shadow-sm active:scale-95"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="p-3 lg:p-4 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    disabled={!isFastApiConnected || isAiTyping}
                                    placeholder={isFastApiConnected ? "Ketik prompt analisis strategis..." : "Server Offline..."}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-[40px] px-4 lg:px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                                <button type="submit" disabled={!isFastApiConnected || isAiTyping || !chatInput.trim()} className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white p-3 rounded-full hover:shadow-md transition-all disabled:opacity-50 shadow-sm active:scale-95 flex items-center justify-center">
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    )}
                    <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white rounded-full flex items-center justify-center shadow-[0_12px_30px_rgba(79,70,229,0.4)] hover:scale-105 transition-transform duration-300 border-[4px] border-white z-10 active:scale-95">
                        {isChatOpen ? <X size={24} /> : <Bot size={26} />}
                        {!isFastApiConnected && !isChatOpen && <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-amber-400 border-2 border-white rounded-full"></span>}
                    </button>
                </div>
            </div>

            {/* --- TAMBAHKAN MODAL LOGOUT DI SINI --- */}
            {isLogoutModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LogOut size={28} />
                        </div>
                        <h3 className="font-black text-slate-900 text-xl mb-2">Keluar Akun?</h3>
                        <p className="text-sm text-slate-500 mb-8">Sesi Anda akan berakhir dan Anda harus login kembali untuk masuk ke dashboard.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsLogoutModalOpen(false)}
                                className="flex-1 py-3 rounded-full font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-3 rounded-full font-bold text-sm bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95"
                            >
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* -------------------------------------- */}

            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar-on-mobile::-webkit-scrollbar { display: none; }
                .hide-scrollbar-on-mobile { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f1f5f9; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </div>
    );
}