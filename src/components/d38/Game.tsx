"use client";

import React, { useState, useEffect, useRef } from 'react';

type GameState = 'START' | 'PLAYING' | 'GAME_OVER';

interface Obstacle {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  type: 'cloud' | 'lightning';
}

interface Particle {
  id: number;
  x: number;
  y: number;
  length: number;
  speed: number;
}

const WIDTH = 430;
const HEIGHT = 500;
const PROBE_Y = 150;
const PROBE_RADIUS = 15;
const MAX_HULL = 100;
const ACCEL = 0.6;
const FRICTION = 0.85;
const WIND_FORCE_MULTIPLIER = 0.12;

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [hull, setHull] = useState(MAX_HULL);
  const [depth, setDepth] = useState(0);
  const [probeX, setProbeX] = useState(WIDTH / 2);
  const [probeVx, setProbeVx] = useState(0);
  const [wind, setWind] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [message, setMessage] = useState('');

  const reqRef = useRef<number | null>(null);

  const stateRef = useRef<{
    gameState: GameState;
    x: number;
    vx: number;
    hull: number;
    depth: number;
    wind: number;
    targetWind: number;
    windChangeTimer: number;
    obstacles: Obstacle[];
    particles: Particle[];
    keys: { left: boolean; right: boolean };
    obstacleTimer: number;
    messageTimer: number;
    message: string;
  } | null>(null);

  if (!stateRef.current) {
    stateRef.current = {
      gameState: 'START',
      x: WIDTH / 2,
      vx: 0,
      hull: MAX_HULL,
      depth: 0,
      wind: 0,
      targetWind: 0,
      windChangeTimer: 0,
      obstacles: [],
      particles: [],
      keys: { left: false, right: false },
      obstacleTimer: 0,
      messageTimer: 0,
      message: ''
    };
  }

  const startGame = () => {
    if (!stateRef.current) return;
    stateRef.current = {
      ...stateRef.current,
      gameState: 'PLAYING',
      x: WIDTH / 2,
      vx: 0,
      hull: MAX_HULL,
      depth: 0,
      wind: 0,
      targetWind: 0,
      obstacles: [],
      particles: [],
      message: '대기권 진입 중...',
      messageTimer: 60,
      obstacleTimer: 60,
    };
    setGameState('PLAYING');
    setHull(MAX_HULL);
    setDepth(0);
    setMessage('대기권 진입 중...');
  };

  const update = () => {
    if (!stateRef.current) return;
    if (stateRef.current.gameState !== 'PLAYING') {
      reqRef.current = requestAnimationFrame(update);
      return;
    }

    const state = stateRef.current;
    
    // Wind mechanics
    state.windChangeTimer -= 1;
    if (state.windChangeTimer <= 0) {
      state.windChangeTimer = Math.random() * 120 + 60; // 1 to 3 seconds
      state.targetWind = (Math.random() - 0.5) * 12; // -6 to 6
    }
    state.wind += (state.targetWind - state.wind) * 0.03;

    // Probe movement
    let ax = state.wind * WIND_FORCE_MULTIPLIER;
    if (state.keys.left) ax -= ACCEL;
    if (state.keys.right) ax += ACCEL;

    state.vx += ax;
    state.vx *= FRICTION;
    state.x += state.vx;

    // Boundary collision
    if (state.x < PROBE_RADIUS) {
      state.x = PROBE_RADIUS;
      state.vx = 0;
      state.hull -= 0.6;
      state.message = '경고: 선체 압력 한계!';
      state.messageTimer = 20;
    }
    if (state.x > WIDTH - PROBE_RADIUS) {
      state.x = WIDTH - PROBE_RADIUS;
      state.vx = 0;
      state.hull -= 0.6;
      state.message = '경고: 선체 압력 한계!';
      state.messageTimer = 20;
    }

    // Depth progression
    state.depth += 0.2 + (state.depth * 0.0001);

    // Obstacles
    state.obstacleTimer -= 1;
    if (state.obstacleTimer <= 0) {
      state.obstacleTimer = Math.random() * 40 + Math.max(10, 50 - state.depth * 0.02);
      state.obstacles.push({
        id: Math.random(),
        x: Math.random() * WIDTH,
        y: HEIGHT + 50,
        radius: Math.random() * 20 + 15,
        speed: Math.random() * 3 + 3 + state.depth * 0.002,
        type: Math.random() > 0.7 ? 'lightning' : 'cloud'
      });
    }

    // Move obstacles and check collision
    for (let i = state.obstacles.length - 1; i >= 0; i--) {
      const ob = state.obstacles[i];
      ob.y -= ob.speed;

      // Collision
      const dx = ob.x - state.x;
      const dy = ob.y - PROBE_Y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < ob.radius + PROBE_RADIUS - 8) {
        if (ob.type === 'lightning') {
          state.hull -= 20;
          state.message = '치명적: 번개 타격!';
          state.messageTimer = 40;
        } else {
          state.hull -= 5;
          state.vx += (Math.random() - 0.5) * 10;
        }
        state.obstacles.splice(i, 1);
        continue;
      }

      if (ob.y < -100) {
        state.obstacles.splice(i, 1);
      }
    }

    // Particles (Wind effect)
    if (Math.random() > 0.3) {
      state.particles.push({
        id: Math.random(),
        x: state.wind > 0 ? -20 : WIDTH + 20,
        y: Math.random() * HEIGHT,
        length: Math.random() * 30 + 10,
        speed: (state.wind * (Math.random() * 0.5 + 0.8)) + (state.wind > 0 ? 2 : -2)
      });
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.speed;
      if (p.x < -50 || p.x > WIDTH + 50) {
        state.particles.splice(i, 1);
      }
    }

    if (state.messageTimer > 0) {
      state.messageTimer -= 1;
    } else {
      state.message = '';
    }

    if (state.hull <= 0) {
      state.hull = 0;
      state.gameState = 'GAME_OVER';
      setGameState('GAME_OVER');
    }

    // Update React State
    setProbeX(state.x);
    setProbeVx(state.vx);
    setHull(state.hull);
    setDepth(state.depth);
    setWind(state.wind);
    
    setObstacles([...state.obstacles]);
    setParticles([...state.particles]);
    setMessage(state.message);

    reqRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    reqRef.current = requestAnimationFrame(update);
    return () => {
      if (reqRef.current !== null) {
        cancelAnimationFrame(reqRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!stateRef.current) return;
      if (e.key === 'ArrowLeft') stateRef.current.keys.left = true;
      if (e.key === 'ArrowRight') stateRef.current.keys.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!stateRef.current) return;
      if (e.key === 'ArrowLeft') stateRef.current.keys.left = false;
      if (e.key === 'ArrowRight') stateRef.current.keys.right = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans select-none rounded-xl shadow-[0_0_30px_rgba(196,181,253,0.15)] border border-[#c4b5fd]/20">
      
      {/* Background Gradient Effect */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% ${100 - (depth % 100)}%, #1a0b2e 0%, #0b1026 100%)`,
        }}
      />

      {/* Wind Particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.x,
            top: p.y,
            width: p.length,
            height: 2,
            backgroundColor: '#7de8c3',
            opacity: 0.3,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      {/* Obstacles */}
      {obstacles.map(ob => {
        if (ob.type === 'cloud') {
          return (
            <div 
              key={ob.id}
              className="absolute rounded-full bg-[#c4b5fd]/30 blur-md pointer-events-none"
              style={{
                left: ob.x,
                top: ob.y,
                width: ob.radius * 2,
                height: ob.radius * 2,
                transform: 'translate(-50%, -50%)'
              }}
            />
          );
        } else {
          // Lightning
          return (
            <svg 
              key={ob.id}
              width={ob.radius * 2} 
              height={ob.radius * 2} 
              viewBox="0 0 40 40"
              className="absolute pointer-events-none drop-shadow-[0_0_8px_#f9a8d4]"
              style={{ left: ob.x, top: ob.y, transform: 'translate(-50%, -50%)' }}
            >
              <path d="M 20 0 L 10 20 L 20 20 L 10 40 L 30 15 L 20 15 Z" fill="#f9a8d4" />
            </svg>
          );
        }
      })}

      {/* Probe */}
      {gameState !== 'START' && (
        <div 
          className="absolute z-10 drop-shadow-[0_0_10px_rgba(125,232,195,0.5)] pointer-events-none transition-transform duration-75"
          style={{
            left: probeX,
            top: PROBE_Y,
            transform: `translate(-50%, -50%) rotate(${probeVx * 4}deg)`
          }}
        >
          <svg viewBox="0 0 30 50" width="30" height="50">
            {(stateRef.current?.keys.left || stateRef.current?.keys.right || gameState === 'PLAYING') ? (
               <path d="M 10 38 L 15 48 L 20 38 Z" fill="#f9a8d4" opacity="0.8" className="animate-pulse" />
            ) : null}
            <ellipse cx="15" cy="20" rx="14" ry="18" fill="#7de8c3" stroke="#fff" strokeWidth="2" />
            <circle cx="15" cy="15" r="6" fill="#0b1026" />
            <path d="M 9 35 L 21 35 L 18 39 L 12 39 Z" fill="#c4b5fd" />
          </svg>
        </div>
      )}

      {/* Touch Hitboxes */}
      {gameState === 'PLAYING' && (
        <>
          <div
            className="absolute top-0 left-0 w-1/2 h-full z-30"
            onPointerDown={() => { if (stateRef.current) stateRef.current.keys.left = true; }}
            onPointerUp={() => { if (stateRef.current) stateRef.current.keys.left = false; }}
            onPointerLeave={() => { if (stateRef.current) stateRef.current.keys.left = false; }}
            onPointerCancel={() => { if (stateRef.current) stateRef.current.keys.left = false; }}
          />
          <div
            className="absolute top-0 right-0 w-1/2 h-full z-30"
            onPointerDown={() => { if (stateRef.current) stateRef.current.keys.right = true; }}
            onPointerUp={() => { if (stateRef.current) stateRef.current.keys.right = false; }}
            onPointerLeave={() => { if (stateRef.current) stateRef.current.keys.right = false; }}
            onPointerCancel={() => { if (stateRef.current) stateRef.current.keys.right = false; }}
          />
        </>
      )}

      {/* UI Overlay */}
      {gameState !== 'START' && (
        <>
          <div className="absolute top-4 left-4 right-4 flex justify-between z-20 pointer-events-none">
            <div className="flex flex-col">
              <span className="text-[#7de8c3] text-[10px] tracking-widest font-bold mb-1">HULL INTEGRITY</span>
              <div className="w-32 h-3 bg-gray-800 rounded-full overflow-hidden border border-[#7de8c3]/30 relative">
                <div 
                  className="absolute left-0 top-0 h-full transition-all duration-200"
                  style={{ 
                    width: `${Math.max(0, hull)}%`, 
                    backgroundColor: hull > 30 ? '#7de8c3' : '#f9a8d4',
                    boxShadow: hull > 30 ? '0 0 10px #7de8c3' : '0 0 10px #f9a8d4'
                  }} 
                />
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#c4b5fd] text-[10px] tracking-widest font-bold mb-1">DEPTH</span>
              <span className="text-white font-mono text-lg leading-none drop-shadow-md">
                {Math.floor(depth).toLocaleString()}m
              </span>
            </div>
          </div>

          <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none opacity-80">
            <span className="text-[#c4b5fd] text-[10px] tracking-widest font-bold mb-1">WIND</span>
            <div className="flex items-center gap-2">
              <div className={`text-[10px] transition-colors duration-300 ${wind < -2 ? 'text-[#f9a8d4] animate-pulse' : 'text-gray-600'}`}>
                ◀◀
              </div>
              <div className="w-24 h-1.5 bg-gray-800 rounded-full relative overflow-hidden">
                <div 
                  className="absolute h-full bg-[#f9a8d4] transition-all duration-100"
                  style={{
                    left: '50%',
                    width: `${Math.min(50, Math.abs(wind) * (50 / 6))}%`,
                    transform: wind < 0 ? 'translateX(-100%)' : 'none'
                  }}
                />
              </div>
              <div className={`text-[10px] transition-colors duration-300 ${wind > 2 ? 'text-[#f9a8d4] animate-pulse' : 'text-gray-600'}`}>
                ▶▶
              </div>
            </div>
          </div>

          {message && (
            <div className="absolute top-32 left-1/2 -translate-x-1/2 text-[#f9a8d4] text-sm tracking-wider font-bold animate-pulse text-center z-20 pointer-events-none drop-shadow-[0_0_5px_#f9a8d4]">
              {message}
            </div>
          )}
        </>
      )}

      {/* Start Screen */}
      {gameState === 'START' && (
        <div className="absolute inset-0 bg-[#0b1026]/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
          <h1 className="text-4xl font-black text-[#7de8c3] mb-2 text-center drop-shadow-[0_0_15px_rgba(125,232,195,0.6)] tracking-tight">
            가스 행성 탐사
          </h1>
          <p className="text-[#c4b5fd] text-xs mb-10 text-center max-w-[280px] leading-relaxed">
            폭풍을 피해 탐사선을 심층부로 하강시키세요. 화면의 좌/우를 터치하여 이동합니다.
          </p>
          <button 
            onClick={startGame}
            className="relative z-40 px-10 py-3 bg-[#7de8c3] text-[#0b1026] font-bold rounded-full text-lg shadow-[0_0_20px_rgba(125,232,195,0.6)] hover:scale-105 active:scale-95 transition-all"
          >
            탐사 시작
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-[#0b1026]/90 flex flex-col items-center justify-center z-50 backdrop-blur-md">
          <h1 className="text-4xl font-black text-[#f9a8d4] mb-2 text-center drop-shadow-[0_0_15px_rgba(249,168,212,0.6)]">
            통신 두절
          </h1>
          <p className="text-[#c4b5fd] text-sm mb-10 text-center flex flex-col gap-1">
            <span>최종 도달 깊이</span>
            <span className="text-white font-mono text-3xl font-bold">{Math.floor(depth).toLocaleString()}m</span>
          </p>
          <button 
            onClick={startGame}
            className="relative z-40 px-10 py-3 border-2 border-[#7de8c3] text-[#7de8c3] font-bold rounded-full text-lg shadow-[0_0_15px_rgba(125,232,195,0.2)] hover:bg-[#7de8c3] hover:text-[#0b1026] active:scale-95 transition-all"
          >
            재도전
          </button>
        </div>
      )}
    </div>
  );
}
