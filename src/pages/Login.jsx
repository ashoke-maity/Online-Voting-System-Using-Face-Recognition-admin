import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlowingCard from '../components/GlowingCard';

function Login() {
  const navigate = useNavigate();
  const [epicNumber, setEpicNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaText, setCaptchaText] = useState('E3R8Y');
  const [captchaInput, setCaptchaInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [systemLogs, setSystemLogs] = useState([]);
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Generate a random captcha code
  const refreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(code);
  };

  useEffect(() => {
    refreshCaptcha();
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Boot logs simulation
  useEffect(() => {
    const bootLogs = [
      'Establishing secure administrative connection with ECI central registry...',
      'Validating local presiding officer certificate credentials...',
      'Presiding Authority authorized registry access verified... Workspace Ready.'
    ];

    bootLogs.forEach((msg, idx) => {
      setTimeout(() => addLog(msg, 'info'), idx * 350);
    });
  }, []);

  const addLog = (msg, level = 'info') => {
    setSystemLogs(prev => [
      ...prev,
      {
        id: Math.random(),
        time: new Date().toLocaleTimeString(),
        msg,
        level
      }
    ]);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (captchaInput !== captchaText) {
      setLoginError('Invalid Captcha Code. Please try again.');
      refreshCaptcha();
      return;
    }

    if (epicNumber.trim() === '' || password.trim() === '') {
      setLoginError('Please enter valid EPIC ID and secure passcode.');
      return;
    }

    try {
      addLog(`Initiating secure Presiding Officer authentication for ${epicNumber}...`, 'info');
      const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epicNumber, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || 'Authentication Failed');
        addLog(`Access Denied: ${data.error || 'Invalid officer credentials'}`, 'error');
        refreshCaptcha();
        return;
      }

      addLog(`Authorization validated successfully. Admin session active.`, 'success');
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      console.error(err);
      setLoginError('Failed to connect to the ECI Central Registry server.');
      addLog('Connection error: ECI Central Registry server unreachable.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      
      {/* 1. TOP OFFICIAL ACCESSIBILITY BAR */}
      <div className="bg-slate-100 border-b border-slate-200 py-1.5 px-4 text-[10px] font-bold text-slate-550 uppercase tracking-wider flex flex-col sm:flex-row justify-between items-center gap-1.5 z-10">
        <div>भारत निर्वाचन आयोग | ELECTION COMMISSION OF INDIA</div>
        <div className="flex items-center gap-4">
          <span className="text-slate-450 uppercase font-mono">PRESIDING DESK PORTAL v1.0</span>
          <div className="flex items-center gap-2 border-l border-slate-300 pl-4 select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[8.5px] font-black text-emerald-600">SECURED CONSOLE LINK</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN BRANDING HEADER */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 sm:px-8 shadow-sm flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex items-center justify-center bg-white p-0.5 rounded-full border border-slate-200 shadow-sm">
            <svg className="h-10 w-10" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="54" stroke="#1B3B6F" strokeWidth="4" />
              <circle cx="60" cy="60" r="46" stroke="#F58220" strokeWidth="3" />
              <circle cx="60" cy="60" r="38" stroke="#0B6A3A" strokeWidth="3" />
              <circle cx="60" cy="60" r="16" stroke="#1B3B6F" strokeWidth="2.5" />
              <circle cx="60" cy="60" r="3" fill="#1B3B6F" />
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 15 * Math.PI) / 180;
                const x2 = 60 + 16 * Math.cos(angle);
                const y2 = 60 + 16 * Math.sin(angle);
                return <line key={i} x1="60" y1="60" x2={x2} y2={y2} stroke="#1B3B6F" strokeWidth="1" />;
              })}
              <path d="M 38 60 A 22 22 0 0 1 82 60" stroke="#F58220" strokeWidth="3" opacity="0.3" />
              <path d="M 38 60 A 22 22 0 0 0 82 60" stroke="#0B6A3A" strokeWidth="3" opacity="0.3" />
            </svg>
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-black text-[#1B3B6F] tracking-wide uppercase leading-tight">
              भारत निर्वाचन आयोग / ELECTION COMMISSION OF INDIA
            </h1>
            <p className="text-[9px] text-[#F58220] font-bold tracking-widest uppercase">
              Presiding Officers Hub / पीठासीन अधिकारी कंसोल
            </p>
          </div>
        </div>
      </header>

      {/* 3. BODY LAYOUT */}
      <main className="flex-grow relative flex items-center" style={{ background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 60%, #020617 100%)' }}>
        <div className="relative z-10 mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 items-center min-h-[500px] py-12 px-4 sm:px-8 gap-8">
          
          {/* LEFT SIDE: PRESTIGIOUS GOLD SEAL */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center text-center text-slate-100 py-6">
            <div className="relative select-none h-44 w-44 mb-6">
              <svg viewBox="0 0 220 220" width="220" height="220" className="absolute inset-0">
                <defs>
                  <path id="circleTextHi" d="M 110,110 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
                  <path id="circleTextEn" d="M 110,110 m -65,0 a 65,65 0 1,0 130,0 a 65,65 0 1,0 -130,0" />
                </defs>
                <text fontSize="9.5" fill="#f59e0b" fontWeight="600" fontFamily="sans-serif" letterSpacing="2">
                  <textPath href="#circleTextHi" startOffset="3%">भारत निर्वाचन आयोग</textPath>
                </text>
                <text fontSize="8.5" fill="#f59e0b" fontWeight="600" fontFamily="sans-serif" letterSpacing="1.8">
                  <textPath href="#circleTextEn" startOffset="5%">Election Commission of India</textPath>
                </text>
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 160 145" width="120" height="110" className="opacity-80">
                  <circle cx="55" cy="22" r="14" fill="#d97706" />
                  <rect x="38" y="38" width="34" height="28" rx="6" fill="#d97706" />
                  <circle cx="105" cy="16" r="18" fill="#b45309" />
                  <rect x="85" y="36" width="40" height="32" rx="8" fill="#b45309" />
                  <rect x="18" y="68" width="124" height="72" rx="4" fill="#78350f" />
                  <rect x="18" y="68" width="124" height="24" rx="0" fill="#f59e0b" />
                  <rect x="18" y="92" width="124" height="24" fill="#ffffff" />
                  <rect x="18" y="116" width="124" height="24" rx="0" fill="#047857" />
                  <rect x="58" y="63" width="44" height="8" rx="3" fill="#451a03" />
                  <rect x="18" y="68" width="124" height="72" rx="4" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                </svg>
              </div>
            </div>
            <h2 className="text-base font-black tracking-widest text-amber-400 uppercase font-sans">
              PRESIDING OFFICE ADMINISTRATION PANEL
            </h2>
            <p className="mt-2 text-[10.5px] text-slate-400 font-medium max-w-sm leading-relaxed">
              Authorized ECI District Commissioners, Returning Officers, and Presiding Staff portal. Credentials audits are logged for statutory compliance.
            </p>
          </div>

          {/* RIGHT SIDE: OFFICIAL LOGIN CARD */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl border-t-4 border-t-amber-500 flex-grow flex flex-col justify-between">
              
              <div>
                <div className="text-center mb-6 border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-amber-400 tracking-wider uppercase font-mono">AUTHORIZED OFFICER ENTRY</h3>
                  <p className="text-[9.5px] text-slate-450 font-semibold uppercase mt-0.5 tracking-wider font-sans">statutory authentication gate</p>
                </div>

                {loginError && (
                  <div className="mb-4 rounded border border-rose-500/20 bg-rose-500/5 p-3 text-[10.5px] text-rose-450 leading-snug font-semibold text-center font-mono">
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  
                  {/* EPIC ID Field */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-450 tracking-wider font-mono">Officer EPIC ID / पहचान संख्या</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. ADMIN-ECI-1"
                      value={epicNumber}
                      onChange={(e) => setEpicNumber(e.target.value)}
                      className="rounded border border-slate-850 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none transition-colors font-mono"
                    />
                  </div>

                  {/* Passcode Field */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-450 tracking-wider font-mono">Presiding Passcode / पासवर्ड</label>
                    <div className="relative">
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter Secure Passcode"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded border border-slate-850 bg-slate-950 pl-3.5 pr-10 py-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none transition-colors font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                        title={showPassword ? "Hide Passcode" : "Show Passcode"}
                      >
                        {showPassword ? (
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"></path>
                          </svg>
                        ) : (
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Captcha Field */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-450 tracking-wider font-mono">Captcha verification / कैप्चा</label>
                    <div className="flex gap-2 items-center">
                      <div className="h-10 w-28 bg-white/10 rounded border border-slate-800 flex items-center justify-center font-mono font-black tracking-widest text-amber-400 text-lg select-none relative overflow-hidden shadow-inner">
                        {captchaText}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
                      </div>
                      
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        className="rounded border border-slate-800 bg-slate-950 p-2.5 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                        title="Generate New Captcha"
                      >
                        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                      </button>
                      
                      <input
                        required
                        type="text"
                        placeholder="Enter code"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        className="flex-grow rounded border border-slate-850 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-sm transition-all cursor-pointer text-center active:scale-98"
                  >
                    Authenticate officer desk
                  </button>

                </form>
              </div>

              {/* Developer Bypass Tag */}
              <div className="mt-4 pt-3 border-t border-slate-850 text-center font-mono text-[8px] text-slate-500 uppercase tracking-widest leading-normal">
                Credentials: EPIC ID [ADMIN-ECI-1] passcode [adminpassword]
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* 4. OFFICIAL ECI FOOTER */}
      <footer className="bg-slate-950 text-slate-500 py-6 px-4 text-center border-t border-slate-900 z-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-[9px] uppercase font-mono tracking-widest text-slate-650">
            © {new Date().getFullYear()} ELECTION COMMISSION OF INDIA. PRESIDING OFFICER SERVICE DESK GATEWAY.
          </p>
        </div>
      </footer>

    </div>
  );
}

export default Login;
