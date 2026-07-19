"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

type GameState = 'START' | 'PLAYING' | 'GAME_OVER';
type SunState = 'IDLE' | 'WARNING' | 'FLARE';

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [sunState, setSunState] = useState<SunState>('IDLE');
  const [panelsOpen, setPanelsOpen] = useState(true);
  const [highScore, setHighScore] = useState(0);

  const stateRef = useRef({
    hp: 100,
    score: 0,
    sunState: 'IDLE' as SunState,
    panelsOpen: true,
    gameState: 'START' as GameState,
  });

  useEffect(() => { stateRef.current.sunState = sunState; }, [sunState]);
  useEffect(() => { stateRef.current.panelsOpen = panelsOpen; }, [panelsOpen]);
  useEffect(() => { stateRef.current.gameState = gameState; }, [gameState]);

  const sunTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const scheduleNextSunEvent = useCallback((currentState: SunState, currentScore: number) => {
    if (sunTimerRef.current) clearTimeout(sunTimerRef.current);

    let nextState: SunState = 'IDLE';
    let delay = 1000;

    const difficultyFactor = Math.min(0.7, currentScore / 5000); 
    const multiplier = 1 - difficultyFactor;

    if (currentState === 'IDLE') {
      nextState = 'WARNING';
      delay = Math.max(500, (Math.random() * 2000 + 1500) * multiplier);
    } else if (currentState === 'WARNING') {
      nextState = 'FLARE';
      delay = Math.max(300, 800 * multiplier);
    } else if (currentState === 'FLARE') {
      nextState = 'IDLE';
      delay = Math.max(600, (Math.random() * 1500 + 1000) * multiplier);
    }

    sunTimerRef.current = setTimeout(() => {
      setSunState(nextState);
      scheduleNextSunEvent(nextState, stateRef.current.score);
    }, delay);
  }, []);

  const startGame = () => {
    setGameState('PLAYING');
    setHp(100);
    setScore(0);
    setSunState('IDLE');
    setPanelsOpen(true);
    
    stateRef.current = {
      hp: 100,
      score: 0,
      sunState: 'IDLE',
      panelsOpen: true,
      gameState: 'PLAYING',
    };

    scheduleNextSunEvent('IDLE', 0);
    lastTimeRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const gameOver = useCallback(() => {
    setGameState('GAME_OVER');
    setHighScore((prev) => Math.max(prev, Math.floor(stateRef.current.score)));
    if (sunTimerRef.current) clearTimeout(sunTimerRef.current);
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  }, []);

  const gameLoop = useCallback((time: number) => {
    if (stateRef.current.gameState !== 'PLAYING') return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    const { sunState, panelsOpen, hp, score } = stateRef.current;

    let newHp = hp;
    let newScore = score;

    if (sunState === 'FLARE') {
      if (panelsOpen) {
        newHp -= (60 * deltaTime) / 1000;
      }
    } else {
      if (panelsOpen) {
        newScore += (100 * deltaTime) / 1000;
      }
    }

    if (newHp <= 0) {
      newHp = 0;
      stateRef.current.hp = newHp;
      setHp(newHp);
      gameOver();
      return;
    }

    stateRef.current.hp = newHp;
    stateRef.current.score = newScore;

    setHp(newHp);
    setScore(newScore);

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameOver]);

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (sunTimerRef.current) clearTimeout(sunTimerRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (stateRef.current.gameState !== 'PLAYING') return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setPanelsOpen(false);
  };

  const handlePointerUp = () => {
    if (stateRef.current.gameState !== 'PLAYING') return;
    setPanelsOpen(true);
  };

  const stars = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      animationDelay: `${Math.random() * 3}s`,
    }));
  }, []);

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(3px, -3px); }
          50% { transform: translate(-3px, 3px); }
          75% { transform: translate(3px, 3px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out infinite;
        }
      `}</style>
      <div 
        className={`w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] select-none touch-none rounded-xl shadow-2xl ring-1 ring-white/10 ${sunState === 'FLARE' && panelsOpen ? 'animate-shake' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute inset-0 bg-[#0b1026] pointer-events-none -z-10">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animationDelay: star.animationDelay,
              }}
            />
          ))}
        </div>

        <div className={`absolute inset-0 transition-colors duration-300 pointer-events-none z-0 ${sunState === 'WARNING' ? 'bg-[#f9a8d4]/15' : 'bg-transparent'}`} />
        <div className={`absolute inset-0 pointer-events-none z-40 transition-opacity duration-75 ${sunState === 'FLARE' && panelsOpen ? 'bg-red-500/20' : 'opacity-0'}`} />

        <div className="absolute top-0 w-full p-4 flex justify-between items-start z-30 pointer-events-none">
          <div className="flex flex-col gap-1 w-2/5">
            <span className="text-[#7de8c3] font-bold text-xs tracking-wider">HULL INTEGRITY</span>
            <div className="w-full h-3 bg-[#0b1026] border border-[#7de8c3] rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-75"
                style={{ width: `${Math.max(0, hp)}%`, backgroundColor: hp < 30 ? '#f9a8d4' : '#7de8c3' }}
              />
            </div>
          </div>
          <div className="flex flex-col items-end w-2/5 text-right">
            <span className="text-[#c4b5fd] font-bold text-xs tracking-wider">ENERGY</span>
            <span className="text-2xl font-black text-white leading-none">{Math.floor(score)}</span>
          </div>
        </div>

        {sunState === 'WARNING' && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#f9a8d4] text-xl font-black animate-ping whitespace-nowrap z-30 pointer-events-none drop-shadow-[0_0_10px_#f9a8d4]">
            SOLAR FLARE IMMINENT
          </div>
        )}

        <div className="absolute top-0 left-0 w-full flex justify-center items-start pt-16 pointer-events-none">
          <div className="relative flex justify-center items-center">
            <svg width="120" height="120" viewBox="0 0 120 120" className="z-10">
              <defs>
                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                   <stop offset="0%" stopColor={sunState === 'FLARE' ? '#f9a8d4' : (sunState === 'WARNING' ? '#ff6b6b' : '#c4b5fd')} />
                   <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <circle cx="60" cy="60" r="50" fill="url(#sunGlow)" className={`transition-all duration-300 ${sunState === 'WARNING' ? 'animate-pulse' : ''}`} />
              <circle cx="60" cy="60" r="30" fill={sunState === 'FLARE' ? '#fff' : '#f9a8d4'} className="transition-colors duration-300 shadow-[0_0_20px_#f9a8d4]" />
            </svg>
            {sunState === 'FLARE' && (
              <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[120px] h-[500px] bg-gradient-to-b from-[#f9a8d4] via-[#f9a8d4]/80 to-transparent blur-lg origin-top animate-pulse z-0 mix-blend-screen" />
            )}
          </div>
        </div>

        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 pointer-events-none">
          {!panelsOpen && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#7de8c3]/10 border-[3px] border-[#7de8c3] rounded-full shadow-[0_0_25px_#7de8c3] animate-pulse z-20" />
          )}
          
          <div className="relative flex items-center justify-center">
            <div className={`absolute right-[16px] top-1/2 -translate-y-1/2 w-[70px] h-[36px] bg-[#c4b5fd] border-2 border-[#0b1026] origin-right transition-transform duration-200 ease-out ${panelsOpen ? 'scale-x-100' : 'scale-x-0'}`}>
              <div className="w-full h-full flex flex-col justify-evenly p-1">
                <div className="w-full h-[2px] bg-[#0b1026] opacity-40" />
                <div className="w-full h-[2px] bg-[#0b1026] opacity-40" />
                <div className="w-full h-[2px] bg-[#0b1026] opacity-40" />
              </div>
            </div>
            
            <div className="w-[36px] h-[70px] bg-[#f9a8d4] border-2 border-[#7de8c3] rounded-md z-10 flex flex-col items-center justify-between p-1 shadow-[0_0_15px_rgba(125,232,195,0.3)]">
              <div className="w-3 h-3 bg-[#0b1026] rounded-full mt-1" />
              <div className="w-5 h-1.5 bg-[#0b1026] rounded-sm mb-1" />
            </div>

            <div className={`absolute left-[16px] top-1/2 -translate-y-1/2 w-[70px] h-[36px] bg-[#c4b5fd] border-2 border-[#0b1026] origin-left transition-transform duration-200 ease-out ${panelsOpen ? 'scale-x-100' : 'scale-x-0'}`}>
               <div className="w-full h-full flex flex-col justify-evenly p-1">
                <div className="w-full h-[2px] bg-[#0b1026] opacity-40" />
                <div className="w-full h-[2px] bg-[#0b1026] opacity-40" />
                <div className="w-full h-[2px] bg-[#0b1026] opacity-40" />
              </div>
            </div>
          </div>
        </div>

        {gameState === 'PLAYING' && (
          <div className="absolute bottom-8 w-full text-center z-30 pointer-events-none">
            <p className={`text-base font-black tracking-widest transition-all ${
              !panelsOpen 
                ? 'text-[#7de8c3] drop-shadow-[0_0_10px_#7de8c3]' 
                : 'text-[#7de8c3]/40'
            }`}>
              {panelsOpen ? 'HOLD SCREEN TO SHIELD' : 'SHIELD ACTIVE'}
            </p>
          </div>
        )}

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-[#0b1026]/90 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
            <h1 className="text-4xl font-black text-[#f9a8d4] mb-2 tracking-tighter drop-shadow-[0_0_15px_#f9a8d4]">SOLAR FLARE</h1>
            <p className="text-[#c4b5fd] text-sm mb-10 leading-relaxed font-medium">
              태양풍이 위성을 향해 불어옵니다.<br/>
              에너지를 모으다가, 경고가 뜨면<br/>
              <strong className="text-[#7de8c3]">화면을 길게 눌러</strong> 패널을 보호하세요!
            </p>
            <button onClick={startGame} className="px-8 py-3 bg-[#7de8c3] text-[#0b1026] font-black rounded-full text-lg shadow-[0_0_20px_#7de8c3] hover:scale-105 transition-transform pointer-events-auto">
              SYSTEM START
            </button>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-[#0b1026]/90 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm pointer-events-auto">
            <h1 className="text-3xl font-black text-[#f9a8d4] mb-2 drop-shadow-[0_0_10px_#f9a8d4]">SYSTEM FAILURE</h1>
            <p className="text-[#c4b5fd] text-sm mb-6">위성의 패널이 모두 타버렸습니다.</p>
            
            <div className="bg-[#151b3b]/80 p-6 rounded-2xl w-full max-w-[260px] mb-8 border border-[#c4b5fd]/20 shadow-xl">
              <p className="text-[#7de8c3] text-xs font-bold mb-1 tracking-widest">COLLECTED ENERGY</p>
              <p className="text-5xl font-black text-white mb-6 drop-shadow-md">{Math.floor(score)}</p>
              
              <div className="w-full h-px bg-[#c4b5fd]/20 mb-4" />
              
              <p className="text-[#c4b5fd] text-xs font-bold mb-1 tracking-widest">HIGH SCORE</p>
              <p className="text-2xl font-bold text-white/90">{highScore}</p>
            </div>

            <button onClick={startGame} className="px-8 py-3 bg-transparent border-2 border-[#7de8c3] text-[#7de8c3] font-black rounded-full text-lg hover:bg-[#7de8c3] hover:text-[#0b1026] transition-all shadow-[0_0_15px_rgba(125,232,195,0.2)]">
              REBOOT SYSTEM
            </button>
          </div>
        )}
      </div>
    </>
  );
}
