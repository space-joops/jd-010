"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

interface Projectile {
  id: number;
  angle: number; // degrees
  distance: number; // radius from center
  speed: number;
}

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [shieldAngle, setShieldAngle] = useState(0);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  
  const stateRef = useRef({
    shieldAngle: 0,
    projectiles: [] as Projectile[],
    score: 0,
    lastSpawn: 0,
    difficulty: 1
  });

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setShieldAngle(0);
    setProjectiles([]);
    stateRef.current = {
      shieldAngle: 0,
      projectiles: [],
      score: 0,
      lastSpawn: performance.now(),
      difficulty: 1
    };
  };

  const gameLoop = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    const s = stateRef.current;
    
    // Spawn
    s.difficulty += dt * 0.05;
    if (time - s.lastSpawn > 2000 / s.difficulty) {
      s.lastSpawn = time;
      s.projectiles.push({
        id: time,
        angle: Math.random() * 360,
        distance: 200,
        speed: 40 + Math.random() * 20 * s.difficulty
      });
    }

    let hit = false;
    s.projectiles = s.projectiles.filter(p => {
      p.distance -= p.speed * dt;
      if (p.distance <= 45) { // Shield radius is approx 45-50
        // Check if shield blocks it. Shield covers a 60 degree arc
        let diff = Math.abs((p.angle - s.shieldAngle) % 360);
        if (diff > 180) diff = 360 - diff;
        
        if (diff < 35) {
          // Blocked
          s.score += 10;
          return false; 
        } else if (p.distance <= 20) {
          // Earth hit
          hit = true;
          return false;
        }
      }
      return true;
    });

    if (hit) {
      setGameState('GAMEOVER');
      return;
    }

    setShieldAngle(s.shieldAngle);
    setProjectiles([...s.projectiles]);
    setScore(s.score);

    requestRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, gameLoop]);

  const rotateShield = (dir: number) => {
    stateRef.current.shieldAngle = (stateRef.current.shieldAngle + dir * 25) % 360;
    if (stateRef.current.shieldAngle < 0) stateRef.current.shieldAngle += 360;
  };

  return (
    <div className="max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white select-none shadow-2xl rounded-xl ring-1 ring-white/10 flex flex-col">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwYjEwMjYiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-50" />
      
      {gameState === 'START' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center">
          <svg className="w-20 h-20 text-[#7de8c3] mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <h1 className="text-3xl font-bold mb-2">궤도 방어</h1>
          <p className="text-[#f9a8d4] text-sm mb-6">위성을 노리는 우주 쓰레기를<br/>전자기 쉴드를 회전시켜 막아내세요.</p>
          <button onClick={startGame} className="px-8 py-3 bg-[#7de8c3] text-[#0b1026] font-bold rounded-full hover:bg-white transition-colors">
            방어 시작
          </button>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-md">
          <div className="text-5xl mb-4">💥</div>
          <h2 className="text-3xl font-bold text-[#f87171] mb-2">위성 파괴됨</h2>
          <p className="text-2xl text-[#7de8c3] font-mono mb-8">SCORE: {score}</p>
          <button onClick={startGame} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-[#c4b5fd] transition-colors">
            재시도
          </button>
        </div>
      )}

      {/* Score */}
      <div className="absolute top-6 inset-x-0 text-center z-10 font-mono">
        <div className="text-white/50 text-xs tracking-widest">DEFENSE SCORE</div>
        <div className="text-3xl font-bold text-[#7de8c3] drop-shadow-[0_0_10px_rgba(125,232,195,0.8)]">{score}</div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative w-full overflow-hidden flex items-center justify-center">
        {/* Center Planet/Satellite */}
        <div className="absolute w-12 h-12 bg-white rounded-full z-10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.5)]">
          <svg className="w-8 h-8 text-[#0b1026]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Shield */}
        <div 
          className="absolute z-10"
          style={{
            transform: `rotate(${shieldAngle}deg)`,
            transition: 'transform 0.1s linear',
            width: '100px',
            height: '100px',
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <path 
              d="M 15 50 A 35 35 0 0 1 85 50" 
              fill="none" 
              stroke="#c4b5fd" 
              strokeWidth="6" 
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(196,181,253,0.8)]"
            />
          </svg>
        </div>

        {/* Projectiles */}
        {projectiles.map(p => {
          const rad = p.angle * Math.PI / 180;
          const px = Math.cos(rad) * p.distance;
          const py = Math.sin(rad) * p.distance;
          
          return (
            <div 
              key={p.id}
              className="absolute w-3 h-3 bg-[#f9a8d4] rounded-full shadow-[0_0_10px_rgba(249,168,212,0.8)]"
              style={{
                transform: `translate(${px}px, ${py}px)`,
              }}
            />
          );
        })}
      </div>

      {/* Controls */}
      <div className="h-24 bg-white/5 border-t border-white/10 flex z-10">
        <button 
          className="flex-1 flex items-center justify-center active:bg-white/10 transition-colors group"
          onClick={() => rotateShield(-1)}
        >
          <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center group-active:border-[#7de8c3]">
            <svg className="w-8 h-8 text-white/50 group-active:text-[#7de8c3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </div>
        </button>
        <button 
          className="flex-1 flex items-center justify-center active:bg-white/10 transition-colors group"
          onClick={() => rotateShield(1)}
        >
          <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center group-active:border-[#7de8c3]">
            <svg className="w-8 h-8 text-white/50 group-active:text-[#7de8c3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}
