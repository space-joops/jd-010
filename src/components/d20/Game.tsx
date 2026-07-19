"use client";
import React, { useState, useEffect } from 'react';

type Phase = 'start' | 'playing' | 'end';

interface Mineral {
  id: string;
  name: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  color: string;
  icon: React.ReactNode;
}

const MINERALS: Mineral[] = [
  { 
    id: 'stardust', 
    name: 'Stardust', 
    basePrice: 50, 
    minPrice: 10, 
    maxPrice: 100, 
    color: '#f9a8d4', 
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 7.6 7.6 2.4-7.6 2.4L12 22l-2.4-7.6-7.6-2.4 7.6-2.4L12 2z"/>
      </svg>
    )
  },
  { 
    id: 'nebula_ore', 
    name: 'Nebula Ore', 
    basePrice: 200, 
    minPrice: 80, 
    maxPrice: 400, 
    color: '#7de8c3', 
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l8 6v8l-8 6-8-6V8l8-6z"/>
      </svg>
    )
  },
  { 
    id: 'void_crystal', 
    name: 'Void Crystal', 
    basePrice: 800, 
    minPrice: 300, 
    maxPrice: 1800, 
    color: '#c4b5fd', 
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 12l10 10 10-10L12 2zm0 4.8l5.2 5.2-5.2 5.2-5.2-5.2L12 6.8z"/>
      </svg>
    )
  },
];

const SYSTEMS = [
  { id: 'alpha', name: 'Alpha Centauri' },
  { id: 'sirius', name: 'Sirius' },
  { id: 'vega', name: 'Vega' }
];

const INITIAL_CREDITS = 1000;
const TARGET_CREDITS = 10000;
const MAX_TURNS = 20;

type Inventory = Record<string, number>;
type Prices = Record<string, Record<string, number>>;

const generatePrices = () => {
  const newPrices: Prices = {};
  SYSTEMS.forEach(sys => {
    newPrices[sys.id] = {};
    MINERALS.forEach(min => {
      newPrices[sys.id][min.id] = Math.floor(Math.random() * (min.maxPrice - min.minPrice + 1)) + min.minPrice;
    });
  });
  return newPrices;
};

const Starfield = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
    <g fill="#fff">
      <circle cx="10%" cy="20%" r="1" />
      <circle cx="30%" cy="80%" r="1.5" opacity="0.6" />
      <circle cx="50%" cy="40%" r="2" opacity="0.8" />
      <circle cx="70%" cy="10%" r="1" />
      <circle cx="90%" cy="60%" r="1.5" opacity="0.7" />
      <circle cx="20%" cy="50%" r="1" />
      <circle cx="80%" cy="85%" r="1" opacity="0.5" />
      <circle cx="40%" cy="90%" r="1.5" />
      <circle cx="60%" cy="30%" r="1" opacity="0.9" />
      <circle cx="85%" cy="35%" r="2" opacity="0.4" />
      <circle cx="15%" cy="85%" r="1" />
    </g>
  </svg>
);

const fmt = (n: number) => n.toLocaleString();

