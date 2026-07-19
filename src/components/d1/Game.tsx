"use client";

import React, { useState, useEffect, useRef } from 'react';

const COLORS = {
  space: '#0b1026',
  mint: '#7de8c3',
  pink: '#f9a8d4',
  lavender: '#c4b5fd',
  sun: '#fde047'
};

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const RotateCcwIcon = ({size=24, className=""}:any) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
);
const CrosshairIcon = ({size=24, color="#7de8c3", x="0", y="0"}:any) => (
  <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
);
const ChevronRightIcon = ({size=18}:any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
);

const LEVELS = [
  {
    shipPos: { x: 50, y: 400 },
    target: { x: 380, y: 100, radius: 25 },
    planets: [
      { x: 215, y: 250, radius: 40, mass: 1500, color: COLORS.lavender }
    ]
  },
  {
    shipPos: { x: 50, y: 400 },
    target: { x: 50, y: 100, radius: 25 },
    planets: [
      { x: 215, y: 250, radius: 50, mass: 2500, color: COLORS.pink },
      { x: 100, y: 200, radius: 30, mass: 800, color: COLORS.mint }
    ]
  },
  {
    shipPos: { x: 50, y: 450 },
    target: { x: 380, y: 50, radius: 25 },
    planets: [
      { x: 150, y: 350, radius: 35, mass: 1200, color: COLORS.lavender },
      { x: 300, y: 200, radius: 45, mass: 2000, color: COLORS.pink }
    ]
  },
  {
    shipPos: { x: 50, y: 50 },
    target: { x: 380, y: 450, radius: 25 },
    planets: [
      { x: 120, y: 150, radius: 30, mass: 1000, color: COLORS.mint },
      { x: 250, y: 250, radius: 45, mass: 2200, color: COLORS.lavender },
      { x: 350, y: 350, radius: 35, mass: 1400, color: COLORS.pink }
    ]
  }
];

