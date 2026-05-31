import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlowingCard from '../components/GlowingCard';

const WEST_BENGAL_CONSTITUENCIES = [
  "Cooch Behar", "Alipurduars", "Jalpaiguri", "Darjeeling", "Raiganj", "Balurghat", "Maldaha Uttar", "Maldaha Dakshin",
  "Jangipur", "Baharampur", "Murshidabad", "Krishnanagar", "Ranaghat", "Bangaon", "Barrackpore", "Dum Dum", "Barasat",
  "Basirhat", "Jaynagar", "Mathurapur", "Diamond Harbour", "Jadavpur", "Kolkata Dakshin", "Kolkata Uttar", "Howrah",
  "Uluberia", "Serampore", "Hooghly", "Arambagh", "Tamluk", "Kanthi", "Ghatal", "Jhargram", "Medinipur", "Purulia",
  "Bankura", "Bishnupur", "Bardhaman Purba", "Bardhaman–Durgapur", "Asansol", "Bolpur", "Birbhum"
];

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

  // Elector Edit State
  const [editingElector, setEditingElector] = useState(null);
  const [electorFormData, setElectorFormData] = useState({
    fullName: '',
    relationName: '',
    relationType: "Father's Name",
    dob: '',
    gender: 'Male',
    idType: 'Aadhaar Card',
    idNumber: '',
    stateUt: '',
    constituency: '',
    email: '',
    phone: '',
    voterId: '',
    matchScore: '98.4',
    photo: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // Register Nominee State
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [addName, setAddName] = useState('');
  const [addParty, setAddParty] = useState('');
  const [addLogo, setAddLogo] = useState('🏛️');
  const [addColor, setAddColor] = useState('indigo');
  const [addLoading, setAddLoading] = useState(false);
  const [partyLogos, setPartyLogos] = useState([]);
  const [addConstituency, setAddConstituency] = useState('Cooch Behar');
  const [editConstituency, setEditConstituency] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All Zones');

  const clearAddForm = () => {
    setAddName('');
    setAddParty('');
    setAddLogo(partyLogos.length > 0 ? partyLogos[0].url : '🏛️');
    setAddColor('indigo');
    setAddConstituency('Cooch Behar');
  };

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
    
    // 1. Fetch electors directory
    try {
      const electorsRes = await fetch(`${BACKEND_URL}/api/admin/users`);
      if (electorsRes.ok) {
        const electorsData = await electorsRes.json();
        setElectors(electorsData.users || []);
      }
    } catch (error) {
      // Ignored for clean browser console
    }
    
    // 2. Fetch candidates & standings
    try {
      const statsRes = await fetch(`${BACKEND_URL}/api/users/vote-stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.candidates) {
          setCandidates(statsData.candidates.map(c => ({
            id: c.id,
            name: c.name || c.Name || '',
            party: c.party || c.Party || '',
            color: c.color || c.Color || 'indigo',
            logo: c.logo || c.Logo || '🏛️',
            constituency: c.constituency || c.Constituency || '',
            votes: c.votes !== undefined ? c.votes : (c.Votes !== undefined ? c.Votes : 0)
          })));
        }
      }
    } catch (error) {
      // Ignored for clean browser console
    }

    // 3. Fetch Cloudinary party logos from backend env
    try {
      const logosRes = await fetch(`${BACKEND_URL}/api/admin/party-logos`);
      if (logosRes.ok) {
        const logosData = await logosRes.json();
        const activeLogos = logosData.logos || [];
        setPartyLogos(activeLogos);
        if (activeLogos.length > 0) {
          setAddLogo(activeLogos[0].url);
        }
      }
    } catch (error) {
      // Ignored for clean browser console
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/');
  };

  // Open modal and load elector values
  const handleEditElectorClick = (elector) => {
    setEditingElector(elector);
    setElectorFormData({
      fullName: elector.fullName || '',
      relationName: elector.relationName || '',
      relationType: elector.relationType || "Father's Name",
      dob: elector.dob || '',
      gender: elector.gender || 'Male',
      idType: elector.idType || 'Aadhaar Card',
      idNumber: elector.idNumber || '',
      stateUt: elector.stateUt || '',
      constituency: elector.constituency || '',
      email: elector.email || '',
      phone: elector.phone || '',
      voterId: elector.voterId || '',
      matchScore: elector.matchScore || '98.4',
      photo: elector.photo || ''
    });
  };

  // Submit elector updates to database
  const handleUpdateElector = async (e) => {
    e.preventDefault();
    if (!electorFormData.fullName || !electorFormData.phone || !electorFormData.voterId) {
      alert('Full Name, Registered Mobile Number, and EPIC Number are required.');
      return;
    }

    setSaveLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${editingElector.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(electorFormData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update elector details');
      }

      alert(`🎉 Elector details for "${electorFormData.fullName}" updated successfully in ECI Central Registry!`);
      setEditingElector(null);
      fetchAdminData(); // Refresh the list
    } catch (error) {
      console.error(error);
      alert(`Error updating elector record: ${error.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete elector from database
  const handleDeleteElector = async (elector) => {
    const doubleConfirm = window.confirm(
      `⚠️ WARNING: Are you sure you want to permanently delete registered elector "${elector.fullName}" (EPIC: ${elector.voterId})?\n\nThis action will also permanently erase any vote cast by this elector and cannot be undone.`
    );
    if (!doubleConfirm) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${elector.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete elector');
      }

      alert(`🎉 Elector "${elector.fullName}" was successfully removed from the Central Registry.`);
      fetchAdminData(); // Refresh the list
    } catch (error) {
      console.error(error);
      alert(`Error deleting elector: ${error.message}`);
    }
  };

  // Submit candidate updates (name & constituency) to Postgres
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
        body: JSON.stringify({ name: newName, constituency: editConstituency })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update candidate details in database');
      }

      alert(`🎉 Nominee Details Updated Successfully! Elector terminals have synced the new registry.`);
      setEditingId(null);
      setNewName('');
      setEditConstituency('');
      fetchAdminData(); // reload
    } catch (error) {
      console.error(error);
      alert(`Error updating nominee: ${error.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  // Delete contesting candidate from database
  const handleDeleteCandidate = async (id, name) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to delete contesting candidate "${name}"? This will permanently remove all associated votes cast for this candidate from the registry.`)) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/candidates/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete contesting candidate from the registry');
      }

      alert(`🎉 Contesting Candidate "${name}" and all associated votes have been successfully deleted.`);
      fetchAdminData(); // Refresh the standings and elector directory
    } catch (error) {
      console.error(error);
      alert(`Error deleting contesting candidate: ${error.message}`);
    }
  };

  // Register contesting candidate in ECI central database
  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    if (!addName || addName.trim() === '' || !addParty || addParty.trim() === '') return;

    setAddLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: addName.trim(),
          party: addParty.trim(),
          logo: addLogo.trim(),
          color: addColor,
          constituency: addConstituency
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to register contesting candidate in database');
      }

      alert(`🎉 Contesting Candidate "${addName}" registered successfully in ECI Central Registry!`);
      setIsAddingCandidate(false);
      clearAddForm();
      fetchAdminData(); // Refresh standings and directory
    } catch (error) {
      console.error(error);
      alert(`Error registering nominee: ${error.message}`);
    } finally {
      setAddLoading(false);
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

  const filteredCandidatesList = candidates.filter(c => {
    if (selectedZoneFilter === 'All Zones') return true;
    const filterVal = selectedZoneFilter.trim().toLowerCase();
    const candidateZone = c.constituency ? c.constituency.trim().toLowerCase() : '';
    return candidateZone === filterVal;
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
                    Presiding Officers Administrative Workspace
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
            {!isCollapsed && <span>Electoral Statistics</span>}
            {isCollapsed && (
              <span className="absolute left-full ml-4 px-2.5 py-1.5 rounded bg-slate-950 text-white text-[10px] uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg border border-slate-750">
                Electoral Statistics
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
            {!isCollapsed && <span>Contesting Candidates</span>}
            {isCollapsed && (
              <span className="absolute left-full ml-4 px-2.5 py-1.5 rounded bg-slate-950 text-white text-[10px] uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg border border-slate-750">
                Contesting Candidates
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
                  ECI CHIEF PRESIDING OFFICE
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
            {!isCollapsed && <span>Logout Workspace</span>}
          </button>

        </div>
      </aside>

      {/* 2. ADMIN MAIN SCROLLABLE CONTENT CANVAS */}
      <main className="flex-grow flex flex-col min-h-screen bg-slate-50 overflow-y-auto">
        
        {/* TOP STATUS BAR */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-8 shadow-sm flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-[9.5px] font-black tracking-widest text-[#1B3B6F] uppercase font-mono leading-none flex items-center gap-1.5">
              ECI OFFICERS SECURED WORKSPACE ACTIVE
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
                <h4 className="text-[10px] font-bold text-[#1B3B6F] uppercase tracking-wider leading-none">ECI PRESIDING COMMISSIONER CONTEXT DIALOG</h4>
                <p className="text-[10px] text-slate-500 mt-1 font-medium leading-tight">
                  Officer Node authenticated safely. Access granted to Electoral Directory and Contesting Candidates Registry overrides.
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
                <span className="h-3 w-3 rounded-full border-2 border-t-slate-700 border-slate-200" />
              ) : (
                '🔄 Refresh Electoral Directory'
              )}
            </button>
          </div>

          {/* ADMIN ACTIVE VIEW SWITCHER */}
          <div className="transition-all duration-300">
            
            {/* VIEW 1: OVERVIEW & STATS */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* 3 Metric cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-b-4 border-b-[#1B3B6F] flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Registered Electors</h4>
                      <p className="text-2xl font-black text-slate-800 mt-1.5 font-mono">{totalElectorsCount}</p>
                      <p className="text-[9px] text-slate-455 font-semibold mt-1">ECI Official Electoral Roster</p>
                    </div>
                    <span className="text-2xl select-none bg-[#1B3B6F]/5 h-11 w-11 rounded-full flex items-center justify-center border border-[#1B3B6F]/10">👥</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-b-4 border-b-[#0B6A3A] flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Votes Polled</h4>
                      <p className="text-2xl font-black text-slate-800 mt-1.5 font-mono">{totalVotesCast}</p>
                      <p className="text-[9px] text-slate-455 font-semibold mt-1">Decentralized Statutory Records</p>
                    </div>
                    <span className="text-2xl select-none bg-[#0B6A3A]/5 h-11 w-11 rounded-full flex items-center justify-center border border-[#0B6A3A]/10">🗳️</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-b-4 border-b-[#F58220] flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Elector Turnout Ratio</h4>
                      <p className="text-2xl font-black text-slate-800 mt-1.5 font-mono">{turnoutPercentage}%</p>
                      <p className="text-[9px] text-slate-455 font-semibold mt-1">Biometric Verification Turnout</p>
                    </div>
                    <span className="text-2xl select-none bg-[#F58220]/5 h-11 w-11 rounded-full flex items-center justify-center border border-[#F58220]/10">⚡</span>
                  </div>

                </div>

                {/* Candidate Standing Chart representation */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  <div className="lg:col-span-8 flex flex-col">
                    <GlowingCard glowColor="indigo" title="Live Progressive Poll Standings">
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
                                <div className="flex items-center gap-3">
                                  {/* Party Logo */}
                                  <div className="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-xl shrink-0 shadow-sm overflow-hidden select-none">
                                    {candidate.logo && (candidate.logo.startsWith('http') || candidate.logo.startsWith('data:image')) ? (
                                      <img src={candidate.logo} alt="Logo" className="h-full w-full object-cover" />
                                    ) : (
                                      <span>{candidate.logo || '🏛️'}</span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-550 font-mono shadow-sm">
                                        Ballot Position #{candidate.id}
                                      </span>
                                      <span className="text-xs font-black text-slate-800">{candidate.name}</span>
                                    </div>
                                    <p className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{candidate.party}</p>
                                  </div>
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
                    <GlowingCard glowColor="cyan" title="Electoral Audit Specifications">
                      <div className="space-y-4 text-xs">
                        <div className="border-b border-slate-100 pb-3">
                          <h4 className="text-[9px] font-bold text-slate-400 font-mono uppercase">Elector Verification Engine</h4>
                          <p className="text-slate-800 font-extrabold mt-1">ECI Biometric Verification System v1.2</p>
                        </div>
                        
                        <div className="border-b border-slate-100 pb-3">
                          <h4 className="text-[9px] font-bold text-slate-400 font-mono uppercase">Electoral Registry Cryptography</h4>
                          <p className="text-slate-800 font-extrabold mt-1 font-mono">Secured Cryptographic Verification</p>
                        </div>

                        <div>
                          <h4 className="text-[9px] font-bold text-slate-400 font-mono uppercase">Registry Connection Status</h4>
                          <p className="text-emerald-600 font-extrabold mt-1 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
              <div className="space-y-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                
                {/* Header & Search */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase text-[#1B3B6F] tracking-wide font-mono">Official Electoral Directory</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Verify registered elector credentials, biometric identity validation scores, and polled transactions.</p>
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
                        <th className="py-3 px-3">Elector Details</th>
                        <th className="py-3 px-3">Elector Photo Identity Card (EPIC) Number</th>
                        <th className="py-3 px-3">State/UT & Assembly Constituency</th>
                        <th className="py-3 px-3">Mobile & Alternative Identity Document</th>
                        <th className="py-3 px-3">Biometric Match Score</th>
                        <th className="py-3 px-3 text-center">Status of Franchise</th>
                        <th className="py-3 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {filteredElectors.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center font-bold text-slate-400 uppercase tracking-widest font-mono">
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
                              <p className="text-[9px] text-slate-455 font-semibold uppercase mt-0.5">{elector.idType}: {elector.idNumber}</p>
                            </td>

                            {/* Liveness Score */}
                            <td className="py-3.5 px-3 font-mono">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-[#0B6A3A] border border-emerald-500/20 font-bold select-none text-[9.5px]">
                                {elector.matchScore}% verified
                              </span>
                            </td>

                            {/* Vote Status & ZK Transaction Hash */}
                            <td className="py-3.5 px-3 text-center">
                              {elector.hasVoted ? (
                                <div className="inline-block text-left max-w-xs">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/15 text-[#0B6A3A] border border-emerald-500/30 text-[9.5px] font-black uppercase tracking-wider font-mono select-none">
                                    ● Franchise Exercised
                                  </span>
                                  <p className="text-[9px] font-bold text-slate-700 mt-1 leading-snug">
                                    Contesting Candidate: <span className="text-[#1B3B6F]">{elector.votedCandidateName || `Candidate #${elector.votedCandidateId}`}</span>
                                  </p>
                                  <p className="font-mono text-[8px] text-slate-450 break-all select-all font-semibold mt-1">
                                    SECURE LEDGER AUDIT ID: {elector.votedTxHash}
                                  </p>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-500 border border-slate-200 text-[9.5px] font-black uppercase tracking-wider font-mono select-none">
                                  ● Franchise Not Exercised
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                             <td className="py-3.5 px-3 text-center">
                               <div className="flex items-center justify-center gap-1.5">
                                 <button
                                   onClick={() => handleEditElectorClick(elector)}
                                   className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 py-1.5 text-[9.5px] uppercase tracking-wider cursor-pointer shadow-sm active:scale-95 transition-all inline-flex items-center gap-1 leading-none"
                                   title="Edit Elector Details"
                                 >
                                   ✏️ Edit
                                 </button>
                                 <button
                                   onClick={() => handleDeleteElector(elector)}
                                   className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1.5 text-[9.5px] uppercase tracking-wider cursor-pointer shadow-sm active:scale-95 transition-all inline-flex items-center gap-1 leading-none"
                                   title="Delete Elector from Central Registry"
                                 >
                                   🗑️ Delete
                                 </button>
                               </div>
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
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="border-b border-slate-100 pb-3 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-black uppercase text-[#1B3B6F] tracking-wide font-mono">Contesting Candidates Registry</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Presiding Officers hold the statutory authority to modify the Contesting Candidates Registry in the database. Electoral terminals sync automatically.</p>
                    </div>
                    
                    <button
                      onClick={() => setIsAddingCandidate(!isAddingCandidate)}
                      className="rounded-lg bg-[#1B3B6F] hover:bg-[#12274A] text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm text-center shrink-0 flex items-center gap-1.5"
                    >
                      {isAddingCandidate ? '❌ Close Registry Form' : '➕ Register Contesting Candidate'}
                    </button>
                  </div>

                  {/* Register Candidate Form Block */}
                  {isAddingCandidate && (
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-inner animate-none">
                      <h4 className="text-xs font-black uppercase text-[#1B3B6F] tracking-wide font-mono mb-4">
                        Register New Nominee to ECI Registry / नया उम्मीदवार जोड़ें
                      </h4>
                      
                      <form onSubmit={handleCreateCandidate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8.5px] font-bold uppercase text-slate-455 tracking-wider">Candidate Name</label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. Dr. Rajesh Kumar"
                            value={addName}
                            onChange={(e) => setAddName(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[8.5px] font-bold uppercase text-slate-455 tracking-wider">Contesting Lok Sabha Constituency (Zone)</label>
                          <select
                            value={addConstituency}
                            onChange={(e) => setAddConstituency(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[11px] text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                          >
                            {WEST_BENGAL_CONSTITUENCIES.map(zone => (
                              <option key={zone} value={zone}>{zone}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1 md:col-span-2">
                          <label className="text-[8.5px] font-bold uppercase text-slate-455 tracking-wider">Political Party Name</label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. Indian National League (INL) or select below"
                            value={addParty}
                            onChange={(e) => setAddParty(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-col gap-1 md:col-span-2">
                          <label className="text-[8.5px] font-bold uppercase text-slate-455 tracking-wider mb-1">Select Official Political Party Logo (Cloudinary)</label>
                          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                            {partyLogos.map((logo) => (
                              <button
                                key={logo.party}
                                type="button"
                                onClick={() => {
                                  setAddLogo(logo.url);
                                  const nameMap = {
                                    BJP: 'Bharatiya Janata Party (BJP)',
                                    INC: 'Indian National Congress (INC)',
                                    BSP: 'Bahujan Samaj Party (BSP)',
                                    NCP: 'Nationalist Congress Party (NCP)',
                                    CPI: 'Communist Party of India (CPI)',
                                    CPIM: 'Communist Party of India (Marxist) (CPI-M)',
                                    TMC: 'All India Trinamool Congress (AITC)'
                                  };
                                  if (nameMap[logo.party]) {
                                    setAddParty(nameMap[logo.party]);
                                  }
                                }}
                                className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all cursor-pointer bg-white hover:border-[#1B3B6F] shadow-sm select-none ${
                                  addLogo === logo.url
                                    ? 'border-2 border-[#1B3B6F] bg-blue-50/20'
                                    : 'border-slate-200'
                                }`}
                              >
                                <div className="h-10 w-10 flex items-center justify-center overflow-hidden rounded bg-slate-50 border border-slate-150 p-1 shrink-0 mb-2">
                                  <img src={logo.url} alt={logo.party} className="h-full w-full object-contain" />
                                </div>
                                <span className="text-[9.5px] font-mono font-bold text-slate-800 text-center leading-none">{logo.party}</span>
                              </button>
                            ))}
                            {partyLogos.length === 0 && (
                              <div className="col-span-full py-4 text-center text-slate-400 font-bold uppercase tracking-widest text-[9.5px] font-mono border border-dashed border-slate-200 rounded-xl animate-pulse">
                                Loading official party logos from Cloudinary...
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCandidate(false);
                              clearAddForm();
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[9.5px] font-black uppercase text-slate-550 hover:bg-slate-100 cursor-pointer"
                          >
                            Cancel
                          </button>
                          
                          <button
                            type="submit"
                            disabled={addLoading}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-[9.5px] font-black uppercase tracking-wider cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5"
                          >
                            {addLoading ? 'Creating...' : 'Register ECI Nominee'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Constituency filter select box */}
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-b border-slate-100 py-4 mt-4">
                    <div>
                      <h4 className="text-xs font-black uppercase text-[#1B3B6F] tracking-wide font-mono">Contesting Candidates Standings by Constituency</h4>
                      <p className="text-[10px] text-slate-550 font-medium">Filter the candidates card roster by specific Lok Sabha zones or view all registered candidates.</p>
                    </div>
                    <div className="flex items-center gap-2 max-w-xs w-full">
                      <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider font-mono shrink-0">Zone:</span>
                      <select
                        value={selectedZoneFilter}
                        onChange={(e) => setSelectedZoneFilter(e.target.value)}
                        className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none shadow-sm font-semibold w-full"
                      >
                        <option value="All Zones">All Zones / सभी क्षेत्र</option>
                        {WEST_BENGAL_CONSTITUENCIES.map(zone => (
                          <option key={zone} value={zone}>{zone}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Candidates editing roster */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredCandidatesList.length === 0 ? (
                      <div className="col-span-full py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 shadow-inner">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-lg select-none animate-pulse">
                          📂
                        </div>
                        <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-widest">No Nominees Registered</h4>
                        <p className="text-[10px] text-slate-400 mt-1">There are no contesting candidates registered in {selectedZoneFilter === 'All Zones' ? 'the database' : selectedZoneFilter} yet.</p>
                      </div>
                    ) : (
                      filteredCandidatesList.map(candidate => {
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
                                BALLOT POSITION #{candidate.id}
                              </span>
                              <span className="text-[10.5px] font-black text-slate-800 font-mono select-none">
                                {candidate.votes} votes ({percentage}%)
                              </span>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                              {/* Party Logo */}
                              <div className="h-11 w-11 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-2xl shrink-0 shadow-sm overflow-hidden select-none">
                                {candidate.logo && (candidate.logo.startsWith('http') || candidate.logo.startsWith('data:image')) ? (
                                  <img src={candidate.logo} alt="Logo" className="h-full w-full object-cover" />
                                ) : (
                                  <span>{candidate.logo || '🏛️'}</span>
                                )}
                              </div>
                              
                              <div>
                                <h4 className="text-xs font-black text-slate-900 leading-snug">{candidate.name}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{candidate.party}</p>
                                <span className="inline-block text-[8.5px] font-bold bg-[#1B3B6F]/5 border border-[#1B3B6F]/10 text-[#1B3B6F] px-2 py-0.5 rounded-md mt-1.5 font-mono uppercase">
                                  📍 Zone: {candidate.constituency || 'General Registry'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Edit Form */}
                          <div className="pt-4 border-t border-slate-200/60 mt-2">
                            {isEditingThis ? (
                              <form onSubmit={(e) => handleUpdateCandidateName(e, candidate.id)} className="space-y-3.5">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[8.5px] font-bold uppercase text-slate-455 tracking-wider">Candidate Name</label>
                                  <input
                                    required
                                    type="text"
                                    placeholder="Enter candidate name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[8.5px] font-bold uppercase text-slate-455 tracking-wider">Contesting Lok Sabha Constituency</label>
                                  <select
                                    value={editConstituency}
                                    onChange={(e) => setEditConstituency(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[11px] text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                                  >
                                    {WEST_BENGAL_CONSTITUENCIES.map(zone => (
                                      <option key={zone} value={zone}>{zone}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(null);
                                      setNewName('');
                                      setEditConstituency('');
                                    }}
                                    className="w-1/3 rounded-lg border border-slate-300 bg-white py-2 text-[9.5px] font-black uppercase text-slate-550 hover:bg-slate-100 cursor-pointer text-center"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="w-2/3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-[9.5px] font-black uppercase tracking-wider cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5"
                                  >
                                    {editLoading ? (
                                      <span className="h-3 w-3 rounded-full border-2 border-t-white border-white/20 animate-spin" />
                                    ) : (
                                      'Save Changes'
                                    )}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => {
                                    setEditingId(candidate.id);
                                    setNewName(candidate.name);
                                    setEditConstituency(candidate.constituency || 'Cooch Behar');
                                  }}
                                  className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-[10.5px] font-black uppercase tracking-wider cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  <span>Edit Candidate Nominee</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                                  className="w-full rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 py-2.5 text-[10.5px] font-black uppercase tracking-wider cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  <span>Delete Candidate Nominee</span>
                                </button>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    }))}
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
            <p className="mt-1.5 text-slate-600">PRESIDING OFFICERS DESK HUB | AUTHORIZED DIRECTORY INTEGRITY SECURED</p>
          </div>
        </footer>

      {/* 3. PREMIUM EDIT ELECTOR OVERLAY MODAL */}
      {editingElector && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden transform scale-100 transition-all duration-300">
            
            {/* Modal Header with ECI Tricolor Stripe */}
            <div className="flex flex-col shrink-0">
              <div className="h-1.5 bg-tricolor-line" />
              <div className="bg-[#1B3B6F] text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">✏️</span>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider font-mono">ECI Central Registry Elector Editor</h3>
                    <p className="text-[10px] text-slate-350 font-bold uppercase mt-0.5 leading-none">
                      Correct or update official records of elector {editingElector.voterId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingElector(null)}
                  className="text-slate-300 hover:text-white text-lg font-bold leading-none p-1 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleUpdateElector} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Profile Photo Display & Input */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-305 bg-white flex items-center justify-center shrink-0 shadow-sm">
                  {electorFormData.photo ? (
                    <img src={electorFormData.photo} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-black text-slate-400 font-mono">NO PHOTO</span>
                  )}
                </div>
                <div className="flex-grow w-full space-y-1.5">
                  <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Elector Photo (Base64 String or Image URL)</label>
                  <input
                    type="text"
                    placeholder="Enter Base64 data:image or http web image URL"
                    value={electorFormData.photo}
                    onChange={(e) => setElectorFormData({ ...electorFormData, photo: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none placeholder:text-slate-400 font-mono"
                  />
                </div>
              </div>

              {/* SECTION A: Personal Details */}
              <div>
                <h4 className="text-[11px] font-black uppercase text-[#1B3B6F] tracking-widest border-b border-slate-100 pb-2 mb-4 font-mono">
                  I. Personal Details & Mobile
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Full Name <span className="text-rose-500">*</span></label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={electorFormData.fullName}
                      onChange={(e) => setElectorFormData({ ...electorFormData, fullName: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                    />
                  </div>

                  {/* Registered Mobile Number */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Registered Mobile Number <span className="text-rose-500">*</span></label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={electorFormData.phone}
                      onChange={(e) => setElectorFormData({ ...electorFormData, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none font-mono"
                    />
                  </div>

                  {/* Gender */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Gender</label>
                    <select
                      value={electorFormData.gender}
                      onChange={(e) => setElectorFormData({ ...electorFormData, gender: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Third Gender">Third Gender</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Date of Birth (YYYY-MM-DD)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1995-08-15"
                      value={electorFormData.dob}
                      onChange={(e) => setElectorFormData({ ...electorFormData, dob: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none font-mono"
                    />
                  </div>

                  {/* Relation Type */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Relation Type</label>
                    <select
                      value={electorFormData.relationType}
                      onChange={(e) => setElectorFormData({ ...electorFormData, relationType: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                    >
                      <option value="Father's Name">Father's Name</option>
                      <option value="Mother's Name">Mother's Name</option>
                      <option value="Husband's Name">Husband's Name</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Relation Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Relation's Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Shyam Lal"
                      value={electorFormData.relationName}
                      onChange={(e) => setElectorFormData({ ...electorFormData, relationName: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. voter@example.com"
                      value={electorFormData.email}
                      onChange={(e) => setElectorFormData({ ...electorFormData, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: Electoral & ID Details */}
              <div>
                <h4 className="text-[11px] font-black uppercase text-[#1B3B6F] tracking-widest border-b border-slate-100 pb-2 mb-4 font-mono">
                  II. Electoral & Identity specifications
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* EPIC Number */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">EPIC Card Number <span className="text-rose-500">*</span></label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. ECI-12345678-X"
                      value={electorFormData.voterId}
                      onChange={(e) => setElectorFormData({ ...electorFormData, voterId: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none font-mono font-bold uppercase"
                    />
                  </div>

                  {/* Biometric Liveness Verification Score */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Biometric Match score (%)</label>
                    <input
                      type="text"
                      placeholder="e.g. 98.4"
                      value={electorFormData.matchScore}
                      onChange={(e) => setElectorFormData({ ...electorFormData, matchScore: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none font-mono"
                    />
                  </div>

                  {/* Alternative ID Type */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Alternative ID Document Type</label>
                    <select
                      value={electorFormData.idType}
                      onChange={(e) => setElectorFormData({ ...electorFormData, idType: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Ration Card">Ration Card</option>
                    </select>
                  </div>

                  {/* Alternative ID Number */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">ID Document Reference Number</label>
                    <input
                      type="text"
                      placeholder="Enter identity reference number"
                      value={electorFormData.idNumber}
                      onChange={(e) => setElectorFormData({ ...electorFormData, idNumber: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none font-mono uppercase"
                    />
                  </div>

                  {/* State UT */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">State / Union Territory</label>
                    <input
                      type="text"
                      placeholder="e.g. West Bengal"
                      value={electorFormData.stateUt}
                      onChange={(e) => setElectorFormData({ ...electorFormData, stateUt: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                    />
                  </div>

                  {/* Constituency */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Assembly Constituency</label>
                    <input
                      type="text"
                      placeholder="e.g. AC-12 Salt Lake"
                      value={electorFormData.constituency}
                      onChange={(e) => setElectorFormData({ ...electorFormData, constituency: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-[#1B3B6F] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

            </form>

            {/* Modal Sticky Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4.5 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingElector(null)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-black uppercase text-slate-550 hover:bg-slate-100 cursor-pointer shadow-sm active:scale-98 transition-all"
              >
                Cancel / रद्द करें
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                onClick={handleUpdateElector}
                className="rounded-xl bg-[#1B3B6F] hover:bg-[#12274A] text-white px-6 py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:bg-slate-400"
              >
                {saveLoading ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-t-white border-white/20 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Record / सहेजें</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      </main>

    </div>
  );
}

export default AdminDashboard;
