"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

type Particle = {
  id: number;
  type: 'matter' | 'antimatter';
  y: number;
  lane: 'left' | 'right';
  hit: boolean;
  missed: boolean;
};

export default function Game() {
  const [uiState, setUiState] = useState<'start' | 'playing' | 'gameover'>('start');
  
  const gameStateRef = useRef<'start' | 'playing' | 'gameover'>('start');
  const scoreRef = useRef(0);
  const heatRef = useRef(0);
  const balanceRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const spawnBalanceRef = useRef(0);
  
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number>(0);
  const speedRef = useRef<number>(30); 
  const particleIdRef = useRef<number>(0);
  
  const [, setTick] = useState(0);
  
  const TARGET_Y = 80;
  const HIT_WINDOW = 12;
  const MAX_HEAT = 100;
  
  const startGame = () => {
    gameStateRef.current = 'playing';
    setUiState('playing');
    scoreRef.current = 0;
    heatRef.current = 0;
    balanceRef.current = 0;
    particlesRef.current = [];
    spawnBalanceRef.current = 0;
    speedRef.current = 30;
    spawnTimerRef.current = 1;
    lastTimeRef.current = performance.now();
    
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  };
  
  const gameOver = () => {
    gameStateRef.current = 'gameover';
    setUiState('gameover');
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const gameLoop = useCallback((time: number) => {
    if (gameStateRef.current !== 'playing') return;

    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
    }
    const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1); 
    lastTimeRef.current = time;

    speedRef.current += deltaTime * 1.5;

    spawnTimerRef.current -= deltaTime;
    if (spawnTimerRef.current <= 0) {
      let type: 'matter' | 'antimatter';
      if (spawnBalanceRef.current >= 2) {
        type = 'matter';
      } else if (spawnBalanceRef.current <= -2) {
        type = 'antimatter';
      } else {
        type = Math.random() > 0.5 ? 'matter' : 'antimatter';
      }
      
      if (type === 'matter') spawnBalanceRef.current--;
      else spawnBalanceRef.current++;

      particlesRef.current.push({
        id: particleIdRef.current++,
        type,
        y: -10,
        lane: type === 'matter' ? 'left' : 'right',
        hit: false,
        missed: false,
      });
      
      const minSpawnTime = 0.35;
      const baseSpawnTime = 1.8;
      spawnTimerRef.current = Math.max(minSpawnTime, baseSpawnTime - (speedRef.current - 30) * 0.025);
    }

    for (let i = 0; i < particlesRef.current.length; i++) {
      const p = particlesRef.current[i];
      if (p.hit) continue;
      
      p.y += speedRef.current * deltaTime;
      
      if (!p.missed && p.y > TARGET_Y + HIT_WINDOW) {
        p.missed = true;
        heatRef.current = Math.min(MAX_HEAT, heatRef.current + 15);
        if (p.type === 'matter') balanceRef.current += 2;
        else balanceRef.current -= 2;
      }
    }
    
    particlesRef.current = particlesRef.current.filter(p => !p.hit && p.y < 110);
    
    const absBalance = Math.abs(balanceRef.current);
    if (absBalance > 5) {
      heatRef.current += deltaTime * (absBalance - 5) * 2;
    }
    
    if (absBalance <= 3 && heatRef.current > 0) {
      heatRef.current -= deltaTime * 4;
    }
    
    heatRef.current = Math.max(0, Math.min(MAX_HEAT, heatRef.current));
    
    if (heatRef.current >= MAX_HEAT) {
      gameOver();
      return;
    }
    
    setTick(t => t + 1);
    requestRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const handleInject = useCallback((type: 'matter' | 'antimatter') => {
    if (gameStateRef.current !== 'playing') return;

    const lane = type === 'matter' ? 'left' : 'right';
    
    let hitId = -1;
    let minDiff = 999;

    particlesRef.current.forEach((p) => {
      if (!p.hit && !p.missed && p.lane === lane) {
        const diff = Math.abs(p.y - TARGET_Y);
        if (diff <= HIT_WINDOW && diff < minDiff) {
          minDiff = diff;
          hitId = p.id;
        }
      }
    });

    if (hitId !== -1) {
      const p = particlesRef.current.find(p => p.id === hitId);
      if (p) p.hit = true;
      
      const accuracy = 1 - (minDiff / HIT_WINDOW);
      const points = Math.floor(accuracy * 15) + 5;
      scoreRef.current += points;
      
      if (type === 'matter') balanceRef.current -= 1;
      else balanceRef.current += 1;
      
      heatRef.current = Math.max(0, heatRef.current - 8);
    } else {
      heatRef.current = Math.min(MAX_HEAT, heatRef.current + 10);
      if (type === 'matter') balanceRef.current -= 1.5;
      else balanceRef.current += 1.5;
    }
    
    balanceRef.current = Math.max(-15, Math.min(15, balanceRef.current));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'f' || e.key === 'F') {
        handleInject('matter');
      } else if (e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') {
        handleInject('antimatter');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInject]);

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  if (uiState === 'start') {
    return (
      <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-[#c4b5fd] border-2 border-[#c4b5fd]/30 rounded-xl shadow-[0_0_30px_rgba(196,181,253,0.15)] flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-black mb-2 text-center" style={{ textShadow: '0 0 15px #7de8c3' }}>ANTIMATTER</h1>
        <h2 className="text-2xl font-bold mb-8 text-center text-[#f9a8d4]" style={{ textShadow: '0 0 10px #f9a8d4' }}>ENGINE</h2>
        
        <p className="text-center text-sm mb-8 opacity-80 max-w-[280px] leading-relaxed">
          Maintain the exact 1:1 ratio of Matter and Antimatter injections.
          <br/><br/>
          Tap Left for <span className="text-[#7de8c3] font-bold">Matter</span>.<br/>
          Tap Right for <span className="text-[#f9a8d4] font-bold">Antimatter</span>.
          <br/><br/>
          Keep the balance stable to prevent engine meltdown!
        </p>

        <button 
          onClick={startGame}
          className="px-8 py-3 rounded-full bg-transparent border-2 border-[#7de8c3] text-[#7de8c3] font-bold text-xl hover:bg-[#7de8c3]/10 active:scale-95 transition-all"
          style={{ boxShadow: '0 0 15px #7de8c355' }}
        >
          INITIALIZE
        </button>
      </div>
    );
  }

  if (uiState === 'gameover') {
    return (
      <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white border-2 border-red-500/50 rounded-xl flex flex-col items-center justify-center p-6" style={{ boxShadow: '0 0 30px rgba(239,68,68,0.3)' }}>
        <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
        
        <h1 className="text-4xl font-black mb-2 text-center text-red-500 z-10" style={{ textShadow: '0 0 15px #ef4444' }}>CORE MELTDOWN</h1>
        
        <div className="text-center z-10 my-8">
          <p className="text-lg text-[#c4b5fd] mb-1">FINAL ENERGY OUTPUT</p>
          <p className="text-6xl font-black text-[#7de8c3]" style={{ textShadow: '0 0 15px #7de8c3' }}>{scoreRef.current}</p>
        </div>

        <button 
          onClick={startGame}
          className="px-8 py-3 rounded-full bg-transparent border-2 border-[#f9a8d4] text-[#f9a8d4] font-bold text-xl hover:bg-[#f9a8d4]/10 active:scale-95 transition-all z-10"
          style={{ boxShadow: '0 0 15px #f9a8d455' }}
        >
          RESTART SEQUENCE
        </button>
      </div>
    );
  }

  const displayBalance = Math.max(-10, Math.min(10, balanceRef.current));
  const heatColor = heatRef.current > 80 ? '#ef4444' : heatRef.current > 50 ? '#f59e0b' : '#3b82f6';
  
  return (
    <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] select-none rounded-xl border border-[#c4b5fd]/20">
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="80%" r="50%">
            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0b1026" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="laneLineMint" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7de8c3" stopOpacity="0" />
            <stop offset="100%" stopColor="#7de8c3" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="laneLinePink" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f9a8d4" stopOpacity="0" />
            <stop offset="100%" stopColor="#f9a8d4" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        
        <circle cx="50" cy="80" r="40" fill="url(#coreGlow)" />
        
        <line x1="0" y1={TARGET_Y} x2="100" y2={TARGET_Y} stroke="#c4b5fd" strokeWidth="0.2" strokeDasharray="2,2" opacity="0.3" />
        
        <path d="M 25 0 L 25 100" stroke="url(#laneLineMint)" strokeWidth="0.5" strokeDasharray="2,2" />
        <path d="M 75 0 L 75 100" stroke="url(#laneLinePink)" strokeWidth="0.5" strokeDasharray="2,2" />
      </svg>

      <div className="absolute top-4 left-4 right-4 flex flex-col gap-2 pointer-events-none z-10">
        <div className="flex justify-between items-center text-[#c4b5fd] font-bold">
          <span className="w-24">HEAT: {Math.floor(heatRef.current)}%</span>
          <span className="text-3xl text-white" style={{ textShadow: '0 0 8px #ffffff' }}>{scoreRef.current}</span>
          <span className="w-24 text-right">BAL: {balanceRef.current > 0 ? '+' : ''}{balanceRef.current.toFixed(1)}</span>
        </div>
        
        <div className="w-full h-2 bg-[#0b1026] rounded-full overflow-hidden border border-gray-700">
          <div 
            className="h-full transition-all duration-100 ease-linear" 
            style={{ width: heatRef.current + '%', backgroundColor: heatColor, boxShadow: '0 0 10px ' + heatColor }}
          />
        </div>
        
        <div className="w-full h-4 bg-[#0b1026] rounded-full relative mt-1 border border-[#c4b5fd]/50 overflow-hidden">
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white z-10 -ml-[1px]" />
          <div 
            className="absolute top-0 bottom-0 transition-all duration-100 ease-linear"
            style={{
              left: displayBalance < 0 ? (50 + (displayBalance / 10) * 50) + '%' : '50%',
              right: displayBalance > 0 ? (50 - (displayBalance / 10) * 50) + '%' : '50%',
              backgroundColor: displayBalance < 0 ? '#7de8c3' : '#f9a8d4',
              boxShadow: '0 0 10px ' + (displayBalance < 0 ? '#7de8c3' : '#f9a8d4')
            }}
          />
        </div>
      </div>

      <div 
        className="absolute w-14 h-14 -ml-7 -mt-7 border-4 rounded-full flex items-center justify-center opacity-40 z-0"
        style={{ left: '25%', top: TARGET_Y + '%', borderColor: '#7de8c3', boxShadow: '0 0 15px #7de8c3, inset 0 0 15px #7de8c3' }}
      />
      <div 
        className="absolute w-14 h-14 -ml-7 -mt-7 border-4 rounded-full flex items-center justify-center opacity-40 z-0"
        style={{ left: '75%', top: TARGET_Y + '%', borderColor: '#f9a8d4', boxShadow: '0 0 15px #f9a8d4, inset 0 0 15px #f9a8d4' }}
      />

      {particlesRef.current.map(p => {
        const isLeft = p.lane === 'left';
        const color = isLeft ? '#7de8c3' : '#f9a8d4';
        const x = isLeft ? '25%' : '75%';
        
        return (
          <div
            key={p.id}
            className="absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center z-10"
            style={{ 
              left: x, 
              top: p.y + '%', 
              backgroundColor: color + '22', 
              border: '2px solid ' + color,
              boxShadow: '0 0 10px ' + color
            }}
          >
            {isLeft ? (
              <div className="w-3 h-3 bg-[#7de8c3] rounded-sm transform rotate-45" />
            ) : (
              <div className="w-3 h-3 bg-[#f9a8d4] rounded-full" />
            )}
          </div>
        );
      })}

      <div className="absolute bottom-6 left-0 right-0 flex justify-between px-8 z-20">
        <button 
          className="w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center active:scale-90 transition-transform bg-[#0b1026]/80"
          style={{ borderColor: '#7de8c3', boxShadow: '0 0 20px #7de8c344', WebkitTapHighlightColor: 'transparent' }}
          onPointerDown={(e) => { e.preventDefault(); handleInject('matter'); }}
        >
          <span className="text-[#7de8c3] font-black text-xl mb-1">M</span>
          <span className="text-[#7de8c3]/80 text-[10px] uppercase">Matter</span>
        </button>
        <button 
          className="w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center active:scale-90 transition-transform bg-[#0b1026]/80"
          style={{ borderColor: '#f9a8d4', boxShadow: '0 0 20px #f9a8d444', WebkitTapHighlightColor: 'transparent' }}
          onPointerDown={(e) => { e.preventDefault(); handleInject('antimatter'); }}
        >
          <span className="text-[#f9a8d4] font-black text-xl mb-1">A</span>
          <span className="text-[#f9a8d4]/80 text-[10px] uppercase">Anti</span>
        </button>
      </div>
      
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-75 mix-blend-screen"
        style={{ 
          backgroundColor: '#ef4444', 
          opacity: heatRef.current > 85 ? (Math.sin(Date.now() / 50) * 0.2 + 0.1) : 0 
        }}
      />
    </div>
  );
}
