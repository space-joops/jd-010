"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

type Signal = {
  id: number;
  spawnTime: number;
  targetTime: number;
  status: 'active' | 'hit' | 'missed';
};

type Feedback = {
  id: number;
  text: string;
};

const TRAVEL_TIME = 2000;
const SPAWN_INTERVAL = 700;
const HIT_WINDOW = 150;
const GAME_DURATION = 30000;
const TARGET_RADIUS = 150;
const CENTER_X = 215;
const CENTER_Y = 250;

export default function Game() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [now, setNow] = useState(0);

  const signalsRef = useRef<Signal[]>([]);
  const startTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const reqRef = useRef<number>(0);

  const stars = useMemo(() => Array.from({ length: 60 }).map(() => ({
    x: Math.random() * 430,
    y: Math.random() * 500,
    r: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.8 + 0.2
  })), []);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(GAME_DURATION / 1000);
    setFeedbacks([]);
    signalsRef.current = [];
    const t = Date.now();
    startTimeRef.current = t;
    lastSpawnRef.current = t;
    setNow(t);
  };

  const showFeedback = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setFeedbacks(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setFeedbacks(prev => prev.filter(f => f.id !== id));
    }, 800);
  }, []);

  const loop = useCallback(() => {
    const currentTime = Date.now();
    setNow(currentTime);

    const elapsedGame = currentTime - startTimeRef.current;
    if (elapsedGame >= GAME_DURATION) {
      setGameState('end');
      return; 
    }

    const remaining = Math.max(0, Math.ceil((GAME_DURATION - elapsedGame) / 1000));
    setTimeLeft(prev => prev !== remaining ? remaining : prev);

    while (currentTime - lastSpawnRef.current > SPAWN_INTERVAL) {
      const spawnT = lastSpawnRef.current + SPAWN_INTERVAL;
      
      if (spawnT + TRAVEL_TIME <= startTimeRef.current + GAME_DURATION) {
        signalsRef.current.push({
          id: spawnT,
          spawnTime: spawnT,
          targetTime: spawnT + TRAVEL_TIME,
          status: 'active'
        });
      }
      lastSpawnRef.current = spawnT;
    }

    let missedCount = 0;
    signalsRef.current.forEach(s => {
      if (s.status === 'active' && currentTime > s.targetTime + HIT_WINDOW) {
        s.status = 'missed';
        missedCount++;
      }
    });

    if (missedCount > 0) {
      setCombo(0);
      showFeedback('MISS');
    }

    signalsRef.current = signalsRef.current.filter(s => currentTime < s.targetTime + 1000);

    reqRef.current = requestAnimationFrame(loop);
  }, [showFeedback]);

  useEffect(() => {
    if (gameState === 'playing') {
      reqRef.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(reqRef.current);
  }, [gameState, loop]);

  const handleTap = (e: React.PointerEvent) => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    const currentTime = Date.now();

    const activeSignals = signalsRef.current.filter(s => s.status === 'active');
    
    if (activeSignals.length === 0) {
      setCombo(0);
      return;
    }

    activeSignals.sort((a, b) => a.targetTime - b.targetTime);
    const closest = activeSignals[0];

    const diff = Math.abs(currentTime - closest.targetTime);
    if (diff <= HIT_WINDOW) {
      closest.status = 'hit';
      
      let points = 10;
      let text = 'GOOD';
      if (diff <= HIT_WINDOW / 2) {
        points = 20;
        text = 'PERFECT';
      }

      setCombo(c => {
        const newCombo = c + 1;
        setMaxCombo(prev => Math.max(prev, newCombo));
        
        let multiplier = 1;
        if (newCombo >= 20) multiplier = 2;
        else if (newCombo >= 10) multiplier = 1.5;
        
        setScore(s => s + Math.floor(points * multiplier));
        return newCombo;
      });

      showFeedback(text);
    } else if (diff <= HIT_WINDOW * 2.5) {
      closest.status = 'missed';
      setCombo(0);
      showFeedback('MISS');
    } else {
      setCombo(0);
    }
  };

  const pulsePhase = now > 0 ? (now % SPAWN_INTERVAL) / SPAWN_INTERVAL : 0;
  const pulsarRadius = 15 + Math.exp(-pulsePhase * 5) * 10;

  return (
    <div 
      className="max-w-[430px] w-full mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white select-none touch-none shadow-2xl shadow-[#7de8c3]/10 rounded-xl border border-[#c4b5fd]/20"
      onPointerDown={handleTap}
    >
      <style>{`
        @keyframes floatUpFade {
          0% { transform: translate(-50%, -50%); opacity: 1; scale: 0.8; }
          20% { transform: translate(-50%, -60%); opacity: 1; scale: 1.2; }
          100% { transform: translate(-50%, -100%); opacity: 0; scale: 1; }
        }
        .feedback-anim {
          animation: floatUpFade 0.8s ease-out forwards;
        }
      `}</style>

      <svg width="100%" height="100%" viewBox="0 0 430 500" className="absolute inset-0 pointer-events-none">
        {/* Stars */}
        {stars.map((star, i) => (
          <circle key={i} cx={star.x} cy={star.y} r={star.r} fill="#ffffff" opacity={star.opacity} />
        ))}
        
        {/* Target Ring */}
        <circle 
          cx={CENTER_X} 
          cy={CENTER_Y} 
          r={TARGET_RADIUS} 
          stroke="#7de8c3" 
          strokeWidth="2" 
          fill="none" 
          strokeDasharray="4 8" 
          opacity={gameState === 'playing' ? 0.6 : 0.2} 
        />
        
        {gameState === 'playing' && signalsRef.current.map(signal => {
          const elapsed = now - signal.spawnTime;
          const progress = elapsed / TRAVEL_TIME;
          const currentRadius = progress * TARGET_RADIUS;
          
          let opacity = 1;
          let stroke = "#f9a8d4";
          
          if (signal.status === 'hit') {
            stroke = "#7de8c3";
            opacity = 1 - (now - signal.targetTime) / 300;
          } else if (signal.status === 'missed') {
            stroke = "#ef4444";
            opacity = 1 - (now - signal.targetTime - HIT_WINDOW) / 300;
          } else {
             opacity = Math.min(1, progress * 5);
          }
          
          if (opacity < 0) return null;
          
          return (
            <circle 
              key={signal.id} 
              cx={CENTER_X} 
              cy={CENTER_Y} 
              r={Math.max(0, currentRadius)} 
              stroke={stroke} 
              strokeWidth={signal.status === 'hit' ? 6 : 3} 
              fill="none" 
              opacity={opacity} 
            />
          );
        })}

        {/* Pulsar Center */}
        <circle 
          cx={CENTER_X} 
          cy={CENTER_Y} 
          r={gameState === 'playing' ? pulsarRadius : 15} 
          fill="#c4b5fd" 
          opacity={0.9}
        />
        {/* Pulsar Glow */}
        <circle 
          cx={CENTER_X} 
          cy={CENTER_Y} 
          r={gameState === 'playing' ? pulsarRadius * 2 : 25} 
          fill="#c4b5fd" 
          opacity={0.2}
          filter="blur(4px)"
        />
      </svg>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header HUD */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[#f9a8d4] font-bold text-sm tracking-wider uppercase">Score</span>
            <span className="text-3xl font-black drop-shadow-md tabular-nums">{score.toLocaleString()}</span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-[#c4b5fd] font-bold text-sm tracking-wider uppercase">Time</span>
            <span className="text-3xl font-black drop-shadow-md w-12 text-right tabular-nums">{timeLeft}</span>
          </div>
        </div>

        {/* Combo Tracker */}
        {gameState === 'playing' && combo > 0 && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="text-sm font-bold text-[#7de8c3]">COMBO</span>
            <span className={`text-4xl font-black ${combo >= 20 ? 'text-[#f9a8d4] animate-pulse' : 'text-white'}`}>
              {combo}
            </span>
          </div>
        )}

        {/* Feedbacks */}
        {feedbacks.map(f => (
          <div 
            key={f.id} 
            className="feedback-anim absolute left-1/2 top-[45%] text-2xl font-black tracking-widest drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] z-10"
            style={{
              color: f.text === 'PERFECT' ? '#7de8c3' : f.text === 'GOOD' ? '#c4b5fd' : '#ef4444'
            }}
          >
            {f.text}
          </div>
        ))}
      </div>

      {/* Screens */}
      {gameState !== 'playing' && (
        <div className="absolute inset-0 bg-[#0b1026]/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-20 pointer-events-auto">
          {gameState === 'start' ? (
            <>
              <h1 className="text-4xl font-black text-[#7de8c3] mb-4 drop-shadow-[0_0_10px_rgba(125,232,195,0.5)] leading-tight">
                PULSAR<br/>TIMING
              </h1>
              <p className="text-[#c4b5fd] mb-8 text-sm max-w-[250px] leading-relaxed">
                Tap anywhere when the expanding pulse hits the dashed target ring. Keep the rhythm to build your combo!
              </p>
              <button 
                className="px-8 py-4 bg-[#f9a8d4] text-[#0b1026] font-black rounded-full hover:bg-[#7de8c3] transition-colors active:scale-95 text-lg shadow-[0_0_20px_rgba(249,168,212,0.4)] w-full max-w-[250px]"
                onClick={startGame}
              >
                START SYNC
              </button>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-black text-[#f9a8d4] mb-4 drop-shadow-[0_0_10px_rgba(249,168,212,0.5)]">
                CONNECTION LOST
              </h2>
              <div className="bg-white/5 p-6 rounded-2xl mb-8 w-full backdrop-blur-md border border-white/10">
                <div className="flex flex-col mb-6">
                  <span className="text-[#c4b5fd] text-sm uppercase tracking-wider font-bold mb-1">Final Score</span>
                  <span className="text-5xl font-black text-white tabular-nums">{score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-5">
                  <div className="flex flex-col items-start">
                    <span className="text-[#7de8c3] text-xs uppercase font-bold mb-1">Max Combo</span>
                    <span className="text-xl font-bold">{maxCombo}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[#7de8c3] text-xs uppercase font-bold mb-1">Rank</span>
                    <span className="text-xl font-bold">
                      {score > 800 ? 'S' : score > 500 ? 'A' : score > 250 ? 'B' : 'C'}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                className="px-8 py-4 bg-[#7de8c3] text-[#0b1026] font-black rounded-full hover:bg-[#c4b5fd] transition-colors active:scale-95 text-lg shadow-[0_0_20px_rgba(125,232,195,0.4)] w-full max-w-[250px]"
                onClick={startGame}
              >
                PLAY AGAIN
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
