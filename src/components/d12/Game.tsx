'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// --- Utility Functions ---
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// --- Types ---
type EntityType = 'debris1' | 'debris2' | 'debris3' | 'satellite';
type Entity = {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
};

type Particle = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

type FloatingText = {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
};

type Laser = {
  id: string;
  targetX: number;
  targetY: number;
  life: number;
  color: string;
};

// --- Subcomponents ---
const Background = React.memo(() => {
  const stars = useMemo(() => {
    return Array.from({ length: 70 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      delay: `${Math.random() * 3}s`,
      duration: `${Math.random() * 2 + 1.5}s`
    }));
  }, []);

  return (
    <div className="absolute inset-0 bg-[#0b1026] overflow-hidden pointer-events-none">
      {stars.map((star, i) => (
        <div 
          key={i}
          className="absolute rounded-full bg-white opacity-60 animate-pulse"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration
          }}
        />
      ))}
      <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-[#c4b5fd] blur-[120px] opacity-20" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-[#7de8c3] blur-[120px] opacity-15" />
    </div>
  );
});
Background.displayName = 'Background';

const Debris1 = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
    <path d="M20,30 L50,10 L80,40 L90,80 L40,90 L10,60 Z" fill="#4a5568" stroke="#718096" strokeWidth="4" strokeLinejoin="round"/>
    <path d="M30,40 L60,30 L70,60" fill="none" stroke="#2d3748" strokeWidth="3" strokeLinejoin="round"/>
  </svg>
);

const Debris2 = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
    <rect x="25" y="25" width="50" height="50" transform="rotate(15 50 50)" fill="#2d3748" stroke="#a0aec0" strokeWidth="3"/>
    <line x1="30" y1="30" x2="70" y2="70" stroke="#f9a8d4" strokeWidth="2"/>
    <circle cx="75" cy="25" r="6" fill="#cbd5e0"/>
    <circle cx="25" cy="75" r="6" fill="#cbd5e0"/>
  </svg>
);

const Debris3 = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
    <polygon points="50,15 85,50 50,85 15,50" fill="#1a202c" stroke="#c4b5fd" strokeWidth="2" strokeDasharray="4 4"/>
    <path d="M40,30 L70,60 L50,80 L30,50 Z" fill="#4a5568" />
    <circle cx="50" cy="50" r="4" fill="#c4b5fd"/>
  </svg>
);

const Satellite = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_rgba(196,181,253,0.6)]">
    <rect x="5" y="35" width="35" height="30" rx="2" fill="#1e3a8a" stroke="#c4b5fd" strokeWidth="2"/>
    <line x1="15" y1="35" x2="15" y2="65" stroke="#c4b5fd" strokeWidth="1"/>
    <line x1="25" y1="35" x2="25" y2="65" stroke="#c4b5fd" strokeWidth="1"/>

    <rect x="60" y="35" width="35" height="30" rx="2" fill="#1e3a8a" stroke="#c4b5fd" strokeWidth="2"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="#c4b5fd" strokeWidth="1"/>
    <line x1="85" y1="35" x2="85" y2="65" stroke="#c4b5fd" strokeWidth="1"/>
    
    <rect x="40" y="15" width="20" height="70" rx="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
    <circle cx="50" cy="50" r="8" fill="#7de8c3" className="animate-pulse"/>
    
    <path d="M50,15 L50,5 M40,5 L60,5" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="50" cy="3" r="3" fill="#f9a8d4" className="animate-ping"/>
  </svg>
);

