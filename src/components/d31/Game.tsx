"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

type Pulsar = {
  id: string;
  x: number;
  y: number;
  period: number;
  phase: number;
  color: string;
  locked: boolean;
};

type Feedback = {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
};

const COLORS = ["#7de8c3", "#f9a8d4", "#c4b5fd"]; // mint, pink, lavender
const GAME_TIME = 45000;
const WINDOW = 120; // flash window threshold in ms (total 240ms)

const GAME_CSS = `
  @keyframes fadeUp {
    0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -150%) scale(1.2); }
  }
  .animate-fadeUp {
    animation: fadeUp 1s ease-out forwards;
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 4s linear infinite;
  }
  @keyframes sweep {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .radar-sweep {
    transform-origin: 215px 250px;
    animation: sweep 4s linear infinite;
  }
`;

const StaticStars = React.memo(() => {
  const stars = Array.from({ length: 80 }).map((_, i) => ({
    x: (Math.sin(i * 12.3) * 0.5 + 0.5) * 430,
    y: (Math.cos(i * 45.6) * 0.5 + 0.5) * 500,
    r: (Math.sin(i * 78.9) * 0.5 + 0.5) * 1.5,
    o: 0.1 + (Math.cos(i * 12.3) * 0.5 + 0.5) * 0.4
  }));
  return (
    <g>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />
      ))}
    </g>
  );
});
StaticStars.displayName = "StaticStars";

const distance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.hypot(x1 - x2, y1 - y2);

const getPulsarVisuals = (pulsar: Pulsar, t: number) => {
  if (pulsar.locked) {
    return { opacity: 1, coreRadius: 12, ringRadius: 12, brightness: 1, ringOpacity: 0 };
  }
  
  const mod = ((t - pulsar.phase) % pulsar.period + pulsar.period) % pulsar.period;
  const distanceToPeak = Math.min(mod, pulsar.period - mod);
  
  const shrinkProgress = (pulsar.period - mod) / pulsar.period; 
  let ringRadius = 8 + 32 * shrinkProgress;
  
  let opacity = 0.3;
  let coreRadius = 8;
  let brightness = 0;
  let ringOpacity = 0.2 + 0.6 * (1 - shrinkProgress);

  if (distanceToPeak <= WINDOW) {
    const intensity = 1 - (distanceToPeak / WINDOW);
    opacity = 0.5 + 0.5 * intensity;
    coreRadius = 8 + 4 * intensity; 
    brightness = intensity;
    ringRadius = coreRadius;
    ringOpacity = 0.8 * intensity;
  }

  return { opacity, coreRadius, ringRadius, brightness, ringOpacity };
};

