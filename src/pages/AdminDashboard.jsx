import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlowingCard from '../components/GlowingCard';

/**
 * AdminDashboard represents the premium ECI Officers Portal unlocked upon Chief Presiding Officer authentication.
 * Features:
 * 1. Overview & Stats (Turnout ratios, connection speed, registry audit counters).
 * 2. Elector Directory (Searchable table of all registered users, details, photos, ZK transaction hashes).
 * 3. Nominee Manager (Real-time database updates for active candidates).
 */
function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // overview, electors, nominees
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());
  
  // Officer Profile
  const [adminData, setAdminData] = useState(null);

  // Data States
  const [electors, setElectors] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Nominee Edit State
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Check auth on mount
  useEffect(() => {
    const savedAdmin = localStorage.getItem('adminUser');
    if (!savedAdmin) {
      navigate('/');
    } else {
      setAdminData(JSON.parse(savedAdmin));
    }
  }, [navigate]);

  // System clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch admin portal data
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch electors directory
      const electorsRes = await fetch(`${BACKEND_URL}/api/admin/users`);
      if (electorsRes.ok) {
        const electorsData = await electorsRes.json();
        setElectors(electorsData.users || []);
      }
      
      // 2. Fetch candidates & standings
      const statsRes = await fetch(`${BACKEND_URL}/api/users/vote-stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.candidates) {
          setCandidates(statsData.candidates);
        }
      }
    } catch (error) {
      console.error('Failed to sync ECI admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/');
  };

  // Submit candidate name change to Postgres
  const handleUpdateCandidateName = async (e, id) => {
    e.preventDefault();
    if (!newName || newName.trim() === '') return;

    setEditLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/candidates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update candidate name in database');
      }

      alert(`🎉 Nominee Name Updated Successfully! Elector terminals have synced the new registry.`);
      setEditingId(null);
      setNewName('');
      fetchAdminData(); // reload
    } catch (error) {
      console.error(error);
      alert(`Error updating nominee name: ${error.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  // Turnout computations
  const totalElectorsCount = electors.length;
  const totalVotesCast = electors.filter(e => e.hasVoted).length;
  const turnoutPercentage = totalElectorsCount > 0 ? ((totalVotesCast / totalElectorsCount) * 100).toFixed(1) : '0.0';

  // Search filter
  const filteredElectors = electors.filter(e => {
    const query = searchQuery.toLowerCase();
    const fullName = e.fullName ? e.fullName.toLowerCase() : '';
    const voterId = e.voterId ? e.voterId.toLowerCase() : '';
    const phone = e.phone ? e.phone.toString().toLowerCase() : '';
    const constituency = e.constituency ? e.constituency.toLowerCase() : '';

    return (
      fullName.includes(query) ||
      voterId.includes(query) ||
      phone.includes(query) ||
      constituency.includes(query)
    );
  });

  if (!adminData) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col lg:flex-row">
      
      {/* 1. COLLAPSIBLE ADMIN SIDEBAR */}
      <aside 
        className={`bg-slate-900 text-white flex flex-col justify-between transition-all duration-300 ease-in-out z-20 shadow-xl ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-full lg:min-h-screen border-r border-slate-800`}
      >
        {/* Sidebar Top Header */}
        <div className="flex flex-col border-b border-slate-850">
          {/* Admin Tricolor Stripe */}
          <div className="h-1 bg-tricolor-line" />
          
          <div className="flex items-center justify-between p-4.5 gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-amber-500/30 flex items-center justify-center p-0.5 shadow shrink-0">
                <svg className="h-7 w-7 text-amber-400" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" />
                  <path d="M25 50 L50 25 L75 50 L50 75 Z" fill="#F58220" opacity="0.25" />
                  <path d="M25 50 H75" stroke="#F58220" strokeWidth="3" />
                  <circle cx="50" cy="50" r="6" fill="#0B6A3A" />
                </svg>
              </div>
              
              {!isCollapsed && (
                <div className="font-sans">
                  <h1 className="text-[11px] font-black tracking-widest text-amber-400 uppercase leading-none">
                    ECI OFFICERS
                  </h1>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    Presiding Admin Gate
                  </p>
                </div>
              )}
            </div>

            {/* Collapse Arrow Toggle */}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-all text-white cursor-pointer"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <svg 
                className={`h-4.5 w-4.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar Middle Navigation List */}
        <nav className="flex-grow p-3 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible justify-center lg:justify-start">
          
          {/* Tab 1: Overview & Stats */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs leading-none select-none relative group shrink-0 ${
              activeTab === 'overview' 
                ? 'bg-slate-800 text-amber-400 shadow-inner border-l-4 border-amber-450' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            } ${isCollapsed ? 'lg:justify-center lg:px-2' : 'w-full'}`}
          >
            <span className="text-base select-none shrink-0">📊</span>
            {!isCollapsed && <span>Overview & Stats</span>}
            {isCollapsed && (
              <span className="absolute left-full ml-4 px-2.5 py-1.5 rounded bg-slate-950 text-white text-[10px] uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg border border-slate-750">
                Overview & Stats
              </span>
            )}
          </button>

          {/* Tab 2: Elector Directory */}
          <button
            onClick={() => setActiveTab('electors')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs leading-none select-none relative group shrink-0 ${
              activeTab === 'electors' 
                ? 'bg-slate-800 text-amber-400 shadow-inner border-l-4 border-amber-450' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            } ${isCollapsed ? 'lg:justify-center lg:px-2' : 'w-full'}`}
          >
            <span className="text-base select-none shrink-0">👥</span>
            {!isCollapsed && <span>Elector Directory</span>}
            {isCollapsed && (
              <span className="absolute left-full ml-4 px-2.5 py-1.5 rounded bg-slate-950 text-white text-[10px] uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg border border-slate-750">
                Elector Directory
              </span>
            )}
          </button>

          {/* Tab 3: Nominee Manager */}
          <button
            onClick={() => setActiveTab('nominees')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs leading-none select-none relative group shrink-0 ${
              activeTab === 'nominees' 
                ? 'bg-slate-800 text-amber-400 shadow-inner border-l-4 border-amber-450' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            } ${isCollapsed ? 'lg:justify-center lg:px-2' : 'w-full'}`}
          >
            <span className="text-base select-none shrink-0">🗳️</span>
            {!isCollapsed && <span>Ballot Nominees</span>}
            {isCollapsed && (
              <span className="absolute left-full ml-4 px-2.5 py-1.5 rounded bg-slate-950 text-white text-[10px] uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg border border-slate-750">
                Ballot Nominees
              </span>
            )}
          </button>

        </nav>

        {/* Sidebar Bottom Profile Footer */}
        <div className="border-t border-slate-800 p-3 bg-black/20 flex flex-col gap-2">
          
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-amber-500/40 bg-slate-800 flex items-center justify-center">
              <span className="text-sm font-black select-none text-amber-455">ECI</span>
            </div>

            {!isCollapsed && (
              <div className="font-mono text-[9.5px] uppercase leading-tight truncate flex-1 min-w-0">
                <p className="font-black tracking-wide truncate text-white">{adminData.fullName}</p>
                <p className="text-[8.5px] text-slate-400 tracking-wider font-semibold truncate">
                  CHIEF OFFICERS DESK
                </p>
              </div>
            )}
          </div>

          {/* Admin Logout button */}
          <button
            onClick={handleLogout}
            className={`flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-rose-755 hover:border-transparent text-slate-300 hover:text-white transition-all py-2 text-[10.5px] font-black uppercase tracking-wider cursor-pointer ${
              isCollapsed ? 'w-full px-1' : 'w-full'
            }`}
            title="Secure Session Logout"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {!isCollapsed && <span>Logout Desk</span>}
          </button>

        </div>
      </aside>

      {/* 2. ADMIN MAIN SCROLLABLE CONTENT CANVAS */}
      <main className="flex-grow flex flex-col min-h-screen bg-slate-50 overflow-y-auto">
        
        {/* TOP STATUS BAR */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-8 shadow-sm flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="text-[9.5px] font-black tracking-widest text-[#1B3B6F] uppercase font-mono leading-none flex items-center gap-1.5">
              ECI OFFICIAL PRESIDING AUTHORITY NODE ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 text-[10px] font-bold font-mono">
            <span className="hidden sm:inline bg-slate-100 border border-slate-200 rounded px-2.5 py-0.5 select-none text-[8.5px] uppercase">
              District: AC-12
            </span>
            <span className="text-slate-800 text-[11px] font-extrabold select-none">
              {systemTime}
            </span>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto flex-grow">
          
          {/* Refresh Banner */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm flex items-center justify-between gap-3 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3">
              <div className="h-8.5 w-8.5 rounded bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 font-bold select-none text-base">
                🛡️
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-[#1B3B6F] uppercase tracking-wider leading-none">ECI PRESIDING COMMISSIONER DIALOG</h4>
                <p className="text-[10px] text-slate-500 mt-1 font-medium leading-tight">
                  Officer Node authenticated safely. Access granted to electors ledger directories and dynamic ballot nominees overrides.
                </p>
              </div>
            </div>

            {/* Quick manual sync data */}
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-[10px] font-black uppercase text-slate-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer disabled:bg-slate-100"
            >
              {loading ? (
                <span className="h-3 w-3 rounded-full border-2 border-t-slate-700 border-slate-200 animate-spin" />
              ) : (
                '🔄 Sync Roster'
              )}
            </button>
          </div>

          {/* ADMIN ACTIVE VIEW SWITCHER */}
          <div className="transition-all duration-300">
            
            {/* VIEW 1: OVERVIEW & STATS */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-float">
                {/* 3 Metric cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-b-4 border-b-[#1B3B6F] flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Registered Electors</h4>
                      <p className="text-2xl font-black text-slate-800 mt-1.5 font-mono">{totalElectorsCount}</p>
                      <p className="text-[9px] text-slate-455 font-semibold mt-1">ECI Ledger Roster</p>
                    </div>
                    <span className="text-2xl select-none bg-[#1B3B6F]/5 h-11 w-11 rounded-full flex items-center justify-center border border-[#1B3B6F]/10">👥</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-b-4 border-b-[#0B6A3A] flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Votes Cast</h4>
                      <p className="text-2xl font-black text-slate-800 mt-1.5 font-mono">{totalVotesCast}</p>
                      <p className="text-[9px] text-slate-455 font-semibold mt-1">Cryptographic Ledger Nodes</p>
                    </div>
                    <span className="text-2xl select-none bg-[#0B6A3A]/5 h-11 w-11 rounded-full flex items-center justify-center border border-[#0B6A3A]/10">🗳️</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-b-4 border-b-[#F58220] flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Turnout Ratio</h4>
                      <p className="text-2xl font-black text-slate-800 mt-1.5 font-mono">{turnoutPercentage}%</p>
                      <p className="text-[9px] text-slate-455 font-semibold mt-1">EVM Elector Liveness</p>
                    </div>
                    <span className="text-2xl select-none bg-[#F58220]/5 h-11 w-11 rounded-full flex items-center justify-center border border-[#F58220]/10">⚡</span>
                  </div>

                </div>

                {/* Candidate Standing Chart representation */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  <div className="lg:col-span-8 flex flex-col">
                    <GlowingCard glowColor="indigo" title="Real-time Legislative Standings">
                      <div className="space-y-5.5">
                        {candidates.map(candidate => {
                          const percentage = totalVotesCast > 0 ? ((candidate.votes / totalVotesCast) * 100).toFixed(1) : '0.0';
                          
                          const barColor = {
                            indigo: 'bg-[#1B3B6F]',
                            cyan: 'bg-[#F58220]',
                            emerald: 'bg-[#0B6A3A]',
                          }[candidate.color] || 'bg-[#1B3B6F]';

                          return (
                            <div key={candidate.id} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                              <div className="mb-2 flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-550 font-mono shadow-sm">
                                      Ballot #{candidate.id}
                                    </span>
                                    <span className="text-xs font-black text-slate-800">{candidate.name}</span>
                                  </div>
                                  <p className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{candidate.party}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-black text-slate-900 font-mono">{candidate.votes} votes</span>
                                  <span className="text-[9px] text-slate-500 font-bold font-mono block mt-0.5">({percentage}%)</span>
                                </div>
                              </div>
                              
                              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${barColor}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </GlowingCard>
                  </div>

                  {/* Administrative details */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    <GlowingCard glowColor="cyan" title="Electoral Audit Specs">
                      <div className="space-y-4 text-xs">
                        <div className="border-b border-slate-100 pb-3">
                          <h4 className="text-[9px] font-bold text-slate-400 font-mono uppercase">Voter Verification Engine</h4>
                          <p className="text-slate-800 font-extrabold mt-1">ECI Biometric Face Matcher v1.2</p>
                        </div>
                        
                        <div className="border-b border-slate-100 pb-3">
                          <h4 className="text-[9px] font-bold text-slate-400 font-mono uppercase">Ledger Cryptography</h4>
                          <p className="text-slate-800 font-extrabold mt-1">SHA-256 with Zero-Knowledge Proofs</p>
                        </div>

                        <div>
                          <h4 className="text-[9px] font-bold text-slate-400 font-mono uppercase">Connection Node</h4>
                          <p className="text-emerald-600 font-extrabold mt-1 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                            SECURE & SYNCED
                          </p>
                        </div>
                      </div>
                    </GlowingCard>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: ELECTOR DIRECTORY */}
            {activeTab === 'electors' && (
              <div className="space-y-5 animate-float bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                
                {/* Header & Search */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase text-[#1B3B6F] tracking-wide font-mono">Registered Electors Directory</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Verify registered electors metadata, biometrics liveness score, and voted ledger transactions.</p>
                  </div>
                  
                  {/* Search bar */}
                  <div className="relative max-w-xs w-full">
                    <input
                      type="text"
                      placeholder="Search Name, EPIC No, Phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3.5 py-2 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 select-none text-xs">🔍</span>
                  </div>
                </div>

                {/* Electors Directory Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10.5px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-250 text-slate-650 font-bold uppercase tracking-wider font-mono">
                        <th className="py-3 px-3">Elector</th>
                        <th className="py-3 px-3">EPIC Card Number</th>
                        <th className="py-3 px-3">State & Constituency</th>
                        <th className="py-3 px-3">Phone & ID Card</th>
                        <th className="py-3 px-3">Liveness Match</th>
                        <th className="py-3 px-3 text-center">Vote Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {filteredElectors.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center font-bold text-slate-400 uppercase tracking-widest font-mono">
                            No electors found matching registry filters.
                          </td>
                        </tr>
                      ) : (
                        filteredElectors.map(elector => (
                          <tr key={elector.id} className="hover:bg-slate-50/50 transition-colors">
                            
                            {/* Elector Photo & Name */}
                            <td className="py-3.5 px-3 flex items-center gap-3">
                              <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-250 bg-slate-100 flex items-center justify-center shrink-0">
                                {elector.photo ? (
                                  <img src={elector.photo} alt="Elector" className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-slate-400 font-mono">EPIC</span>
                                )}
                              </div>
                              <div className="leading-tight">
                                <p className="font-extrabold text-slate-900">{elector.fullName}</p>
                                <p className="text-[9px] text-slate-455 font-bold uppercase mt-0.5">{elector.gender} | {elector.dob}</p>
                              </div>
                            </td>

                            {/* EPIC Card Number */}
                            <td className="py-3.5 px-3 font-mono font-bold text-[#1B3B6F] select-all">
                              {elector.voterId}
                            </td>

                            {/* State & Constituency */}
                            <td className="py-3.5 px-3 leading-tight">
                              <p className="font-bold text-slate-800">{elector.constituency}</p>
                              <p className="text-[9px] text-slate-450 font-semibold uppercase mt-0.5">{elector.stateUt}</p>
                            </td>

                            {/* Mobile & ID details */}
                            <td className="py-3.5 px-3 leading-tight">
                              <p className="font-mono font-bold text-slate-700">{elector.phone}</p>
                              <p className="text-[9px] text-slate-450 font-semibold uppercase mt-0.5">{elector.idType}: {elector.idNumber}</p>
                            </td>

                            {/* Liveness Score */}
                            <td className="py-3.5 px-3 font-mono">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-[#0B6A3A] border border-emerald-500/20 font-bold select-none text-[9.5px]">
                                {elector.matchScore}% liveness
                              </span>
                            </td>

                            {/* Vote Status & ZK Transaction Hash */}
                            <td className="py-3.5 px-3 text-center">
                              {elector.hasVoted ? (
                                <div className="inline-block text-left max-w-xs">
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-[#0B6A3A] border border-emerald-500/20 uppercase tracking-widest font-mono select-none">
                                    ● voted (Nominee #{elector.votedCandidateId})
                                  </span>
                                  <p className="font-mono text-[8px] text-slate-400 break-all select-all font-semibold mt-1">
                                    HASH: {elector.votedTxHash}
                                  </p>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-455 border border-slate-200 uppercase tracking-widest font-mono select-none">
                                  ● Unvoted
                                </span>
                              )}
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* VIEW 3: NOMINEE MANAGER */}
            {activeTab === 'nominees' && (
              <div className="space-y-6 animate-float">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="border-b border-slate-100 pb-3 mb-5">
                    <h3 className="text-sm font-black uppercase text-[#1B3B6F] tracking-wide font-mono">Dynamic Ballot Nominee Manager</h3>
                    <p className="text-[10px] text-slate-500 font-medium">ECI Admins hold the authority to modify candidate rosters dynamically in the PostgreSQL database. Electors EVM terminals update automatically.</p>
                  </div>

                  {/* Candidates editing roster */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {candidates.map(candidate => {
                      const percentage = totalVotesCast > 0 ? ((candidate.votes / totalVotesCast) * 100).toFixed(1) : '0.0';
                      
                      const cardBorder = {
                        indigo: 'border-t-4 border-t-[#1B3B6F]',
                        cyan: 'border-t-4 border-t-[#F58220]',
                        emerald: 'border-t-4 border-t-[#0B6A3A]',
                      }[candidate.color] || 'border-t-4 border-t-[#1B3B6F]';

                      const isEditingThis = editingId === candidate.id;

                      return (
                        <div 
                          key={candidate.id} 
                          className={`bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-slate-350 transition-all ${cardBorder}`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[8.5px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-550 font-mono shadow-inner select-none">
                                BALLOT NO. #{candidate.id}
                              </span>
                              <span className="text-[10.5px] font-black text-slate-800 font-mono select-none">
                                {candidate.votes} votes ({percentage}%)
                              </span>
                            </div>

                            <div className="mb-4">
                              <h4 className="text-xs font-black text-slate-900 leading-snug">{candidate.name}</h4>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{candidate.party}</p>
                            </div>
                          </div>

                          {/* Edit Form */}
                          <div className="pt-4 border-t border-slate-200/60 mt-2">
                            {isEditingThis ? (
                              <form onSubmit={(e) => handleUpdateCandidateName(e, candidate.id)} className="space-y-3.5">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[8.5px] font-bold uppercase text-slate-450 tracking-wider">Configure New Name</label>
                                  <input
                                    required
                                    type="text"
                                    placeholder="Enter new candidate name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(null);
                                      setNewName('');
                                    }}
                                    className="w-1/3 rounded-lg border border-slate-300 bg-white py-2 text-[9.5px] font-black uppercase text-slate-550 hover:bg-slate-100 cursor-pointer text-center"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="w-2/3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5"
                                  >
                                    {editLoading ? (
                                      <span className="h-3 w-3 rounded-full border-2 border-t-white border-white/20 animate-spin" />
                                    ) : (
                                      'Commit'
                                    )}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingId(candidate.id);
                                  setNewName(candidate.name);
                                }}
                                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-[10.5px] font-black uppercase tracking-wider active:scale-97 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                📝 Rename Candidate
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>

        {/* ECI OFFICIAL ADMIN FOOTER */}
        <footer className="mt-auto bg-slate-900 text-slate-500 py-6 px-4 text-center border-t border-slate-800">
          <div className="mx-auto max-w-7xl text-[8.5px] uppercase font-mono tracking-widest">
            <p>© {new Date().getFullYear()} ELECTION COMMISSION OF INDIA. ALL RIGHTS RESERVED.</p>
            <p className="mt-1.5 text-slate-600">PRESIDING DESK HUB | AUTHORIZED DIRECTORY DATABASE INTEGRITY SECURED</p>
          </div>
        </footer>

      </main>

    </div>
  );
}

export default AdminDashboard;
