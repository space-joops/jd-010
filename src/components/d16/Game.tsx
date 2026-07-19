'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

type Lane = -1 | 0 | 1;

interface Obstacle {
  id: number;
  lane: Lane;
  z: number;
}

interface Ring {
  id: number;
  z: number;
}

const getScale = (z: number) => 10 / (Math.max(z, -9) + 10);

export default function Game() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [playerLane, setPlayerLane] = useState<Lane>(0);
  const [, setTick] = useState(0);

  const stateRef = useRef({
    obstacles: [] as Obstacle[],
    rings: [] as Ring[],
    zSpeed: 60,
    score: 0,
    spawnTimer: 0,
    ringTimer: 0,
    lane: 0 as Lane,
    isGameOver: false,
  });

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const startGame = () => {
    const initialRings = [];
    for (let i = 0; i < 6; i++) {
      initialRings.push({ id: Math.random(), z: i * 20 });
    }

    stateRef.current = {
      obstacles: [],
      rings: initialRings,
      zSpeed: 60,
      score: 0,
      spawnTimer: 2, // 2 seconds before first obstacle
      ringTimer: 0,
      lane: 0,
      isGameOver: false,
    };
    setScore(0);
    setPlayerLane(0);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const update = (time: number) => {
      if (stateRef.current.isGameOver) return;

      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      const state = stateRef.current;

      // Increase speed gradually up to a maximum
      state.zSpeed = Math.min(200, state.zSpeed + dt * 2);

      // Move obstacles
      state.obstacles.forEach(o => { o.z -= state.zSpeed * dt; });

      // Check collision
      const hit = state.obstacles.some(o => o.z < 5 && o.z > -5 && o.lane === state.lane);
      if (hit) {
        state.isGameOver = true;
        setGameState('gameover');
        return;
      }

      // Remove passed obstacles & add score
      state.obstacles = state.obstacles.filter(o => {
        if (o.z < -5) {
          state.score += 10;
          setScore(state.score);
          return false;
        }
        return true;
      });

      // Move rings
      state.rings.forEach(r => { r.z -= state.zSpeed * dt; });
      state.rings = state.rings.filter(r => r.z > -8);

      // Spawn obstacles
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        const numObstacles = Math.random() > 0.8 ? 2 : 1;
        const lanes = [-1, 0, 1].sort(() => Math.random() - 0.5);
        for (let i = 0; i < numObstacles; i++) {
          state.obstacles.push({ id: Math.random(), lane: lanes[i] as Lane, z: 100 });
        }
        state.spawnTimer = 60 / state.zSpeed;
      }

      // Spawn rings
      state.ringTimer -= dt;
      if (state.ringTimer <= 0) {
        state.rings.push({ id: Math.random(), z: 100 });
        state.ringTimer = 15 / state.zSpeed;
      }

      setTick(t => t + 1);
      requestRef.current = requestAnimationFrame(update);
    };

    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(update);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  const moveLeft = useCallback(() => {
    const newLane = Math.max(-1, stateRef.current.lane - 1) as Lane;
    stateRef.current.lane = newLane;
    setPlayerLane(newLane);
  }, []);

  const moveRight = useCallback(() => {
    const newLane = Math.min(1, stateRef.current.lane + 1) as Lane;
    stateRef.current.lane = newLane;
    setPlayerLane(newLane);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.isGameOver || gameState !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        moveLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        moveRight();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, moveLeft, moveRight]);

  const stars = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.5 + 0.1
  })), []);

  return (
    <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] select-none rounded-xl shadow-2xl font-sans">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1a2040_0%,#0b1026_70%)]" />

      {/* Stars */}
      <div className="absolute inset-0 z-0">
        {stars.map(s => (
          <div
            key={s.id}
            className="absolute bg-white rounded-full"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.size}px`, height: `${s.size}px`, opacity: s.opacity }}
          />
        ))}
      </div>

      {/* Perspective Lane Lines */}
      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
        <line x1="50%" y1="200" x2="calc(50% - 245px)" y2="500" stroke="#c4b5fd" strokeWidth="2" opacity="0.15" />
        <line x1="50%" y1="200" x2="calc(50% - 82px)" y2="500" stroke="#c4b5fd" strokeWidth="2" opacity="0.15" />
        <line x1="50%" y1="200" x2="calc(50% + 82px)" y2="500" stroke="#c4b5fd" strokeWidth="2" opacity="0.15" />
        <line x1="50%" y1="200" x2="calc(50% + 245px)" y2="500" stroke="#c4b5fd" strokeWidth="2" opacity="0.15" />
      </svg>

      {/* Rings */}
      {stateRef.current.rings.map(r => {
        const scale = getScale(r.z);
        const size = 440 * scale;
        return (
          <div
            key={r.id}
            className="absolute rounded-full"
            style={{
              left: '50%',
              top: '200px',
              width: `${size}px`,
              height: `${size}px`,
              transform: 'translate(-50%, -50%)',
              opacity: Math.max(0, 1 - r.z / 100),
              border: `${Math.max(1, 2 * scale)}px solid #c4b5fd`,
              boxShadow: `0 0 ${10 * scale}px #c4b5fd`,
              zIndex: Math.floor(100 - r.z)
            }}
          />
        );
      })}

      {/* Obstacles */}
      {stateRef.current.obstacles.map(o => {
        const scale = getScale(o.z);
        const x = `calc(50% + ${o.lane * 120 * scale}px)`;
        const y = 200 + 220 * scale;
        const size = 60 * scale;
        return (
          <div
            key={o.id}
            className="absolute bg-[#0b1026] rounded-full flex items-center justify-center"
            style={{
              left: x,
              top: `${y}px`,
              width: `${size}px`,
              height: `${size}px`,
              transform: 'translate(-50%, -100%)',
              boxShadow: `0 0 ${20 * scale}px #f9a8d4, inset 0 0 ${10 * scale}px #f9a8d4`,
              border: `${Math.max(1, 2 * scale)}px solid #f9a8d4`,
              zIndex: Math.floor(100 - o.z) + 100
            }}
          >
            <div className="w-1/2 h-1/2 bg-[#f9a8d4] rounded-full animate-pulse blur-[2px]" />
          </div>
        );
      })}

      {/* Player Ship */}
      <div
        className="absolute transition-all duration-150 ease-out"
        style={{
          left: `calc(50% + ${playerLane * 120}px)`,
          top: `420px`,
          width: `60px`,
          height: `60px`,
          transform: 'translate(-50%, -100%)',
          zIndex: 1000
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full text-[#7de8c3]" style={{ filter: 'drop-shadow(0 0 10px #7de8c3)' }}>
          <path d="M50 15 L85 85 L50 70 L15 85 Z" fill="currentColor" />
          <circle cx="35" cy="80" r="4" fill="#f9a8d4" className="animate-pulse" />
          <circle cx="65" cy="80" r="4" fill="#f9a8d4" className="animate-pulse" />
          <polygon points="50,45 58,65 50,60 42,65" fill="#0b1026" />
        </svg>
      </div>

      {/* UI Overlays */}
      {gameState === 'playing' && (
        <>
          <div className="absolute top-4 left-4 text-[#7de8c3] font-mono text-xl z-[2000] drop-shadow-[0_0_5px_#7de8c3]">
            SCORE: {score}
          </div>
          <div className="absolute inset-0 flex z-[1500] touch-none">
            <div className="flex-1 cursor-pointer" onTouchStart={(e) => { e.preventDefault(); moveLeft(); }} onMouseDown={() => moveLeft()} />
            <div className="flex-1 cursor-pointer" onTouchStart={(e) => { e.preventDefault(); moveRight(); }} onMouseDown={() => moveRight()} />
          </div>
        </>
      )}

      {gameState === 'start' && (
        <div className="absolute inset-0 bg-[#0b1026]/80 flex flex-col items-center justify-center z-[2000] backdrop-blur-sm">
          <h1 className="text-4xl font-bold text-[#f9a8d4] mb-2 tracking-widest text-center drop-shadow-[0_0_10px_#f9a8d4]">WORMHOLE</h1>
          <h2 className="text-xl text-[#c4b5fd] mb-10 tracking-widest">NAVIGATION</h2>
          <p className="text-[#7de8c3] mb-8 text-sm max-w-[80%] text-center opacity-90 leading-relaxed">
            Navigate spacetime distortions.<br/>
            Tap left/right or use arrow keys.
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3 bg-[#0b1026] border-2 border-[#7de8c3] text-[#7de8c3] font-bold rounded-full hover:bg-[#7de8c3] hover:text-[#0b1026] transition-all drop-shadow-[0_0_10px_#7de8c3]"
          >
            INITIATE JUMP
          </button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-[#0b1026]/90 flex flex-col items-center justify-center z-[2000] backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-[#f9a8d4] mb-4 tracking-widest text-center drop-shadow-[0_0_10px_#f9a8d4]">ANOMALY COLLISION</h1>
          <p className="text-[#c4b5fd] text-2xl mb-10 font-mono drop-shadow-[0_0_5px_#c4b5fd]">SCORE: {score}</p>
          <button
            onClick={startGame}
            className="px-8 py-3 bg-[#0b1026] border-2 border-[#f9a8d4] text-[#f9a8d4] font-bold rounded-full hover:bg-[#f9a8d4] hover:text-[#0b1026] transition-all drop-shadow-[0_0_10px_#f9a8d4]"
          >
            REBOOT SYSTEM
          </button>
        </div>
      )}
    </div>
  );
}
