"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';

const TOTAL_TIME = 30;
const R = 22;
const SQRT3 = Math.sqrt(3);

const hexCoordinates = [
  {q: 0, r: 0},
  {q: 1, r: 0}, {q: 0, r: 1}, {q: -1, r: 1}, {q: -1, r: 0}, {q: 0, r: -1}, {q: 1, r: -1},
  {q: 2, r: 0}, {q: 1, r: 1}, {q: 0, r: 2}, {q: -1, r: 2}, {q: -2, r: 2}, {q: -2, r: 1},
  {q: -2, r: 0}, {q: -1, r: -1}, {q: 0, r: -2}, {q: 1, r: -2}, {q: 2, r: -2}, {q: 2, r: -1}
];

const mirrorPositions = hexCoordinates.map(hex => ({
  x: SQRT3 * R * (hex.q + hex.r / 2) + 150,
  y: 1.5 * R * hex.r + 150
}));

const hexPoints = Array.from({length: 6}).map((_, i) => {
  const a = (60 * i - 90) * Math.PI / 180;
  return (R * Math.cos(a)) + "," + (R * Math.sin(a));
}).join(' ');

export default function Game() {
  const [gameState, setGameState] = useState<'idle'|'playing'|'gameover'>('idle');
  const [mirrors, setMirrors] = useState<number[]>(Array(19).fill(0));
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_TIME);
  const [score, setScore] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stars = useMemo(() => Array.from({length: 40}).map(() => ({
    cx: Math.random() * 400,
    cy: Math.random() * 160,
    r: Math.random() * 1.5 + 0.5,
    fill: Math.random() > 0.8 ? '#7de8c3' : Math.random() > 0.5 ? '#f9a8d4' : '#ffffff',
    opacity: Math.random() * 0.6 + 0.4
  })), []);

  const alignedCount = mirrors.filter(m => m % 6 === 0).length;

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      handleGameOver(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState === 'playing' && alignedCount === 19) {
      handleGameOver(true);
    }
  }, [alignedCount, gameState]);

  const handleGameOver = (isWin: boolean) => {
    setGameState('gameover');
    if (timerRef.current) clearTimeout(timerRef.current);
    const finalScore = (alignedCount * 50) + (isWin ? timeLeft * 100 : 0);
    setScore(finalScore);
  };

  const startGame = () => {
    const newMirrors: number[] = Array.from({ length: 19 }, () => {
      if (Math.random() < 0.25) return 0;
      return Math.floor(Math.random() * 5) + 1;
    });
    if (newMirrors.every(m => m === 0)) { (newMirrors as number[])[0] = 1; }
    setMirrors(newMirrors);
    setTimeLeft(TOTAL_TIME);
    setScore(0);
    setGameState('playing');
  };

  const onMirrorClick = (index: number) => {
    if (gameState !== 'playing') return;
    setMirrors(prev => {
      const next = [...prev];
      next[index] = next[index] + 1;
      return next;
    });
  };

  const blurAmount = gameState === 'idle' ? 15 : ((19 - alignedCount) / 19) * 15;

  return (
    <div className="max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white flex flex-col font-sans border border-[#c4b5fd]/20 rounded-lg shadow-2xl select-none">
      
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-[#0b1026]/80 backdrop-blur-sm z-10 border-b border-[#c4b5fd]/10">
        <h1 className="text-[#c4b5fd] font-bold text-sm tracking-widest">JWST CALIBRATION</h1>
        <div className="flex gap-4 font-mono text-sm">
          <div className={timeLeft <= 10 ? 'text-[#f9a8d4] animate-pulse' : 'text-[#7de8c3]'}>
            T-{timeLeft}s
          </div>
        </div>
      </div>

      {/* Galaxy Display Area */}
      <div className="w-[90%] mx-auto h-[160px] relative rounded-xl overflow-hidden border border-[#c4b5fd]/30 mt-4 bg-[#0b1026] flex-shrink-0 shadow-[0_0_15px_rgba(196,181,253,0.1)]">
        <div 
          style={{ 
            filter: `blur(${blurAmount}px)`,
            transform: 'scale(1.1)'
          }} 
          className="w-full h-full transition-all duration-500 ease-out"
        >
          <svg viewBox="0 0 400 160" className="w-full h-full">
            <defs>
              <radialGradient id="galaxyCore" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#f9a8d4" stopOpacity="1" />
                <stop offset="40%" stopColor="#c4b5fd" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0b1026" stopOpacity="0" />
              </radialGradient>
            </defs>
            {stars.map((star, i) => (
              <circle key={i} cx={star.cx} cy={star.cy} r={star.r} fill={star.fill} opacity={star.opacity} />
            ))}
            <ellipse cx="200" cy="80" rx="130" ry="35" fill="url(#galaxyCore)" transform="rotate(-15 200 80)" />
            <ellipse cx="200" cy="80" rx="70" ry="15" fill="#ffffff" opacity="0.4" transform="rotate(-15 200 80)" filter="blur(3px)" />
            <ellipse cx="200" cy="80" rx="20" ry="8" fill="#ffffff" opacity="0.8" transform="rotate(-15 200 80)" filter="blur(1px)" />
          </svg>
        </div>
        
        {gameState === 'playing' && alignedCount === 19 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b1026]/40 z-10">
            <div className="text-[#7de8c3] font-bold text-xl tracking-widest bg-[#0b1026]/80 px-4 py-2 rounded border border-[#7de8c3]">
              SIGNAL ACQUIRED
            </div>
          </div>
        )}
      </div>

      {/* Mirrors Area */}
      <div className="flex-1 w-full relative flex items-center justify-center mt-2">
        <svg width="300" height="300" viewBox="0 0 300 300" className="mx-auto block overflow-visible">
          {mirrors.map((rot, i) => {
            const isAligned = rot % 6 === 0;
            const {x, y} = mirrorPositions[i];
            return (
              <g key={i} transform={`translate(${x}, ${y})`}>
                <g 
                  style={{ 
                    transform: `rotate(${rot * 60}deg)`, 
                    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                  }}
                  onClick={() => onMirrorClick(i)}
                  className="cursor-pointer group"
                >
                  <polygon
                    points={hexPoints}
                    fill={isAligned ? 'rgba(125, 232, 195, 0.15)' : 'rgba(196, 181, 253, 0.05)'}
                    stroke={isAligned ? '#7de8c3' : '#c4b5fd'}
                    strokeWidth="1.5"
                    className="transition-colors duration-300 group-hover:stroke-[#f9a8d4]"
                  />
                  <line 
                    x1="0" y1="0" x2="0" y2={-R} 
                    stroke={isAligned ? '#7de8c3' : '#f9a8d4'} 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    className="transition-colors duration-300"
                  />
                  <circle 
                    cx="0" cy={-R + 4} r="2.5" 
                    fill={isAligned ? '#7de8c3' : '#f9a8d4'} 
                    className="transition-colors duration-300"
                  />
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-[#c4b5fd]/20 w-full">
        <div 
          className="h-full bg-[#7de8c3] transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / TOTAL_TIME) * 100}%` }}
        />
      </div>

      {/* Overlays */}
      {gameState !== 'playing' && (
        <div className="absolute inset-0 bg-[#0b1026]/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center">
          {gameState === 'idle' ? (
            <>
              <h2 className="text-3xl font-bold text-[#7de8c3] mb-4 tracking-widest drop-shadow-[0_0_10px_rgba(125,232,195,0.5)]">
                CALIBRATION
              </h2>
              <p className="text-[#c4b5fd] text-sm mb-8 max-w-[250px] leading-relaxed">
                Align all 19 hexagonal mirror segments to their zero position to focus the deep-space signal.
              </p>
              <button 
                onClick={startGame}
                className="bg-transparent border-2 border-[#7de8c3] text-[#7de8c3] px-8 py-3 rounded-full font-bold tracking-widest hover:bg-[#7de8c3]/10 transition-colors active:scale-95"
              >
                INITIATE
              </button>
            </>
          ) : (
            <>
              <h2 className={`text-2xl font-bold mb-2 tracking-widest ${alignedCount === 19 ? 'text-[#7de8c3]' : 'text-[#f9a8d4]'}`}>
                {alignedCount === 19 ? 'SIGNAL ACQUIRED' : 'SIGNAL LOST'}
              </h2>
              <div className="text-[#c4b5fd] text-sm mb-8 flex flex-col gap-2 mt-4 bg-[#c4b5fd]/5 p-4 rounded-lg border border-[#c4b5fd]/10 w-full max-w-[200px]">
                <div className="flex justify-between">
                  <span>Aligned:</span>
                  <span className="font-mono text-white">{alignedCount}/19</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Bonus:</span>
                  <span className="font-mono text-white">{alignedCount === 19 ? timeLeft * 100 : 0}</span>
                </div>
                <div className="w-full h-[1px] bg-[#c4b5fd]/20 my-1" />
                <div className="flex justify-between text-[#7de8c3] font-bold">
                  <span>Score:</span>
                  <span className="font-mono">{score}</span>
                </div>
              </div>
              <button 
                onClick={startGame}
                className={`bg-transparent border-2 px-8 py-3 rounded-full font-bold tracking-widest transition-colors active:scale-95 ${
                  alignedCount === 19 
                    ? 'border-[#7de8c3] text-[#7de8c3] hover:bg-[#7de8c3]/10' 
                    : 'border-[#f9a8d4] text-[#f9a8d4] hover:bg-[#f9a8d4]/10'
                }`}
              >
                {alignedCount === 19 ? 'NEXT TARGET' : 'RETRY'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
