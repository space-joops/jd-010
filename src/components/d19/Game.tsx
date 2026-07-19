"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';

type Phase = 'START' | 'APPROACH' | 'LAUNCHED' | 'DRILL' | 'RESULT';

const TARGET_Y = 25;
const PROBE_START_Y = 80;

export default function Game() {
  const [phase, setPhase] = useState<Phase>('START');
  const [cometX, setCometX] = useState(50);
  const [probeY, setProbeY] = useState(PROBE_START_Y);
  const [drillScore, setDrillScore] = useState(0);
  const [timingScore, setTimingScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5.0);
  const [resultMsg, setResultMsg] = useState('');
  const [stars, setStars] = useState<{x:number, y:number, r:number, c:string, o:number}[]>([]);

  const requestRef = useRef<number | null>(null);
  const launchTimeRef = useRef<number>(0);
  const probeYRef = useRef(PROBE_START_Y);
  const cometXRef = useRef(50);
  const phaseRef = useRef<Phase>('START');

  useEffect(() => {
    setStars([...Array(60)].map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: Math.random() * 1.5 + 0.5,
      c: Math.random() > 0.5 ? "#f9a8d4" : "#7de8c3",
      o: Math.random() * 0.8 + 0.2
    })));
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const loop = useCallback((time: number) => {
    const currentPhase = phaseRef.current;
    if (currentPhase === 'START' || currentPhase === 'RESULT') return;

    if (currentPhase === 'APPROACH' || currentPhase === 'LAUNCHED') {
      const newCometX = 50 + 35 * Math.sin(time / 600) + 5 * Math.sin(time / 300);
      cometXRef.current = newCometX;
      setCometX(newCometX);

      if (currentPhase === 'LAUNCHED') {
        const elapsed = time - launchTimeRef.current;
        const newProbeY = Math.max(TARGET_Y, PROBE_START_Y - (elapsed / 10)); // 10ms per 1%
        probeYRef.current = newProbeY;
        setProbeY(newProbeY);

        if (newProbeY <= TARGET_Y) {
          const dist = Math.abs(newCometX - 50);
          if (dist < 15) {
            phaseRef.current = 'DRILL';
            setPhase('DRILL');
            const tScore = Math.floor(Math.max(0, 15 - dist) * 100);
            setTimingScore(tScore);
            launchTimeRef.current = performance.now(); 
          } else {
            phaseRef.current = 'RESULT';
            setPhase('RESULT');
            setResultMsg('MISSION FAILED: Missed the Comet');
          }
        }
      }
    } else if (currentPhase === 'DRILL') {
       const elapsed = (time - launchTimeRef.current) / 1000;
       const remaining = Math.max(0, 5.0 - elapsed);
       setTimeLeft(remaining);
       if (remaining <= 0) {
         phaseRef.current = 'RESULT';
         setPhase('RESULT');
         setResultMsg('SAMPLE SECURED!');
       }
    }
    
    if (phaseRef.current !== 'START' && phaseRef.current !== 'RESULT') {
      requestRef.current = requestAnimationFrame(loop);
    }
  }, []);

  useEffect(() => {
    if (phase === 'APPROACH') {
      requestRef.current = requestAnimationFrame(loop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [phase, loop]);

  const startGame = () => {
    setPhase('APPROACH');
    setCometX(50);
    setProbeY(PROBE_START_Y);
    setDrillScore(0);
    setTimingScore(0);
    setTimeLeft(5.0);
    setResultMsg('');
    probeYRef.current = PROBE_START_Y;
  };

  const launch = () => {
    if (phase === 'APPROACH') {
      setPhase('LAUNCHED');
      launchTimeRef.current = performance.now();
    }
  };

  const handleDrillTap = (e: React.PointerEvent) => {
    e.preventDefault();
    if (phase === 'DRILL') {
      setDrillScore(s => s + 1);
    }
  };

  const isDrilling = phase === 'DRILL';

  return (
    <div className="max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans rounded-xl shadow-2xl border border-[#c4b5fd]/20 select-none touch-none">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          25% { transform: translate(calc(-50% - 2px), calc(-50% + 2px)) rotate(-1deg); }
          50% { transform: translate(calc(-50% + 2px), calc(-50% - 2px)) rotate(1deg); }
          75% { transform: translate(calc(-50% - 2px), calc(-50% - 2px)) rotate(-1deg); }
        }
        .animate-shake {
          animation: shake 0.2s infinite;
        }
      `}</style>

      {/* Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="15%" r="50%">
            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="#0b1026" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="#0b1026" />
        <rect width="100%" height="100%" fill="url(#starGlow)" />
        {stars.map((s, i) => (
          <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill={s.c} opacity={s.o} />
        ))}
      </svg>

      {/* Target Zone Indicator */}
      {phase === 'APPROACH' && (
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[2px] bg-[#c4b5fd]/30 rounded-full z-10">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-[#c4b5fd]/50" />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-[#c4b5fd]/50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-[#f9a8d4]/50 animate-ping" />
        </div>
      )}

      {/* Comet */}
      <div 
        className={`absolute top-[15%] w-28 h-28 z-0 ${isDrilling ? 'animate-shake' : '-translate-x-1/2 -translate-y-1/2'}`}
        style={!isDrilling ? { left: `${cometX}%` } : { left: '50%' }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(125,232,195,0.6)]">
          <path 
            d="M30 70 Q 40 85 60 75 Q 85 70 85 50 Q 95 30 70 20 Q 50 5 30 25 Q 5 40 15 60 Z" 
            fill="#7de8c3" 
          />
          <circle cx="45" cy="45" r="8" fill="#0b1026" opacity="0.3"/>
          <circle cx="70" cy="40" r="12" fill="#0b1026" opacity="0.4"/>
          <circle cx="35" cy="30" r="6" fill="#0b1026" opacity="0.2"/>
          <circle cx="55" cy="70" r="5" fill="#0b1026" opacity="0.3"/>
        </svg>
      </div>

      {/* Probe */}
      <div 
        className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-16 z-10 transition-transform duration-75"
        style={{ left: '50%', top: `${probeY}%` }}
      >
        <svg viewBox="0 0 50 80" className="w-full h-full drop-shadow-[0_0_10px_rgba(249,168,212,0.8)]">
          <polygon points="25,20 45,70 25,60 5,70" fill="#c4b5fd" />
          <polygon points="25,20 25,60 5,70" fill="#f9a8d4" opacity="0.8"/>
          {!isDrilling && phase !== 'START' && phase !== 'RESULT' && (
            <circle cx="25" cy="75" r="6" fill="#7de8c3" opacity="0.8" className="animate-pulse" />
          )}
          {isDrilling && (
            <rect x="23" y="0" width="4" height="20" fill="#7de8c3" className="animate-bounce" />
          )}
        </svg>
      </div>

      {/* HUD */}
      {(phase === 'APPROACH' || phase === 'LAUNCHED' || phase === 'DRILL') && (
        <div className="absolute top-4 left-4 right-4 flex justify-between z-20 text-[#7de8c3] font-bold tracking-wider drop-shadow-[0_0_5px_rgba(125,232,195,0.8)]">
          <div>SCORE: {timingScore + drillScore * 50}</div>
          {phase === 'DRILL' && <div>TIME: {timeLeft.toFixed(1)}s</div>}
        </div>
      )}

      {/* Overlays */}
      {phase === 'START' && (
        <div className="absolute inset-0 bg-[#0b1026]/80 flex flex-col items-center justify-center p-6 text-center z-30 backdrop-blur-sm">
          <h1 className="text-3xl font-black text-[#7de8c3] mb-2 uppercase tracking-wider drop-shadow-[0_0_10px_rgba(125,232,195,0.8)] leading-tight">
            Comet<br/>Sample Return
          </h1>
          <p className="text-[#c4b5fd] mb-10 text-sm max-w-[250px]">Launch the probe when the comet passes the target zone. Then tap rapidly to extract the core sample!</p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-[#f9a8d4] text-[#0b1026] font-black rounded-full hover:scale-105 active:scale-95 transition-transform shadow-[0_0_15px_rgba(249,168,212,0.6)] uppercase tracking-widest"
          >
            Start Mission
          </button>
        </div>
      )}

      {phase === 'APPROACH' && (
        <div className="absolute bottom-12 left-0 right-0 flex justify-center z-20">
          <button 
            onClick={launch}
            className="w-32 h-32 bg-[#7de8c3] text-[#0b1026] font-black rounded-full hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(125,232,195,0.6)] text-2xl tracking-widest flex items-center justify-center border-4 border-[#0b1026]"
          >
            LAUNCH
          </button>
        </div>
      )}

      {phase === 'DRILL' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-12 bg-gradient-to-t from-[#0b1026] to-transparent pointer-events-none">
          <div className="w-3/4 h-3 bg-[#0b1026] rounded-full mb-6 border border-[#c4b5fd]/50 overflow-hidden relative shadow-[0_0_10px_rgba(196,181,253,0.3)]">
             <div 
               className="h-full bg-gradient-to-r from-[#f9a8d4] to-[#7de8c3] transition-all duration-75 ease-out" 
               style={{ width: `${Math.min(100, (drillScore / 40) * 100)}%` }}
             />
          </div>
          <button 
            onPointerDown={handleDrillTap}
            className="w-40 h-40 bg-[#f9a8d4] text-[#0b1026] font-black rounded-full active:scale-95 transition-transform shadow-[0_0_30px_rgba(249,168,212,0.6)] flex flex-col items-center justify-center text-3xl select-none touch-none uppercase border-4 border-[#0b1026] pointer-events-auto"
          >
            <span>EXTRACT</span>
            <span className="text-sm tracking-widest opacity-70 mt-1">TAP RAPIDLY</span>
          </button>
        </div>
      )}

      {phase === 'RESULT' && (
        <div className="absolute inset-0 bg-[#0b1026]/90 flex flex-col items-center justify-center p-6 text-center z-30 backdrop-blur-md">
          <h2 className={`text-2xl font-black mb-6 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(249,168,212,0.8)] ${resultMsg.includes('FAILED') ? 'text-red-400' : 'text-[#f9a8d4]'}`}>
            {resultMsg}
          </h2>
          
          <div className="bg-[#0b1026] border border-[#c4b5fd]/20 rounded-xl p-6 mb-8 w-full max-w-[280px] shadow-[0_0_20px_rgba(196,181,253,0.1)]">
            <div className="flex justify-between mb-3 text-sm">
              <span className="text-[#c4b5fd]">Timing Score</span>
              <span className="text-[#7de8c3] font-bold">{timingScore}</span>
            </div>
            <div className="flex justify-between mb-4 text-sm">
              <span className="text-[#c4b5fd]">Sample Score</span>
              <span className="text-[#7de8c3] font-bold">{drillScore * 50}</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-[#c4b5fd]/30 text-lg">
              <span className="text-white font-black">TOTAL</span>
              <span className="text-[#f9a8d4] font-black">{timingScore + drillScore * 50}</span>
            </div>
          </div>

          <button 
            onClick={startGame}
            className="px-10 py-4 bg-[#7de8c3] text-[#0b1026] font-black rounded-full hover:scale-105 active:scale-95 transition-transform shadow-[0_0_15px_rgba(125,232,195,0.6)] uppercase tracking-widest"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
