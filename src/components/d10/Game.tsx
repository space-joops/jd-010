'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

type GameState = 'START' | 'PLAYING' | 'GAME_OVER';

interface Target {
  id: number;
  angle: number;
  type: 'mint' | 'pink' | 'lavender';
  hit: boolean;
  value: number;
}

const COLORS = {
  bg: '#0b1026',
  mint: '#7de8c3',
  pink: '#f9a8d4',
  lavender: '#c4b5fd',
};

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [harpoonsLeft, setHarpoonsLeft] = useState(10);
  
  const [asteroidRotation, setAsteroidRotation] = useState(0);
  const [rotationSpeed, setRotationSpeed] = useState(1.5);
  const [direction, setDirection] = useState(1);
  const [targets, setTargets] = useState<Target[]>([]);
  
  const [harpoonState, setHarpoonState] = useState<'IDLE' | 'SHOOTING' | 'RETURNING' | 'HIT'>('IDLE');
  const [harpoonY, setHarpoonY] = useState(410);
  const [message, setMessage] = useState('');
  
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  const generateTargets = useCallback(() => {
    const newTargets: Target[] = [];
    const count = Math.floor(Math.random() * 4) + 4; // 4 to 7 targets
    const types: ('mint' | 'pink' | 'lavender')[] = ['mint', 'pink', 'lavender'];
    
    let baseAngle = Math.random() * 360;
    for (let i = 0; i < count; i++) {
      newTargets.push({
        id: i,
        angle: (baseAngle + (i * (360 / count)) + (Math.random() * 20 - 10)) % 360,
        type: types[Math.floor(Math.random() * types.length)],
        hit: false,
        value: 100,
      });
    }
    setTargets(newTargets);
  }, []);

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setHarpoonsLeft(10);
    setAsteroidRotation(0);
    setRotationSpeed(1.5);
    setDirection(1);
    generateTargets();
    setHarpoonState('IDLE');
    setHarpoonY(410);
    setMessage('');
  };

  const shoot = () => {
    if (harpoonState !== 'IDLE' || gameState !== 'PLAYING') return;
    setHarpoonState('SHOOTING');
    setHarpoonsLeft(prev => prev - 1);
  };

  const update = useCallback((time: number) => {
    if (gameState !== 'PLAYING') {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    if (lastTimeRef.current !== undefined) {
      const deltaTime = Math.min(time - lastTimeRef.current, 50);
      
      setAsteroidRotation(prev => (prev + rotationSpeed * direction * (deltaTime / 16)) % 360);
      
      setHarpoonState(currentHarpoonState => {
        setHarpoonY(currentY => {
          if (currentHarpoonState === 'SHOOTING') {
            const nextY = currentY - 12 * (deltaTime / 16);
            if (nextY <= 305) return 305; 
            return nextY;
          } else if (currentHarpoonState === 'RETURNING') {
            const nextY = currentY + 8 * (deltaTime / 16);
            if (nextY >= 410) return 410; 
            return nextY;
          }
          return currentY;
        });
        return currentHarpoonState;
      });
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(update);
  }, [gameState, rotationSpeed, direction]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  useEffect(() => {
    if (harpoonState === 'SHOOTING' && harpoonY <= 305) {
      let hitAny = false;
      let newTargets = [...targets];
      
      for (let i = 0; i < newTargets.length; i++) {
        const t = newTargets[i];
        if (t.hit) continue;
        
        let currentAngle = (t.angle + asteroidRotation) % 360;
        if (currentAngle < 0) currentAngle += 360;
        
        if (Math.abs(currentAngle - 180) < 18 || Math.abs(currentAngle - 180 + 360) < 18 || Math.abs(currentAngle - 180 - 360) < 18) {
          hitAny = true;
          t.hit = true;
          setScore(s => s + t.value + Math.floor(rotationSpeed * 50));
          setMessage('PERFECT HIT!');
          setRotationSpeed(prev => Math.min(prev + 0.4, 6));
          
          if (Math.random() > 0.6) {
            setDirection(d => d * -1);
          } else {
             setRotationSpeed(prev => Math.min(prev + 0.2, 6));
          }
          break;
        }
      }
      
      if (hitAny) {
        setTargets(newTargets);
        setHarpoonState('HIT');
        setTimeout(() => {
          setHarpoonState('RETURNING');
          setMessage('');
          if (newTargets.every(t => t.hit)) {
             setTimeout(() => {
                generateTargets();
                setMessage('NEW ASTEROID!');
                setRotationSpeed(prev => Math.max(1.5, prev - 1)); // Slow down slightly
                setHarpoonsLeft(prev => prev + 3); // Bonus
                setTimeout(() => setMessage(''), 1000);
             }, 300);
          }
        }, 300);
      } else {
        setMessage('MISS!');
        setHarpoonState('RETURNING');
        setTimeout(() => setMessage(''), 500);
      }
    }
  }, [harpoonY, harpoonState, targets, asteroidRotation, rotationSpeed, generateTargets]);
  
  useEffect(() => {
     if (harpoonState === 'RETURNING' && harpoonY >= 410) {
         setHarpoonState('IDLE');
         if (harpoonsLeft <= 0) {
             setGameState('GAME_OVER');
         }
     }
  }, [harpoonY, harpoonState, harpoonsLeft]);

  const stars = React.useMemo(() => {
      return Array.from({length: 80}).map((_, i) => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.7 + 0.3,
          duration: Math.random() * 3 + 2
      }));
  }, []);

  return (
    <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans flex flex-col items-center justify-center rounded-2xl shadow-[0_0_40px_rgba(11,16,38,0.8)] border border-[#c4b5fd]/20">
      
      {/* Background Stars */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {stars.map((star, i) => (
           <circle 
             key={i} 
             cx={`${star.x}%`} 
             cy={`${star.y}%`} 
             r={star.size} 
             fill="#fff" 
             opacity={star.opacity}
           >
             <animate 
                attributeName="opacity" 
                values={`${star.opacity};0.1;${star.opacity}`} 
                dur={`${star.duration}s`} 
                repeatCount="indefinite" 
             />
           </circle>
        ))}
        {/* Nebula clouds */}
        <circle cx="20%" cy="80%" r="150" fill={COLORS.pink} opacity="0.05" filter="blur(40px)" />
        <circle cx="80%" cy="20%" r="150" fill={COLORS.mint} opacity="0.05" filter="blur(40px)" />
      </svg>
      
      {gameState === 'START' && (
        <div className="z-10 flex flex-col items-center p-8 bg-[#0b1026]/80 backdrop-blur-md rounded-2xl border border-[#7de8c3]/30 text-center mx-4 shadow-[0_0_30px_rgba(125,232,195,0.15)]">
          <div className="mb-2 relative">
             <h1 className="text-4xl font-black tracking-tighter" style={{ color: COLORS.mint }}>ASTEROID</h1>
             <div className="absolute -inset-1 blur-sm bg-[#7de8c3] opacity-30 -z-10 rounded-full"></div>
          </div>
          <h2 className="text-2xl font-bold mb-6 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#f9a8d4] to-[#c4b5fd]">
            MINING
          </h2>
          <p className="text-sm mb-8 text-[#c4b5fd] max-w-[250px] leading-relaxed">
            Timing is everything. Harpoon the glowing resource nodes on the spinning asteroid.
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-3 rounded-full font-bold text-lg bg-gradient-to-r from-[#7de8c3] to-[#34d399] text-[#0b1026] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(125,232,195,0.4)]"
          >
            LAUNCH MISSION
          </button>
        </div>
      )}

      {gameState === 'GAME_OVER' && (
        <div className="z-10 flex flex-col items-center p-8 bg-[#0b1026]/90 backdrop-blur-lg rounded-2xl border border-[#f9a8d4]/30 text-center mx-4 shadow-[0_0_30px_rgba(249,168,212,0.15)]">
          <h2 className="text-3xl font-black mb-2 text-white">MISSION COMPLETE</h2>
          <p className="text-sm text-[#c4b5fd] mb-4 uppercase tracking-widest">Total Resources Secured</p>
          <div className="text-6xl font-black mb-8 text-[#7de8c3] drop-shadow-[0_0_15px_rgba(125,232,195,0.6)]">
            {score}
          </div>
          <button 
            onClick={startGame}
            className="px-8 py-3 rounded-full font-bold text-lg bg-gradient-to-r from-[#f9a8d4] to-[#f472b6] text-[#0b1026] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(249,168,212,0.4)]"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <>
          <div className="absolute top-6 left-6 z-10 font-mono">
            <div className="text-xs text-[#c4b5fd] mb-1 tracking-widest">SCORE</div>
            <div className="text-3xl font-black drop-shadow-[0_0_8px_rgba(125,232,195,0.5)]" style={{ color: COLORS.mint }}>{score}</div>
          </div>
          <div className="absolute top-6 right-6 z-10 font-mono text-right">
            <div className="text-xs text-[#c4b5fd] mb-1 tracking-widest">HARPOONS</div>
            <div className="text-3xl font-black flex items-center justify-end gap-2 drop-shadow-[0_0_8px_rgba(249,168,212,0.5)]" style={{ color: COLORS.pink }}>
               {harpoonsLeft}
               <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0L16 8H8L12 0Z" />
                  <rect x="11" y="8" width="2" height="16" />
               </svg>
            </div>
          </div>

          {message && (
             <div className="absolute top-[120px] left-1/2 -translate-x-1/2 z-20 text-2xl font-black italic tracking-widest animate-bounce text-transparent bg-clip-text bg-gradient-to-r from-[#f9a8d4] to-[#c4b5fd] drop-shadow-[0_0_10px_rgba(249,168,212,0.8)] whitespace-nowrap">
                {message}
             </div>
          )}

          <div 
            className="absolute inset-0 cursor-crosshair"
            onClick={shoot}
          >
            {/* Asteroid */}
            <div 
              className="absolute left-1/2 top-[220px] w-[180px] h-[180px] -ml-[90px] -mt-[90px] flex items-center justify-center"
              style={{ transform: `rotate(${asteroidRotation}deg)` }}
            >
              <svg width="180" height="180" viewBox="0 0 180 180" className="drop-shadow-[0_0_20px_rgba(196,181,253,0.15)]">
                <path 
                  d="M 90 10 C 130 5, 160 25, 170 60 C 180 95, 160 130, 140 155 C 110 180, 65 175, 35 150 C 10 120, 5 70, 25 35 C 45 15, 65 20, 90 10 Z" 
                  fill="#0f172a" 
                  stroke="#334155" 
                  strokeWidth="4" 
                />
                <circle cx="50" cy="60" r="14" fill="#020617" opacity="0.6" />
                <circle cx="120" cy="90" r="22" fill="#020617" opacity="0.6" />
                <circle cx="80" cy="140" r="18" fill="#020617" opacity="0.6" />
                <circle cx="140" cy="40" r="10" fill="#020617" opacity="0.6" />
                <path d="M 60 40 Q 80 20 100 40" stroke="#1e293b" strokeWidth="2" fill="none" />
                <path d="M 110 130 Q 130 150 150 130" stroke="#1e293b" strokeWidth="2" fill="none" />
                
                {targets.map(t => {
                   const rad = (t.angle - 90) * Math.PI / 180;
                   const r = 85; 
                   const x = 90 + r * Math.cos(rad);
                   const y = 90 + r * Math.sin(rad);
                   
                   const color = t.type === 'mint' ? COLORS.mint : t.type === 'pink' ? COLORS.pink : COLORS.lavender;
                   
                   return (
                     <g key={t.id} transform={`translate(${x}, ${y}) rotate(${t.angle})`}>
                       {!t.hit ? (
                         <>
                           <circle cx="0" cy="0" r="14" fill={color} opacity="0.25" className="animate-ping" />
                           <circle cx="0" cy="0" r="8" fill={color} />
                           <circle cx="0" cy="0" r="4" fill="#fff" opacity="0.9" />
                           <path d="M -4 -8 L 0 -14 L 4 -8 Z" fill={color} />
                           <path d="M -8 -2 L -14 0 L -8 2 Z" fill={color} />
                           <path d="M 8 -2 L 14 0 L 8 2 Z" fill={color} />
                         </>
                       ) : (
                         <>
                           <circle cx="0" cy="0" r="8" fill="#1e293b" />
                           <circle cx="0" cy="0" r="4" fill="#0f172a" />
                         </>
                       )}
                     </g>
                   );
                })}
              </svg>
            </div>

            {/* Harpoon */}
            <div 
              className="absolute left-1/2 -ml-[6px]"
              style={{ top: `${harpoonY}px` }}
            >
               <svg width="12" height="60" viewBox="0 0 12 60">
                  <path d="M6 0 L12 15 L8 15 L8 60 L4 60 L4 15 L0 15 Z" fill={harpoonState === 'HIT' ? COLORS.mint : COLORS.pink} />
                  <path d="M4 15 L8 15 L6 5 Z" fill="#fff" opacity="0.5" />
                  
                  {harpoonState === 'SHOOTING' && (
                      <>
                        <rect x="4" y="60" width="4" height="150" fill="url(#trail-shoot)" opacity="0.8" />
                        <circle cx="6" cy="60" r="4" fill={COLORS.pink} />
                      </>
                  )}
                  {harpoonState === 'RETURNING' && (
                      <rect x="5" y="60" width="2" height="100" fill="url(#trail-shoot)" opacity="0.3" />
                  )}
                  <defs>
                    <linearGradient id="trail-shoot" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor={COLORS.pink} stopOpacity="1" />
                       <stop offset="100%" stopColor={COLORS.pink} stopOpacity="0" />
                    </linearGradient>
                  </defs>
               </svg>
            </div>
            
            {/* Launcher Base */}
            <div className="absolute bottom-6 left-1/2 -ml-[30px] pointer-events-none">
               <svg width="60" height="50" viewBox="0 0 60 50" className="drop-shadow-[0_0_15px_rgba(125,232,195,0.2)]">
                  <path d="M10 50 L25 20 L35 20 L50 50 Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                  <path d="M25 20 L30 0 L35 20 Z" fill="#475569" />
                  <circle cx="30" cy="35" r="8" fill={harpoonState === 'IDLE' ? COLORS.mint : '#334155'} className={harpoonState === 'IDLE' ? 'animate-pulse' : ''} />
                  <rect x="28" y="0" width="4" height="20" fill="#94a3b8" />
               </svg>
            </div>

            {harpoonState === 'IDLE' && (
               <div className="absolute bottom-[90px] left-0 w-full text-center text-[#c4b5fd] text-xs font-bold tracking-[0.3em] animate-pulse pointer-events-none">
                  TAP TO SHOOT
               </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