// --- Main Game Component ---
export default function Game() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  // Refs for game loop state
  const entitiesRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const gameStateRef = useRef(gameState);
  
  // Force re-renders for the game loop
  const [, setTick] = useState(0);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(30);
    entitiesRef.current = [];
    particlesRef.current = [];
    textsRef.current = [];
    lasersRef.current = [];
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const spawnEntity = () => {
    const isSatellite = Math.random() > 0.75;
    const types: EntityType[] = ['debris1', 'debris2', 'debris3'];
    const type = isSatellite ? 'satellite' : types[Math.floor(Math.random() * types.length)];
    
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0, vx = 0, vy = 0;
    const speed = random(70, 160);

    if (side === 0) { // Top
      x = random(50, 380); y = -60;
      vx = random(-40, 40); vy = speed;
    } else if (side === 1) { // Right
      x = 490; y = random(50, 400);
      vx = -speed; vy = random(-40, 40);
    } else if (side === 2) { // Bottom
      x = random(50, 380); y = 560;
      vx = random(-40, 40); vy = -speed;
    } else { // Left
      x = -60; y = random(50, 400);
      vx = speed; vy = random(-40, 40);
    }

    entitiesRef.current.push({
      id: Math.random().toString(36).substring(2, 9),
      type,
      x,
      y,
      vx,
      vy,
      size: isSatellite ? random(55, 75) : random(35, 60),
      rotation: random(0, 360),
      rotSpeed: random(-120, 120),
    });
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(60, 250);
      particlesRef.current.push({
        id: Math.random().toString(36).substring(2, 9),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: random(0.4, 0.8),
        color,
        size: random(3, 8),
      });
    }
  };

  const addText = (x: number, y: number, text: string, color: string) => {
    textsRef.current.push({
      id: Math.random().toString(36).substring(2, 9),
      x,
      y,
      text,
      color,
      life: 1,
    });
  };

  const gameLoop = useCallback((time: number) => {
    if (gameStateRef.current !== 'playing') return;

    // Cap dt to prevent massive jumps when switching tabs
    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = time;

    // Entities
    entitiesRef.current = entitiesRef.current.filter(ent => {
      ent.x += ent.vx * dt;
      ent.y += ent.vy * dt;
      ent.rotation += ent.rotSpeed * dt;
      // Keep if within expanded bounds
      return !(ent.x < -150 || ent.x > 580 || ent.y < -150 || ent.y > 650);
    });

    // Spawning
    spawnTimerRef.current -= dt;
    if (spawnTimerRef.current <= 0) {
      spawnEntity();
      spawnTimerRef.current = random(0.4, 1.0);
    }

    // Particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt / p.maxLife;
      return p.life > 0;
    });

    // Texts
    textsRef.current = textsRef.current.filter(t => {
      t.y -= 40 * dt;
      t.life -= dt;
      return t.life > 0;
    });

    // Lasers
    lasersRef.current = lasersRef.current.filter(l => {
      l.life -= dt * 6; // Fast fade
      return l.life > 0;
    });

    setTick(t => (t + 1) % 100);
    requestRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, gameLoop]);

  // Timer Countdown
  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('gameover');
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  const handleInteract = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (gameState !== 'playing') return;

    const index = entitiesRef.current.findIndex(ent => ent.id === id);
    if (index === -1) return;

    const ent = entitiesRef.current[index];
    
    // Shoot laser effect
    const isPenalty = ent.type === 'satellite';
    lasersRef.current.push({
      id: Math.random().toString(36).substring(2, 9),
      targetX: ent.x,
      targetY: ent.y,
      life: 1,
      color: isPenalty ? '#f9a8d4' : '#7de8c3'
    });

    if (isPenalty) {
      setScore(s => s - 20);
      spawnParticles(ent.x, ent.y, '#f9a8d4', 20);
      addText(ent.x, ent.y, '-20', '#f9a8d4');
    } else {
      setScore(s => s + 10);
      spawnParticles(ent.x, ent.y, '#7de8c3', 15);
      addText(ent.x, ent.y, '+10', '#7de8c3');
    }

    entitiesRef.current.splice(index, 1);
  };

  return (
    <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] rounded-2xl shadow-[0_0_40px_rgba(11,16,38,0.8)] border border-[#1e293b] touch-none select-none">
      <Background />

      {/* Header UI */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white z-20 pointer-events-none">
        <div className="bg-[#0b1026]/80 px-4 py-2 rounded-xl border border-[#7de8c3]/30 backdrop-blur-md shadow-lg">
          <div className="text-[#7de8c3] text-xs font-bold tracking-widest">SCORE</div>
          <div className="text-2xl font-black">{score}</div>
        </div>
        <div className="bg-[#0b1026]/80 px-4 py-2 rounded-xl border border-[#f9a8d4]/30 backdrop-blur-md shadow-lg text-right">
          <div className="text-[#f9a8d4] text-xs font-bold tracking-widest">TIME</div>
          <div className="text-2xl font-black">{timeLeft}s</div>
        </div>
      </div>

      {/* Play Area */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Lasers */}
        <svg className="absolute inset-0 z-10" width="100%" height="100%">
          {lasersRef.current.map(l => (
            <line
              key={l.id}
              x1="215" // roughly half of 430px width
              y1="500" // bottom center
              x2={l.targetX}
              y2={l.targetY}
              stroke={l.color}
              strokeWidth={Math.max(1, l.life * 6)}
              opacity={l.life}
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_currentColor]"
            />
          ))}
        </svg>

        {/* Entities */}
        {entitiesRef.current.map(ent => {
          let SvgComp = Debris1;
          if (ent.type === 'debris2') SvgComp = Debris2;
          else if (ent.type === 'debris3') SvgComp = Debris3;
          else if (ent.type === 'satellite') SvgComp = Satellite;

          return (
            <div
              key={ent.id}
              className="absolute pointer-events-auto cursor-crosshair transform-gpu hover:brightness-125 transition-all duration-75 active:scale-90"
              style={{
                left: ent.x,
                top: ent.y,
                width: ent.size,
                height: ent.size,
                transform: `translate(-50%, -50%) rotate(${ent.rotation}deg)`,
              }}
              onPointerDown={(e) => handleInteract(e, ent.id)}
            >
              <SvgComp />
            </div>
          );
        })}
        
        {/* Particles */}
        {particlesRef.current.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full transform-gpu"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: Math.max(0, p.life),
              transform: `translate(-50%, -50%)`,
              boxShadow: `0 0 ${p.size}px ${p.color}`
            }}
          />
        ))}

        {/* Floating Texts */}
        {textsRef.current.map(t => (
          <div
            key={t.id}
            className="absolute font-black text-2xl pointer-events-none transform-gpu z-20"
            style={{
              left: t.x,
              top: t.y,
              color: t.color,
              opacity: Math.max(0, Math.min(1, t.life * 2)),
              transform: `translate(-50%, -50%) scale(${1 + (1 - t.life) * 0.5})`,
              textShadow: '0 4px 12px rgba(0,0,0,0.8)'
            }}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* Start Screen */}
      {gameState === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b1026]/90 backdrop-blur-sm z-30">
          <div className="text-center mb-10 transform hover:scale-105 transition-transform duration-500">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] mb-2 drop-shadow-[0_0_15px_rgba(125,232,195,0.4)]">
              DEBRIS
            </h1>
            <h2 className="text-3xl font-black text-white tracking-[0.2em]">CLEANUP</h2>
          </div>
          
          <div className="bg-[#1e293b]/50 p-6 rounded-2xl border border-[#334155] mb-10 max-w-[85%]">
            <p className="text-white/90 text-center text-sm leading-relaxed font-medium">
              Tap orbiting debris <span className="text-[#7de8c3] font-bold">★</span> to destroy them.<br/>
              Do NOT hit the satellites <span className="text-[#f9a8d4] font-bold">■</span>!
            </p>
          </div>

          <button
            onClick={startGame}
            className="px-10 py-4 bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] text-[#0b1026] font-black rounded-full text-xl shadow-[0_0_30px_rgba(125,232,195,0.5)] hover:shadow-[0_0_50px_rgba(196,181,253,0.6)] hover:scale-105 active:scale-95 transition-all"
          >
            START MISSION
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b1026]/90 backdrop-blur-sm z-30">
          <h2 className="text-2xl font-bold text-[#c4b5fd] mb-2 tracking-widest">MISSION COMPLETE</h2>
          
          <div className="text-[5rem] font-black text-white mb-2 drop-shadow-[0_0_25px_rgba(125,232,195,0.5)] leading-none">
            {score}
          </div>
          <div className="text-[#7de8c3] text-sm font-bold tracking-widest mb-10">FINAL SCORE</div>

          <button
            onClick={startGame}
            className="px-10 py-4 bg-transparent border-2 border-[#7de8c3] text-[#7de8c3] font-black rounded-full hover:bg-[#7de8c3]/10 hover:shadow-[0_0_20px_rgba(125,232,195,0.3)] active:scale-95 transition-all text-lg"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
