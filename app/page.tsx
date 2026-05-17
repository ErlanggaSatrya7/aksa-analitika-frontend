"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, XCircle, Eye, EyeOff, ShieldCheck, CheckSquare } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [toast, setToast] = useState<{ type: 'error', message: string } | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setToast(null);

    let isValid = true;

    if (!email) {
      setEmailError('Email wajib diisi.');
      isValid = false;
    } else if (!email.includes('@') || !email.includes('.')) {
      setEmailError('Format email tidak valid.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Kata sandi wajib diisi.');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);

    setTimeout(() => {
      let destination = '/dashboard/admin';
      let role = 'super_admin';

      const emailLower = email.toLowerCase();
      if (emailLower.includes('store')) {
        destination = '/dashboard/store';
        role = 'store_mgr';
      } else if (emailLower.includes('city')) {
        destination = '/dashboard/city';
        role = 'city_mgr';
      } else if (emailLower.includes('regional')) {
        destination = '/dashboard/regional';
        role = 'regional_mgr';
      } else if (emailLower.includes('data')) {
        destination = '/dashboard/data-engineer';
        role = 'data_engineer';
      }

      document.cookie = `aksa_token=dummy_jwt_token_${role}; path=/; max-age=3600`;

      setTimeout(() => {
        window.location.href = destination;
      }, 1000);
    }, 1500);
  };

  return (
    <main className="h-[100dvh] w-full flex items-center justify-center bg-[#EDF2FE] p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-12px); } 100% { transform: translateY(0px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes entrance { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-entrance { animation: entrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* BACKGROUND DEKORASI */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-white/40 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-[#D2DCFC] rounded-full blur-[100px]"></div>
      </div>

      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-top-5 fade-in duration-300 font-semibold text-sm border bg-red-50 text-red-600 border-red-200 w-[90%] max-w-sm">
          <XCircle size={20} className="shrink-0" />
          <p className="leading-tight">{toast.message}</p>
        </div>
      )}

      <div className="animate-entrance opacity-0 w-full max-w-[1000px] max-h-[95vh] mx-auto bg-white rounded-[28px] sm:rounded-[32px] lg:rounded-[40px] shadow-[0_24px_60px_-15px_rgba(79,70,229,0.15)] flex flex-col lg:flex-row overflow-hidden relative z-10">

        {/* KIRI: AREA ILUSTRASI (UPDATE: Gradient Background) */}
        <div className="hidden lg:flex flex-[1.15] bg-gradient-to-br from-[#6A7BFA] to-[#4f46e5] relative items-start p-8 lg:p-10 overflow-hidden flex-col h-full">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute -top-20 -left-20 w-64 h-64 border-[40px] border-white/20 rounded-full"></div>
            <div className="absolute bottom-10 -right-20 w-80 h-80 border-[40px] border-white/10 rounded-full"></div>
          </div>

          <div className="relative z-10 flex flex-col w-full h-full min-h-0">
            {/* LOGO DESKTOP */}
            <div className="flex items-center shrink-0 cursor-default mb-4">
              <img src="/Logo-AksaAnalitika-BgBlue.png" alt="AKSA Analitika Logo" className="h-12 lg:h-16 w-auto object-contain mix-blend-screen" />
            </div>

            <div className="mt-4 lg:mt-5 shrink-0">
              <h2 className="font-heading text-[32px] lg:text-[38px] leading-[1.2] font-bold text-white mb-3 drop-shadow-sm">Tingkatkan omzet<br />hari ini!</h2>
              <p className="text-white/90 text-[14px] leading-relaxed max-w-sm">Pantau aktivitas penjualan harian, analisa tren toko, dan wujudkan target cabang bersama.</p>
            </div>

            <div className="w-full flex-1 flex items-end justify-center relative mt-6 animate-float min-h-0">
              <img src="/ilustrasi-login-NoBg-Fix.png" alt="Illustration" className="w-[85%] max-h-full object-contain drop-shadow-2xl" />
            </div>
          </div>
        </div>

        {/* KANAN: FORM LOGIN PURE */}
        <div className="flex-1 py-8 px-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white h-full overflow-y-auto no-scrollbar relative">
          <div className="max-w-[360px] w-full mx-auto">

            {/* LOGO MOBILE */}
            <div className="flex lg:hidden items-center justify-center mb-2">
              <img src="/Logo-AksaAnalitika-BgWhite.png" alt="AKSA Analitika Logo" className="h-14 sm:h-16 w-auto object-contain" />
            </div>

            {/* TEKS SELAMAT DATANG */}
            <div className="mb-8 text-center lg:text-left">
              <h1 className="font-heading text-[26px] sm:text-[28px] lg:text-[32px] font-bold text-slate-900 mb-1 lg:mb-2 tracking-tight">Selamat Datang!</h1>
              <p className="text-[13px] lg:text-[14px] text-slate-500 leading-relaxed px-2 lg:px-0">
                Akses dashboard untuk memantau performa dan penuhi target hari ini.
              </p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4 lg:gap-5">

              {/* INPUT EMAIL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700 ml-1">Email Perusahaan</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                  placeholder="anda@aksa.com"
                  className={`w-full px-5 py-4 bg-slate-50 border ${emailError ? 'border-red-400 focus:ring-red-400/20' : 'border-slate-200 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]'} rounded-[20px] focus:outline-none focus:ring-4 transition-all text-slate-800 text-[14px] placeholder:text-slate-400`}
                />
                {emailError && <span className="text-[12px] text-red-500 font-medium ml-1">{emailError}</span>}
              </div>

              {/* INPUT PASSWORD */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700 ml-1">Kata Sandi</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                    placeholder="••••••••••••"
                    className={`w-full pl-5 pr-12 py-4 bg-slate-50 border ${passwordError ? 'border-red-400 focus:ring-red-400/20' : 'border-slate-200 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]'} rounded-[20px] focus:outline-none focus:ring-4 transition-all text-slate-800 text-[14px] placeholder:text-slate-400 tracking-wider`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4f46e5] transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordError && <span className="text-[12px] text-red-500 font-medium ml-1">{passwordError}</span>}
              </div>

              <div className="flex items-center justify-between px-1 mt-[-4px]">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="sr-only" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                    <div className={`w-4 h-4 border rounded-[4px] transition-all flex items-center justify-center ${rememberMe ? 'bg-[#4f46e5] border-[#4f46e5]' : 'border-slate-300 group-hover:border-[#4f46e5]'}`}>
                      {rememberMe && <CheckSquare size={12} className="text-white absolute" />}
                    </div>
                  </div>
                  <span className="text-[13px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Ingat saya</span>
                </label>
                <span className="text-[13px] font-bold text-[#6A7BFA] hover:text-[#4f46e5] cursor-pointer transition-all">Lupa sandi?</span>
              </div>

              {/* UPDATE: Tombol Sign In menggunakan Gradasi Premium */}
              <button type="submit" disabled={isLoading} className="w-full mt-2 bg-gradient-to-r from-[#6A7BFA] to-[#4f46e5] text-white font-bold text-sm py-4 rounded-[20px] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_25px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? <><Loader2 size={18} className="animate-spin" /> Sedang memproses...</> : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-4 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                <ShieldCheck size={14} /> Keamanan Data Terenkripsi
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}