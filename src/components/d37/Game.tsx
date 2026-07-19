'use client';

import React, { useState, useEffect, useRef } from 'react';

type GameState = 'start' | 'playing' | 'gameover';

interface Ship {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Asteroid {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  color: string;
  rotation: number;
  rotSpeed: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

const GAME_WIDTH = 430;
const GAME_HEIGHT = 500;
const SHIP_SIZE = 40;
const COLORS = ['#f9a8d4', '#c4b5fd', '#7de8c3'];

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const shipRef = useRef<Ship | null>(null);
  const asteroidsRef = useRef<Asteroid[] | null>(null);
  const starsRef = useRef<Star[] | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const scoreRef = useRef<number | null>(null);
  const gameAreaRef = useRef<HTMLDivElement | null>(null);
  const asteroidSpawnTimerRef = useRef<number | null>(null);
  const asteroidIdCounterRef = useRef<number | null>(null);
  const difficultyMultiplierRef = useRef<number | null>(null);
  const isPointerDownRef = useRef<boolean | null>(null);

  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 50; i++) {
      stars.push({
        id: i,
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 2 + 0.5,
        opacity: Math.random()
      });
    }
    starsRef.current = stars;
    if (!shipRef.current) {
      shipRef.current = { x: GAME_WIDTH / 2 - SHIP_SIZE / 2, y: GAME_HEIGHT - 80, w: SHIP_SIZE, h: SHIP_SIZE };
    }
    if (!asteroidsRef.current) asteroidsRef.current = [];
    if (scoreRef.current === null) scoreRef.current = 0;
    if (asteroidSpawnTimerRef.current === null) asteroidSpawnTimerRef.current = 0;
    if (asteroidIdCounterRef.current === null) asteroidIdCounterRef.current = 0;
    if (difficultyMultiplierRef.current === null) difficultyMultiplierRef.current = 1;
    if (isPointerDownRef.current === null) isPointerDownRef.current = false;

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    scoreRef.current = 0;
    shipRef.current = { x: GAME_WIDTH / 2 - SHIP_SIZE / 2, y: GAME_HEIGHT - 80, w: SHIP_SIZE, h: SHIP_SIZE };
    asteroidsRef.current = [];
    asteroidSpawnTimerRef.current = 0;
    difficultyMultiplierRef.current = 1;
    lastTimeRef.current = performance.now();
    isPointerDownRef.current = false;
    
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const spawnAsteroid = () => {
    if (!asteroidsRef.current || difficultyMultiplierRef.current === null || asteroidIdCounterRef.current === null) return;
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (GAME_WIDTH - size);
    const speed = (Math.random() * 3 + 2) * difficultyMultiplierRef.current;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    asteroidsRef.current.push({
      id: asteroidIdCounterRef.current++,
      x,
      y: -size,
      w: size,
      h: size,
      speed,
      color,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 5
    });
  };

