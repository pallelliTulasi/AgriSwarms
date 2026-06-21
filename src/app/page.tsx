'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Volume2, Truck, TrendingUp, Leaf, Users, CheckCircle2, 
  Activity, FileText, CloudLightning, ShieldAlert, DollarSign, 
  MapPin, RotateCcw, MessageSquare, Search, Award, Send, Globe,
  ArrowRight, ShieldCheck, HelpCircle, Loader2, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import { FarmerListing, Driver, Trip, NegotiationMessage, AdvisoryArticle } from '../lib/types';
import { INITIAL_LISTINGS, INITIAL_DRIVERS, HUB_LOCATION, WEATHER_STATUS, CROP_KNOWLEDGE_BASE } from '../lib/mockData';
import { runFarmerLiaisonAgent, runLogisticsPlannerAgent, simulateNegotiationStep, searchKnowledgeBase } from '../lib/agentEngine';

export default function Dashboard() {
  // Application State
  const [listings, setListings] = useState<FarmerListing[]>(INITIAL_LISTINGS);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [negotiations, setNegotiations] = useState<NegotiationMessage[]>([]);
  const [weather] = useState(WEATHER_STATUS);
  
  // Demo Controls
  const [activeStep, setActiveStep] = useState<number>(1); // 1: Farmer Input, 2: Logistics, 3: Negotiation, 4: RAG Advisory
  const [isLiaisonThinking, setIsLiaisonThinking] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [selectedCropForNegotiation, setSelectedCropForNegotiation] = useState<string>('Maize');
  
  // Custom Farmer Input State
  const [farmerVoiceText, setFarmerVoiceText] = useState(
    "Hi, this is Mariamu from Kibiko Farm. I will harvest about 500 kg of fresh tomatoes this Wednesday. I need to get at least 25 shillings per kg because fertilizer was expensive."
  );
  const [farmerNameInput, setFarmerNameInput] = useState("Mariamu Wanjiku");
  
  // RAG Search State
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState<AdvisoryArticle[]>([]);
  const [activeAdvisoryAlert, setActiveAdvisoryAlert] = useState<string | null>(null);

  // Chat window auto scroll
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [negotiations]);

  // Pre-configured speech options
  const VOICE_OPTIONS = [
    {
      label: "Mariamu (Tomatoes)",
      name: "Mariamu Wanjiku",
      text: "Hi, this is Mariamu from Kibiko Farm. I will harvest about 500 kg of fresh tomatoes this Wednesday. I need to get at least 25 shillings per kg because fertilizer was expensive."
    },
    {
      label: "Juma (Maize)",
      name: "Juma Omwamba",
      text: "Hello, Juma here. I am reaping my maize crop. I expect 900 kg ready by Thursday morning. Reserve price is 19 shillings per kilo. Please schedule transport."
    },
    {
      label: "Dev (Potatoes)",
      name: "Dev Patel",
      text: "Namaste. I have 1500 kg of potatoes harvesting on Friday. I am looking for 16 rupees per kg. My ridge is at Sotik North."
    }
  ];

  const selectVoiceSample = (sample: typeof VOICE_OPTIONS[0]) => {
    setFarmerNameInput(sample.name);
    setFarmerVoiceText(sample.text);
  };

  // Step 1: Run Farmer Liaison Agent (FLA)
  const handleParseVoiceInput = async () => {
    if (!farmerVoiceText.trim() || !farmerNameInput.trim()) return;
    
    setIsLiaisonThinking(true);
    
    try {
      const newListing = await runFarmerLiaisonAgent(farmerVoiceText, farmerNameInput);
      
      setListings(prev => {
        // Avoid duplicate ids if running multiple times
        if (prev.some(l => l.id === newListing.id)) return prev;
        return [...prev, newListing as FarmerListing];
      });

      // Update state step indicator
      setActiveStep(2);
      
      // Flash notifications or alerts
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLiaisonThinking(false);
    }
  };

  // Step 2: Run Logistics Planner Agent (LPA)
  const handleOptimizeLogistics = () => {
    const result = runLogisticsPlannerAgent(listings, drivers);
    
    if (result.trips.length === 0) {
      alert("No pending listings matching available drivers found. Register new yields first!");
      return;
    }

    setTrips(prev => [...prev, ...result.trips]);
    setListings(result.updatedListings);
    setDrivers(result.updatedDrivers);
    
    // Auto-select crop for negotiation based on what was pooled
    if (result.trips.length > 0) {
      setSelectedCropForNegotiation(result.trips[0].listings[0].cropName);
    }

    setActiveStep(3);
  };

  // Step 3: Run B2B Market Negotiator Agent (MNA)
  const handleStartNegotiation = () => {
    if (isNegotiating) return;
    setIsNegotiating(true);
    setNegotiations([]);

    // Find trip info for the selected crop
    const activeTrip = trips.find(t => t.listings[0]?.cropName === selectedCropForNegotiation);
    const cropName = selectedCropForNegotiation;
    const totalWeight = activeTrip ? activeTrip.totalWeight : 1400; // fallback mock
    const reservePrice = activeTrip ? activeTrip.listings[0].reservePricePerKg : 20;

    let currentMessages: NegotiationMessage[] = [];
    
    // Step-by-step dispatch intervals to animate the negotiation in real-time
    const runStep = (stepIdx: number) => {
      setTimeout(() => {
        currentMessages = simulateNegotiationStep(currentMessages, cropName, totalWeight, reservePrice);
        setNegotiations([...currentMessages]);

        if (stepIdx < 5) {
          runStep(stepIdx + 1);
        } else {
          setIsNegotiating(false);
          setActiveStep(4);
          // Explode confetti on negotiation success!
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 }
          });

          // Mark listings in the trip as SOLD
          if (activeTrip) {
            setListings(prev => 
              prev.map(l => {
                const isPart = activeTrip.listings.some(atl => atl.id === l.id);
                if (isPart) {
                  return { ...l, status: 'SOLD', agreedPricePerKg: Math.round(reservePrice * 1.1) };
                }
                return l;
              })
            );
            // Move driver and trip along the map
            setTrips(prev => 
              prev.map(t => t.id === activeTrip.id ? { ...t, status: 'IN_TRANSIT' } : t)
            );
          }
        }
      }, 2000);
    };

    runStep(0);
  };

  // Reset Demo State
  const handleResetDemo = () => {
    setListings(INITIAL_LISTINGS);
    setDrivers(INITIAL_DRIVERS);
    setTrips([]);
    setNegotiations([]);
    setActiveStep(1);
    setRagQuery('');
    setRagResults([]);
    setActiveAdvisoryAlert(null);
  };

  // Step 4: RAG Advisory Search (AAA)
  const handleSearchRAG = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    const results = searchKnowledgeBase(ragQuery);
    setRagResults(results);
  };

  // Trigger Pest Alert Simulation
  const triggerPestWarning = () => {
    setActiveAdvisoryAlert(
      "High Risk Warning: Weather humidity is at 82%, correlating with historical outbreaks of Late Blight in tomato fields in Sotik/Kibiko. Tomato farmers are recommended to apply organic copper soaps immediately."
    );
    setActiveStep(4);
  };

  // Compute stats
  const totalWeightSaved = listings.reduce((sum, l) => l.status === 'SOLD' ? sum + l.quantityKg : sum, 0);
  const totalFarmersSaved = listings.filter(l => l.status === 'SOLD').length;
  const carbonOffset = Math.round(totalWeightSaved * 0.18); // 0.18 kg CO2 saved per kg of produce waste avoided
  const avgPremium = totalWeightSaved > 0 ? "10%" : "0%";

  return (
    <div className="flex-1 flex flex-col min-h-screen text-slate-100 p-4 lg:p-6 select-none bg-[#06090e]">
      
      {/* Header bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-white/5 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Globe className="h-6 w-6 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                AgriSwarms <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">Capston MVP</span>
              </h1>
              <p className="text-xs text-slate-400 font-light">Decentralized Multi-Agent Logistics & Collective Bargaining Network</p>
            </div>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            System Live: 4 Co-Op Agents Active
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/40 border border-white/5 text-slate-300">
            <Activity className="h-3 w-3 text-indigo-400" />
            RAG database synced
          </div>
          <button 
            onClick={handleResetDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-white/10 text-slate-300 transition cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Demo
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Demo Walkthrough Controller & Agent Consoles (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Section: Stepper Flow Guide */}
          <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-xl rounded-full"></div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-400 mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-400" />
              Demo Phase Controller
            </h2>
            <div className="flex justify-between items-center gap-2">
              {[
                { step: 1, label: 'Farmer Voice' },
                { step: 2, label: 'LPA Route' },
                { step: 3, label: 'MNA Negotiate' },
                { step: 4, label: 'AAA RAG' },
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setActiveStep(s.step)}
                  className={`flex-1 py-2 px-1 text-center rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                    activeStep === s.step
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                      : activeStep > s.step
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'
                      : 'bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/10'
                  }`}
                >
                  <div className="font-bold mb-0.5">Phase {s.step}</div>
                  <div className="truncate">{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Stepper Content Box */}
          <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col justify-between min-h-[360px]">
            
            {/* Step 1 Content: FLA WhatsApp Simulation */}
            {activeStep === 1 && (
              <div className="flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                      Agent: Farmer Liaison (FLA)
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                      Voice Parsing
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Simulate WhatsApp Voice Intake</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Isolated farmers use voice recordings to state their harvests in local dialects. The FLA translates, interprets, and structures the variables automatically.
                  </p>

                  {/* Preset quick buttons */}
                  <div className="mb-4">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1.5 tracking-wider">Select Preset Voice Intake:</div>
                    <div className="flex flex-wrap gap-2">
                      {VOICE_OPTIONS.map((v, i) => (
                        <button
                          key={i}
                          onClick={() => selectVoiceSample(v)}
                          className="text-xs bg-slate-800 hover:bg-slate-700 border border-white/5 px-2.5 py-1 rounded-md transition cursor-pointer"
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Farmer Identity</label>
                      <input 
                        type="text" 
                        value={farmerNameInput}
                        onChange={(e) => setFarmerNameInput(e.target.value)}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">WhatsApp Audio Transcription (Swahili/English phonetic)</label>
                      <textarea
                        rows={3}
                        value={farmerVoiceText}
                        onChange={(e) => setFarmerVoiceText(e.target.value)}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 resize-none font-light leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleParseVoiceInput}
                    disabled={isLiaisonThinking}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    {isLiaisonThinking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Agent Extracting Structured Data...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-current" />
                        Trigger FLA Voice Analysis
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 Content: LPA Logistics Routing */}
            {activeStep === 2 && (
              <div className="flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                      Agent: Logistics Planner (LPA)
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5 text-indigo-400" />
                      Dynamic Cluster
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Co-op Vehicle Consolidation</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    The LPA scans listings, clusters them by region and date, checks transport capacity, and builds optimal multi-stop routes. This eliminates individual fuel expenses.
                  </p>

                  <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Pending Local Shipments</span>
                      <span className="font-semibold text-white">
                        {listings.filter(l => l.status === 'PENDING').length} listings
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Available Cargo Drivers</span>
                      <span className="font-semibold text-white">
                        {drivers.filter(d => d.status === 'IDLE').length} registered
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Consolidation Buffer</span>
                      <span className="font-semibold text-slate-300">Within 3-Day Proximity</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleOptimizeLogistics}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10"
                  >
                    <Truck className="h-4 w-4" />
                    Consolidate Cargo & Generate Trip Routes
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 Content: MNA Negotiations */}
            {activeStep === 3 && (
              <div className="flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                      Agent: B2B Negotiator (MNA)
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                      Dynamic Auction
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Collective Bulk Negotiation</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    The MNA pools the collective yield of smallholders into a single high-volume listing, then autonomously bargains with commercial buyers for premium rates.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Select Pooled Crop for Bargaining</label>
                      <select 
                        value={selectedCropForNegotiation}
                        onChange={(e) => setSelectedCropForNegotiation(e.target.value)}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                      >
                        {Array.from(new Set(listings.map(l => l.cropName))).map(crop => (
                          <option key={crop} value={crop}>{crop} Listings</option>
                        ))}
                      </select>
                    </div>

                    {trips.some(t => t.listings[0]?.cropName === selectedCropForNegotiation) ? (
                      <div className="bg-emerald-500/5 border border-emerald-500/15 p-3 rounded-lg text-xs text-emerald-400">
                        ✓ Active cargo pooled: {trips.find(t => t.listings[0]?.cropName === selectedCropForNegotiation)?.totalWeight}kg mapped to transport.
                      </div>
                    ) : (
                      <div className="bg-amber-500/5 border border-amber-500/15 p-3 rounded-lg text-xs text-amber-400">
                        ⚠ No active logistics trip for {selectedCropForNegotiation} yet. LPA will simulate negotiation with mock values.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleStartNegotiation}
                    disabled={isNegotiating}
                    className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                  >
                    {isNegotiating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Bidding & Countering in Progress...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4" />
                        Initiate Autonomous Negotiation
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4 Content: AAA Agronomist RAG Console */}
            {activeStep === 4 && (
              <div className="flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                      Agent: Agronomist (AAA)
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                      RAG Diagnostics
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Pest Risk & Local Advisory</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    RAG filters scientific handbooks and climate feeds to create organic suggestions. You can search issues or trigger weather alarms.
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={triggerPestWarning}
                      className="w-full py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-semibold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Simulate Regional Weather Risk (Late Blight)
                    </button>

                    <form onSubmit={handleSearchRAG} className="relative">
                      <input
                        type="text"
                        placeholder="Search RAG manuals (e.g., tomato blight)..."
                        value={ragQuery}
                        onChange={(e) => setRagQuery(e.target.value)}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      />
                      <button 
                        type="submit"
                        className="absolute right-2 top-2 text-slate-400 hover:text-emerald-400 cursor-pointer"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 italic text-center pt-2">
                  Query returns vector matches from agricultural guidelines.
                </div>
              </div>
            )}

          </div>

        </div>

        {/* MIDDLE COLUMN: SVG Interactive Map & Active Listings (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Produce Transferred', val: `${totalWeightSaved.toLocaleString()} kg`, icon: Leaf, color: 'text-emerald-400' },
              { label: 'Co-Op Farmers Payed', val: totalFarmersSaved, icon: Users, color: 'text-indigo-400' },
              { label: 'Bargained Price Premium', val: avgPremium, icon: TrendingUp, color: 'text-amber-400' },
              { label: 'CO2 Offset (Spoilage)', val: `${carbonOffset} kg`, icon: CloudLightning, color: 'text-sky-400' },
            ].map((stat, idx) => (
              <div key={idx} className="glass-panel rounded-xl p-3.5 flex items-center gap-3">
                <div className={`p-2 bg-slate-800 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{stat.label}</div>
                  <div className="text-sm font-bold text-white">{stat.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* MAIN GRAPHICS PANEL: 3 Tabs (Map, Active Listings, Negotiation/RAG results) */}
          <div className="glass-panel rounded-2xl flex-1 flex flex-col overflow-hidden min-h-[500px]">
            
            {/* Tab header */}
            <div className="border-b border-white/5 bg-slate-900/30 px-5 py-3 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Cooperative District Monitoring Hub (Live Visualization)
              </h2>
              <span className="text-[11px] text-slate-400 italic">Nakuru County, East District</span>
            </div>

            {/* Content: Map and details split */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12">
              
              {/* Map Canvas (7 Columns on md+) */}
              <div className="md:col-span-7 bg-[#0b0f17]/60 p-4 border-r border-white/5 relative flex items-center justify-center min-h-[300px]">
                
                {/* SVG Visual Map */}
                <svg viewBox="0 0 400 400" className="w-full h-full max-h-[360px] select-none">
                  
                  {/* Grid Lines for style */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="400" height="400" fill="url(#grid)" />
                  
                  {/* District Boundaries */}
                  <rect x="10" y="10" width="380" height="380" rx="15" fill="none" stroke="rgba(16, 185, 129, 0.05)" strokeWidth="2" strokeDasharray="5" />
                  
                  {/* Draw logistics route points when active */}
                  {trips.map(trip => (
                    <g key={trip.id}>
                      {/* Lines connecting stops */}
                      {trip.routePoints.map((pt, idx) => {
                        if (idx === 0) return null;
                        const prevPt = trip.routePoints[idx - 1];
                        return (
                          <line
                            key={idx}
                            x1={prevPt.x}
                            y1={prevPt.y}
                            x2={pt.x}
                            y2={pt.y}
                            stroke={trip.status === 'IN_TRANSIT' ? '#6366f1' : '#475569'}
                            strokeWidth={2}
                            strokeDasharray={trip.status === 'IN_TRANSIT' ? '6,4' : '4,4'}
                            className={trip.status === 'IN_TRANSIT' ? 'route-path-animated' : ''}
                          />
                        );
                      })}
                    </g>
                  ))}

                  {/* Nakuru Central Hub Pin */}
                  <g transform={`translate(${HUB_LOCATION.x}, ${HUB_LOCATION.y})`} className="cursor-pointer">
                    <circle r="16" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" strokeWidth="1" />
                    <circle r="8" fill="#10b981" />
                    <circle r="3" fill="#ffffff" />
                    <foreignObject x="-50" y="18" width="100" height="24">
                      <div className="text-[8px] text-center font-bold bg-[#0b0f17] border border-emerald-500/30 text-emerald-400 px-1 py-0.5 rounded shadow">
                         Nakuru Co-op Hub
                      </div>
                    </foreignObject>
                  </g>

                  {/* Farmer Farm Pins */}
                  {listings.map(l => {
                    const isPending = l.status === 'PENDING';
                    const isPooled = l.status === 'POOLED';
                    const isSold = l.status === 'SOLD';
                    
                    let pinColor = '#f59e0b'; // Pooled orange
                    if (isPending) pinColor = '#10b981'; // Green
                    if (isSold) pinColor = '#6366f1'; // Sold Indigo

                    return (
                      <g key={l.id} transform={`translate(${l.location.x}, ${l.location.y})`} className="cursor-pointer">
                        <circle 
                          r={isPending ? "10" : "8"} 
                          fill={pinColor} 
                          opacity={isPending ? "0.2" : "0.4"} 
                          className={isPending ? "animate-pulse-node" : ""}
                        />
                        <circle r="4" fill={pinColor} />
                        
                        {/* Little indicator flags */}
                        <foreignObject x="-30" y="-22" width="60" height="18">
                          <div className="text-[7px] text-center bg-slate-900/90 border border-white/10 text-white rounded px-0.5 py-0.2 truncate shadow font-medium">
                            {l.farmerName.split(' ')[0]} ({l.cropName[0]})
                          </div>
                        </foreignObject>
                      </g>
                    );
                  })}

                  {/* Active vehicle moving when Trip is in transit */}
                  {trips.filter(t => t.status === 'IN_TRANSIT').map(t => {
                    // Place truck at the midpoint of route for animation display
                    const midIdx = Math.floor(t.routePoints.length / 2);
                    const pt = t.routePoints[midIdx];

                    return (
                      <g key={t.id} transform={`translate(${pt.x}, ${pt.y})`}>
                        <circle r="12" fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="1" className="animate-ping" />
                        <rect x="-8" y="-6" width="16" height="12" rx="2" fill="#6366f1" />
                        <circle cx="-4" cy="6" r="2" fill="#000" />
                        <circle cx="4" cy="6" r="2" fill="#000" />
                        <foreignObject x="-30" y="-22" width="60" height="14">
                          <div className="text-[7px] text-center font-bold text-indigo-300">
                            🚚 Transit
                          </div>
                        </foreignObject>
                      </g>
                    );
                  })}

                </svg>

                {/* Map Overlay Legends */}
                <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-white/5 rounded-lg p-2 text-[9px] space-y-1">
                  <div className="font-semibold text-white uppercase tracking-wider mb-1">Map Legend</div>
                  <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Pending Yield (FLA logged)</div>
                  <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500"></span> Pooled & Route Scheduled (LPA)</div>
                  <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500"></span> Bulk Sold & Dispatched (MNA)</div>
                </div>

              </div>

              {/* Data Panel: Crop Yield Listings & Active Routing lists (5 Columns) */}
              <div className="md:col-span-5 p-4 flex flex-col gap-4 overflow-y-auto max-h-[460px]">
                
                {/* Section: Active Listings */}
                <div>
                  <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Active Co-op Listings</span>
                    <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[8px]">
                      {listings.length} total
                    </span>
                  </h3>
                  
                  <div className="space-y-2">
                    {listings.map((l) => (
                      <div 
                        key={l.id} 
                        className={`p-2.5 rounded-lg border text-xs flex justify-between items-center transition ${
                          l.status === 'SOLD' 
                            ? 'bg-indigo-500/5 border-indigo-500/20' 
                            : l.status === 'POOLED' 
                            ? 'bg-amber-500/5 border-amber-500/20' 
                            : 'bg-slate-900/60 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-1">
                            {l.farmerName}
                            <span className="text-[9px] font-normal text-slate-400">({l.id})</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {l.quantityKg}kg {l.cropName} • Ready {l.harvestDate}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-white">
                            {l.status === 'SOLD' ? `Ksh ${l.agreedPricePerKg}` : `Ksh ${l.reservePricePerKg}`}/kg
                          </div>
                          <span className={`inline-block text-[8px] px-1.5 py-0.5 rounded-full font-bold mt-1 ${
                            l.status === 'SOLD' 
                              ? 'bg-indigo-500/10 text-indigo-400' 
                              : l.status === 'POOLED' 
                              ? 'bg-amber-500/10 text-amber-400' 
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {l.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Logistics Trips */}
                {trips.length > 0 && (
                  <div>
                    <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Consolidated Trips</h3>
                    <div className="space-y-2">
                      {trips.map(t => (
                        <div key={t.id} className="p-2.5 bg-indigo-500/5 border border-indigo-500/25 rounded-lg text-xs">
                          <div className="flex justify-between font-bold text-white mb-1">
                            <span>Route: {t.id}</span>
                            <span className="text-[9px] text-indigo-300 flex items-center gap-1 font-semibold">
                              🚚 {t.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 space-y-0.5">
                            <div>Driver: <span className="text-slate-300 font-medium">{t.driver.name}</span></div>
                            <div>Payload: <span className="text-slate-300 font-medium">{t.totalWeight}kg {t.listings[0]?.cropName}</span></div>
                            <div>Stops: <span className="text-slate-300">{t.listings.length} farms</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>

          {/* LOWER GRID: Live Agents Negotiation Chat & Agronomist Diagnostic results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Negotiation Output */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col h-[320px] overflow-hidden">
              <h3 className="text-xs font-bold text-white border-b border-white/5 pb-2 mb-3 flex items-center gap-1.5 text-amber-400">
                <MessageSquare className="h-4 w-4" />
                MNA Live Bargaining Log (Negotiation Loop)
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                {negotiations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
                    <MessageSquare className="h-8 w-8 text-slate-600 mb-2" />
                    <p className="text-xs">No active negotiations in progress.</p>
                    <p className="text-[10px] text-slate-600 font-light mt-1">Complete steps 1 & 2, then click "Initiate Autonomous Negotiation".</p>
                  </div>
                ) : (
                  negotiations.map((msg) => {
                    let containerClass = "flex flex-col max-w-[85%] rounded-xl p-2.5 text-xs ";
                    let senderLabel = msg.senderName;
                    
                    if (msg.sender === 'SYSTEM') {
                      return (
                        <div key={msg.id} className="w-full text-center text-[10px] bg-slate-900/60 border border-white/5 text-slate-400 py-1.5 px-3 rounded-lg font-light italic leading-normal">
                          {msg.text}
                        </div>
                      );
                    } else if (msg.sender === 'AGENT') {
                      containerClass += "bg-amber-500/10 border border-amber-500/25 self-start text-amber-200";
                    } else {
                      containerClass += "bg-slate-800 border border-white/5 self-end text-slate-100 ml-auto";
                    }

                    return (
                      <div key={msg.id} className={msg.sender === 'AGENT' ? 'flex justify-start' : 'flex justify-end'}>
                        <div className={containerClass}>
                          <div className="flex justify-between items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider">{senderLabel}</span>
                            <span className="text-[8px] text-slate-500 font-light">{msg.timestamp}</span>
                          </div>
                          <p className="font-light leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* RAG Advisory & Weather risks logs */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col h-[320px] overflow-hidden">
              <h3 className="text-xs font-bold text-white border-b border-white/5 pb-2 mb-3 flex items-center justify-between text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <Leaf className="h-4 w-4" />
                  AAA Agronomist Diagnostics (RAG Output)
                </span>
                <span className="text-[9px] font-medium bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                  Pest Risk: {weather.pestRisk}
                </span>
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                
                {/* Proactive Blight Alert display */}
                {activeAdvisoryAlert && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-1.5 text-red-400 font-bold mb-1">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Climate-Triggered Disease Threat
                    </div>
                    <p className="text-slate-300 leading-relaxed font-light">{activeAdvisoryAlert}</p>
                    
                    <button 
                      onClick={() => {
                        setRagQuery('tomato late blight');
                        setRagResults(searchKnowledgeBase('tomato late blight'));
                      }}
                      className="mt-2 text-[10px] text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Retrieve FAO Management Document <ArrowRight className="h-3 w-3" />
                    </button>
                  </motion.div>
                )}

                {/* Weather monitoring summary */}
                <div className="grid grid-cols-3 gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-white/5 text-center text-xs">
                  <div>
                    <div className="text-[9px] text-slate-500">Air Humidity</div>
                    <div className="font-bold text-white mt-0.5">{weather.humidity}%</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500">Avg Temp</div>
                    <div className="font-bold text-white mt-0.5">{weather.temp}°C</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500">Forecast</div>
                    <div className="font-bold text-white mt-0.5">{weather.condition}</div>
                  </div>
                </div>

                {/* RAG search query returns */}
                {ragResults.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vector Document Matches ({ragResults.length})</div>
                    {ragResults.map((art) => (
                      <div key={art.id} className="p-3 bg-slate-900/60 border border-white/5 rounded-xl text-xs space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white">{art.title}</span>
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20">{art.crop}</span>
                        </div>
                        
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase">Symptoms</span>
                          <ul className="list-disc list-inside text-slate-300 font-light mt-0.5">
                            {art.symptoms.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>

                        <div>
                          <span className="text-[9px] text-emerald-400 font-bold block uppercase">Organic Remedy</span>
                          <p className="text-slate-300 font-light mt-0.5">{art.organicRemedy}</p>
                        </div>

                        <div className="text-[8px] text-slate-500 font-light border-t border-white/5 pt-1 mt-1">
                          Source: {art.source}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  !activeAdvisoryAlert && (
                    <div className="h-28 flex flex-col items-center justify-center text-center text-slate-500">
                      <HelpCircle className="h-6 w-6 text-slate-600 mb-1" />
                      <p className="text-xs">No query searched yet.</p>
                      <p className="text-[9px] text-slate-600 font-light">Type disease symptoms in the AAA panel to retrieve guidelines.</p>
                    </div>
                  )
                )}

              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Footer bar */}
      <footer className="mt-6 pt-4 border-t border-white/5 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div>
          © 2026 AgriSwarms. Built for the Capstone "Agents for Good" Track.
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-300 transition">GitHub Sandbox</a>
          <a href="#" className="hover:text-slate-300 transition">FAO Manual Database</a>
          <a href="#" className="hover:text-slate-300 transition">Privacy & Location Masking Policy</a>
        </div>
      </footer>

    </div>
  );
}
