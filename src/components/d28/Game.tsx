"use client";

import React, { useState, useEffect, useRef } from 'react';

// Interfaces
interface Crater {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export default function LunarRoverGame() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [, setTick] = useState(0);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const cratersRef = useRef<Crater[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  const scoreRef = useRef(0);
  const batteryRef = useRef(100);
  const roverXRef = useRef(215);
  const keysRef = useRef({ left: false, right: false });
  const touchXRef = useRef<number | null>(null);
  const gameSpeedRef = useRef(1);
  const inShadowRef = useRef(false);
  const gridOffsetRef = useRef(0);

  const GAME_WIDTH = 430;
  const GAME_HEIGHT = 500;
  const ROVER_Y = 400;
  const ROVER_RADIUS = 18;

  const startGame = () => {
    setGameState('playing');
    scoreRef.current = 0;
    batteryRef.current = 100;
    roverXRef.current = 215;
    cratersRef.current = [];
    particlesRef.current = [];
    gameSpeedRef.current = 1;
    inShadowRef.current = false;
    gridOffsetRef.current = 0;
    keysRef.current = { left: false, right: false };
    touchXRef.current = null;
    lastTimeRef.current = performance.now();

    for (let i = 0; i < 40; i++) {
      particlesRef.current.push({
        id: Math.random(),
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = (time: number) => {
    if (lastTimeRef.current === null) lastTimeRef.current = time;
    const deltaTime = Math.min(time - lastTimeRef.current, 32); 
    lastTimeRef.current = time;

    gameSpeedRef.current += deltaTime * 0.000015;
    
    // Grid animation
    gridOffsetRef.current = (gridOffsetRef.current + deltaTime * 0.1 * gameSpeedRef.current) % 40;

    // Movement
    const moveSpeed = 0.35 * deltaTime;
    if (keysRef.current.left) roverXRef.current = Math.max(ROVER_RADIUS + 15, roverXRef.current - moveSpeed);
    if (keysRef.current.right) roverXRef.current = Math.min(GAME_WIDTH - (ROVER_RADIUS + 15), roverXRef.current + moveSpeed);

    if (touchXRef.current !== null) {
      const diff = touchXRef.current - roverXRef.current;
      if (Math.abs(diff) > 2) {
        roverXRef.current += Math.sign(diff) * Math.min(Math.abs(diff), moveSpeed);
      }
    }

    // Spawn Craters
    if (Math.random() < 0.015 * gameSpeedRef.current) {
      cratersRef.current.push({
        id: Math.random(),
        x: Math.random() * GAME_WIDTH,
        y: -150,
        radius: Math.random() * 50 + 40,
        speed: (Math.random() * 1.5 + 1.5) * gameSpeedRef.current,
      });
    }

    // Move Craters
    for (let i = cratersRef.current.length - 1; i >= 0; i--) {
      const crater = cratersRef.current[i];
      crater.y += crater.speed * (deltaTime / 16);
      if (crater.y - crater.radius > GAME_HEIGHT) {
        cratersRef.current.splice(i, 1);
      }
    }

    // Move Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.y += p.speed * gameSpeedRef.current * (deltaTime / 16);
      if (p.y > GAME_HEIGHT) {
        p.y = -10;
        p.x = Math.random() * GAME_WIDTH;
      }
    }

    // Collision (Shadow)
    let inShadow = false;
    for (const crater of cratersRef.current) {
      const dx = roverXRef.current - crater.x;
      const dy = ROVER_Y - crater.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < crater.radius + ROVER_RADIUS - 5) {
        inShadow = true;
        break;
      }
    }
    inShadowRef.current = inShadow;

    if (inShadow) {
      batteryRef.current -= 0.06 * deltaTime; // Drain faster
    } else {
      batteryRef.current = Math.min(100, batteryRef.current + 0.012 * deltaTime); // Charge slower
    }

    scoreRef.current += deltaTime * 0.01 * gameSpeedRef.current;

    setTick(t => t + 1);

    if (batteryRef.current <= 0) {
      setGameState('end');
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      return;
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = true;
      if (e.key === 'ArrowRight') keysRef.current.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === 'ArrowRight') keysRef.current.right = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1 && e.pointerType === 'mouse') return;
    const container = document.getElementById('game-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      touchXRef.current = Math.max(ROVER_RADIUS, Math.min(GAME_WIDTH - ROVER_RADIUS, (x / rect.width) * GAME_WIDTH));
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const container = document.getElementById('game-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      touchXRef.current = Math.max(ROVER_RADIUS, Math.min(GAME_WIDTH - ROVER_RADIUS, (x / rect.width) * GAME_WIDTH));
    }
  };

  const handlePointerUp = () => {
    touchXRef.current = null;
  };

  // Dynamic colors based on state
  const isShadow = inShadowRef.current;
  const wheelColor = isShadow ? "#3a7a63" : "#7de8c3";
  const bodyColor = isShadow ? "#8f5776" : "#f9a8d4";
  const panelColor = isShadow ? "#6d6491" : "#c4b5fd";
  const coreColor = isShadow ? "#ff4444" : "#7de8c3";

  return (
    <div 
      id="game-container"
      className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans touch-none select-none rounded-xl shadow-2xl"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {gameState === 'playing' && (
        <>
          {inShadowRef.current && (
            <div className="absolute inset-0 border-[6px] border-red-500/30 pointer-events-none z-10 animate-pulse" />
          )}

          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
            <div className="flex flex-col">
              <span className="text-[#f9a8d4] font-bold text-xs tracking-widest drop-shadow-md">BATTERY</span>
              <div className="w-32 h-3 bg-[#0b1026] border border-[#c4b5fd] rounded-full overflow-hidden mt-1 shadow-[0_0_10px_rgba(196,181,253,0.3)]">
                <div 
                  className={`h-full ${inShadowRef.current ? 'bg-red-500' : 'bg-[#7de8c3] shadow-[0_0_8px_#7de8c3]'}`}
                  style={{ width: `${batteryRef.current}%` }}
                />
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#c4b5fd] font-bold text-xs tracking-widest drop-shadow-md">DISTANCE</span>
              <span className="text-[#7de8c3] font-mono text-2xl font-black drop-shadow-md leading-none mt-1">
                {Math.floor(scoreRef.current)}m
              </span>
            </div>
          </div>

          <svg width="100%" height="100%" viewBox={`0 0 ${GAME_WIDTH} ${GAME_HEIGHT}`} preserveAspectRatio="none">
            {/* Grid */}
            {Array.from({ length: 15 }).map((_, i) => (
              <line 
                key={`h${i}`}
                x1="0" y1={(i * 40 + gridOffsetRef.current)} 
                x2="430" y2={(i * 40 + gridOffsetRef.current)} 
                stroke="#7de8c3" strokeOpacity="0.1" strokeWidth="1" 
              />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line 
                key={`v${i}`}
                x1={i * 40} y1="0" 
                x2={i * 40} y2="500" 
                stroke="#7de8c3" strokeOpacity="0.1" strokeWidth="1" 
              />
            ))}

            {/* Particles */}
            {particlesRef.current.map(p => (
              <circle key={p.id} cx={p.x} cy={p.y} r={p.size} fill="#7de8c3" opacity={p.opacity} />
            ))}

            {/* Craters */}
            {cratersRef.current.map(c => (
              <g key={c.id}>
                <circle cx={c.x} cy={c.y} r={c.radius + 4} fill="#f9a8d4" opacity="0.2" />
                <circle cx={c.x} cy={c.y} r={c.radius} fill="#050814" stroke="#c4b5fd" strokeWidth="1.5" strokeOpacity="0.4" />
                <circle cx={c.x - c.radius * 0.15} cy={c.y - c.radius * 0.15} r={c.radius * 0.6} fill="#020308" />
              </g>
            ))}

            {/* Rover */}
            <g transform={`translate(${roverXRef.current}, ${ROVER_Y})`}>
              <rect x="-20" y="-14" width="8" height="14" fill={wheelColor} rx="3" />
              <rect x="12" y="-14" width="8" height="14" fill={wheelColor} rx="3" />
              <rect x="-20" y="6" width="8" height="14" fill={wheelColor} rx="3" />
              <rect x="12" y="6" width="8" height="14" fill={wheelColor} rx="3" />
              
              {/* Solar panels */}
              <rect x="-34" y="-8" width="18" height="22" fill={panelColor} rx="2" stroke="#0b1026" strokeWidth="1" />
              <rect x="16" y="-8" width="18" height="22" fill={panelColor} rx="2" stroke="#0b1026" strokeWidth="1" />
              
              {/* Body */}
              <rect x="-14" y="-22" width="28" height="44" fill={bodyColor} rx="6" />
              <path d="M-10 -15 L10 -15 L14 10 L-14 10 Z" fill="#0b1026" opacity="0.3" />
              
              {/* Energy core */}
              <circle cx="0" cy="0" r="7" fill={coreColor} />
              {!isShadow && <circle cx="0" cy="0" r="4" fill="#fff" opacity="0.8" />}
            </g>
          </svg>
        </>
      )}

      {gameState === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b1026]/90 z-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#7de8c3]/10 to-transparent pointer-events-none" />
          <h1 className="text-4xl font-black text-center mb-2 bg-gradient-to-br from-[#7de8c3] to-[#f9a8d4] text-transparent bg-clip-text leading-tight drop-shadow-[0_0_15px_rgba(125,232,195,0.4)]">
            LUNAR ROVER<br/>BATTERY SURVIVAL
          </h1>
          <p className="text-[#c4b5fd] text-sm mb-10 text-center px-8 leading-relaxed bg-[#0b1026]/50 py-2 rounded-lg backdrop-blur-sm border border-[#c4b5fd]/20">
            태양광으로 배터리를 충전하며<br/>거대한 크레이터의 그림자를 피하세요!
          </p>
          <button 
            onClick={startGame}
            className="px-10 py-4 bg-gradient-to-r from-[#7de8c3] to-[#f9a8d4] text-[#0b1026] font-black tracking-wider rounded-full hover:scale-105 hover:shadow-[0_0_20px_#7de8c3] transition-all active:scale-95 z-10"
          >
            START MISSION
          </button>
        </div>
      )}

      {gameState === 'end' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b1026]/95 z-20 backdrop-blur-sm">
          <h2 className="text-3xl font-black text-[#ff4444] mb-2 drop-shadow-[0_0_10px_rgba(255,68,68,0.5)]">BATTERY DEPLETED</h2>
          <div className="text-center mb-10 p-6 bg-white/5 rounded-2xl border border-white/10 w-3/4">
            <p className="text-[#c4b5fd] text-sm mb-2 font-bold tracking-widest">DISTANCE TRAVELED</p>
            <p className="text-6xl font-mono text-[#7de8c3] font-black drop-shadow-[0_0_15px_rgba(125,232,195,0.5)]">
              {Math.floor(scoreRef.current)}m
            </p>
          </div>
          <button 
            onClick={startGame}
            className="px-10 py-4 bg-gradient-to-r from-[#c4b5fd] to-[#f9a8d4] text-[#0b1026] font-black tracking-wider rounded-full hover:scale-105 hover:shadow-[0_0_20px_#c4b5fd] transition-all active:scale-95"
          >
            REBOOT ROVER
          </button>
        </div>
      )}
    </div>
  );
}
