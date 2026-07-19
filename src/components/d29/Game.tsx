'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

export default function OrbitalCargoGame() {
  const [distance, setDistance] = useState(2500);
  const [velocity, setVelocity] = useState(400);
  const [isBraking, setIsBraking] = useState(false);
  const [gameStatus, setGameStatus] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  
  const velocityRef = useRef(400);
  const distanceRef = useRef(2500);
  const isBrakingRef = useRef(false);

  // Background stars that map to distance
  const stars = useMemo(() => {
    return Array.from({ length: 60 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 500,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.1,
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const startGame = () => {
    setGameStatus('PLAYING');
    velocityRef.current = 400;
    distanceRef.current = 2500;
    setDistance(2500);
    setVelocity(400);
    setScore(0);
    setMessage('');
    lastTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(update);
  };

  const update = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    // Cap dt to prevent massive jumps on tab switch
    const safeDt = Math.min(dt, 0.1);

    if (isBrakingRef.current) {
      velocityRef.current -= 500 * safeDt; // Braking deceleration
    } else {
      velocityRef.current += 150 * safeDt; // Engine acceleration
    }

    velocityRef.current = Math.max(0, Math.min(velocityRef.current, 800));
    distanceRef.current -= velocityRef.current * safeDt;

    setDistance(distanceRef.current);
    setVelocity(velocityRef.current);

    if (distanceRef.current <= 0) {
      distanceRef.current = 0;
      setDistance(0);
      handleGameOver(velocityRef.current, 0);
      return;
    }

    if (velocityRef.current <= 0) {
      handleGameOver(0, distanceRef.current);
      return;
    }

    frameRef.current = requestAnimationFrame(update);
  };

  const handleGameOver = (finalVel: number, finalDist: number) => {
    setGameStatus('GAMEOVER');
    let finalScore = 0;
    let msg = '';
    
    if (finalDist <= 0) {
      if (finalVel > 40) {
        msg = 'CRASHED! TOO FAST';
        finalScore = 0;
      } else {
        msg = 'DOCKING SUCCESS';
        finalScore = Math.max(0, 100 - Math.floor(finalVel * 2.5));
      }
    } else {
      msg = 'STOPPED EARLY';
      finalScore = Math.max(0, 100 - Math.floor(finalDist / 5));
    }
    
    setScore(finalScore);
    setMessage(msg);
  };

  const startBraking = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (gameStatus === 'PLAYING') {
      isBrakingRef.current = true;
      setIsBraking(true);
    }
  };

  const stopBraking = (e: React.SyntheticEvent) => {
    e.preventDefault();
    isBrakingRef.current = false;
    setIsBraking(false);
  };

  return (
    <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans select-none touch-none shadow-2xl rounded-lg border border-[#c4b5fd]/20">
      {/* Background Stars */}
      {stars.map((star, i) => {
        const currentY = ((star.y + (2500 - distance) * star.speed) % 500 + 500) % 500;
        return (
          <div 
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${currentY}px`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.speed * 1.5
            }}
          />
        )
      })}

      {/* Dock Structure */}
      <div 
        className="absolute w-full flex flex-col items-center z-0" 
        style={{ top: 220 - distance }}
      >
        <svg width="300" height="100" viewBox="0 0 300 100">
          <rect x="0" y="0" width="300" height="20" fill="#1f2937" />
          <path d="M 50 20 L 250 20 L 230 80 L 70 80 Z" fill="#c4b5fd" opacity="0.2"/>
          <path d="M 80 20 L 220 20 L 200 90 L 100 90 Z" fill="#c4b5fd" opacity="0.4"/>
          <rect x="120" y="90" width="60" height="10" fill="#7de8c3" />
          <circle cx="100" cy="50" r="4" fill="#f9a8d4">
             <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="200" cy="50" r="4" fill="#f9a8d4">
             <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Cable */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-[#c4b5fd] opacity-20 z-0" />

      {/* Cargo Pod */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: 300 }}>
        <svg width="100" height="120" viewBox="0 0 100 120" className="overflow-visible">
          <rect x="35" y="20" width="30" height="50" fill="#f9a8d4" rx="4"/>
          <path d="M 25 70 L 75 70 L 85 90 L 15 90 Z" fill="#c4b5fd" />
          <rect x="40" y="30" width="20" height="15" fill="#0b1026" rx="2" opacity="0.5"/>
          
          {/* Main Engine */}
          {!isBraking && gameStatus === 'PLAYING' && (
            <polygon points="35,90 65,90 50,115" fill="#7de8c3">
              <animate attributeName="opacity" values="1;0.6;1" dur="0.2s" repeatCount="indefinite" />
            </polygon>
          )}
          
          {/* Braking Thrusters */}
          {isBraking && gameStatus === 'PLAYING' && (
            <>
              <polygon points="25,70 5,50 25,60" fill="#f9a8d4" />
              <polygon points="75,70 95,50 75,60" fill="#f9a8d4" />
            </>
          )}
        </svg>
      </div>

      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between z-10 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[#c4b5fd] text-[10px] font-bold tracking-widest">VELOCITY</span>
          <span className={`text-2xl font-mono font-bold ${velocity > 500 ? 'text-[#f9a8d4]' : 'text-[#7de8c3]'}`}>
            {Math.floor(velocity)} <span className="text-sm">m/s</span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[#c4b5fd] text-[10px] font-bold tracking-widest">DISTANCE</span>
          <span className="text-2xl font-mono font-bold text-white drop-shadow-md">
            {Math.max(0, Math.floor(distance))} <span className="text-sm">m</span>
          </span>
        </div>
      </div>

      {/* Brake Button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[80%] z-10">
        <button
          className={`w-full py-4 rounded-xl font-bold text-xl tracking-wider transition-all select-none
            ${gameStatus !== 'PLAYING' ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            ${isBraking ? 'bg-[#f9a8d4] text-[#0b1026] scale-[0.97] shadow-[0_0_20px_rgba(249,168,212,0.6)]' : 'bg-[#1f2937]/80 backdrop-blur-sm border-2 border-[#f9a8d4] text-[#f9a8d4]'}`}
          onPointerDown={startBraking}
          onPointerUp={stopBraking}
          onPointerLeave={stopBraking}
          onPointerCancel={stopBraking}
          onContextMenu={(e) => e.preventDefault()}
        >
          {isBraking ? 'BRAKING...' : 'HOLD TO BRAKE'}
        </button>
      </div>

      {/* Start Screen */}
      {gameStatus === 'START' && (
        <div className="absolute inset-0 bg-[#0b1026]/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
          <h1 className="text-4xl font-black text-[#7de8c3] mb-2 tracking-widest text-center drop-shadow-[0_0_15px_rgba(125,232,195,0.4)]">
            ORBITAL<br/>CARGO
          </h1>
          <p className="text-[#c4b5fd] text-center max-w-[280px] mb-8 text-sm">
            Deliver cargo to the orbital station. Hold <strong className="text-[#f9a8d4]">BRAKE</strong> to decelerate. Stop exactly at <strong className="text-white">0m</strong> distance.
          </p>
          <button 
            onClick={startGame}
            className="px-10 py-4 bg-[#7de8c3] text-[#0b1026] text-xl font-black rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(125,232,195,0.4)]"
          >
            LAUNCH
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameStatus === 'GAMEOVER' && (
        <div className="absolute inset-0 bg-[#0b1026]/90 flex flex-col items-center justify-center z-20 backdrop-blur-md animate-in fade-in duration-300">
          <h2 className={`text-2xl font-black mb-2 tracking-widest text-center ${score > 50 ? 'text-[#7de8c3]' : 'text-[#f9a8d4]'}`}>
            {message}
          </h2>
          <div className="text-7xl font-mono font-bold text-white mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {score}
          </div>
          <div className="text-[#c4b5fd] text-sm font-bold tracking-widest mb-8">
            POINTS
          </div>
          <button 
            onClick={startGame}
            className="px-10 py-4 bg-[#c4b5fd] text-[#0b1026] text-xl font-black rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(196,181,253,0.4)]"
          >
            TRY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