export default function Game() {
  const [gameState, setGameState] = useState<"START" | "PLAYING" | "GAME_OVER">("START");
  const [score, setScore] = useState(0);
  const [sector, setSector] = useState(1);
  const [pulsars, setPulsars] = useState<Pulsar[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [, setNow] = useState(0);

  const timeRemainingRef = useRef<number>(GAME_TIME);
  const elapsedRef = useRef<number>(0);
  const reqRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const pulsarsRef = useRef<Pulsar[]>([]);
  const lastTapRef = useRef<Record<string, number>>({});

  const shipX = 215;
  const shipY = 250;

  const generateSector = useCallback((currentSector: number) => {
    const minPeriod = Math.max(800, 2500 - currentSector * 200);
    const maxPeriod = Math.max(1200, 3500 - currentSector * 200);

    const newPulsars: Pulsar[] = [];
    
    for (let i = 0; i < COLORS.length; i++) {
      let x = 0, y = 0, valid = false;
      let attempts = 0;
      while (!valid && attempts < 50) {
        x = 60 + Math.random() * 310;
        y = 100 + Math.random() * 260;
        valid = true;
        if (distance(x, y, shipX, shipY) < 60) valid = false;
        for (const p of newPulsars) {
          if (distance(x, y, p.x, p.y) < 60) valid = false;
        }
        attempts++;
      }
      
      newPulsars.push({
        id: `p-${currentSector}-${i}`,
        x,
        y,
        period: minPeriod + Math.random() * (maxPeriod - minPeriod),
        phase: Math.random() * 3000,
        color: COLORS[i],
        locked: false
      });
    }
    
    setPulsars(newPulsars);
    pulsarsRef.current = newPulsars;
  }, []);

  const showFeedback = useCallback((text: string, x: number, y: number, color: string) => {
    const id = performance.now() + Math.random();
    setFeedback(prev => [...prev, { id, text, x, y, color }]);
    setTimeout(() => {
      setFeedback(prev => prev.filter(f => f.id !== id));
    }, 1000);
  }, []);

  const loop = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;

    timeRemainingRef.current -= dt;
    elapsedRef.current += dt;
    
    setNow(elapsedRef.current);

    if (timeRemainingRef.current <= 0) {
      timeRemainingRef.current = 0;
      setGameState("GAME_OVER");
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      return;
    }

    reqRef.current = requestAnimationFrame(loop);
  }, []);

  const startGame = useCallback(() => {
    setGameState("PLAYING");
    setScore(0);
    setSector(1);
    timeRemainingRef.current = GAME_TIME;
    elapsedRef.current = 0;
    lastTapRef.current = {};
    setFeedback([]);
    generateSector(1);

    lastTimeRef.current = performance.now();
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    reqRef.current = requestAnimationFrame(loop);
  }, [generateSector, loop]);

  useEffect(() => {
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, []);

  const handlePulsarClick = (id: string) => {
    if (gameState !== "PLAYING") return;

    const t = elapsedRef.current;
    if (lastTapRef.current[id] && t - lastTapRef.current[id] < 300) return; // cooldown
    lastTapRef.current[id] = t;

    const pulsar = pulsarsRef.current.find(p => p.id === id);
    if (!pulsar || pulsar.locked) return;

    const mod = ((t - pulsar.phase) % pulsar.period + pulsar.period) % pulsar.period;
    const distanceToPeak = Math.min(mod, pulsar.period - mod);

    if (distanceToPeak <= WINDOW) {
      const accuracy = 1 - (distanceToPeak / WINDOW);
      const points = 50 + Math.floor(accuracy * 50);
      setScore(s => s + points);
      showFeedback(`+${points}`, pulsar.x, pulsar.y - 30, pulsar.color);

      const updated = pulsarsRef.current.map(p => p.id === id ? { ...p, locked: true } : p);
      pulsarsRef.current = updated;
      setPulsars(updated);

      if (updated.every(p => p.locked)) {
        setTimeout(() => {
          setSector(s => {
            const next = s + 1;
            setScore(sc => sc + 300);
            showFeedback(`SECTOR CLEAR`, shipX, shipY - 30, "#7de8c3");
            timeRemainingRef.current += 5000;
            generateSector(next);
            return next;
          });
        }, 500);
      }
    } else {
      timeRemainingRef.current -= 2000;
      showFeedback(`MISS -2s`, pulsar.x, pulsar.y - 30, "#ef4444");
    }
  };

  return (
    <div 
      className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-mono select-none shadow-2xl shadow-[#7de8c3]/10" 
      style={{ touchAction: "none" }}
    >
      <style>{GAME_CSS}</style>
      
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-40 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] mix-blend-overlay"></div>

      {/* UI Layer */}
      <div className="absolute top-0 left-0 w-full p-5 flex justify-between items-start z-20 pointer-events-none">
        <div>
          <div className="text-[#7de8c3] text-xs tracking-widest opacity-80">SECTOR</div>
          <div className="text-2xl font-bold">{sector}</div>
        </div>
        <div className="text-center">
          <div className="text-[#c4b5fd] text-xs tracking-widest opacity-80">TIME</div>
          <div className={`text-2xl font-bold ${timeRemainingRef.current < 10000 ? "text-red-400 animate-pulse" : "text-white"}`}>
            {(Math.max(0, timeRemainingRef.current) / 1000).toFixed(1)}s
          </div>
        </div>
        <div className="text-right">
          <div className="text-[#f9a8d4] text-xs tracking-widest opacity-80">SCORE</div>
          <div className="text-2xl font-bold">{score}</div>
        </div>
      </div>

      {/* SVG Graphics Layer */}
      <svg width="430" height="500" className="absolute inset-0 z-10 block">
        <defs>
          <linearGradient id="radarTail" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#7de8c3" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#7de8c3" stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <StaticStars />

        {/* Ship and Radar */}
        <g>
          <circle cx={shipX} cy={shipY} r="100" stroke="#7de8c3" strokeWidth="1" opacity="0.1" fill="none" />
          <circle cx={shipX} cy={shipY} r="200" stroke="#7de8c3" strokeWidth="1" opacity="0.1" fill="none" />
          <line x1="0" y1={shipY} x2="430" y2={shipY} stroke="#7de8c3" strokeOpacity="0.05" />
          <line x1={shipX} y1="0" x2={shipX} y2="500" stroke="#7de8c3" strokeOpacity="0.05" />
          
          <path 
            d={`M ${shipX} ${shipY} L ${shipX} ${shipY - 200} A 200 200 0 0 1 ${shipX + 141} ${shipY - 141} Z`} 
            fill="url(#radarTail)" 
            className="radar-sweep pointer-events-none" 
          />
          
          <polygon points={`${shipX},${shipY-12} ${shipX-10},${shipY+10} ${shipX+10},${shipY+10}`} fill="#ffffff" />
          <text x={shipX + 15} y={shipY + 4} fill="#7de8c3" fontSize="10" opacity="0.5" className="pointer-events-none">USS-NAV</text>
        </g>

        {/* Connection Lines (Locked) */}
        {pulsars.map(p => p.locked && (
          <line 
            key={`line-${p.id}`} 
            x1={shipX} y1={shipY} 
            x2={p.x} y2={p.y} 
            stroke={p.color} 
            strokeWidth="2" 
            strokeDasharray="4,4" 
            className="animate-pulse" 
          />
        ))}

        {/* Pulsars */}
        {pulsars.map(p => {
          const { opacity, coreRadius, ringRadius, brightness, ringOpacity } = getPulsarVisuals(p, elapsedRef.current);
          
          return (
            <g key={p.id} transform={`translate(${p.x}, ${p.y})`}>
              {/* Halo */}
              {brightness > 0 && (
                <circle 
                  r={25 * brightness} 
                  fill={p.color} 
                  opacity={brightness * 0.5} 
                  filter="url(#glow)"
                  className="pointer-events-none"
                />
              )}
              
              {/* Shrinking Ring */}
              {!p.locked && (
                <circle 
                  r={ringRadius} 
                  stroke={p.color} 
                  strokeWidth="2" 
                  fill="none" 
                  opacity={ringOpacity}
                  className="pointer-events-none"
                />
              )}

              {/* Core */}
              <circle 
                r={coreRadius} 
                fill={p.color} 
                opacity={opacity}
                stroke="#fff"
                strokeWidth={p.locked ? 2 : 0}
                className="pointer-events-none"
              />
              
              {/* Locked visual */}
              {p.locked && (
                <circle 
                  r="18" 
                  stroke={p.color} 
                  strokeWidth="1.5" 
                  fill="none" 
                  strokeDasharray="3,3"
                  className="animate-spin-slow pointer-events-none"
                />
              )}

              {/* Interaction Area */}
              <circle 
                r={40} 
                fill="transparent" 
                className="cursor-pointer"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handlePulsarClick(p.id);
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* HTML Feedback Layer */}
      {feedback.map(f => (
        <div 
          key={f.id}
          className="absolute pointer-events-none text-sm font-bold animate-fadeUp z-50 whitespace-nowrap"
          style={{
            left: f.x,
            top: f.y,
            color: f.color,
            textShadow: `0 0 8px ${f.color}`
          }}
        >
          {f.text}
        </div>
      ))}

      {/* Start Screen */}
      {gameState === "START" && (
        <div className="absolute inset-0 bg-[#0b1026]/90 z-30 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
          <div className="w-20 h-20 mb-8 relative">
            <div className="absolute inset-0 border-2 border-[#7de8c3] rounded-full animate-ping opacity-30"></div>
            <div className="absolute inset-5 bg-[#7de8c3] rounded-full shadow-[0_0_20px_#7de8c3]"></div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            PULSAR<span className="text-[#7de8c3]">NAV</span>
          </h1>
          <p className="text-[#c4b5fd] mb-10 text-sm leading-relaxed max-w-[280px]">
            Synchronize with neutron star frequencies to triangulate your jump coordinates.<br/><br/>
            <span className="text-white font-bold block bg-black/40 p-3 rounded border border-[#c4b5fd]/30">Tap each pulsar exactly when its outer ring merges with the core.</span>
          </p>
          <button 
            onClick={startGame}
            className="px-10 py-4 bg-[#7de8c3] text-[#0b1026] font-bold rounded-none border border-[#7de8c3] hover:bg-transparent hover:text-[#7de8c3] transition-all tracking-widest shadow-[0_0_20px_rgba(125,232,195,0.4)]"
          >
            INITIATE
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === "GAME_OVER" && (
        <div className="absolute inset-0 bg-[#0b1026]/95 z-30 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
          <h2 className="text-4xl font-bold text-[#f9a8d4] mb-2 tracking-widest drop-shadow-[0_0_15px_rgba(249,168,212,0.5)]">SIGNAL LOST</h2>
          <div className="my-10 space-y-2">
            <p className="text-[#c4b5fd] text-sm tracking-widest">FINAL SCORE</p>
            <p className="text-6xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{score}</p>
          </div>
          <p className="text-[#7de8c3] mb-10 text-sm tracking-widest">SECTORS CLEARED: {sector - 1}</p>
          <button 
            onClick={startGame}
            className="px-8 py-4 bg-[#f9a8d4] text-[#0b1026] font-bold rounded-none border border-[#f9a8d4] hover:bg-transparent hover:text-[#f9a8d4] transition-all tracking-widest shadow-[0_0_20px_rgba(249,168,212,0.4)]"
          >
            REBOOT SYSTEM
          </button>
        </div>
      )}
    </div>
  );
}
