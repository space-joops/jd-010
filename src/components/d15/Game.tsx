'use client';

import React, { useState, useEffect, useRef } from 'react';

type GameState = 'start' | 'playing' | 'end';

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [light, setLight] = useState(50);
  const [water, setWater] = useState(50);
  const [nutrients, setNutrients] = useState(50);
  const [growthRate, setGrowthRate] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showHarvest, setShowHarvest] = useState(false);

  const [stars] = useState(() => 
    Array.from({ length: 25 }).map(() => ({
      size: Math.random() * 3 + 1,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2
    }))
  );

  const stateRef = useRef({
    light: 50,
    water: 50,
    nutrients: 50,
    target: { light: 50, water: 50, nutrients: 50 },
    growthRate: 0,
    progress: 0,
    isHarvesting: false
  });

  // Calculate growth rate whenever sliders or target change
  useEffect(() => {
    stateRef.current.light = light;
    stateRef.current.water = water;
    stateRef.current.nutrients = nutrients;

    const diffL = Math.abs(light - stateRef.current.target.light);
    const diffW = Math.abs(water - stateRef.current.target.water);
    const diffN = Math.abs(nutrients - stateRef.current.target.nutrients);
    const avgDiff = (diffL + diffW + diffN) / 3;
    
    // Smooth scaling so players can gauge distance
    const rate = Math.max(0, 100 - avgDiff * 1.8);
    
    setGrowthRate(rate);
    stateRef.current.growthRate = rate;
  }, [light, water, nutrients]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('end');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastTime = performance.now();
    let animationFrameId: number;

    const loop = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      if (!stateRef.current.isHarvesting && stateRef.current.growthRate > 70) {
        // Grow based on how close to 100% rate they are
        const increment = (stateRef.current.growthRate - 70) * 0.005 * deltaTime;
        stateRef.current.progress += increment;
        
        if (stateRef.current.progress >= 100) {
          stateRef.current.progress = 100;
          stateRef.current.isHarvesting = true;
          
          setScore(s => s + 100);
          setShowHarvest(true);
          
          setTimeout(() => {
            const newTarget = {
              light: Math.floor(Math.random() * 81) + 10,
              water: Math.floor(Math.random() * 81) + 10,
              nutrients: Math.floor(Math.random() * 81) + 10,
            };
            stateRef.current.target = newTarget;
            stateRef.current.progress = 0;
            stateRef.current.isHarvesting = false;
            
            setLight(50);
            setWater(50);
            setNutrients(50);
            setProgress(0);
            setShowHarvest(false);
          }, 1000);
        }
        setProgress(stateRef.current.progress);
      } else if (!stateRef.current.isHarvesting && stateRef.current.growthRate <= 70 && stateRef.current.progress > 0) {
        // Slowly lose progress if environment is bad
        stateRef.current.progress = Math.max(0, stateRef.current.progress - 0.002 * deltaTime);
        setProgress(stateRef.current.progress);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setLight(50);
    setWater(50);
    setNutrients(50);
    setProgress(0);
    setShowHarvest(false);
    
    stateRef.current = {
      light: 50,
      water: 50,
      nutrients: 50,
      target: {
        light: Math.floor(Math.random() * 81) + 10,
        water: Math.floor(Math.random() * 81) + 10,
        nutrients: Math.floor(Math.random() * 81) + 10,
      },
      growthRate: 0,
      progress: 0,
      isHarvesting: false
    };
    
    setGameState('playing');
  };

  const getPlantStage = () => {
    if (stateRef.current.isHarvesting) return 3;
    if (progress < 30) return 0;
    if (progress < 60) return 1;
    if (progress < 90) return 2;
    return 3;
  };

  const sliders = [
    { label: 'LIGHT', color: '#f9a8d4', value: light, setValue: setLight, icon: <SunIcon /> },
    { label: 'WATER', color: '#7de8c3', value: water, setValue: setWater, icon: <DropIcon /> },
    { label: 'NUTRIENTS', color: '#c4b5fd', value: nutrients, setValue: setNutrients, icon: <FlaskIcon /> },
  ];

  return (
    <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white rounded-3xl shadow-2xl border-[6px] border-[#c4b5fd]/30 font-sans select-none">
      
      {gameState === 'start' && (
        <div className="absolute inset-0 bg-[#0b1026] flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-32 h-32 mb-4 animate-pulse">
            <PlantSVG stage={3} progress={100} />
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#7de8c3] via-[#f9a8d4] to-[#c4b5fd] mb-3 drop-shadow-lg leading-tight">
            SPACE<br/>BOTANY
          </h1>
          <p className="text-[#c4b5fd] text-sm mb-8 font-medium leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
            무중력 온실에서 식물을 가꾸세요.<br/>
            빛, 물, 영양분 슬라이더를 조절해<br/>
            최적의 생장률(70% 이상)을 찾으세요!
          </p>
          <button 
            onClick={startGame}
            className="px-10 py-4 bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] text-[#0b1026] font-black rounded-full text-xl shadow-[0_0_20px_rgba(125,232,195,0.5)] hover:scale-105 transition-transform active:scale-95"
          >
            MISSION START
          </button>
        </div>
      )}

      {gameState === 'end' && (
        <div className="absolute inset-0 bg-[#0b1026]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
          <h2 className="text-3xl font-black text-[#f9a8d4] mb-4 tracking-widest">MISSION COMPLETE</h2>
          <div className="text-6xl font-mono text-white mb-6 font-black drop-shadow-[0_0_20px_rgba(196,181,253,0.8)]">
            {score}
          </div>
          <p className="text-[#c4b5fd] text-lg mb-10 font-bold bg-white/10 px-6 py-3 rounded-xl">
            수확한 외계 식물: {score / 100}개
          </p>
          <button 
            onClick={startGame}
            className="px-10 py-4 bg-transparent text-white border-4 border-[#7de8c3] font-black rounded-full text-xl hover:bg-[#7de8c3] hover:text-[#0b1026] transition-all shadow-[0_0_15px_rgba(125,232,195,0.3)] active:scale-95"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Main Game UI */}
      <div className="p-5 h-full flex flex-col justify-between relative z-0">
        
        {/* Decorative background stars */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          {stars.map((star, i) => (
             <div key={i} className="absolute bg-white rounded-full animate-pulse" style={{
               width: star.size,
               height: star.size,
               top: star.top,
               left: star.left,
               animationDuration: `${star.duration}s`,
               animationDelay: `${star.delay}s`
             }} />
          ))}
        </div>

        {/* Header */}
        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm z-10 shadow-lg">
          <div className="flex flex-col">
            <span className="text-xs text-[#c4b5fd] font-bold tracking-wider">TIME LEFT</span>
            <span className={`text-3xl font-mono font-black ${timeLeft <= 10 ? 'text-[#f9a8d4] animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-[#7de8c3] font-bold tracking-wider">SCORE</span>
            <span className="text-3xl font-mono font-black text-white">{score}</span>
          </div>
        </div>

        {/* Plant Area */}
        <div className="relative flex-1 flex flex-col items-center justify-center my-4 bg-gradient-to-b from-white/5 to-transparent rounded-3xl border border-white/10 z-10 overflow-hidden shadow-inner">
          <div className="absolute top-4 left-4 text-xs font-bold text-white/30 tracking-widest bg-white/5 px-2 py-1 rounded-md">
            TARGET: HIDDEN
          </div>
          
          {/* Harvest Progress Circular */}
          <div className="absolute top-4 right-4 w-14 h-14 flex items-center justify-center bg-black/20 rounded-full shadow-inner">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-md">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="4"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={progress >= 100 ? "#f9a8d4" : "#7de8c3"}
                strokeWidth="4"
                strokeDasharray={`${progress}, 100`}
                className="transition-all duration-100 ease-linear"
              />
            </svg>
            <div className="absolute text-[11px] font-black font-mono text-white">
              {Math.floor(progress)}%
            </div>
          </div>
          
          {showHarvest && (
            <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-black text-[#f9a8d4] animate-bounce drop-shadow-[0_0_15px_rgba(249,168,212,0.8)] z-30">
              +100
            </div>
          )}

          <div className={`transition-transform duration-500 w-full h-full flex items-center justify-center ${showHarvest ? 'scale-110' : 'scale-100'}`}>
            <PlantSVG stage={getPlantStage()} progress={progress} />
          </div>
          
          {/* Growth Rate Meter */}
          <div className="w-5/6 absolute bottom-6 bg-black/40 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="flex justify-between text-[10px] font-bold text-white/50 mb-1.5 px-1">
              <span>RATE</span>
              <span className={growthRate > 90 ? 'text-[#7de8c3]' : growthRate > 70 ? 'text-[#f9a8d4]' : ''}>
                {Math.round(growthRate)}%
              </span>
            </div>
            <div className="w-full bg-black h-3 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
              <div 
                className="h-full transition-all duration-200 ease-out relative rounded-full"
                style={{ 
                  width: `${growthRate}%`,
                  background: growthRate > 90 
                    ? 'linear-gradient(90deg, #10b981, #7de8c3)' 
                    : growthRate > 70 
                      ? 'linear-gradient(90deg, #db2777, #f9a8d4)' 
                      : 'linear-gradient(90deg, #6d28d9, #c4b5fd)',
                  boxShadow: growthRate > 90 ? '0 0 12px #7de8c3' : 'none'
                }}
              />
              {/* Target zone indicator */}
              <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-white/50 z-10" />
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="bg-white/5 p-5 rounded-3xl border border-white/10 space-y-5 backdrop-blur-sm z-10 shadow-lg">
          {sliders.map(s => (
            <div key={s.label} className="relative">
              <div className="flex justify-between text-xs mb-2 font-black tracking-widest" style={{ color: s.color }}>
                <span className="flex items-center gap-1.5">{s.icon} {s.label}</span>
                <span className="font-mono text-white">{s.value}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={s.value} 
                onChange={e => s.setValue(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(255,255,255,0.9)]
                  [&::-moz-range-thumb]:w-6
                  [&::-moz-range-thumb]:h-6
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:shadow-[0_0_12px_rgba(255,255,255,0.9)]"
                style={{ 
                  background: `linear-gradient(to right, ${s.color} ${s.value}%, rgba(255,255,255,0.1) ${s.value}%)` 
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Icons
const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
);

const DropIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
);

const FlaskIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"/><path d="M14 9.31V2"/><path d="M8.5 2h7"/><path d="M14 9.31l6.4 9.6A2 2 0 0 1 18.73 22H5.27a2 2 0 0 1-1.66-3.09L10 9.31Z"/><line x1="6" y1="14" x2="18" y2="14"/></svg>
);

// Plant SVG Component
const PlantSVG = ({ stage, progress }: { stage: number, progress: number }) => {
  const scale = 0.6 + (progress / 100) * 0.4;
  
  return (
    <svg width="140" height="180" viewBox="0 0 120 160" className={`transition-transform duration-300 ${stage === 3 ? 'drop-shadow-[0_0_25px_rgba(249,168,212,0.6)]' : 'drop-shadow-[0_0_15px_rgba(125,232,195,0.3)]'}`}>
      
      {/* Dirt/Pot */}
      <path d="M 35 145 Q 60 160 85 145 L 95 115 L 25 115 Z" fill="#1f2937" stroke="#374151" strokeWidth="2" />
      <rect x="20" y="105" width="80" height="10" rx="4" fill="#374151" />
      <rect x="25" y="105" width="70" height="3" fill="#4b5563" />
      
      <g transform={`scale(${scale})`} style={{ transformOrigin: '60px 115px' }}>
        
        {/* Glow effect for full plant */}
        {stage === 3 && (
           <circle cx="60" cy="40" r="40" fill="url(#glow)" opacity="0.6" />
        )}
        
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f9a8d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#f9a8d4" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Stem */}
        {stage >= 0 && (
          <path d="M 60 105 Q 55 80 60 55" fill="none" stroke={stage === 3 ? "#f9a8d4" : "#7de8c3"} strokeWidth="5" strokeLinecap="round" className="transition-all duration-500" />
        )}
        
        {/* Leaves stage 0 */}
        {stage >= 0 && (
          <>
            <path d="M 60 90 Q 35 85 40 65 Q 55 70 60 90" fill={stage === 3 ? "#fbcfe8" : "#a7f3d0"} className="transition-all duration-500" />
            <path d="M 60 85 Q 85 80 80 60 Q 65 65 60 85" fill={stage === 3 ? "#fbcfe8" : "#7de8c3"} className="transition-all duration-500" />
          </>
        )}
        
        {/* Stage 1 */}
        {stage >= 1 && (
          <>
            <path d="M 60 55 Q 65 35 60 15" fill="none" stroke={stage === 3 ? "#f9a8d4" : "#7de8c3"} strokeWidth="5" strokeLinecap="round" className="transition-all duration-500" />
            <path d="M 60 45 Q 35 40 40 20 Q 55 25 60 45" fill={stage === 3 ? "#fbcfe8" : "#34d399"} className="transition-all duration-500" />
            <path d="M 60 50 Q 85 45 80 25 Q 65 30 60 50" fill={stage === 3 ? "#fbcfe8" : "#10b981"} className="transition-all duration-500" />
          </>
        )}
        
        {/* Stage 2 & 3: Bud / Flower */}
        {stage >= 2 && (
          <circle cx="60" cy="15" r={stage === 3 ? "12" : "8"} fill={stage === 3 ? "#f9a8d4" : "#c4b5fd"} className="transition-all duration-500" />
        )}
        
        {/* Bloom petals */}
        {stage === 3 && (
          <g className="animate-pulse origin-[60px_15px]">
            {[0, 72, 144, 216, 288].map(angle => (
               <path key={angle} d="M 60 3 Q 75 -10 90 3 Q 75 20 60 15 Z" fill="#f9a8d4" transform={`rotate(${angle}, 60, 15)`} opacity="0.9" />
            ))}
            <circle cx="60" cy="15" r="6" fill="#fff" />
          </g>
        )}
      </g>
    </svg>
  );
};
