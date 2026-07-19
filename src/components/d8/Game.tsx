'use client';

import React, { useState, useEffect } from 'react';

type GameState = 'START' | 'PLAYING' | 'END';

interface Stats {
  p: number; // Pressure
  t: number; // Temperature
  o: number; // Oxygen
  h: number; // Habitability
}

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [stats, setStats] = useState<Stats>({ p: 50, t: 50, o: 50, h: 100 });
  const [stars, setStars] = useState<any[]>([]);

  // Generate background stars once
  useEffect(() => {
    const newStars = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      animDelay: Math.random() * 4
    }));
    setStars(newStars);
  }, []);

  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      setScore((s) => s + 1);

      setStats((prev) => {
        // Drift calculations
        let newP = prev.p + (Math.random() * 6 - 3); // -3 to +3
        let newT = prev.t + (prev.p - 50) * 0.12 + (Math.random() * 4 - 2); 
        let newO = prev.o - 0.8 - Math.abs(50 - prev.t) * 0.04 + (Math.random() * 2 - 1);

        // Clamp to 0-100
        newP = Math.max(0, Math.min(100, newP));
        newT = Math.max(0, Math.min(100, newT));
        newO = Math.max(0, Math.min(100, newO));

        // Habitability calculation
        const pDiff = Math.abs(50 - newP);
        const tDiff = Math.abs(50 - newT);
        const oDiff = Math.abs(50 - newO);

        const totalDiff = pDiff + tDiff + oDiff;
        const threshold = 40;

        let delta = 0;
        if (totalDiff < threshold) {
          delta = 1.5; // Heal
        } else {
          delta = -((totalDiff - threshold) * 0.15); // Damage
        }

        let newH = prev.h + delta;
        newH = Math.max(0, Math.min(100, newH));

        if (newH <= 0) {
          setGameState('END');
        }

        return { p: newP, t: newT, o: newO, h: newH };
      });
    }, 500);

    return () => clearInterval(interval);
  }, [gameState]);

  const adjust = (stat: keyof Stats, amount: number) => {
    setStats((prev) => ({
      ...prev,
      [stat]: Math.max(0, Math.min(100, prev[stat] + amount))
    }));
  };

  const getPlanetStyle = () => {
    let baseColor = '#7de8c3'; // Mint
    let glowColor = '125, 232, 195';

    if (stats.t > 75) {
      baseColor = '#f9a8d4'; // Pink (Too hot visually)
      glowColor = '249, 168, 212';
    } else if (stats.t < 25) {
      baseColor = '#c4b5fd'; // Lavender (Too cold visually)
      glowColor = '196, 181, 253';
    } else if (stats.o < 25) {
      baseColor = '#6b7280'; // Gray
      glowColor = '107, 114, 128';
    }

    const intensity = Math.max(10, (stats.p / 100) * 45); // 10 to 45px
    const opacity = Math.max(0.3, stats.p / 100);

    return {
      backgroundColor: baseColor,
      boxShadow: `inset -15px -15px 30px rgba(0,0,0,0.6), inset 8px 8px 15px rgba(255,255,255,0.3), 0 0 ${intensity}px rgba(${glowColor}, ${opacity})`
    };
  };

  return (
    <div className="max-w-[430px] mx-auto h-[500px] w-full relative overflow-hidden bg-[#0b1026] text-white font-sans rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-[#c4b5fd]/20 flex flex-col select-none">
      <style>{`
        @keyframes slow-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-slow-spin {
          animation: slow-spin 20s linear infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      {/* Starfield Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c4b5fd]/10 to-transparent" />
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: `twinkle 3s infinite ${star.animDelay}s ease-in-out`
            }}
          />
        ))}
      </div>

      {/* Damage overlay */}
      {stats.h < 30 && gameState === 'PLAYING' && (
        <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none z-0" />
      )}

      {/* Start Screen */}
      {gameState === 'START' && (
        <div className="absolute inset-0 bg-[#0b1026] z-50 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
          <div className="relative w-28 h-28 mb-8">
            <div className="absolute inset-0 rounded-full bg-[#7de8c3] shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.5),_0_0_30px_rgba(125,232,195,0.4)] animate-pulse" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-[-12px] rounded-full border-[2px] border-[#c4b5fd]/50 border-t-transparent animate-spin" style={{ animationDuration: '4s' }} />
            <div className="absolute inset-[-24px] rounded-full border-[2px] border-[#f9a8d4]/40 border-b-transparent animate-spin" style={{ animationDuration: '7s', animationDirection: 'reverse' }} />
          </div>
          
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#7de8c3] via-[#c4b5fd] to-[#f9a8d4] mb-2 tracking-tighter drop-shadow-lg">
            TERRAFORM
          </h1>
          <p className="text-[#c4b5fd] font-mono text-[10px] mb-10 tracking-[0.3em] uppercase">Project Goldilocks</p>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left text-[11px] text-gray-300 mb-10 space-y-4 w-full shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-[#c4b5fd] shadow-[0_0_8px_#c4b5fd]"/> Keep levels near 50%.</div>
            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-[#f9a8d4] shadow-[0_0_8px_#f9a8d4]"/> High Pressure raises Temp.</div>
            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-[#7de8c3] shadow-[0_0_8px_#7de8c3]"/> Extreme Temps kill Oxygen.</div>
          </div>
          
          <button 
            onClick={() => {
              setStats({ p: 50, t: 50, o: 50, h: 100 });
              setScore(0);
              setGameState('PLAYING');
            }}
            className="w-full py-4 bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] text-[#0b1026] font-black tracking-widest rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(125,232,195,0.4)] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[0%] transition-transform duration-300" />
            <span className="relative z-10">INITIATE PROTOCOL</span>
          </button>
        </div>
      )}

      {/* Header UI */}
      <div className="relative z-10 px-5 pt-5 flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[9px] text-[#c4b5fd] tracking-widest font-bold">HABITABILITY</span>
            <span className={`text-2xl font-mono font-bold leading-none ${stats.h < 30 ? 'text-red-400' : 'text-white'}`}>
              {Math.max(0, Math.round(stats.h))}%
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-[#c4b5fd] tracking-widest font-bold">YEARS SURVIVED</span>
            <span className="text-2xl font-mono font-bold leading-none text-[#7de8c3]">
              {score}
            </span>
          </div>
        </div>
        
        <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/10 shadow-inner mt-1">
          <div 
            className={`h-full transition-all duration-300 ${stats.h < 30 ? 'bg-red-500' : 'bg-gradient-to-r from-[#f9a8d4] to-[#7de8c3]'}`}
            style={{ width: `${stats.h}%` }}
          />
        </div>
      </div>

      {/* Planet Area */}
      <div className="flex-1 flex items-center justify-center relative z-10 my-2">
        <div 
          className="relative rounded-full transition-colors duration-700 ease-in-out flex items-center justify-center overflow-hidden"
          style={{ 
            width: '160px', 
            height: '160px',
            ...getPlanetStyle()
          }}
        >
          {/* Surface details */}
          <div className="absolute top-[20%] left-[20%] w-10 h-10 rounded-full bg-black/15 blur-[1px]" />
          <div className="absolute bottom-[15%] right-[25%] w-14 h-8 rounded-full bg-black/15 -rotate-12 blur-[2px]" />
          <div className="absolute top-[50%] left-[65%] w-6 h-6 rounded-full bg-black/10 blur-[1px]" />
          
          {/* Clouds Layer 1 */}
          <div 
            className="absolute inset-[-4px] rounded-full border-[8px] border-white/20 border-t-transparent border-r-transparent animate-slow-spin mix-blend-overlay transition-opacity duration-500"
            style={{ opacity: stats.o / 100 }}
          />
          {/* Clouds Layer 2 */}
          <div 
            className="absolute inset-[-8px] rounded-full border-[4px] border-white/15 border-b-transparent border-l-transparent animate-slow-spin mix-blend-overlay transition-opacity duration-500"
            style={{ animationDirection: 'reverse', animationDuration: '12s', opacity: (stats.o / 100) * 0.8 }}
          />
        </div>
      </div>

      {/* Controls Area */}
      <div className="relative z-10 px-4 pb-5 flex flex-col gap-2.5 mt-auto">
        <ControlPanel 
          label="ATMOSPHERIC PRESSURE" 
          value={stats.p} 
          colorClass="bg-[#c4b5fd]" 
          onDecrease={() => adjust('p', -8)} 
          onIncrease={() => adjust('p', 8)} 
        />
        <ControlPanel 
          label="SURFACE TEMPERATURE" 
          value={stats.t} 
          colorClass="bg-[#f9a8d4]" 
          onDecrease={() => adjust('t', -8)} 
          onIncrease={() => adjust('t', 8)} 
        />
        <ControlPanel 
          label="OXYGEN SATURATION" 
          value={stats.o} 
          colorClass="bg-[#7de8c3]" 
          onDecrease={() => adjust('o', -8)} 
          onIncrease={() => adjust('o', 8)} 
        />
      </div>

      {/* End Screen */}
      {gameState === 'END' && (
        <div className="absolute inset-0 bg-[#0b1026]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="w-16 h-16 mb-4 text-[#f9a8d4] animate-pulse">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <h2 className="text-3xl font-black text-[#f9a8d4] mb-2 tracking-widest">ECOSYSTEM COLLAPSE</h2>
          <p className="text-gray-400 text-sm mb-8">Habitability reached 0%.</p>
          
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 w-full mb-10 shadow-lg backdrop-blur-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#7de8c3]/10 rounded-full blur-xl" />
            <p className="text-[10px] text-[#c4b5fd] mb-2 tracking-widest font-bold">COLONY SURVIVAL TIME</p>
            <p className="text-5xl font-mono text-white mb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {score}
            </p>
            <p className="text-xs text-[#7de8c3] tracking-widest">YEARS</p>
          </div>
          
          <button 
            onClick={() => {
              setStats({ p: 50, t: 50, o: 50, h: 100 });
              setScore(0);
              setGameState('PLAYING');
            }}
            className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 active:scale-[0.98] transition-all w-full tracking-widest"
          >
            RETRY MISSION
          </button>
        </div>
      )}
    </div>
  );
}

// Subcomponent for controls
function ControlPanel({ label, value, colorClass, onDecrease, onIncrease }: { label: string, value: number, colorClass: string, onDecrease: () => void, onIncrease: () => void }) {
  return (
    <div className="flex flex-col items-center p-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between w-full mb-2 px-1">
        <span className="text-[9px] text-gray-400 font-bold tracking-widest">{label}</span>
        <span className="text-[10px] text-white font-mono">{Math.round(value)}</span>
      </div>
      
      <div className="flex w-full items-center justify-between gap-3 relative z-10">
        <button 
          onClick={onDecrease} 
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/20 text-white flex items-center justify-center transition-all shadow-[inset_0_1px_rgba(255,255,255,0.1)] border border-white/10 flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
        </button>
        
        <div className="flex-1 h-3 bg-black/60 rounded-full overflow-hidden relative border border-white/10 shadow-inner">
          {/* Target Zone Background */}
          <div className="absolute top-0 left-[40%] w-[20%] h-full bg-white/10" />
          
          {/* Fill Bar */}
          <div 
            className={`absolute top-0 left-0 h-full transition-all duration-200 ${colorClass}`}
            style={{ width: `${value}%` }}
          />
          
          {/* Target markers */}
          <div className="absolute top-0 left-[40%] w-px h-full bg-white/30 z-10" />
          <div className="absolute top-0 left-[60%] w-px h-full bg-white/30 z-10" />
        </div>
        
        <button 
          onClick={onIncrease} 
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/20 text-white flex items-center justify-center transition-all shadow-[inset_0_1px_rgba(255,255,255,0.1)] border border-white/10 flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    </div>
  );
}
