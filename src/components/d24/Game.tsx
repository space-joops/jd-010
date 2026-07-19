"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

type GameState = 'start' | 'playing' | 'end';

const normalizeAngle = (angle: number) => {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
};

const getAngleDiff = (a: number, b: number) => {
  let diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  if (diff > 180) diff = 360 - diff;
  return diff;
};

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [sailAngle, setSailAngle] = useState(0);
  const [windAngle, setWindAngle] = useState(0);
  const [windIntensity, setWindIntensity] = useState(1);
  const [distance, setDistance] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [thrust, setThrust] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const physicsRef = useRef({
    sailAngle: 0,
    windAngle: 0,
    targetWindAngle: 0,
    windIntensity: 1,
    distance: 0,
    timeLeft: 30,
    thrust: 0,
    windChangeTimer: 0,
    stars: Array.from({ length: 70 }).map(() => ({
      x: Math.random() * 430,
      y: Math.random() * 500,
      size: 0.5 + Math.random() * 1.5,
      opacity: 0.1 + Math.random() * 0.7,
    })),
  });

  const controlsRef = useRef({
    left: false,
    right: false,
  });

  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  const update = useCallback((time: number) => {
    if (previousTimeRef.current !== null) {
      const deltaTime = (time - previousTimeRef.current) / 1000;
      const p = physicsRef.current;
      const c = controlsRef.current;

      if (p.timeLeft > 0) {
        p.timeLeft -= deltaTime;
        if (p.timeLeft <= 0) {
          p.timeLeft = 0;
          setGameState('end');
        }

        if (c.left) p.sailAngle = normalizeAngle(p.sailAngle - 240 * deltaTime);
        if (c.right) p.sailAngle = normalizeAngle(p.sailAngle + 240 * deltaTime);

        p.windChangeTimer -= deltaTime;
        if (p.windChangeTimer <= 0) {
          const jump = (Math.random() - 0.5) * 240;
          p.targetWindAngle = p.windAngle + jump;
          p.windIntensity = 1.5 + Math.random() * 1.5; 
          p.windChangeTimer = 3 + Math.random() * 3;
        }

        const diff = p.targetWindAngle - p.windAngle;
        const maxChange = 120 * deltaTime; 
        if (Math.abs(diff) <= maxChange) {
          p.windAngle = p.targetWindAngle;
        } else {
          p.windAngle += Math.sign(diff) * maxChange;
        }

        const currentWindNorm = normalizeAngle(p.windAngle);
        const angleDiff = getAngleDiff(currentWindNorm, p.sailAngle);
        const thrustMultiplier = Math.max(0, Math.cos((angleDiff * Math.PI) / 180));
        p.thrust = p.windIntensity * thrustMultiplier;

        p.distance += p.thrust * 15 * deltaTime;

        setSailAngle(p.sailAngle);
        setWindAngle(currentWindNorm);
        setWindIntensity(p.windIntensity);
        setDistance(p.distance);
        setTimeLeft(p.timeLeft);
        setThrust(p.thrust);
        
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 430, 500);
          p.stars.forEach(star => {
            star.y += (20 + p.thrust * 200) * deltaTime;
            if (star.y > 500) {
              star.y = 0;
              star.x = Math.random() * 430;
            }
            ctx.fillStyle = `rgba(196, 181, 253, ${star.opacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }
    }
    previousTimeRef.current = time;
    if (physicsRef.current.timeLeft > 0) {
      requestRef.current = requestAnimationFrame(update);
    }
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, update]);

  const startGame = () => {
    physicsRef.current = {
      ...physicsRef.current,
      sailAngle: 0,
      windAngle: 0,
      targetWindAngle: 0,
      windIntensity: 1.5,
      distance: 0,
      timeLeft: 30,
      thrust: 0,
      windChangeTimer: 2,
    };
    controlsRef.current = { left: false, right: false };
    setGameState('playing');
    previousTimeRef.current = null;
  };

  const handlePointerDown = (dir: 'left' | 'right') => {
    controlsRef.current[dir] = true;
  };

  const handlePointerUp = (dir: 'left' | 'right') => {
    controlsRef.current[dir] = false;
  };

  const timeColor = timeLeft <= 10 ? 'text-[#f9a8d4] animate-pulse drop-shadow-[0_0_5px_#f9a8d4]' : 'text-white';

  return (
    <div 
      className="max-w-[430px] mx-auto w-full h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans select-none rounded-xl border border-[#c4b5fd]/20 shadow-2xl"
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        @keyframes windFlow {
          0% { transform: translateY(-200px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(400px); opacity: 0; }
        }
        .animate-wind-flow {
          animation-name: windFlow;
        }
      `}</style>

      {/* Starfield Canvas */}
      <canvas
        ref={canvasRef}
        width={430}
        height={500}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* Start Screen */}
      {gameState === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0b1026]/90 z-40 text-center backdrop-blur-sm">
          <h1 className="text-4xl font-black mb-4 text-[#7de8c3] drop-shadow-[0_0_10px_#7de8c3]">SOLAR SAIL</h1>
          <p className="text-[#c4b5fd] mb-8 text-sm">
            항성풍의 방향과 세기를 읽고<br/>돛을 조절해 추진력을 극대화하세요.
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] text-[#0b1026] font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_#7de8c3]"
          >
            DEPLOY SAIL
          </button>
        </div>
      )}

      {/* End Screen */}
      {gameState === 'end' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0b1026]/90 z-40 text-center backdrop-blur-sm">
          <h1 className="text-3xl font-black mb-2 text-[#f9a8d4] drop-shadow-[0_0_10px_#f9a8d4]">JOURNEY COMPLETE</h1>
          <p className="text-white text-xl mb-1">Distance Reached</p>
          <p className="text-5xl font-black text-[#7de8c3] mb-8 drop-shadow-[0_0_10px_#7de8c3]">
            {Math.floor(distance)}<span className="text-lg ml-1">AU</span>
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-transparent border-2 border-[#c4b5fd] text-[#c4b5fd] font-bold rounded-full hover:bg-[#c4b5fd] hover:text-[#0b1026] active:scale-95 transition-all shadow-[0_0_15px_#c4b5fd]"
          >
            RE-DEPLOY
          </button>
        </div>
      )}

      {/* Gameplay Elements */}
      {gameState === 'playing' && (
        <>
          {/* HUD */}
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-30 pointer-events-none">
            <div className="flex flex-col gap-1">
              <div className="text-[#c4b5fd] text-[10px] font-bold uppercase tracking-wider">Distance</div>
              <div className="text-[#7de8c3] text-2xl font-black drop-shadow-[0_0_5px_#7de8c3]">
                {Math.floor(distance)} <span className="text-xs">AU</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <div className="text-[#c4b5fd] text-[10px] font-bold uppercase tracking-wider">Thrust</div>
              <div className="w-24 h-3 bg-[#0b1026] border border-[#c4b5fd]/50 rounded-full overflow-hidden relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#7de8c3] to-[#f9a8d4] transition-all duration-75"
                  style={{ width: `${Math.min(100, (thrust / 3) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="text-[#c4b5fd] text-[10px] font-bold uppercase tracking-wider">Time Left</div>
              <div className={`text-2xl font-black ${timeColor}`}>
                {Math.ceil(timeLeft)}s
              </div>
            </div>
          </div>

          {/* Wind Info HUD */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 pointer-events-none opacity-80">
             <div className="text-[#f9a8d4] text-[10px] font-bold uppercase tracking-wider">Wind Force</div>
             <div className="text-lg font-black text-[#f9a8d4] drop-shadow-[0_0_5px_#f9a8d4]">
               {Math.floor((windIntensity / 3) * 100)}%
             </div>
          </div>

          {/* Wind Flow Animation */}
          <div 
            className="absolute inset-0 flex items-center justify-center transition-transform duration-75 z-10 pointer-events-none"
            style={{ transform: `rotate(${windAngle}deg)` }}
          >
            <svg width="600" height="600" viewBox="0 0 600 600" className="absolute">
              <g>
                {Array.from({ length: 25 }).map((_, i) => {
                  const x = 100 + (i * 21) % 400;
                  const y = (i * 37) % 600;
                  const length = 50 + (i * 13) % 100;
                  return (
                    <line
                      key={i}
                      x1={x}
                      y1={y}
                      x2={x}
                      y2={y + length}
                      stroke="#f9a8d4"
                      strokeWidth={1 + (i % 2)}
                      className="animate-wind-flow"
                      style={{ 
                        animationDuration: `${3 / windIntensity}s`, 
                        animationDelay: `${(i % 7) * -0.4}s`,
                        animationIterationCount: 'infinite',
                        animationTimingFunction: 'linear',
                        opacity: 0.2 + (windIntensity / 3) * 0.4
                      }}
                    />
                  );
                })}
              </g>
            </svg>
            <div className="absolute -top-[140px] left-1/2 -translate-x-1/2 flex flex-col items-center">
               <div className="w-5 h-5 bg-[#f9a8d4] rounded-full shadow-[0_0_20px_#f9a8d4]" />
               <div className="w-[2px] h-12 bg-gradient-to-b from-[#f9a8d4] to-transparent mt-2" />
            </div>
          </div>

          {/* Ship and Sail */}
          <div 
            className="absolute inset-0 flex items-center justify-center transition-transform duration-75 z-20 pointer-events-none"
            style={{ transform: `rotate(${sailAngle}deg)` }}
          >
            <svg width="140" height="140" viewBox="0 0 140 140" className="drop-shadow-[0_0_15px_rgba(125,232,195,0.4)]">
              {/* Sail Front */}
              <path d="M20,60 Q70,20 120,60" fill="none" stroke="#7de8c3" strokeWidth="8" strokeLinecap="round" />
              <path d="M20,60 Q70,40 120,60" fill="none" stroke="#c4b5fd" strokeWidth="3" strokeLinecap="round" />
              
              {/* Struts */}
              <line x1="70" y1="40" x2="70" y2="80" stroke="#7de8c3" strokeWidth="3" />
              <line x1="40" y1="52" x2="55" y2="80" stroke="#7de8c3" strokeWidth="2" />
              <line x1="100" y1="52" x2="85" y2="80" stroke="#7de8c3" strokeWidth="2" />

              {/* Hull */}
              <polygon points="60,80 80,80 75,110 65,110" fill="#c4b5fd" />
              <circle cx="70" cy="90" r="5" fill="#0b1026" />
              
              {/* Engine Plume */}
              <polygon 
                points="65,110 75,110 70,135" 
                fill="#f9a8d4" 
                style={{ 
                  opacity: 0.2 + (thrust / 3) * 0.8, 
                  transformOrigin: '70px 110px', 
                  transform: `scaleY(${0.2 + thrust / 1.5})` 
                }} 
              />
            </svg>
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 left-0 w-full px-8 flex justify-between z-30">
            <button
              onPointerDown={() => handlePointerDown('left')}
              onPointerUp={() => handlePointerUp('left')}
              onPointerLeave={() => handlePointerUp('left')}
              className="w-20 h-20 rounded-full bg-[#0b1026]/90 border-[3px] border-[#c4b5fd] flex items-center justify-center text-[#c4b5fd] hover:bg-[#c4b5fd]/20 active:bg-[#c4b5fd] active:text-[#0b1026] transition-colors shadow-[0_0_20px_rgba(196,181,253,0.4)] touch-none select-none"
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onPointerDown={() => handlePointerDown('right')}
              onPointerUp={() => handlePointerUp('right')}
              onPointerLeave={() => handlePointerUp('right')}
              className="w-20 h-20 rounded-full bg-[#0b1026]/90 border-[3px] border-[#c4b5fd] flex items-center justify-center text-[#c4b5fd] hover:bg-[#c4b5fd]/20 active:bg-[#c4b5fd] active:text-[#0b1026] transition-colors shadow-[0_0_20px_rgba(196,181,253,0.4)] touch-none select-none"
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
