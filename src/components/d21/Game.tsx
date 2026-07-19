'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

type GameState = 'start' | 'playing' | 'gameover';
type Module = {
  id: number;
  x: number;
  y: number;
};

const calculateTorque = (mods: Module[]) => {
  return mods.reduce((sum, mod) => sum + mod.x * (1 + mod.y * 0.15), 0);
};

const getMaxTorque = (count: number) => 400 + count * 50;

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [modules, setModules] = useState<Module[]>([]);
  const [craneX, setCraneX] = useState(0);
  
  const gameStateRef = useRef<GameState | null>(null);
  const craneXRef = useRef<number | null>(null);
  const directionRef = useRef<number | null>(null);
  const speedRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    // Initialize refs
    if (craneXRef.current === null) craneXRef.current = 0;
    if (directionRef.current === null) directionRef.current = 1;
    if (speedRef.current === null) speedRef.current = 3;

    const loop = () => {
      if (gameStateRef.current === 'playing') {
        const currentSpeed = speedRef.current ?? 4;
        const currentDir = directionRef.current ?? 1;
        let currentX = craneXRef.current ?? 0;
        
        currentX += currentSpeed * currentDir;
        
        if (currentX > 150) {
          currentX = 150;
          directionRef.current = -1;
        } else if (currentX < -150) {
          currentX = -150;
          directionRef.current = 1;
        }
        
        craneXRef.current = currentX;
        setCraneX(currentX);
      }
      requestRef.current = requestAnimationFrame(loop);
    };
    
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleDrop = () => {
    if (gameStateRef.current !== 'playing') return;
    
    setModules(prev => {
      const x = craneXRef.current ?? 0;
      const y = prev.length;
      const newMod = { id: Date.now(), x, y };
      
      const nextMods = [...prev, newMod];
      const tq = calculateTorque(nextMods);
      const mx = getMaxTorque(nextMods.length);
      
      if (Math.abs(tq) >= mx) {
        setGameState('gameover');
        return nextMods;
      }
      
      setScore(nextMods.length);
      const nextSpeed = (speedRef.current ?? 4) + 0.2;
      speedRef.current = Math.min(12, nextSpeed);
      return nextMods;
    });
  };

  const startGame = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModules([]);
    setScore(0);
    setGameState('playing');
    craneXRef.current = 0;
    directionRef.current = 1;
    speedRef.current = 4;
    setCraneX(0);
  };

  const currentTorque = useMemo(() => calculateTorque(modules), [modules]);
  const maxTorque = useMemo(() => getMaxTorque(modules.length), [modules.length]);
  const stability = gameState === 'start' ? 100 : Math.max(0, 100 - (Math.abs(currentTorque) / maxTorque) * 100);
  const rotationAngle = (currentTorque / maxTorque) * 25;
  const cameraY = Math.max(0, modules.length * 40 - 250);

  const starBg = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Ccircle cx='40' cy='60' r='1.5' fill='%23ffffff' opacity='0.4'/%3E%3Ccircle cx='160' cy='140' r='2' fill='%23ffffff' opacity='0.7'/%3E%3Ccircle cx='260' cy='40' r='1' fill='%23ffffff' opacity='0.3'/%3E%3Ccircle cx='340' cy='280' r='2.5' fill='%23ffffff' opacity='0.6'/%3E%3Ccircle cx='80' cy='320' r='1' fill='%23ffffff' opacity='0.5'/%3E%3Ccircle cx='200' cy='380' r='1.5' fill='%23ffffff' opacity='0.8'/%3E%3C/svg%3E\")";
  const stabilityColor = stability > 50 ? '#7de8c3' : stability > 20 ? '#fcd34d' : '#f9a8d4';

  return (
    <div 
      className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] cursor-pointer select-none rounded-xl shadow-[0_0_50px_rgba(11,16,38,0.8)] border border-[#c4b5fd]/20"
      onClick={handleDrop}
    >
      {/* Background Stars */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: starBg, 
          backgroundSize: '400px', 
          backgroundPosition: `0px ${cameraY * 0.2}px` 
        }} 
      />
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: starBg, 
          backgroundSize: '300px', 
          backgroundPosition: `50px ${cameraY * 0.4}px`, 
          opacity: 0.6 
        }} 
      />

      {/* Top Bar UI */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-col gap-2 pointer-events-none">
        <div className="flex justify-between items-center font-mono">
          <span className="text-xl font-bold text-[#c4b5fd] drop-shadow-[0_0_5px_rgba(196,181,253,0.8)]">
            ALT: {score * 10}m
          </span>
          <span className="text-sm font-bold" style={{ color: stabilityColor, textShadow: `0 0 5px ${stabilityColor}` }}>
            TENSION: {Math.round(stability)}%
          </span>
        </div>
        
        <div className="w-full h-3 bg-[#0b1026] border border-[#c4b5fd]/40 rounded-full relative overflow-hidden">
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white z-20 -translate-x-1/2" />
          <div 
            className="absolute top-0 bottom-0 transition-all duration-300 z-10"
            style={{
              backgroundColor: stabilityColor,
              left: currentTorque < 0 ? `calc(50% - ${(Math.abs(currentTorque)/maxTorque)*50}%)` : '50%',
              width: `${(Math.abs(currentTorque)/maxTorque)*50}%`,
              boxShadow: `0 0 10px ${stabilityColor}`
            }}
          />
        </div>
      </div>

      {/* Static Crane Rail */}
      <div className="absolute top-[80px] left-0 right-0 h-2 bg-[#c4b5fd]/10 border-y border-[#c4b5fd]/30 z-10 pointer-events-none"></div>

      {/* Moving Crane */}
      <div 
        className="absolute left-1/2 z-20 pointer-events-none flex flex-col items-center"
        style={{ 
          top: `80px`, 
          transform: `translateX(calc(-50% + ${craneX}px))` 
        }}
      >
        <div className="w-16 h-3 bg-[#7de8c3] rounded-t-sm shadow-[0_0_10px_rgba(125,232,195,0.6)] z-20"></div>
        <div className="w-1 h-8 bg-[#7de8c3] z-10"></div>
        {gameState === 'playing' && (
          <div className="w-20 h-10 bg-[#7de8c3]/90 border-2 border-[#7de8c3] rounded-sm shadow-[0_0_20px_rgba(125,232,195,0.8)] flex items-center justify-center">
            <div className="w-16 h-2 bg-[#0b1026]/40 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Static Ground */}
      <div 
        className="absolute left-1/2 w-[600px] h-[200px] bg-[#0b1026] border-t-2 border-[#c4b5fd]/50 rounded-[50%] z-0 pointer-events-none transition-transform duration-300 ease-out"
        style={{ 
          bottom: '-170px', 
          transform: `translateX(-50%) translateY(${cameraY}px)`,
          boxShadow: '0 -20px 50px rgba(196,181,253,0.1)'
        }}
      />

      {/* Tower Container */}
      <div 
        className="absolute left-1/2 w-0 z-10 pointer-events-none"
        style={{ 
          bottom: '40px',
          transformOrigin: 'bottom center',
          transform: `translateY(${cameraY}px) rotate(${gameState === 'gameover' ? rotationAngle * 3 : rotationAngle}deg)`,
          transition: gameState === 'gameover' ? 'transform 1.5s cubic-bezier(0.5, 0, 1, 1)' : 'transform 0.3s ease-out'
        }}
      >
        {/* Cable */}
        <div className="absolute bottom-[-40px] left-1/2 w-1 h-[2000px] bg-[#c4b5fd]/30 -translate-x-1/2 rounded-full blur-[1px]"></div>
        <div className="absolute bottom-[-40px] left-1/2 w-[2px] h-[2000px] bg-[#c4b5fd]/80 -translate-x-1/2 shadow-[0_0_10px_#c4b5fd]"></div>
        
        {/* Modules */}
        {modules.map((mod: Module, i: number) => (
          <div 
            key={mod.id}
            className="absolute w-20 h-10 bg-[#c4b5fd] border-2 border-[#0b1026] rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(196,181,253,0.4)] transition-all"
            style={{
              bottom: `${i * 40}px`,
              left: `calc(50% + ${mod.x}px)`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="absolute top-0 bottom-0 left-1/2 w-2 bg-[#0b1026]/30 -translate-x-1/2"></div>
            <div className="w-16 h-2 bg-[#0b1026]/40 rounded-full flex justify-between px-2 items-center z-10">
              <div className="w-1 h-1 bg-[#7de8c3] rounded-full"></div>
              <div className="w-1 h-1 bg-[#f9a8d4] rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Overlays */}
      {gameState === 'start' && (
        <div className="absolute inset-0 z-50 bg-[#0b1026]/80 flex flex-col items-center justify-center backdrop-blur-sm">
          <h1 className="text-5xl font-bold text-[#7de8c3] mb-2 text-center drop-shadow-[0_0_15px_rgba(125,232,195,0.8)] tracking-wider">D-21</h1>
          <h2 className="text-xl text-[#c4b5fd] mb-8 font-mono tracking-widest">SPACE ELEVATOR</h2>
          <p className="text-sm text-gray-300 mb-8 max-w-[280px] text-center leading-relaxed">
            Drop modules to build the space elevator. Keep the center of mass balanced!
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-[#0b1026] border-2 border-[#7de8c3] text-[#7de8c3] rounded-full font-bold text-lg hover:bg-[#7de8c3] hover:text-[#0b1026] transition-all duration-300 shadow-[0_0_20px_rgba(125,232,195,0.5)] hover:shadow-[0_0_30px_rgba(125,232,195,0.8)] pointer-events-auto"
          >
            INITIATE BUILD
          </button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-50 bg-[#0b1026]/90 flex flex-col items-center justify-center backdrop-blur-md">
          <h2 className="text-4xl font-bold text-[#f9a8d4] mb-2 drop-shadow-[0_0_15px_rgba(249,168,212,0.8)] tracking-wider">CABLE SNAPPED</h2>
          <p className="text-xl text-[#c4b5fd] mb-8 font-mono">Final Altitude: {score * 10}m</p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-[#0b1026] border-2 border-[#f9a8d4] text-[#f9a8d4] rounded-full font-bold text-lg hover:bg-[#f9a8d4] hover:text-[#0b1026] transition-all duration-300 shadow-[0_0_20px_rgba(249,168,212,0.5)] hover:shadow-[0_0_30px_rgba(249,168,212,0.8)] pointer-events-auto"
          >
            RETRY BUILD
          </button>
        </div>
      )}
    </div>
  );
}
