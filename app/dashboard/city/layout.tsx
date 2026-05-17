"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    BarChart2, PieChart, TrendingUp, LogOut, Building2,
    Bot, X, Send, Menu, Settings, AlertTriangle, CheckCircle2, ShieldCheck, Inbox, LayoutDashboard, Bell, BrainCircuit, MapPin
} from 'lucide-react';

export default function CityLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // State Notifications (BARU)
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // State Chatbot & Toast
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'warning' } | null>(null);

    const [currentDate, setCurrentDate] = useState('Memuat...');
    const [currentLocation, setCurrentLocation] = useState('Memuat...');
    const [greeting, setGreeting] = useState('Halo');

    // Data Dummy Notifikasi Kota (BARU)
    const notifications = [
        { id: 1, title: 'Target Harian Tercapai', desc: 'Ramayana Plaza Medan sukses melampaui target hari ini.', time: '30 menit yang lalu', isRead: false, icon: <CheckCircle2 size={16} className="text-emerald-500" />, bg: 'bg-emerald-50' },
        { id: 2, title: 'Alert: Stok Kritis', desc: 'AI mendeteksi stok Sneakers Vans menipis di Sport Station Deli.', time: '2 Jam yang lalu', isRead: false, icon: <AlertTriangle size={16} className="text-amber-500" />, bg: 'bg-amber-50' },
        { id: 3, title: 'Instruksi Provinsi', desc: 'Suntikan dana promo akhir pekan telah disetujui.', time: 'Kemarin', isRead: true, icon: <BrainCircuit size={16} className="text-[#6A7BFA]" />, bg: 'bg-[#EDF2FE]' },
    ];

    useEffect(() => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        setCurrentDate(now.toLocaleDateString('id-ID', options).toUpperCase());

        const hour = now.getHours();
        if (hour >= 5 && hour < 12) setGreeting('Selamat Pagi');
        else if (hour >= 12 && hour < 15) setGreeting('Selamat Siang');
        else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore');
        else setGreeting('Selamat Malam');

        setCurrentLocation('Medan, Sumatera Utara');
    }, []);

    // Handle klik di luar pop-up notifikasi (BARU)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => router.push('/');
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => setIsScrolled(e.currentTarget.scrollTop > 10);

    const showToast = (message: string, type: 'success' | 'warning') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        setChatMessages(prev => [...prev, { role: 'user', text: chatInput }]);
        const input = chatInput.toLowerCase();
        setChatInput('');
        setIsAiTyping(true);

        setTimeout(() => {
            const isAskingOutside = !input.includes('medan') &&
                (input.includes('jakarta') || input.includes('surabaya') || input.includes('jawa'));

            if (isAskingOutside) {
                setChatMessages(prev => [...prev, {
                    role: 'ai', text: "Mohon maaf, otoritas saya terbatas hanya untuk menganalisis data Kota Medan sesuai kredensial Anda."
                }]);
            } else if (input.includes('error')) {
                showToast("Gemma Medan AI sedang sinkronisasi data toko.", "warning");
            } else {
                setChatMessages(prev => [...prev, {
                    role: 'ai', text: "Tren di Medan minggu ini menunjukkan Sneakers Kasual mendominasi 60% penjualan. Toko Ramayana Plaza mencatat kenaikan traffic tertinggi di hari Sabtu."
                }]);
            }
            setIsAiTyping(false);
        }, 1500);
    };

    return (
        <div className="flex h-[100dvh] w-full bg-[#F4F7FE] overflow-hidden font-sans text-slate-600 relative">

            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className={`absolute top-6 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-[40px] shadow-xl flex items-center gap-3 z-[100] animate-in slide-in-from-top-5 duration-300 font-bold border text-sm w-[90%] max-w-sm ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertTriangle size={20} className="shrink-0" />}
                    <p className="leading-tight">{toast.message}</p>
                </div>
            )}

            {/* MODAL KONFIRMASI LOGOUT */}
            {isLogoutModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 flex flex-col items-center text-center border border-slate-100">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
                            <LogOut size={28} className="ml-1" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Konfirmasi Sign Out</h3>
                        <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
                            Apakah Anda yakin ingin keluar dari sistem? Sesi Anda akan diakhiri.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 py-3.5 px-4 bg-slate-50 text-slate-600 font-bold text-sm rounded-[24px] hover:bg-slate-100 transition-colors border border-slate-200 active:scale-95">
                                Batal
                            </button>
                            <button onClick={handleLogout} className="flex-1 py-3.5 px-4 bg-red-500 text-white font-bold text-sm rounded-[24px] hover:bg-red-600 transition-colors shadow-[0_8px_20px_rgba(239,68,68,0.3)] active:scale-95">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] lg:hidden transition-opacity duration-300 ease-in-out" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* SIDEBAR DENGAN ROUNDED PREMIUM */}
            <aside className={`fixed lg:relative top-0 left-0 h-[100dvh] w-[280px] bg-[#ffffff] flex flex-col py-6 px-5 z-[100] rounded-r-[32px] lg:rounded-none lg:rounded-br-[40px] lg:border-r lg:border-slate-100 shadow-[20px_0_40px_rgba(0,0,0,0.1)] lg:shadow-none transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex items-center justify-between mb-8 px-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <img
                            src="/Logo-AksaAnalitika-BgWhite.png"
                            alt="AKSA Analitika"
                            className="h-14 lg:h-16 w-auto object-contain"
                        />
                    </div>
                    <button className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 hover:text-[#6A7BFA] rounded-full transition-all active:scale-90" onClick={() => setIsMobileMenuOpen(false)}>
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-4 shrink-0">Main Menu</div>

                <nav className="flex-1 min-h-0 space-y-1.5 overflow-y-auto custom-scrollbar px-1">
                    {[
                        { href: '/dashboard/city', label: 'Dashboard', icon: <LayoutDashboard size={20} />, exact: true },
                        { href: '/dashboard/city/analysis', label: 'Store Analysis', icon: <PieChart size={20} />, exact: false },
                        { href: '/dashboard/city/forecast', label: 'AI Forecast', icon: <TrendingUp size={20} />, exact: false },
                        { href: '/dashboard/city/inbox', label: 'Command Center', icon: <Inbox size={20} />, exact: false },
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
                </nav>

                <div className="px-2 mt-4 mb-2 shrink-0">
                    <button onClick={() => setIsLogoutModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 text-sm font-bold hover:bg-red-50 hover:text-red-600 rounded-[40px] transition-colors group">
                        <LogOut size={20} className="group-hover:translate-x-1 transition-transform" /> Sign Out
                    </button>
                </div>

                {/* PROFILE WIDGET BOTTOM LINK */}
                <div className="relative px-2 pt-4 border-t border-slate-100 shrink-0">
                    <Link href="/dashboard/city/profile" onClick={() => setIsMobileMenuOpen(false)}
                        className={`w-full flex items-center justify-between p-3 rounded-[24px] transition-all duration-200 group text-left ${pathname.includes('/profile') ? 'bg-[#EDF2FE]' : 'bg-transparent hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-sm border-2 border-white group-hover:scale-105 transition-transform bg-slate-100" />
                            <div className="overflow-hidden">
                                <p className={`text-sm font-bold leading-tight truncate transition-colors group-hover:text-[#4f46e5] ${pathname.includes('/profile') ? 'text-[#4f46e5]' : 'text-slate-900'}`}>Citra Lestari</p>
                                <p className="text-[11px] text-slate-500 font-medium truncate">Manager Medan</p>
                            </div>
                        </div>
                        <Settings size={16} className={`transition-all duration-300 ${pathname.includes('/profile') ? 'text-[#4f46e5] rotate-45' : 'text-slate-400 group-hover:text-[#4f46e5] group-hover:rotate-45'}`} />
                    </Link>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 h-full overflow-y-auto relative custom-scrollbar bg-[#F4F7FE]" onScroll={handleScroll}>

                {/* HEADER DYNAMIC KONSISTEN DENGAN NOTIFIKASI */}
                <header className={`sticky top-0 z-[70] w-full transition-all duration-300 rounded-b-[32px] lg:rounded-b-none lg:rounded-br-[40px] ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]' : 'bg-white/80 backdrop-blur-md border-b border-slate-200/50'}`}>

                    {/* KHUSUS MOBILE HEADER */}
                    <div className="flex lg:hidden items-center justify-between px-4 sm:px-6 h-[72px]">
                        <button className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 shadow-sm text-slate-700 hover:text-[#4f46e5] hover:bg-[#EDF2FE] hover:border-[#EDF2FE] rounded-2xl transition-all active:scale-95" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu size={22} strokeWidth={2.5} />
                        </button>

                        <img
                            src="/Logo-AksaAnalitika-BgWhite.png"
                            alt="AKSA Analitika"
                            className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm"
                        />

                        {/* MOBILE NOTIFICATION & PROFILE */}
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-500 hover:bg-[#EDF2FE] hover:text-[#4f46e5] transition-colors active:scale-95 border border-slate-200 shadow-sm">
                                <Bell size={16} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            </button>
                            <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-slate-50 active:scale-90 transition-all cursor-pointer hidden sm:block">
                                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" alt="Profile" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>

                    {/* KHUSUS DESKTOP HEADER */}
                    <div className="hidden lg:flex items-center justify-between px-10 h-20">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                                {pathname.includes('/profile') ? 'Account Settings' : `${greeting}, Citra! 👋`}
                            </h2>
                            <p className="text-xs font-medium text-slate-500 mt-1">Akses otorisasi tingkat Kota (Medan)</p>
                        </div>
                        <div className="flex items-center gap-6 relative" ref={notifRef}>
                            <div className="text-right border-r border-slate-200 pr-6">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{currentDate}</p>
                                <p className="text-xs font-semibold text-slate-600 flex items-center justify-end gap-1"><MapPin size={12} className="text-[#4f46e5]" /> {currentLocation}</p>
                            </div>

                            {/* TOMBOL LONCENG NOTIFIKASI DESKTOP */}
                            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="w-10 h-10 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-[#4f46e5] hover:bg-slate-50 transition-colors relative">
                                <Bell size={18} />
                                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            </button>

                            {/* POPOVER NOTIFIKASI */}
                            {isNotifOpen && (
                                <div className="absolute right-0 top-[calc(100%+8px)] w-[300px] sm:w-[340px] bg-white rounded-[24px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 z-[100]">
                                    <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                        <span className="font-bold text-slate-800 text-sm">Notifikasi Terkini</span>
                                        <span className="text-[10px] font-bold text-[#4f46e5] bg-[#EDF2FE] px-2 py-1 rounded-full">2 Baru</span>
                                    </div>
                                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                        {notifications.map(n => (
                                            <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!n.isRead ? 'bg-slate-50/50' : ''}`}>
                                                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${n.bg}`}>
                                                    {n.icon}
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className={`text-sm ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{n.title}</h4>
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-relaxed mb-1.5 line-clamp-2">{n.desc}</p>
                                                    <span className="text-[10px] font-semibold text-slate-400">{n.time}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setIsNotifOpen(false)} className="w-full p-3 text-xs font-bold text-[#4f46e5] hover:bg-[#EDF2FE] transition-colors border-t border-slate-50 text-center">
                                        Tutup
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-10 lg:pt-8 min-h-[calc(100vh-80px)]">
                    {children}
                </main>

                {/* AI CHATBOT STORE AI */}
                <div className="fixed bottom-6 right-4 sm:right-6 lg:bottom-10 lg:right-10 z-[80] flex flex-col items-end">
                    {isChatOpen && (
                        <div className="bg-white/95 backdrop-blur-xl w-[calc(100vw-32px)] sm:w-[340px] lg:w-[380px] rounded-[32px] lg:rounded-[40px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] border border-slate-200/50 mb-4 overflow-hidden flex flex-col h-[480px] lg:h-[520px] animate-in slide-in-from-bottom-8 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                            <div className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] p-5 flex items-center justify-between text-white shadow-md relative z-10 shrink-0">
                                <div className="flex items-center gap-3"><Bot size={24} /><span className="font-bold text-base tracking-tight">Gemma Medan AI</span></div>
                                <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors active:scale-90"><X size={20} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 lg:p-5 bg-slate-50/50 space-y-4 text-sm custom-scrollbar relative z-0">
                                <div className="bg-white border border-slate-200 text-slate-700 p-4 rounded-[20px] rounded-tl-none max-w-[85%] leading-relaxed shadow-sm font-medium">Halo Bu Citra! Saya siap menganalisis daya beli dan performa toko di wilayah Anda hari ini.</div>
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                        <div className={`p-4 max-w-[85%] shadow-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white rounded-[20px] rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-[20px] rounded-tl-none'}`}>{msg.text}</div>
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
                            </div>
                            <form onSubmit={handleSendMessage} className="p-3 lg:p-4 bg-white border-t border-slate-100 flex gap-2 relative z-10 shrink-0">
                                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Tanya tren pembeli..." className="flex-1 bg-slate-50 border border-slate-200 rounded-[40px] px-4 lg:px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] text-sm font-medium transition-all" />
                                <button type="submit" disabled={isAiTyping} className="bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white p-3 rounded-full transition-all shadow-md active:scale-90 disabled:opacity-50"><Send size={18} /></button>
                            </form>
                        </div>
                    )}
                    <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white rounded-full flex items-center justify-center shadow-[0_12px_30px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 border-[3px] border-white z-[70]">
                        {isChatOpen ? <X size={24} /> : <Bot size={26} />}
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar-on-mobile::-webkit-scrollbar { display: none; }
                .hide-scrollbar-on-mobile { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
}