'use client';

import React, { useState, useEffect, useRef } from 'react';

type GameState = 'START' | 'PLAYING' | 'END';

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [time, setTime] = useState(0);
  const [result, setResult] = useState<'SUCCESS' | 'FAIL' | null>(null);
  const [failReason, setFailReason] = useState('');
  const [score, setScore] = useState(0);

  // Derived physics
  const fuel = Math.max(0, 100 - (100 / 15) * time);
  const altitude = 120 * Math.pow(time / 15, 2);
  const velocity = 8000 * Math.pow(time / 15, 1.5);
  const q = time * Math.exp(-time / 4) * 30; // Max ~44 at t=4
  
  const startGame = () => {
    setTime(0);
    setResult(null);
    setFailReason('');
    setScore(0);
    setGameState('PLAYING');
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'PLAYING') {
      timer = setInterval(() => {
        setTime((prev) => {
          const next = prev + 0.05;
          if (next >= 15) {
            setResult('FAIL');
            setFailReason('1st stage fuel depleted. Lost momentum.');
            setScore(0);
            setGameState('END');
            return 15;
          }
          return next;
        });
      }, 50);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  const handleSeparate = () => {
    if (gameState !== 'PLAYING') return;

    if (q > 15) {
      setResult('FAIL');
      setFailReason('Aerodynamic stress too high! Vehicle disintegrated.');
      setScore(0);
      setGameState('END');
    } else if (fuel > 25) {
      setResult('FAIL');
      setFailReason('Staged too early. Target orbit not reached.');
      setScore(10);
      setGameState('END');
    } else {
      const s = Math.round((1 - fuel / 25) * 100);
      setResult('SUCCESS');
      setFailReason('Perfect Staging! MECO & Second stage ignition nominal.');
      setScore(Math.max(0, Math.min(100, s)));
      setGameState('END');
    }
  };
  
  // Stars generation (static)
  const stars = useRef(
    Array.from({ length: 50 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.5
    }))
  ).current;

  const altPercent = Math.min(1, altitude / 100);
  const shakeX = gameState === 'PLAYING' ? (Math.random() - 0.5) * (q / 5) : 0;
  const shakeY = gameState === 'PLAYING' ? (Math.random() - 0.5) * (q / 5) : 0;
  const isExploded = gameState === 'END' && result === 'FAIL' && failReason.includes('Aerodynamic');

  return (
    <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white rounded-xl shadow-2xl border border-white/10 select-none">
      {/* Sky to Space background */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#3b82f6] to-[#1e3a8a] transition-opacity duration-75 pointer-events-none"
        style={{ opacity: 1 - altPercent }}
      />
      
      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: altPercent }}>
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${(star.y + (gameState === 'PLAYING' ? time * star.speed * 20 : 0)) % 100}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: Math.random() * 0.5 + 0.3
            }}
          />
        ))}
      </div>

      {/* Fuel Bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-black/50 z-20">
        <div 
          className="h-full transition-all duration-75"
          style={{ 
            width: `${fuel}%`, 
            backgroundColor: fuel > 20 ? '#7de8c3' : (fuel > 0 ? '#f9a8d4' : 'red') 
          }} 
        />
      </div>

      {/* HUD */}
      <div className="absolute top-5 left-4 right-4 flex justify-between font-mono text-xs uppercase tracking-widest z-20">
        <div className="flex flex-col gap-1.5">
          <span className="text-[#c4b5fd] drop-shadow-md">ALT: {(altitude).toFixed(1)} km</span>
          <span className="text-[#7de8c3] drop-shadow-md">VEL: {(velocity).toFixed(0)} km/h</span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`${fuel > 20 ? 'text-white' : 'text-[#f9a8d4] animate-pulse'} drop-shadow-md`}>
            FUEL: {fuel.toFixed(1)}%
          </span>
          <span className="text-white/60 drop-shadow-md">T+{time.toFixed(1)}s</span>
        </div>
      </div>

      {/* Q Gauge */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-64 w-8 bg-black/60 rounded-full border border-white/10 flex flex-col justify-end p-1 overflow-hidden backdrop-blur-sm z-20">
        {/* Safe zone background indicator (Q < 15, max 50 => 30%) */}
        <div className="absolute bottom-0 left-0 w-full bg-[#7de8c3]/15" style={{ height: '30%' }} />
        <div className="absolute bottom-[30%] left-0 w-full h-px bg-[#7de8c3]/50" />
        
        <div 
          className="w-full rounded-full transition-all duration-75 relative z-10"
          style={{
            height: `${(q / 50) * 100}%`,
            backgroundColor: q > 15 ? '#f9a8d4' : '#7de8c3',
            boxShadow: q > 15 ? '0 0 10px rgba(249,168,212,0.5)' : '0 0 10px rgba(125,232,195,0.5)'
          }}
        />
        <div className="absolute inset-0 flex flex-col justify-between py-3 items-center text-[9px] text-white/50 z-20 font-mono font-bold">
          <span>MAX</span>
          <span style={{ position: 'absolute', bottom: '30%', transform: 'translateY(50%)' }} className="text-[#7de8c3]">SAFE</span>
        </div>
      </div>
      <div className="absolute left-4 top-1/2 -translate-y-[150px] text-[10px] font-mono text-white/50 z-20 w-8 text-center">
        Q(kPa)
      </div>

      {/* Explosion Effect */}
      {isExploded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="w-64 h-64 bg-[#f9a8d4] rounded-full blur-3xl opacity-60 animate-pulse" />
        </div>
      )}

      {/* Rocket */}
      <div 
        className="absolute left-1/2 bottom-24 -translate-x-1/2 flex flex-col items-center z-20"
        style={{ transform: `translate(calc(-50% + ${shakeX}px), ${shakeY}px)` }}
      >
        {/* 2nd Stage */}
        <svg width="40" height="60" viewBox="0 0 40 60" 
          className="relative z-10 transition-all duration-1000 ease-in-out" 
          style={{ 
            transform: gameState === 'END' && result === 'SUCCESS' ? 'translateY(-200px) scale(0.7)' : 'none' 
          }}>
          <path d="M 20 0 C 35 20, 40 30, 40 60 L 0 60 C 0 30, 5 20, 20 0 Z" fill="#e2e8f0" />
          <rect x="0" y="45" width="40" height="4" fill="#c4b5fd" />
          <circle cx="20" cy="35" r="5" fill="#0b1026" stroke="#7de8c3" strokeWidth="1.5" />
          
          {gameState === 'END' && result === 'SUCCESS' && (
            <g className="animate-pulse">
              <path d="M 12 60 L 20 85 L 28 60 Z" fill="#7de8c3" opacity="0.9" />
              <path d="M 16 60 L 20 75 L 24 60 Z" fill="#fff" />
            </g>
          )}
        </svg>

        {/* 1st Stage */}
        <svg width="40" height="100" viewBox="0 0 40 100" 
          className="transition-all duration-1000 ease-in-out" 
          style={{ 
            transform: gameState === 'END' ? 'translateY(300px) rotate(45deg)' : 'none', 
            opacity: gameState === 'END' ? 0 : 1 
          }}>
          <rect x="0" y="0" width="40" height="90" fill="#94a3b8" />
          <rect x="5" y="10" width="30" height="70" fill="#64748b" rx="2" />
          <line x1="0" y1="45" x2="40" y2="45" stroke="#475569" strokeWidth="2" />
          <path d="M 5 90 L 35 90 L 40 100 L 0 100 Z" fill="#334155" />
          
          {gameState === 'PLAYING' && (
            <g className="animate-pulse" style={{ transformOrigin: 'top center', transform: `scaleY(${1 + q/100})` }}>
              <path d="M -5 100 L 20 160 L 45 100 Z" fill="#f9a8d4" opacity="0.8" />
              <path d="M 5 100 L 20 130 L 35 100 Z" fill="#fff" />
            </g>
          )}
        </svg>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSeparate}
        disabled={gameState !== 'PLAYING'}
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full font-black text-lg tracking-widest transition-all z-30
          ${gameState === 'PLAYING' 
            ? 'bg-gradient-to-r from-[#f9a8d4] to-[#c4b5fd] text-gray-900 shadow-[0_0_20px_rgba(249,168,212,0.4)] hover:scale-105 active:scale-95'
            : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-0 pointer-events-none'
          }`}
      >
        SEPARATE
      </button>

      {/* Start Overlay */}
      {gameState === 'START' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6 text-center">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#7de8c3] to-[#c4b5fd] mb-2 tracking-tighter drop-shadow-lg">
            MAX-Q
          </h1>
          <h2 className="text-[#f9a8d4] font-bold tracking-[0.3em] text-xs mb-10">STAGING SIMULATOR</h2>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-10 backdrop-blur-md">
            <p className="text-gray-200 text-sm mb-4 leading-relaxed font-medium">
              Mission Objective:
            </p>
            <ul className="text-left text-xs text-gray-400 space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#f9a8d4]" />
                Survive <span className="text-[#f9a8d4] font-bold">Max-Q</span> (aerodynamic pressure).
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7de8c3]" />
                Wait until Q drops into the <span className="text-[#7de8c3] font-bold">SAFE ZONE</span>.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c4b5fd]" />
                Separate stages before <span className="text-[#c4b5fd] font-bold">FUEL</span> depletes.
              </li>
            </ul>
          </div>

          <button
            onClick={startGame}
            className="px-12 py-4 rounded-full bg-white text-[#0b1026] font-black uppercase tracking-widest hover:bg-[#7de8c3] hover:shadow-[0_0_30px_rgba(125,232,195,0.6)] transition-all"
          >
            Launch
          </button>
        </div>
      )}

      {/* End Overlay */}
      {gameState === 'END' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center animate-in fade-in duration-500">
          <h2 className={`text-4xl font-black mb-4 tracking-tighter ${result === 'SUCCESS' ? 'text-[#7de8c3]' : 'text-[#f9a8d4]'}`}>
            {result === 'SUCCESS' ? 'SUCCESS' : 'FAILED'}
          </h2>
          <p className="text-gray-300 mb-8 text-sm max-w-[250px] leading-relaxed">{failReason}</p>
          
          {result === 'SUCCESS' && (
            <div className="mb-10 flex flex-col items-center bg-white/5 px-8 py-4 rounded-xl border border-white/10">
              <span className="text-gray-400 text-xs mb-2 tracking-[0.2em] font-bold">EFFICIENCY SCORE</span>
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd]">
                {score}
              </span>
              <span className="text-xs text-gray-500 mt-2">100 = Perfect timing</span>
            </div>
          )}

          <button
            onClick={startGame}
            className="px-10 py-4 border-2 border-white/20 rounded-full text-white font-black tracking-widest text-sm hover:bg-white hover:text-[#0b1026] transition-all"
          >
            RETRY
          </button>
        </div>
      )}
    </div>
  );
}