  const gameOver = () => {
    setGameState('gameover');
    if (scoreRef.current !== null && scoreRef.current > highScore) {
      setHighScore(Math.floor(scoreRef.current));
    }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const checkCollision = (rect1: Ship, rect2: Asteroid) => {
    const paddingX = rect1.w * 0.2;
    const paddingY = rect1.h * 0.2;
    const astPadding = rect2.w * 0.15;
    
    return (
      rect1.x + paddingX < rect2.x + rect2.w - astPadding &&
      rect1.x + rect1.w - paddingX > rect2.x + astPadding &&
      rect1.y + paddingY < rect2.y + rect2.h - astPadding &&
      rect1.y + rect1.h - paddingY > rect2.y + astPadding
    );
  };

  const gameLoop = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    if (scoreRef.current !== null && difficultyMultiplierRef.current !== null) {
      scoreRef.current += deltaTime * 0.01;
      difficultyMultiplierRef.current = 1 + scoreRef.current * 0.01;
    }

    if (starsRef.current) {
      starsRef.current.forEach(star => {
        star.y += star.speed * (deltaTime / 16);
        if (star.y > GAME_HEIGHT) {
          star.y = 0;
          star.x = Math.random() * GAME_WIDTH;
        }
      });
    }

    if (asteroidSpawnTimerRef.current !== null && scoreRef.current !== null) {
      asteroidSpawnTimerRef.current += deltaTime;
      const spawnRate = Math.max(200, 1000 - scoreRef.current * 10);
      if (asteroidSpawnTimerRef.current > spawnRate) {
        spawnAsteroid();
        asteroidSpawnTimerRef.current = 0;
      }
    }

    const ship = shipRef.current;
    if (ship && asteroidsRef.current) {
      for (let i = asteroidsRef.current.length - 1; i >= 0; i--) {
        const ast = asteroidsRef.current[i];
        ast.y += ast.speed * (deltaTime / 16);
        ast.rotation += ast.rotSpeed * (deltaTime / 16);

        if (checkCollision(ship, ast)) {
          gameOver();
          return;
        }

        if (ast.y > GAME_HEIGHT) {
          asteroidsRef.current.splice(i, 1);
        }
      }
    }

    if (scoreRef.current !== null) {
      setScore(Math.floor(scoreRef.current));
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameState !== 'playing' || !gameAreaRef.current) return;
    isPointerDownRef.current = true;
    gameAreaRef.current.setPointerCapture(e.pointerId);
    updateShipPosition(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameState !== 'playing' || !isPointerDownRef.current) return;
    updateShipPosition(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = false;
    if (gameAreaRef.current) {
      gameAreaRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const updateShipPosition = (clientX: number, clientY: number) => {
    if (!gameAreaRef.current || !shipRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    let x = clientX - rect.left - SHIP_SIZE / 2;
    let y = clientY - rect.top - SHIP_SIZE / 2;

    x = Math.max(0, Math.min(x, GAME_WIDTH - SHIP_SIZE));
    y = Math.max(0, Math.min(y, GAME_HEIGHT - SHIP_SIZE));

    shipRef.current.x = x;
    shipRef.current.y = y;
  };

  return (
    <div 
      className="max-w-[430px] mx-auto h-[500px] relative overflow-hidden rounded-xl bg-[#0b1026] select-none shadow-[0_0_30px_rgba(125,232,195,0.15)] ring-1 ring-white/10"
      style={{ touchAction: 'none' }}
      ref={gameAreaRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Background Stars */}
      {starsRef.current && starsRef.current.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}px`,
            top: `${star.y}px`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
          }}
        />
      ))}

      {gameState === 'playing' && shipRef.current && (
        <>
          <div className="absolute top-4 left-4 text-[#7de8c3] font-mono text-xl z-10 font-bold drop-shadow-[0_0_5px_#7de8c3]">
            SCORE {score}
          </div>

          {asteroidsRef.current && asteroidsRef.current.map(ast => (
            <div
              key={ast.id}
              className="absolute flex items-center justify-center"
              style={{
                left: `${ast.x}px`,
                top: `${ast.y}px`,
                width: `${ast.w}px`,
                height: `${ast.h}px`,
                transform: `rotate(${ast.rotation}deg)`,
              }}
            >
               <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ color: ast.color }}>
                 <path 
                   d="M40,10 L70,20 L90,50 L75,85 L35,95 L10,65 L15,30 Z" 
                   fill="currentColor"
                   stroke="#ffffff"
                   strokeWidth="2"
                   strokeOpacity="0.5"
                 />
                 <circle cx="35" cy="40" r="8" fill="#0b1026" fillOpacity="0.3" />
                 <circle cx="65" cy="60" r="12" fill="#0b1026" fillOpacity="0.3" />
                 <circle cx="50" cy="80" r="6" fill="#0b1026" fillOpacity="0.3" />
               </svg>
            </div>
          ))}

          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `${shipRef.current.x}px`,
              top: `${shipRef.current.y}px`,
              width: `${shipRef.current.w}px`,
              height: `${shipRef.current.h}px`,
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_#7de8c3] overflow-visible">
              <polygon points="40,80 50,105 60,80" fill="#f9a8d4">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="0.15s" repeatCount="indefinite" />
              </polygon>
              <path d="M50,10 L85,80 L50,65 L15,80 Z" fill="#7de8c3" stroke="#ffffff" strokeWidth="2" />
              <ellipse cx="50" cy="50" rx="10" ry="15" fill="#0b1026" />
            </svg>
          </div>
        </>
      )}

      {gameState === 'start' && (
        <div className="absolute inset-0 bg-[#0b1026]/80 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
          <div className="relative mb-2">
            <h1 className="text-5xl font-black text-[#c4b5fd] tracking-widest drop-shadow-[0_0_15px_#c4b5fd]">D-37</h1>
          </div>
          <h2 className="text-lg font-bold text-[#f9a8d4] mb-8 tracking-[0.2em]">ASTEROID DODGE</h2>
          
          <div className="w-16 h-16 mb-8 relative flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_#7de8c3]">
              <path d="M50,10 L85,80 L50,65 L15,80 Z" fill="#7de8c3" stroke="#ffffff" strokeWidth="2" />
              <ellipse cx="50" cy="50" rx="10" ry="15" fill="#0b1026" />
            </svg>
            <div className="absolute -inset-4 border-2 border-[#7de8c3] rounded-full border-dashed animate-[spin_4s_linear_infinite] opacity-50" />
          </div>
          
          <p className="text-[#c4b5fd] text-sm mb-8 text-center px-8 opacity-80 leading-relaxed font-mono">
            DRAG TO MOVE<br/>EVADE THE ASTEROIDS
          </p>

          <button 
            onClick={startGame}
            className="px-8 py-4 bg-transparent border-2 border-[#7de8c3] text-[#7de8c3] font-bold rounded-full hover:bg-[#7de8c3] hover:text-[#0b1026] transition-all duration-300 shadow-[0_0_15px_rgba(125,232,195,0.4)] hover:shadow-[0_0_25px_rgba(125,232,195,0.8)] active:scale-95 tracking-wider"
          >
            INITIATE
          </button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-[#0b1026]/90 flex flex-col items-center justify-center z-30 backdrop-blur-md">
          <h1 className="text-3xl font-black text-[#f9a8d4] mb-8 drop-shadow-[0_0_15px_#f9a8d4] tracking-widest">HULL BREACHED</h1>
          
          <div className="bg-black/50 border border-[#c4b5fd]/30 p-8 rounded-2xl text-center mb-10 w-3/4 max-w-[280px] shadow-[0_0_30px_rgba(196,181,253,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c4b5fd] to-transparent opacity-50" />
            <p className="text-[#c4b5fd] text-xs font-mono mb-2 tracking-widest opacity-80">SCORE</p>
            <p className="text-5xl font-mono text-[#7de8c3] mb-6 font-bold drop-shadow-[0_0_8px_#7de8c3]">{score}</p>
            
            <p className="text-[#c4b5fd] text-xs font-mono mb-2 tracking-widest opacity-80">HIGH SCORE</p>
            <p className="text-2xl font-mono text-white opacity-90">{highScore}</p>
          </div>

          <button 
            onClick={startGame}
            className="px-10 py-4 bg-[#c4b5fd] text-[#0b1026] font-bold rounded-full hover:bg-[#f9a8d4] transition-all duration-300 shadow-[0_0_20px_rgba(196,181,253,0.6)] hover:shadow-[0_0_30px_rgba(249,168,212,0.8)] active:scale-95 tracking-widest"
          >
            RETRY
          </button>
        </div>
      )}
    </div>
  );
}
