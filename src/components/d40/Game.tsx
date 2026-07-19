"use client";

import React, { useState, useEffect, useRef } from "react";

type GameState = "START" | "PLAYING" | "GAME_OVER" | "VICTORY";

interface Debris {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
}

export default function Game() {
  const [gameState, setGameState] = useState<GameState>("START");
  const [playerX, setPlayerX] = useState(50);
  const [warpCharge, setWarpCharge] = useState(0);
  const [score, setScore] = useState(0);
  const [debrisList, setDebrisList] = useState<Debris[]>([]);

  const gameStateRef = useRef<GameState>("START");
  const playerXRef = useRef(50);
  const warpChargeRef = useRef(0);
  const scoreRef = useRef(0);
  const debrisRef = useRef<Debris[]>([]);
  const spawnRateRef = useRef(1000);
  const lastSpawnRef = useRef(0);
  const nextDebrisIdRef = useRef(0);
  
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  const update = (time: number) => {
    if (gameStateRef.current !== "PLAYING") {
      lastTimeRef.current = null;
      return;
    }
    
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(update);
      return;
    }
    
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    
    scoreRef.current += deltaTime * 0.01;
    
    warpChargeRef.current = Math.min(100, warpChargeRef.current + (deltaTime / 25000) * 100);
    
    if (warpChargeRef.current >= 100) {
      setGameState("VICTORY");
      setScore(Math.floor(scoreRef.current));
      setWarpCharge(100);
      lastTimeRef.current = null;
      return;
    }
    
    if (time - lastSpawnRef.current > spawnRateRef.current) {
      const colors = ["#f9a8d4", "#c4b5fd", "#7de8c3"];
      const newDebris: Debris = {
        id: nextDebrisIdRef.current++,
        x: Math.random() * 100,
        y: -50,
        size: 15 + Math.random() * 30,
        speed: 150 + Math.random() * 250,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
      debrisRef.current.push(newDebris);
      lastSpawnRef.current = time;
      
      spawnRateRef.current = Math.max(150, spawnRateRef.current - 15);
    }
    
    const GAME_WIDTH = 430;
    const GAME_HEIGHT = 500;
    const PLAYER_SIZE = 30;
    
    let collision = false;
    debrisRef.current = debrisRef.current.filter((d) => {
      d.y += (d.speed * deltaTime) / 1000;
      d.rotation += (d.rotationSpeed * deltaTime) / 1000;
      
      const playerPixelX = (playerXRef.current / 100) * GAME_WIDTH;
      const playerPixelY = GAME_HEIGHT - 70;
      
      const debrisPixelX = (d.x / 100) * GAME_WIDTH;
      const debrisPixelY = d.y;
      
      const dist = Math.hypot(playerPixelX - debrisPixelX, playerPixelY - debrisPixelY);
      
      if (dist < PLAYER_SIZE / 2 + d.size / 2 - 5) {
        collision = true;
      }
      
      return d.y < GAME_HEIGHT + d.size;
    });
    
    if (collision) {
      setGameState("GAME_OVER");
      setScore(Math.floor(scoreRef.current));
      lastTimeRef.current = null;
      return;
    }
    
    setScore(Math.floor(scoreRef.current));
    setWarpCharge(warpChargeRef.current);
    setDebrisList([...debrisRef.current]);
    
    requestRef.current = requestAnimationFrame(update);
  };
  
  useEffect(() => {
    if (gameState === "PLAYING") {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState]);

  const startGame = () => {
    setGameState("PLAYING");
    setPlayerX(50);
    setWarpCharge(0);
    setScore(0);
    setDebrisList([]);
    
    playerXRef.current = 50;
    warpChargeRef.current = 0;
    scoreRef.current = 0;
    debrisRef.current = [];
    spawnRateRef.current = 800;
    lastSpawnRef.current = performance.now();
    nextDebrisIdRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameState !== "PLAYING") return;
    const rect = e.currentTarget.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    x = Math.max(5, Math.min(95, x));
    setPlayerX(x);
    playerXRef.current = x;
  };

  const backgroundClass = "w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#f9a8d4] via-[#c4b5fd] to-transparent blur-[80px] animate-pulse transition-transform duration-[30000ms] ease-linear " + (gameState === "PLAYING" ? "scale-150" : "scale-100");

  return (
    <div 
      className="max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white rounded-lg shadow-2xl select-none"
      style={{ touchAction: "none" }}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerMove}
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30">
         <div className={backgroundClass} />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
         <div className="absolute top-4 left-4 right-4 h-4 bg-gray-800 rounded-full overflow-hidden border border-[#7de8c3]/30">
            <div 
              className="h-full bg-[#7de8c3] transition-all duration-100 ease-linear shadow-[0_0_10px_#7de8c3]" 
              style={{ width: warpCharge + "%" }}
            />
         </div>
         <div className="absolute top-10 left-4 text-[#7de8c3] font-bold text-sm drop-shadow-md">
           WARP CORE: {Math.floor(warpCharge)}%
         </div>
         <div className="absolute top-10 right-4 text-white font-bold text-sm drop-shadow-md">
           SCORE: {score}
         </div>
      </div>
      
      {gameState === "PLAYING" && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div 
            className="absolute bottom-[70px] -translate-x-1/2 w-[30px] h-[40px] drop-shadow-[0_0_10px_#7de8c3]"
            style={{ left: playerX + "%" }}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 14L12 22L20 14L12 2Z" fill="#7de8c3" />
              <path d="M10 22L12 26L14 22Z" fill="#f9a8d4" className="animate-pulse" />
            </svg>
          </div>
          
          {debrisList.map(d => (
            <div
              key={d.id}
              className="absolute"
              style={{
                left: d.x + "%",
                top: d.y + "px",
                width: d.size,
                height: d.size,
                transform: "translate(-50%, -50%) rotate(" + d.rotation + "deg)",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                <path d="M12 2L2 12L12 22L22 12L12 2Z" fill={d.color} opacity="0.9" />
                <path d="M12 6L6 12L12 18L18 12L12 6Z" fill="#0b1026" opacity="0.5" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {gameState === "START" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0b1026]/80 backdrop-blur-sm">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f9a8d4] to-[#7de8c3] mb-4 text-center drop-shadow-sm tracking-widest">
            SUPERNOVA<br/>ESCAPE
          </h1>
          <p className="text-[#c4b5fd] text-center mb-10 px-8 font-medium leading-relaxed">
            The star is collapsing.<br/>Dodge the debris and charge your warp core to escape!
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-[#7de8c3] text-[#0b1026] font-bold rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_#7de8c3]"
          >
            INITIATE LAUNCH
          </button>
        </div>
      )}
      
      {gameState === "GAME_OVER" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0b1026]/90 backdrop-blur-md">
          <div className="text-red-500 mb-4 animate-bounce">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
          </div>
          <h1 className="text-4xl font-black text-red-500 mb-2 tracking-widest">HULL BREACH</h1>
          <p className="text-[#f9a8d4] mb-8 text-xl font-bold">Score: {score}</p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-[#f9a8d4] text-[#0b1026] font-bold rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_#f9a8d4]"
          >
            RETRY
          </button>
        </div>
      )}
      
      {gameState === "VICTORY" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0b1026]/90 backdrop-blur-md border-4 border-[#7de8c3]">
          <div className="text-[#7de8c3] mb-4 animate-pulse">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-[#7de8c3] mb-2 drop-shadow-[0_0_10px_#7de8c3] tracking-widest text-center">WARP<br/>SUCCESSFUL</h1>
          <p className="text-white mb-8 text-xl font-bold">Final Score: {score}</p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-[#c4b5fd] text-[#0b1026] font-bold rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_#c4b5fd]"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