export default function Game() {
  const [phase, setPhase] = useState<Phase>('start');
  const [credits, setCredits] = useState(INITIAL_CREDITS);
  const [turn, setTurn] = useState(1);
  const [inventory, setInventory] = useState<Inventory>({ stardust: 0, nebula_ore: 0, void_crystal: 0 });
  const [currentSystem, setCurrentSystem] = useState<string>(SYSTEMS[0].id);
  const [prices, setPrices] = useState<Prices | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    setPrices(generatePrices());
  }, []);

  const startGame = () => {
    setPhase('playing');
    setCredits(INITIAL_CREDITS);
    setTurn(1);
    setInventory({ stardust: 0, nebula_ore: 0, void_crystal: 0 });
    setCurrentSystem(SYSTEMS[0].id);
    setPrices(generatePrices());
    setMessage('');
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  };

  const advanceTurn = (newSystem: string) => {
    if (!prices) return;
    const nextTurn = turn + 1;
    
    if (nextTurn > MAX_TURNS) {
      let finalCredits = credits;
      MINERALS.forEach(min => {
        finalCredits += inventory[min.id] * prices[currentSystem][min.id];
      });
      setCredits(finalCredits);
      setInventory({ stardust: 0, nebula_ore: 0, void_crystal: 0 });
      setPhase('end');
    } else {
      setTurn(nextTurn);
      setPrices(generatePrices());
      setCurrentSystem(newSystem);
    }
  };

  const travel = (systemId: string) => {
    if (systemId === currentSystem) return;
    advanceTurn(systemId);
  };

  const waitTurn = () => {
    advanceTurn(currentSystem);
  };

  const handleBuy = (mineralId: string) => {
    if (!prices) return;
    const price = prices[currentSystem][mineralId];
    if (credits >= price) {
      setCredits(c => c - price);
      setInventory(inv => ({ ...inv, [mineralId]: inv[mineralId] + 1 }));
    } else {
      showMessage("Not enough credits!");
    }
  };

  const handleBuyMax = (mineralId: string) => {
    if (!prices) return;
    const price = prices[currentSystem][mineralId];
    const amount = Math.floor(credits / price);
    if (amount > 0) {
      setCredits(c => c - (price * amount));
      setInventory(inv => ({ ...inv, [mineralId]: inv[mineralId] + amount }));
    } else {
      showMessage("Not enough credits!");
    }
  };

  const handleSell = (mineralId: string) => {
    if (!prices) return;
    if (inventory[mineralId] > 0) {
      const price = prices[currentSystem][mineralId];
      setCredits(c => c + price);
      setInventory(inv => ({ ...inv, [mineralId]: inv[mineralId] - 1 }));
    } else {
      showMessage("No items to sell!");
    }
  };

  const handleSellAll = (mineralId: string) => {
    if (!prices) return;
    if (inventory[mineralId] > 0) {
      const price = prices[currentSystem][mineralId];
      const amount = inventory[mineralId];
      setCredits(c => c + (price * amount));
      setInventory(inv => ({ ...inv, [mineralId]: 0 }));
    } else {
      showMessage("No items to sell!");
    }
  };

  if (!prices) return null;

  return (
    <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans border-2 border-[#c4b5fd]/30 rounded-xl shadow-[0_0_20px_rgba(196,181,253,0.2)] select-none">
      <Starfield />
      
      {message && (
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg z-50 text-center animate-bounce border border-[#c4b5fd] text-sm whitespace-nowrap">
          {message}
        </div>
      )}

      {phase === 'start' && (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center relative z-10">
          <h1 className="text-4xl font-black mb-2 text-[#7de8c3] drop-shadow-[0_0_10px_rgba(125,232,195,0.8)] leading-tight">
            GALACTIC<br/>TRADING
          </h1>
          <p className="text-[#c4b5fd] mb-8 text-lg font-bold tracking-widest">은하계 무역선</p>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-sm text-gray-300 space-y-3 w-full">
            <p>Buy low, sell high across 3 star systems.</p>
            <div className="h-px bg-white/10 w-full my-2"></div>
            <p className="flex justify-between"><span>Goal:</span> <span className="text-[#7de8c3] font-bold">{fmt(TARGET_CREDITS)} Cr</span></p>
            <p className="flex justify-between"><span>Time:</span> <span className="text-[#f9a8d4] font-bold">{MAX_TURNS} Turns</span></p>
          </div>
          
          <button onClick={startGame} className="w-full py-4 bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] text-[#0b1026] font-black text-xl rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(125,232,195,0.5)]">
            START GAME
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <div className="flex flex-col h-full relative z-10">
          {/* Header */}
          <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex justify-between items-center backdrop-blur-sm">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold tracking-wider">TURN</span>
              <span className="font-bold text-[#f9a8d4]">{turn} / {MAX_TURNS}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-400 font-bold tracking-wider">CREDITS</span>
              <span className="font-bold text-[#7de8c3] font-mono text-lg">{fmt(credits)}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex p-2 gap-2 bg-[#0b1026]/80 backdrop-blur-sm">
            {SYSTEMS.map(sys => (
              <button 
                key={sys.id}
                onClick={() => travel(sys.id)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all duration-200 ${
                  currentSystem === sys.id 
                    ? 'bg-white/20 border-[#c4b5fd] text-white shadow-[0_0_10px_rgba(196,181,253,0.3)]' 
                    : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                {sys.name}
              </button>
            ))}
          </div>

          {/* Market */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 no-scrollbar">
            {MINERALS.map(min => (
              <div key={min.id} className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm relative overflow-hidden group hover:border-white/20 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
                  {/* Big background icon */}
                  <div style={{ color: min.color, transform: 'scale(4)' }}>{min.icon}</div>
                </div>
                
                <div className="flex justify-between items-center mb-3 relative z-10">
                   <div className="flex items-center gap-2">
                      <div style={{ color: min.color }}>{min.icon}</div>
                      <span style={{ color: min.color }} className="font-bold text-sm tracking-wide">{min.name}</span>
                   </div>
                   <div className="text-xs bg-black/40 px-2 py-1 rounded">
                     Stock: <span className="text-white font-mono">{inventory[min.id]}</span>
                   </div>
                </div>
                
                <div className="flex justify-between items-end mb-4 relative z-10">
                   <div className="text-xs text-gray-400 flex flex-col">
                     <span>Current Price</span>
                     <div className="flex items-baseline gap-1">
                       <span className="text-2xl text-white font-mono font-bold">{prices[currentSystem][min.id]}</span>
                       <span className="text-xs text-gray-500">Cr</span>
                     </div>
                   </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 relative z-10">
                   <button onClick={() => handleBuy(min.id)} className="bg-[#7de8c3]/10 border border-[#7de8c3]/30 text-[#7de8c3] py-2 rounded text-xs font-bold hover:bg-[#7de8c3]/30 transition-colors">BUY</button>
                   <button onClick={() => handleBuyMax(min.id)} className="bg-[#7de8c3]/10 border border-[#7de8c3]/30 text-[#7de8c3] py-2 rounded text-xs font-bold hover:bg-[#7de8c3]/30 transition-colors">MAX</button>
                   <button onClick={() => handleSell(min.id)} className="bg-[#f9a8d4]/10 border border-[#f9a8d4]/30 text-[#f9a8d4] py-2 rounded text-xs font-bold hover:bg-[#f9a8d4]/30 transition-colors">SELL</button>
                   <button onClick={() => handleSellAll(min.id)} className="bg-[#f9a8d4]/10 border border-[#f9a8d4]/30 text-[#f9a8d4] py-2 rounded text-xs font-bold hover:bg-[#f9a8d4]/30 transition-colors">ALL</button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer (Wait Turn) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0b1026] via-[#0b1026]/90 to-transparent">
            <button onClick={waitTurn} className="w-full py-3 bg-[#c4b5fd]/10 border border-[#c4b5fd]/50 text-[#c4b5fd] rounded-xl font-bold hover:bg-[#c4b5fd]/30 transition-colors flex items-center justify-center gap-2 backdrop-blur-md">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              WAIT 1 TURN (Refresh)
            </button>
          </div>
        </div>
      )}

      {phase === 'end' && (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center relative z-10">
          <div className="mb-6">
            {credits >= TARGET_CREDITS ? (
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7de8c3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto drop-shadow-[0_0_15px_rgba(125,232,195,0.8)]">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            ) : (
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f9a8d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto drop-shadow-[0_0_15px_rgba(249,168,212,0.8)]">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            )}
          </div>
          
          <h1 className="text-4xl font-black mb-2 tracking-wide" style={{ color: credits >= TARGET_CREDITS ? '#7de8c3' : '#f9a8d4' }}>
            {credits >= TARGET_CREDITS ? 'VICTORY' : 'GAME OVER'}
          </h1>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 w-full">
            <p className="text-gray-400 text-sm mb-1">Final Balance</p>
            <p className="text-3xl font-mono text-white mb-4">{fmt(credits)} <span className="text-lg text-gray-500">Cr</span></p>
            
            <div className="h-px bg-white/10 w-full my-4"></div>
            
            <p className="text-sm text-gray-300">
              {credits >= TARGET_CREDITS 
                ? "You reached the target! The galaxy is yours."
                : `You missed the target by ${fmt(TARGET_CREDITS - credits)} Cr.`}
            </p>
          </div>
          
          <button onClick={startGame} className="w-full py-4 bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] text-[#0b1026] font-black text-xl rounded-xl hover:opacity-90 transition-opacity">
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