export default function OrbitalSlingshot() {
  const [gameState, setGameState] = useState('START');
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  
  const [ship, setShip] = useState({ x: 50, y: 400, vx: 0, vy: 0 });
  const [isLaunched, setIsLaunched] = useState(false);
  const [trajectory, setTrajectory] = useState<{x: number, y: number}[]>([]);
  
  const [angle, setAngle] = useState(-45);
  const [power, setPower] = useState(60);
  const reqRef = useRef<number>(0);
  
  useEffect(() => {
    if (gameState !== 'PLAYING' || !isLaunched) return;
    
    const G = 0.5;
    const dt = 1;
    
    const update = () => {
      setShip(prev => {
        let ax = 0;
        let ay = 0;
        const currentLevel = LEVELS[level];
        let crashed = false;
        let won = false;
        
        currentLevel.planets.forEach(p => {
          const dx = p.x - prev.x;
          const dy = p.y - prev.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);
          
          if (dist < p.radius + 8) {
            crashed = true;
          }
          
          const force = (G * p.mass) / (distSq * dist);
          ax += force * dx;
          ay += force * dy;
        });
        
        const tx = currentLevel.target.x - prev.x;
        const ty = currentLevel.target.y - prev.y;
        if (Math.sqrt(tx*tx + ty*ty) < currentLevel.target.radius + 5) {
          won = true;
        }
        
        if (prev.x < -100 || prev.x > 530 || prev.y < -100 || prev.y > 600) {
          crashed = true;
        }
        
        if (crashed) {
          setGameState('GAMEOVER');
          return prev;
        }
        
        if (won) {
          if (level + 1 >= LEVELS.length) {
            setGameState('ALL_CLEAR');
            setScore(s => s + Math.max(10, 1000 - trajectory.length));
          } else {
            setGameState('WIN');
            setScore(s => s + Math.max(10, 500 - trajectory.length));
          }
          return prev;
        }
        
        const nextX = prev.x + prev.vx * dt;
        const nextY = prev.y + prev.vy * dt;
        
        setTrajectory(t => [...t, {x: nextX, y: nextY}]);
        
        return {
          ...prev,
          x: nextX,
          y: nextY,
          vx: prev.vx + ax * dt,
          vy: prev.vy + ay * dt,
        };
      });
      reqRef.current = requestAnimationFrame(update);
    };
    
    reqRef.current = requestAnimationFrame(update);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [gameState, isLaunched, level, trajectory.length]);

  const startLevel = (l: number) => {
    setLevel(l);
    setShip({ x: LEVELS[l].shipPos.x, y: LEVELS[l].shipPos.y, vx: 0, vy: 0 });
    setIsLaunched(false);
    setTrajectory([]);
    setGameState('PLAYING');
  };

  const launch = () => {
    const rad = (angle * Math.PI) / 180;
    const speed = power * 0.15;
    setShip(prev => ({
      ...prev,
      vx: Math.cos(rad) * speed,
      vy: Math.sin(rad) * speed
    }));
    setIsLaunched(true);
  };
  
  const getPrediction = () => {
    if (isLaunched || gameState !== 'PLAYING') return [];
    let curX = ship.x;
    let curY = ship.y;
    const rad = (angle * Math.PI) / 180;
    const speed = power * 0.15;
    let cvx = Math.cos(rad) * speed;
    let cvy = Math.sin(rad) * speed;
    const pts = [];
    const G = 0.5;
    
    for (let i = 0; i < 200; i++) {
      let ax = 0;
      let ay = 0;
      LEVELS[level].planets.forEach(p => {
        const dx = p.x - curX;
        const dy = p.y - curY;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        const force = (G * p.mass) / (distSq * dist);
        ax += force * dx;
        ay += force * dy;
      });
      cvx += ax;
      cvy += ay;
      curX += cvx;
      curY += cvy;
      if (i % 3 === 0) pts.push({x: curX, y: curY});
      if (curX < -50 || curX > 480 || curY < -50 || curY > 550) break;
    }
    return pts;
  };

  const shipAngle = isLaunched ? (Math.atan2(ship.vy, ship.vx) * 180 / Math.PI) : angle;

  return (
    <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans rounded-xl shadow-[0_0_40px_rgba(125,232,195,0.15)] border border-white/10 select-none">
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
        <pattern id="stars" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="1.5" fill="#fff" opacity="0.8" />
          <circle cx="45" cy="40" r="1" fill="#fff" opacity="0.4" />
          <circle cx="30" cy="55" r="2" fill={COLORS.lavender} opacity="0.5" />
          <circle cx="5" cy="45" r="1" fill={COLORS.pink} opacity="0.7" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#stars)" />
      </svg>
      
      {gameState === 'START' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#0b1026]/90 backdrop-blur-sm z-50">
          <div className="w-24 h-24 mb-6 rounded-full border-4 border-[#7de8c3] flex items-center justify-center bg-[#0b1026] shadow-[0_0_30px_rgba(125,232,195,0.4)]">
            <RotateCcwIcon size={48} className="text-[#7de8c3]" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd]">ORBITAL</h1>
          <h2 className="text-4xl font-black mb-8 text-[#f9a8d4] drop-shadow-[0_0_15px_rgba(249,168,212,0.6)]">SLINGSHOT</h2>
          <p className="text-sm text-gray-300 mb-10 max-w-[280px] leading-relaxed">
            Harness planetary gravity to guide your probe across the galaxy. 
          </p>
          <button 
            onClick={() => { setScore(0); startLevel(0); }}
            className="group relative px-8 py-3 bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] text-[#0b1026] font-bold rounded-full overflow-hidden hover:scale-105 transition-transform shadow-[0_0_20px_rgba(125,232,195,0.4)]"
          >
            <span className="relative z-10 flex items-center gap-2 text-[15px]">START MISSION <PlayIcon /></span>
          </button>
        </div>
      )}

      {(gameState === 'GAMEOVER' || gameState === 'WIN' || gameState === 'ALL_CLEAR') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#0b1026]/85 backdrop-blur-md z-50">
          <h2 className={`text-4xl font-black mb-2 ${gameState === 'GAMEOVER' ? 'text-red-400' : 'text-[#7de8c3]'}`}>
            {gameState === 'GAMEOVER' ? 'MISSION FAILED' : gameState === 'WIN' ? 'TARGET REACHED' : 'GALAXY CLEARED!'}
          </h2>
          <p className="text-xl mb-10 text-white/90">Score: <span className="font-bold text-[#c4b5fd]">{score}</span></p>
          
          {gameState === 'WIN' ? (
            <button 
              onClick={() => startLevel(level + 1)}
              className="px-8 py-3 bg-[#c4b5fd] text-[#0b1026] font-bold rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(196,181,253,0.4)]"
            >
              NEXT MISSION
            </button>
          ) : (
            <button 
              onClick={() => {
                setScore(0);
                startLevel(0);
              }}
              className="px-8 py-3 bg-[#f9a8d4] text-[#0b1026] font-bold rounded-full hover:bg-white hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(249,168,212,0.4)]"
            >
              <RotateCcwIcon size={18} /> PLAY AGAIN
            </button>
          )}
        </div>
      )}

      {gameState !== 'START' && (
        <>
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <radialGradient id="planet-glow" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.7" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Target */}
            {LEVELS[level] && (
              <g transform={`translate(${LEVELS[level].target.x}, ${LEVELS[level].target.y})`}>
                <circle r={LEVELS[level].target.radius + 8} fill="none" stroke="#7de8c3" strokeWidth="1" strokeDasharray="3 6" opacity="0.5">
                  <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="8s" repeatCount="indefinite" />
                </circle>
                <circle r={LEVELS[level].target.radius} fill="none" stroke="#7de8c3" strokeWidth="2" strokeDasharray="6 6">
                  <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle r={LEVELS[level].target.radius - 8} fill="#7de8c3" opacity="0.2" filter="url(#glow)" />
                <CrosshairIcon size={28} color="#7de8c3" x="-14" y="-14" />
              </g>
            )}

            {/* Planets */}
            {LEVELS[level]?.planets.map((p, i) => (
              <g key={i} transform={`translate(${p.x}, ${p.y})`}>
                <circle r={p.radius * 3} fill={p.color} opacity="0.03" />
                <circle r={p.radius * 2} fill={p.color} opacity="0.06" />
                <circle r={p.radius * 1.4} fill={p.color} opacity="0.1" />
                <circle r={p.radius} fill={p.color} filter="url(#glow)" opacity="0.8" />
                <circle r={p.radius} fill="url(#planet-glow)" />
              </g>
            ))}

            {/* Trajectory */}
            {!isLaunched && gameState === 'PLAYING' && (
              <polyline 
                points={getPrediction().map(p => `${p.x},${p.y}`).join(' ')} 
                fill="none" 
                stroke="#fff" 
                strokeWidth="2" 
                strokeDasharray="4 8" 
                opacity="0.4" 
              />
            )}
            
            {/* Actual Path */}
            {trajectory.length > 0 && (
              <polyline 
                points={trajectory.map(p => `${p.x},${p.y}`).join(' ')} 
                fill="none" 
                stroke="#f9a8d4" 
                strokeWidth="2.5" 
                opacity="0.9" 
                filter="url(#glow)"
              />
            )}
            
            {/* Ship */}
            <g transform={`translate(${ship.x}, ${ship.y}) rotate(${shipAngle})`}>
              {/* Flame */}
              {isLaunched && gameState === 'PLAYING' && (
                <polygon points="-12,-4 -24,0 -12,4" fill="#fde047" filter="url(#glow)">
                  <animate attributeName="opacity" values="1;0.4;1" dur="0.1s" repeatCount="indefinite" />
                </polygon>
              )}
              {/* Ship Body */}
              <polygon points="10,0 -8,-6 -4,0 -8,6" fill="#fff" />
              <polygon points="-4,0 -8,-6 -10,0 -8,6" fill="#c4b5fd" />
            </g>
          </svg>

          {/* Controls Overlay */}
          {!isLaunched && gameState === 'PLAYING' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] bg-[#0b1026]/70 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl">
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-[#c4b5fd] w-12 font-black tracking-wider">ANGLE</span>
                  <input 
                    type="range" 
                    min="-180" max="180" 
                    value={angle} 
                    onChange={e => setAngle(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#c4b5fd]"
                  />
                  <span className="text-xs text-white/80 w-10 text-right tabular-nums font-medium">{angle}°</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-[#f9a8d4] w-12 font-black tracking-wider">POWER</span>
                  <input 
                    type="range" 
                    min="10" max="120" 
                    value={power} 
                    onChange={e => setPower(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#f9a8d4]"
                  />
                  <span className="text-xs text-white/80 w-10 text-right tabular-nums font-medium">{power}</span>
                </div>
                <button 
                  onClick={launch}
                  className="w-full py-3 mt-1 bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] text-[#0b1026] font-black rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(125,232,195,0.3)]"
                >
                  LAUNCH <ChevronRightIcon />
                </button>
              </div>
            </div>
          )}
          
          {/* Top UI */}
          <div className="absolute top-5 left-5 flex gap-3">
            <div className="px-4 py-1.5 bg-[#0b1026]/60 rounded-full border border-white/10 backdrop-blur-md text-sm font-bold text-[#7de8c3] shadow-lg">
              LVL {level + 1}
            </div>
            <div className="px-4 py-1.5 bg-[#0b1026]/60 rounded-full border border-white/10 backdrop-blur-md text-sm font-bold text-[#f9a8d4] shadow-lg">
              SCORE: {score}
            </div>
          </div>
          
          {(isLaunched && gameState === 'PLAYING') && (
            <button
              onClick={() => startLevel(level)}
              className="absolute top-5 right-5 p-2.5 bg-[#0b1026]/60 rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/20 backdrop-blur-md transition-all shadow-lg"
            >
              <RotateCcwIcon size={18} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
