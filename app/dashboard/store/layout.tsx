"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    LayoutDashboard, TrendingUp, LogOut, Store,
    Bot, X, Send, Menu, Settings, AlertTriangle, CheckCircle2, PieChart, Inbox, Bell, MapPin, BrainCircuit, ServerOff, ShieldCheck, Activity, Database, Loader2, Info, ChevronDown, ChevronUp, MessagesSquare, ServerCrash
} from 'lucide-react';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const { data: session } = useSession();
    const user = session?.user as any;
    const userName = user?.name || 'Store Supervisor';
    const firstName = userName.split(' ')[0];
    const userCity = user?.assignedCity || 'Kota Anda';
    const userState = user?.assignedState || 'Provinsi Anda';
    const avatarSeed = user?.email || 'store-spv';
    const retailerId = user?.retailerId || '';

    const [realStoreName, setRealStoreName] = useState('Memuat toko...');

    useEffect(() => {
        if (user?.email) {
            fetch(`/api/user/profile?email=${user.email}`)
                .then(res => res.json())
                .then(data => {
                    if (data?.retailer?.name) setRealStoreName(data.retailer.name);
                    else setRealStoreName('Toko Belum Disetel');
                })
                .catch(err => console.error("Gagal get toko:", err));
        }
    }, [user?.email]);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
    const [systemStatus, setSystemStatus] = useState({ fastApi: 'checking', supabase: 'checking' });

    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [showAllPrompts, setShowAllPrompts] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'warning' } | null>(null);

    const [currentDate, setCurrentDate] = useState('Memuat...');
    const [greeting, setGreeting] = useState('Halo');
    const [notifications, setNotifications] = useState<any[]>([]);

    const storePrompts = [
        `Berapa estimasi pencapaian target toko ${realStoreName} bulan ini?`,
        `Produk apa yang paling cepat habis di toko saya?`,
        `Saran AI untuk meningkatkan margin profit hari ini?`,
        `Apakah ada anomali penjualan yang harus saya perhatikan?`
    ];

    useEffect(() => {
        if (!user?.email) return;
        const fetchNotifs = async () => {
            try {
                const res = await fetch(`/api/city/notifications?email=${encodeURIComponent(user.email)}`);
                if (res.ok) setNotifications(await res.json());
            } catch (error) { }
        };
        fetchNotifs();
    }, [user?.email]);

    useEffect(() => {
        if (!retailerId) return;
        const runSystemDiagnostic = async () => {
            setIsSystemModalOpen(true);
            const checkInterval = setInterval(async () => {
                let apiState = 'offline';
                let dbState = 'offline';
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                    const resApi = await fetch(`${apiUrl}/api/health`, { cache: 'no-store' });
                    if (resApi.ok) apiState = 'online';
                } catch (error) { apiState = 'offline'; }

                try {
                    const resDb = await fetch(`/api/store/dashboard?retailerId=${retailerId}`, { cache: 'no-store' });
                    if (resDb.ok) dbState = 'online';
                } catch (error) { dbState = 'offline'; }

                setSystemStatus({ fastApi: apiState, supabase: dbState });

                if (apiState === 'online' && dbState === 'online') {
                    clearInterval(checkInterval);
                    setTimeout(() => setIsSystemModalOpen(false), 1500);
                }
            }, 3000);
            return () => clearInterval(checkInterval);
        };
        runSystemDiagnostic();
    }, [retailerId]);

    const getNotifStyle = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('alert') || t.includes('kritis') || t.includes('tolak')) return { icon: <AlertTriangle size={16} className="text-amber-500" />, bg: 'bg-amber-50' };
        if (t.includes('target') || t.includes('sukses') || t.includes('setuju')) return { icon: <CheckCircle2 size={16} className="text-emerald-500" />, bg: 'bg-emerald-50' };
        return { icon: <BrainCircuit size={16} className="text-[#6A7BFA]" />, bg: 'bg-[#EDF2FE]' };
    };

    const formatNotifTime = (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        setCurrentDate(now.toLocaleDateString('id-ID', options).toUpperCase());
        const hour = now.getHours();
        if (hour >= 5 && hour < 12) setGreeting('Selamat Pagi');
        else if (hour >= 12 && hour < 15) setGreeting('Selamat Siang');
        else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore');
        else setGreeting('Selamat Malam');
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, isAiTyping, isChatOpen, showAllPrompts]);

    const handleLogout = () => signOut({ callbackUrl: '/' });
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => setIsScrolled(e.currentTarget.scrollTop > 10);
    const showToast = (message: string, type: 'success' | 'warning') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

    const handleSendMessage = async (e?: React.FormEvent, directMessage?: string) => {
        if (e) e.preventDefault();
        const messageToSend = directMessage || chatInput.trim();
        if (!messageToSend) return;

        if (systemStatus.fastApi !== 'online') {
            showToast("Server AI Offline: Tidak dapat memproses percakapan.", "warning");
            return;
        }

        setChatMessages(prev => [...prev, { role: 'user', text: messageToSend }]);
        setChatInput('');
        setIsAiTyping(true);
        setShowAllPrompts(false);

        const hiddenContext = `\n\n[INSTRUKSI SISTEM: Anda adalah AKSA COPILOT. Jawab berdasarkan konteks bahwa ini adalah admin cabang toko ${realStoreName} di kota ${userCity}, Provinsi ${userState}. Berikan insight relevan.]`;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${apiUrl}/api/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageToSend + hiddenContext,
                    user_context: `Admin Toko ${realStoreName}`,
                    user_role: 'RETAILER_ADMIN',
                    assigned_state: userCity
                })
            });

            if (response.ok) {
                const data = await response.json();
                const sanitizedReply = data.reply.replace(/\*\*/g, '').replace(/#/g, '').trim();
                setChatMessages(prev => [...prev, { role: 'ai', text: sanitizedReply }]);
            } else {
                setChatMessages(prev => [...prev, { role: 'ai', text: "Maaf, terjadi gangguan pada server AI." }]);
            }
        } catch (error) {
            setChatMessages(prev => [...prev, { role: 'ai', text: "Koneksi terputus. Pastikan server backend AI berjalan." }]);
        } finally {
            setIsAiTyping(false);
        }
    };

    const isSystemOnline = systemStatus.fastApi === 'online' && systemStatus.supabase === 'online';
    const isSystemChecking = systemStatus.fastApi === 'checking' || systemStatus.supabase === 'checking';
    const visiblePrompts = showAllPrompts ? storePrompts : storePrompts.slice(0, 2);

    const menuItems = [
        { href: '/dashboard/store', label: 'Dashboard Toko', icon: <LayoutDashboard size={20} />, exact: true },
        { href: '/dashboard/store/sales', label: 'Analisis Penjualan', icon: <PieChart size={20} />, exact: false },
        { href: '/dashboard/store/forecast', label: 'AI Lokal Forecast', icon: <TrendingUp size={20} />, exact: false },
        { href: '/dashboard/store/inbox', label: 'Status Logistik', icon: <Inbox size={20} />, exact: false },
    ];

    return (
        <div className="flex h-[100dvh] w-full bg-[#F4F7FE] overflow-hidden font-sans text-slate-600 relative">

            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-[40px] shadow-xl flex items-center gap-3 z-[150] animate-in slide-in-from-top-5 duration-300 font-bold border text-sm w-[90%] max-w-sm ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertTriangle size={20} className="shrink-0" />}
                    <p className="leading-tight">{toast.message}</p>
                </div>
            )}

            {isSystemModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[130] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 flex flex-col items-center border border-slate-100">
                        <div className="w-20 h-20 bg-indigo-50 text-[#4f46e5] rounded-full flex items-center justify-center mb-6 shadow-sm border border-indigo-100 relative">
                            {isSystemChecking && <div className="absolute inset-0 rounded-full border-4 border-[#4f46e5]/30 border-t-[#4f46e5] animate-spin"></div>}
                            <ShieldCheck size={36} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight text-center">Diagnostik Toko</h3>
                        <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed text-center">
                            Memeriksa konektivitas infrastruktur untuk cabang <strong>{realStoreName}</strong>.
                        </p>

                        <div className="w-full space-y-4 mb-8">
                            <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <Activity size={20} className="text-[#4f46e5]" />
                                    <span className="font-bold text-slate-700 text-sm">Gemma AI Engine</span>
                                </div>
                                {systemStatus.fastApi === 'checking' ? (
                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Memeriksa</span>
                                ) : systemStatus.fastApi === 'online' ? (
                                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full flex items-center gap-1.5"><CheckCircle2 size={12} /> Terhubung</span>
                                ) : (
                                    <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1.5 rounded-full flex items-center gap-1.5"><ServerCrash size={12} /> Terputus</span>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <Database size={20} className="text-[#4f46e5]" />
                                    <span className="font-bold text-slate-700 text-sm">Pusat Data Logistik</span>
                                </div>
                                {systemStatus.supabase === 'checking' ? (
                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Memeriksa</span>
                                ) : systemStatus.supabase === 'online' ? (
                                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full flex items-center gap-1.5"><CheckCircle2 size={12} /> Terhubung</span>
                                ) : (
                                    <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1.5 rounded-full flex items-center gap-1.5"><ServerCrash size={12} /> Terputus</span>
                                )}
                            </div>
                        </div>

                        <button
                            disabled={!isSystemOnline}
                            onClick={() => setIsSystemModalOpen(false)}
                            className={`w-full py-4 px-4 font-bold text-sm rounded-full transition-all shadow-sm flex items-center justify-center gap-2 ${isSystemOnline ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white hover:shadow-lg active:scale-95 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
                        >
                            {isSystemChecking ? <><Loader2 size={16} className="animate-spin" /> Sedang Memverifikasi</> : isSystemOnline ? <><CheckCircle2 size={18} /> Masuk Dashboard</> : <><Info size={18} /> Menunggu Koneksi</>}
                        </button>
                    </div>
                </div>
            )}

            {isLogoutModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-[40px] w-full max-w-sm p-8 shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
                            <LogOut size={32} className="ml-1" />
                        </div>
                        <h3 className="font-black text-slate-900 text-2xl mb-2 tracking-tight">Keluar Akun?</h3>
                        <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">Sesi toko Anda akan berakhir dan Anda harus login kembali.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 py-3.5 rounded-full font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all active:scale-95 shadow-sm">Batal</button>
                            <button onClick={handleLogout} className="flex-1 py-3.5 rounded-full font-bold text-sm bg-red-500 text-white hover:bg-red-600 shadow-[0_8px_20px_rgba(239,68,68,0.3)] transition-all active:scale-95 border border-red-500">Ya, Keluar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] lg:hidden transition-opacity duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)} />

            <aside className={`fixed lg:relative top-0 left-0 h-[100dvh] w-[280px] bg-[#ffffff] flex flex-col py-6 px-5 z-[100] rounded-r-[32px] lg:rounded-none lg:rounded-br-[40px] lg:border-r lg:border-slate-100 shadow-[20px_0_40px_rgba(0,0,0,0.1)] lg:shadow-none transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex items-center justify-between mb-8 px-3 shrink-0">
                    <img src="/Logo-AksaAnalitika-BgWhite.png" alt="AKSA Analitika" className="h-14 lg:h-16 w-auto object-contain" />
                    <button className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 hover:text-[#6A7BFA] rounded-full transition-all active:scale-90" onClick={() => setIsMobileMenuOpen(false)}>
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-4 shrink-0">Menu Retailer</div>

                <nav className="flex-1 min-h-0 space-y-1.5 overflow-y-auto custom-scrollbar px-1">
                    {menuItems.map((item) => {
                        const isActive = item.exact ? pathname === item.href : pathname.includes(item.href);
                        return (
                            <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[40px] text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white shadow-md shadow-[#4f46e5]/30' : 'text-slate-500 hover:bg-[#EDF2FE] hover:text-[#4f46e5]'}`}>
                                <div className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#4f46e5] transition-colors'}>{item.icon}</div>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-2 mt-4 mb-2 shrink-0">
                    <button onClick={() => setIsLogoutModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 text-sm font-bold hover:bg-red-50 hover:text-red-600 rounded-[40px] transition-colors group">
                        <LogOut size={20} className="group-hover:translate-x-1 transition-transform" /> Sign Out
                    </button>
                </div>

                <div className="relative px-2 pt-4 border-t border-slate-100 shrink-0">
                    <Link href="/dashboard/store/profile" onClick={() => setIsMobileMenuOpen(false)}
                        className={`w-full flex items-center justify-between p-3 rounded-[24px] transition-all duration-200 group text-left ${pathname.includes('/profile') ? 'bg-[#EDF2FE]' : 'bg-transparent hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}`} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-sm border-2 border-white group-hover:scale-105 transition-transform bg-slate-100" />
                            <div className="overflow-hidden">
                                <p className={`text-sm font-bold leading-tight truncate transition-colors group-hover:text-[#4f46e5] ${pathname.includes('/profile') ? 'text-[#4f46e5]' : 'text-slate-900'}`}>{firstName}</p>
                                <p className="text-[11px] text-slate-500 font-medium truncate">Admin Toko</p>
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
                        <img src="/Logo-AksaAnalitika-BgWhite.png" alt="AKSA Analitika" className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" />
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-500 hover:bg-[#EDF2FE] hover:text-[#4f46e5] transition-colors active:scale-95 border border-slate-200 shadow-sm">
                                <Bell size={16} />
                                {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                            </button>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center justify-between px-10 h-20">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">{pathname.includes('/profile') ? 'Pengaturan Akun' : `${greeting}, ${firstName}!`}</h2>
                            <p className="text-xs font-medium text-slate-500 mt-1">{pathname.includes('/profile') ? 'Kelola akun Anda' : `Otorisasi: Admin Cabang • ${realStoreName}`}</p>
                        </div>

                        <div className="flex items-center gap-6 relative" ref={notifRef}>
                            <div className="text-right border-r border-slate-200 pr-6">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{currentDate}</p>
                                <p className="text-xs font-semibold text-slate-600 flex items-center justify-end gap-1"><MapPin size={12} className="text-[#4f46e5]" /> {userCity}, {userState}</p>
                            </div>

                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all duration-300 ${isSystemChecking ? 'bg-amber-50 border border-amber-100 text-amber-700' : isSystemOnline ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-red-50 border border-red-100 text-red-700'}`}>
                                {isSystemChecking ? <Loader2 size={14} className="animate-spin" /> : isSystemOnline ? <CheckCircle2 size={14} /> : <ServerOff size={14} />}
                                {isSystemChecking ? 'Memeriksa Sistem' : isSystemOnline ? 'Sistem Terhubung' : 'Koneksi Terputus'}
                            </div>

                            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="w-10 h-10 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-[#4f46e5] hover:bg-slate-50 transition-colors relative">
                                <Bell size={18} />
                                {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                            </button>

                            {isNotifOpen && (
                                <div className="absolute right-0 top-[calc(100%+8px)] w-[300px] sm:w-[340px] bg-white rounded-[24px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 z-[100]">
                                    <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                        <span className="font-bold text-slate-800 text-sm">Notifikasi Terkini</span>
                                        {unreadCount > 0 && <span className="text-[10px] font-bold text-[#4f46e5] bg-[#EDF2FE] px-2 py-1 rounded-full">{unreadCount} Baru</span>}
                                    </div>
                                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-slate-400 text-xs font-semibold">Belum ada notifikasi.</div>
                                        ) : notifications.map(n => {
                                            const style = getNotifStyle(n.title);
                                            return (
                                                <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!n.isRead ? 'bg-slate-50/50' : ''}`}>
                                                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${style.bg}`}>{style.icon}</div>
                                                    <div>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className={`text-sm ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{n.title}</h4>
                                                        </div>
                                                        <p className="text-xs text-slate-500 leading-relaxed mb-1.5 line-clamp-2">{n.description}</p>
                                                        <span className="text-[10px] font-semibold text-slate-400">{formatNotifTime(n.createdAt)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button onClick={() => setIsNotifOpen(false)} className="w-full p-3 text-xs font-bold text-[#4f46e5] hover:bg-[#EDF2FE] transition-colors border-t border-slate-50 text-center">Tutup Peringatan</button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-10 lg:pt-8 min-h-[calc(100vh-80px)]">
                    {children}
                </main>

                <div className="fixed bottom-6 right-4 sm:right-6 lg:bottom-8 lg:right-8 z-[80] flex flex-col items-end">
                    {isChatOpen && (
                        <div className="bg-white/95 backdrop-blur-xl w-[calc(100vw-32px)] sm:w-[320px] lg:w-[350px] rounded-[32px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] border border-slate-200/50 mb-4 overflow-hidden flex flex-col h-[450px] lg:h-[480px] animate-in slide-in-from-bottom-8 duration-300">
                            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] p-4 flex items-center justify-between text-white shadow-md relative z-10 shrink-0">
                                <div className="flex items-center gap-3">
                                    <Bot size={22} />
                                    <div>
                                        <span className="font-bold text-[15px] tracking-tight block leading-tight">AKSA COPILOT</span>
                                        {!isSystemOnline && <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1 mt-0.5"><ServerOff size={10} /> Offline</span>}
                                    </div>
                                </div>
                                <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors active:scale-90"><X size={18} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-4 text-sm custom-scrollbar relative z-0">
                                <div className="bg-white border border-slate-200 text-slate-700 p-3.5 rounded-[20px] rounded-tl-none max-w-[85%] leading-relaxed shadow-sm font-medium text-[13px]">
                                    {isSystemOnline
                                        ? `Halo Pak ${firstName}! Data penjualan harian sudah sinkron. Ada kategori produk yang ingin dianalisis hari ini?`
                                        : "Halo! Saat ini model AI terputus dari server. Fitur percakapan interaktif sedang dinonaktifkan."
                                    }
                                </div>

                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                        <div className={`p-3.5 max-w-[85%] shadow-sm font-medium leading-relaxed text-[13px] ${msg.role === 'user' ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white rounded-[20px] rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-[20px] rounded-tl-none'}`}>{msg.text}</div>
                                    </div>
                                ))}
                                {isAiTyping && (
                                    <div className="flex justify-start">
                                        <div className="p-3.5 bg-white border border-slate-200 text-slate-400 rounded-[20px] rounded-tl-none flex gap-1.5 shadow-sm">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {isSystemOnline && (
                                <div className="bg-slate-50 border-t border-slate-200 p-3 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-10 transition-all duration-300">
                                    <div className="flex items-center justify-between ml-1 mb-2.5">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><MessagesSquare size={12} /> Prompt Toko:</p>
                                        <button
                                            onClick={() => setShowAllPrompts(!showAllPrompts)}
                                            className="text-[10px] font-bold text-[#4f46e5] flex items-center gap-1 hover:underline active:scale-95"
                                        >
                                            {showAllPrompts ? <><ChevronUp size={12} /> Sembunyikan</> : <><ChevronDown size={12} /> Lihat Semua ({storePrompts.length})</>}
                                        </button>
                                    </div>
                                    <div className={`flex flex-wrap gap-1.5 transition-all duration-300 overflow-y-auto custom-scrollbar ${showAllPrompts ? 'max-h-32' : 'max-h-[60px]'}`}>
                                        {visiblePrompts.map((prompt, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSendMessage(undefined, prompt)}
                                                className="text-left bg-white hover:bg-[#EDF2FE] text-[#4f46e5] px-3 py-2 rounded-full text-[11px] font-bold transition-all border border-slate-200 hover:border-[#6A7BFA] shadow-sm active:scale-95 leading-tight"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 relative z-10 shrink-0">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    disabled={!isSystemOnline || isAiTyping}
                                    placeholder={isSystemOnline ? "Tanya strategi toko..." : "Server Offline..."}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-[30px] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] text-xs font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                                <button type="submit" disabled={!isSystemOnline || isAiTyping || !chatInput.trim()} className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white p-2.5 rounded-full transition-all shadow-md active:scale-90 disabled:opacity-50 flex items-center justify-center">
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    )}
                    <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-14 h-14 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white rounded-full flex items-center justify-center shadow-[0_12px_30px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 border-[3px] border-white z-[70] relative">
                        {isChatOpen ? <X size={24} /> : <Bot size={26} />}
                        {!isSystemOnline && !isChatOpen && <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-amber-400 border-2 border-white rounded-full"></span>}
                    </button>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar-on-mobile::-webkit-scrollbar { display: none; } .hide-scrollbar-on-mobile { -ms-overflow-style: none; scrollbar-width: none; } .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f1f5f9; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }` }} />
        </div>
    );
}