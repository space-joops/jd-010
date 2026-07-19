"use client";
import React, { useState, useEffect, useRef } from 'react';

const TYPES = ['alpha', 'theta', 'chi', 'gamma'] as const;
type SymbolType = typeof TYPES[number];

const SymbolIcon = ({ type, className }: { type: SymbolType, className?: string }) => {
  switch (type) {
    case 'alpha':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-[#7de8c3] drop-shadow-[0_0_8px_rgba(125,232,195,0.8)] ${className}`}><path d="M12 2L2 22h20L12 2z"/></svg>;
    case 'theta':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-[#f9a8d4] drop-shadow-[0_0_8px_rgba(249,168,212,0.8)] ${className}`}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'chi':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-[#c4b5fd] drop-shadow-[0_0_8px_rgba(196,181,253,0.8)] ${className}`}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>;
    case 'gamma':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-[#fde047] drop-shadow-[0_0_8px_rgba(253,224,71,0.8)] ${className}`}><path d="M12 2l8 6v8l-8 6-8-6V8l8-6z"/></svg>;
  }
}

export default function Game() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER'>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [targetSequence, setTargetSequence] = useState<SymbolType[]>([]);
  const [progress, setProgress] = useState(0);
  const [symbols, setSymbols] = useState<{id: string, type: SymbolType, x: number, duration: number, timestamp: number}[]>([]);
  const [combo, setCombo] = useState(0);
  
  const [shake, setShake] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cleanupRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const generateSequence = (length: number): SymbolType[] => {
    const seq: SymbolType[] = [];
    for (let i = 0; i < length; i++) {
      seq.push(TYPES[Math.floor(Math.random() * TYPES.length)]);
    }
    return seq;
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setCombo(0);
    setProgress(0);
    setTargetSequence(generateSequence(3));
    setSymbols([]);
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('GAME_OVER');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      spawnRef.current = setInterval(() => {
        setSymbols(prev => [...prev, {
          id: `${Date.now()}-${Math.random()}`,
          type: TYPES[Math.floor(Math.random() * TYPES.length)],
          x: Math.floor(Math.random() * 80) + 10,
          duration: Math.random() * 2 + 3, // 3 to 5 seconds
          timestamp: Date.now()
        }]);
      }, 400);

      cleanupRef.current = setInterval(() => {
        const now = Date.now();
        setSymbols(prev => prev.filter(s => now - s.timestamp < s.duration * 1000 + 1000));
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
      if (cleanupRef.current) clearInterval(cleanupRef.current);
    };
  }, [gameState]);

  const handleSymbolClick = (id: string, type: SymbolType) => {
    if (gameState !== 'PLAYING') return;

    setSymbols(prev => prev.filter(s => s.id !== id));

    if (type === targetSequence[progress]) {
      const nextProgress = progress + 1;
      if (nextProgress === targetSequence.length) {
        setScore(s => s + targetSequence.length * 100 + combo * 50);
        setCombo(c => c + 1);
        setTimeLeft(t => Math.min(t + 2, 60));
        setProgress(0);
        const nextLen = Math.min(3 + Math.floor((combo + 1) / 3), 6);
        setTargetSequence(generateSequence(nextLen));
        
        setSuccessFlash(true);
        setTimeout(() => setSuccessFlash(false), 300);
      } else {
        setProgress(nextProgress);
      }
    } else {
      setCombo(0);
      setProgress(0);
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }
  };

  return (
    <div className={`max-w-[430px] w-full mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white rounded-xl shadow-[0_0_30px_rgba(11,16,38,0.9)] border-2 border-[#1a203f] select-none ${shake ? 'animate-shake' : ''} ${successFlash ? 'animate-flash' : ''}`}>
      <style>
        {`
          @keyframes fall {
            0% { transform: translateY(-50px) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(550px) rotate(360deg); opacity: 0; }
          }
          .animate-fall {
            animation-name: fall;
            animation-timing-function: linear;
            animation-fill-mode: forwards;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px) rotate(-2deg); }
            50% { transform: translateX(8px) rotate(2deg); }
            75% { transform: translateX(-8px) rotate(-2deg); }
          }
          .animate-shake {
            animation: shake 0.3s ease-in-out;
          }
          @keyframes flash {
            0%, 100% { background-color: #0b1026; }
            50% { background-color: rgba(125, 232, 195, 0.2); }
          }
          .animate-flash {
            animation: flash 0.3s ease-in-out;
          }
        `}
      </style>

      {/* Background Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {mounted && [...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              animationDuration: `${Math.random() * 3 + 1}s`
            }}
          />
        ))}
      </div>

      {/* Header UI */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-4 left-0 w-full flex flex-col items-center z-10 pointer-events-none">
          <div className="flex justify-between w-full px-6 mb-3">
            <div className="text-[#7de8c3] font-mono text-xl font-bold drop-shadow-[0_0_5px_rgba(125,232,195,0.8)]">TIME: {timeLeft}</div>
            <div className="text-[#fde047] font-mono text-xl font-bold drop-shadow-[0_0_5px_rgba(253,224,71,0.8)]">SCORE: {score}</div>
          </div>
          
          <div className="bg-[#1a203f]/80 backdrop-blur px-5 py-3 rounded-full border border-[#c4b5fd]/50 flex gap-3 shadow-[0_0_15px_rgba(196,181,253,0.3)]">
            {targetSequence.map((type, idx) => (
              <div key={idx} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${idx < progress ? 'bg-[#c4b5fd]/20 scale-110 border border-[#7de8c3] shadow-[0_0_10px_rgba(125,232,195,0.5)]' : 'opacity-40'}`}>
                <SymbolIcon type={type} className="w-5 h-5" />
              </div>
            ))}
          </div>
          
          {combo > 1 && (
            <div className="mt-3 text-[#f9a8d4] font-bold italic animate-pulse text-lg drop-shadow-[0_0_5px_rgba(249,168,212,0.8)]">
              {combo} COMBO!
            </div>
          )}
        </div>
      )}

      {/* Falling Symbols */}
      {gameState === 'PLAYING' && symbols.map(s => (
        <button
          key={s.id}
          onPointerDown={() => handleSymbolClick(s.id, s.type)}
          className="absolute w-14 h-14 flex items-center justify-center cursor-pointer active:scale-125 hover:scale-110 transition-transform animate-fall touch-none z-10"
          style={{
            left: `${s.x}%`,
            animationDuration: `${s.duration}s`,
          }}
        >
          <div className="bg-[#1a203f]/60 p-2 rounded-full border border-white/20 backdrop-blur-sm shadow-lg pointer-events-none">
            <SymbolIcon type={s.type} className="w-8 h-8" />
          </div>
        </button>
      ))}

      {/* Start Screen */}
      {gameState === 'START' && (
        <div className="absolute inset-0 bg-[#0b1026]/90 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
          <h1 className="text-3xl font-black text-[#c4b5fd] mb-4 drop-shadow-[0_0_10px_rgba(196,181,253,0.8)] tracking-tight">외계 DNA 해독</h1>
          <p className="text-[#7de8c3] mb-8 text-base leading-relaxed max-w-[280px]">
            상단에 제시된 목표 서열 순서대로<br/>
            떨어지는 유전자 기호를 탭하세요.<br/>
            <span className="text-[#f9a8d4]">틀리면 진행이 초기화됩니다!</span>
          </p>
          <div className="flex gap-4 mb-10 bg-[#1a203f]/50 p-4 rounded-2xl border border-[#c4b5fd]/30 shadow-inner">
            <SymbolIcon type="alpha" className="w-8 h-8" />
            <SymbolIcon type="theta" className="w-8 h-8" />
            <SymbolIcon type="chi" className="w-8 h-8" />
            <SymbolIcon type="gamma" className="w-8 h-8" />
          </div>
          <button
            onClick={startGame}
            className="bg-[#c4b5fd] text-[#0b1026] font-black text-xl px-10 py-4 rounded-full active:scale-95 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(196,181,253,0.6)]"
          >
            해독 시작
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-[#0b1026]/90 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
          <h2 className="text-4xl font-black text-[#f9a8d4] mb-4 drop-shadow-[0_0_15px_rgba(249,168,212,0.8)]">분석 완료</h2>
          <div className="text-sm text-[#7de8c3] mb-1 font-bold">최종 점수</div>
          <div className="text-6xl font-black text-[#fde047] mb-10 drop-shadow-[0_0_20px_rgba(253,224,71,0.8)]">
            {score}
          </div>
          <button
            onClick={startGame}
            className="bg-[#7de8c3] text-[#0b1026] font-black text-xl px-10 py-4 rounded-full active:scale-95 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(125,232,195,0.6)]"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
