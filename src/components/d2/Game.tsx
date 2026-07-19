'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

type GameStatus = 'start' | 'playing' | 'gameover' | 'victory';

interface GameState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fuel: number;
  thrust: boolean;
  leftThrust: boolean;
  rightThrust: boolean;
  wind: number;
}

const GRAVITY = 0.015;
const THRUST = 0.04;
const SIDE_THRUST = 0.02;
const MAX_SAFE_VY = 0.5;
const INITIAL_FUEL = 150;
const LANDING_PAD_X = 50;
const LANDING_PAD_WIDTH = 25; // 25% of screen width
const LANDING_PAD_Y = 85;

const Background = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none">
    {Array.from({ length: 60 }).map((_, i) => (
      <div
        key={i}
        className="absolute bg-white rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 2 + 1}px`,
          height: `${Math.random() * 2 + 1}px`,
          opacity: Math.random() * 0.5 + 0.1,
          animation: `twinkle ${Math.random() * 3 + 2}s infinite alternate`
        }}
      />
    ))}
    <style>{`
      @keyframes twinkle {
        0% { opacity: 0.1; }
        100% { opacity: 0.8; }
      }
    `}</style>
  </div>
));

Background.displayName = 'Background';

export default function Game() {
  const [status, setStatus] = useState<GameStatus>('start');
  const [state, setState] = useState<GameState>({
    x: 50,
    y: 10,
    vx: 0,
    vy: 0,
    fuel: INITIAL_FUEL,
    thrust: false,
    leftThrust: false,
    rightThrust: false,
    wind: 0,
  });
  
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  
  const stateRef = useRef<GameState>(state);
  const keysRef = useRef({ up: false, left: false, right: false });
  const requestRef = useRef<number>();

  const startGame = () => {
    stateRef.current = {
      x: Math.random() * 60 + 20, 
      y: 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0,
      fuel: INITIAL_FUEL,
      thrust: false,
      leftThrust: false,
      rightThrust: false,
      wind: 0,
    };
    keysRef.current = { up: false, left: false, right: false };
    setStatus('playing');
    setScore(0);
  };

  const update = useCallback(() => {
    if (status !== 'playing') return;

    let { x, y, vx, vy, fuel } = stateRef.current;
    const keys = keysRef.current;

    let thrust = false;
    let leftThrust = false;
    let rightThrust = false;

    // Apply thrusts
    if (keys.up && fuel > 0) {
      vy -= THRUST;
      fuel -= 0.3;
      thrust = true;
    }
    if (keys.left && fuel > 0) {
      vx -= SIDE_THRUST;
      fuel -= 0.15;
      leftThrust = true;
    }
    if (keys.right && fuel > 0) {
      vx += SIDE_THRUST;
      fuel -= 0.15;
      rightThrust = true;
    }

    // Dynamic wind effect
    const currentWind = Math.sin(Date.now() / 1500) * 0.005;
    vx += currentWind;

    // Gravity
    vy += GRAVITY;

    // Air resistance (slight)
    vx *= 0.99;

    // Update position
    x += vx;
    y += vy;

    // Screen bounds
    if (x < 2) { x = 2; vx = 0; }
    if (x > 98) { x = 98; vx = 0; }
    if (y < 2) { y = 2; vy = 0; } // Ceiling bump

    // Check landing
    if (y >= LANDING_PAD_Y) {
      y = LANDING_PAD_Y;
      const onPad = Math.abs(x - LANDING_PAD_X) <= LANDING_PAD_WIDTH / 2;
      const safeSpeed = vy <= MAX_SAFE_VY;
      
      if (onPad && safeSpeed) {
        setStatus('victory');
        const remainingFuelScore = Math.floor(Math.max(0, fuel) * 10);
        const accuracy = 1 - (Math.abs(x - LANDING_PAD_X) / (LANDING_PAD_WIDTH / 2));
        const accuracyScore = Math.floor(accuracy * 1000);
        setScore(500 + remainingFuelScore + accuracyScore);
        setMessage('Perfect Landing!');
      } else {
        setStatus('gameover');
        if (!onPad) setMessage('Missed the landing pad!');
        else setMessage(`Crash! Velocity was ${(vy*10).toFixed(1)}m/s (Max safe: ${(MAX_SAFE_VY*10).toFixed(1)})`);
      }
      
      // Stop moving
      vx = 0;
      vy = 0;
      thrust = false;
      leftThrust = false;
      rightThrust = false;
    }

    stateRef.current = { x, y, vx, vy, fuel, thrust, leftThrust, rightThrust, wind: currentWind };
    setState({ ...stateRef.current });

    if (status === 'playing') {
      requestRef.current = requestAnimationFrame(update);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'playing') {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status, update]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'Space', 'KeyW'].includes(e.code)) keysRef.current.up = true;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'Space', 'KeyW'].includes(e.code)) keysRef.current.up = false;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="max-w-[430px] w-full mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans touch-none rounded-2xl shadow-[0_0_50px_rgba(125,232,195,0.15)] border border-[#c4b5fd]/20">
      <Background />

      {/* Landing Pad */}
      <div 
        className="absolute bottom-0 h-[15%] bg-gradient-to-t from-[#c4b5fd]/30 to-transparent border-t-4 border-[#c4b5fd] shadow-[0_-10px_20px_rgba(196,181,253,0.3)] transition-all"
        style={{
          left: `${LANDING_PAD_X - LANDING_PAD_WIDTH / 2}%`,
          width: `${LANDING_PAD_WIDTH}%`
        }}
      >
        <div className="w-full h-full flex items-start mt-2 justify-center text-[#c4b5fd] font-mono text-xs opacity-70 tracking-widest font-bold">
          LZ-ALPHA
        </div>
      </div>

      {/* Surface (outside pad) */}
      <div className="absolute bottom-0 h-[10%] left-0 right-0 bg-[#0b1026] border-t border-white/10 z-[-1]" />

      {/* Rover */}
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${state.x}%`, top: `${state.y}%` }}
      >
        <svg width="48" height="48" viewBox="0 0 40 40" className="overflow-visible">
          {/* Side Thrusters (Visual) */}
          {state.leftThrust && <path d="M28,17 L36,19 L28,21 Z" fill="#f9a8d4" className="animate-pulse opacity-90 drop-shadow-[0_0_4px_#f9a8d4]" />}
          {state.rightThrust && <path d="M12,17 L4,19 L12,21 Z" fill="#f9a8d4" className="animate-pulse opacity-90 drop-shadow-[0_0_4px_#f9a8d4]" />}
          
          {/* Antenna */}
          <rect x="19" y="4" width="2" height="8" fill="#c4b5fd" />
          <circle cx="20" cy="4" r="2.5" fill="#f9a8d4" className="animate-pulse" />
          
          {/* Main Body */}
          <path d="M10,24 L30,24 L26,12 L14,12 Z" fill="#7de8c3" />
          <rect x="14" y="16" width="12" height="4" fill="#0b1026" className="opacity-50" />
          
          {/* Wheels / Landing Legs */}
          <circle cx="12" cy="27" r="3" fill="#c4b5fd" />
          <circle cx="20" cy="28" r="3.5" fill="#c4b5fd" />
          <circle cx="28" cy="27" r="3" fill="#c4b5fd" />
          
          {/* Main Engine Plume */}
          {state.thrust && (
            <path d="M16,30 L24,30 L20,44 Z" fill="#f9a8d4" className="animate-pulse opacity-90 drop-shadow-[0_0_8px_#f9a8d4]" />
          )}
        </svg>
      </div>

      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between font-mono text-xs uppercase tracking-wider z-10 pointer-events-none bg-[#0b1026]/50 p-2 rounded-lg backdrop-blur-sm border border-white/5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[#c4b5fd] w-8">ALT</span>
            <span className="text-white font-bold">{(100 - state.y).toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#c4b5fd] w-8">SPD</span>
            <span className={`font-bold ${state.vy > MAX_SAFE_VY ? 'text-[#f9a8d4]' : 'text-[#7de8c3]'}`}>
              {(state.vy * 10).toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#c4b5fd] w-8">WND</span>
            <span className="text-white font-bold">{(state.wind * 1000).toFixed(0)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 items-end">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{Math.max(0, Math.floor(state.fuel))}</span>
            <span className="text-[#c4b5fd]">FUEL</span>
          </div>
          <div className="w-24 h-2 border border-[#c4b5fd]/30 rounded-full overflow-hidden bg-[#0b1026]">
            <div 
              className={`h-full transition-all duration-75 ${state.fuel < 30 ? 'bg-[#f9a8d4]' : 'bg-[#7de8c3]'}`}
              style={{ width: `${Math.max(0, (state.fuel / INITIAL_FUEL) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* On-Screen Controls */}
      {status === 'playing' && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 z-10 pointer-events-auto">
          <div className="flex gap-2">
            <button 
              className="w-16 h-16 rounded-full bg-[#0b1026]/80 backdrop-blur-md border-2 border-[#c4b5fd]/50 active:bg-[#c4b5fd]/30 flex items-center justify-center select-none shadow-[0_0_15px_rgba(196,181,253,0.2)]"
              onPointerDown={() => keysRef.current.left = true}
              onPointerUp={() => keysRef.current.left = false}
              onPointerLeave={() => keysRef.current.left = false}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button 
              className="w-16 h-16 rounded-full bg-[#0b1026]/80 backdrop-blur-md border-2 border-[#c4b5fd]/50 active:bg-[#c4b5fd]/30 flex items-center justify-center select-none shadow-[0_0_15px_rgba(196,181,253,0.2)]"
              onPointerDown={() => keysRef.current.right = true}
              onPointerUp={() => keysRef.current.right = false}
              onPointerLeave={() => keysRef.current.right = false}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
          <button 
            className="w-20 h-20 rounded-full bg-[#0b1026]/80 backdrop-blur-md border-2 border-[#f9a8d4]/50 active:bg-[#f9a8d4]/30 flex items-center justify-center select-none shadow-[0_0_20px_rgba(249,168,212,0.3)]"
            onPointerDown={() => keysRef.current.up = true}
            onPointerUp={() => keysRef.current.up = false}
            onPointerLeave={() => keysRef.current.up = false}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f9a8d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Screens */}
      {(status === 'start' || status === 'gameover' || status === 'victory') && (
        <div className="absolute inset-0 bg-[#0b1026]/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-20">
          {status === 'start' && (
            <>
              <div className="w-16 h-16 mb-4">
                <svg viewBox="0 0 40 40">
                  <path d="M10,24 L30,24 L26,12 L14,12 Z" fill="#7de8c3" />
                  <rect x="19" y="4" width="2" height="8" fill="#c4b5fd" />
                  <circle cx="20" cy="4" r="2.5" fill="#f9a8d4" />
                </svg>
              </div>
              <h1 className="text-4xl font-black text-[#7de8c3] mb-4 drop-shadow-[0_0_15px_rgba(125,232,195,0.4)] tracking-wider">
                ROVER
                <br/>
                LANDING
              </h1>
              <p className="text-[#c4b5fd] mb-8 text-sm max-w-[250px] leading-relaxed">
                Use retro-rockets to touch down softly on the LZ.
                <br /><br />
                <span className="text-[#f9a8d4]">Watch your fuel and velocity!</span>
              </p>
              <button 
                onClick={startGame}
                className="px-8 py-3.5 bg-[#7de8c3] text-[#0b1026] font-bold rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(125,232,195,0.4)] tracking-wide"
              >
                INITIATE DESCENT
              </button>
            </>
          )}

          {status === 'gameover' && (
            <>
              <h2 className="text-3xl font-black text-[#f9a8d4] mb-4 drop-shadow-[0_0_15px_rgba(249,168,212,0.4)] tracking-widest">
                MISSION FAILED
              </h2>
              <p className="text-white mb-8 font-mono bg-[#f9a8d4]/10 p-3 rounded-lg border border-[#f9a8d4]/30">{message}</p>
              <button 
                onClick={startGame}
                className="px-8 py-3.5 bg-[#f9a8d4] text-[#0b1026] font-bold rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(249,168,212,0.4)] tracking-wide"
              >
                RETRY DROP
              </button>
            </>
          )}

          {status === 'victory' && (
            <>
              <h2 className="text-3xl font-black text-[#7de8c3] mb-2 drop-shadow-[0_0_15px_rgba(125,232,195,0.4)] tracking-widest">
                TOUCHDOWN
              </h2>
              <p className="text-[#c4b5fd] mb-6 font-medium">{message}</p>
              <div className="bg-[#7de8c3]/10 border border-[#7de8c3]/30 p-4 rounded-xl mb-8 w-full max-w-[200px]">
                <p className="text-[#c4b5fd] text-xs uppercase mb-1">Final Score</p>
                <p className="text-3xl text-white font-mono font-bold">{score}</p>
              </div>
              <button 
                onClick={startGame}
                className="px-8 py-3.5 bg-[#7de8c3] text-[#0b1026] font-bold rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(125,232,195,0.4)] tracking-wide"
              >
                NEXT MISSION
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
