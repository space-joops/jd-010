'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

type GameState = 'START' | 'PLAYING' | 'GAMEOVER' | 'SUCCESS';

interface PhysicsState {
  altitude: number;
  velocity: number;
  temperature: number;
  angle: number;
  airbrakes: boolean;
  gameState: GameState;
}

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState<number>(0);
  
  const [altitude, setAltitude] = useState<number>(40000);
  const [velocity, setVelocity] = useState<number>(6000);
  const [temperature, setTemperature] = useState<number>(20);
  
  const [angle, setAngle] = useState<number>(15);
  const [airbrakes, setAirbrakes] = useState<boolean>(false);
  
  const lastTimeRef = useRef<number | null>(null);
  const reqRef = useRef<number | null>(null);
  const stateRef = useRef<PhysicsState | null>(null);

  if (!stateRef.current) {
    stateRef.current = {
      altitude: 40000,
      velocity: 6000,
      temperature: 20,
      angle: 15,
      airbrakes: false,
      gameState: 'START'
    };
  }

  useEffect(() => {
    if (stateRef.current) {
      stateRef.current.angle = angle;
      stateRef.current.airbrakes = airbrakes;
    }
  }, [angle, airbrakes]);

  const loop = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    if (stateRef.current && stateRef.current.gameState === 'PLAYING') {
      const { altitude: alt, velocity: vel, temperature: temp, angle: ang, airbrakes: brk } = stateRef.current;
      
      const timeScale = 3;
      const scaledDt = Math.min(dt, 0.1) * timeScale;
      
      const density = Math.exp(-alt / 8000);
      const baseCd = 0.05;
      const angleCd = (ang / 40) * 0.2;
      const brakeCd = brk ? 0.5 : 0;
      const Cd = baseCd + angleCd + brakeCd;
      
      const dragDecel = density * Cd * vel * vel * 0.0008;
      
      let newVel = vel - dragDecel * scaledDt;
      newVel += 3.7 * Math.sin((ang * Math.PI) / 180) * scaledDt;
      if (newVel < 0) newVel = 0;
      
      const descentRate = newVel * Math.sin((ang * Math.PI) / 180);
      let newAlt = alt - descentRate * scaledDt;
      
      const heatGen = dragDecel * (newVel / 1000) * 0.35;
      const cooling = (temp - 20) * 0.2 + (temp - 20) * density * 0.5;
      let newTemp = temp + (heatGen - cooling) * scaledDt;
      if (newTemp < 20) newTemp = 20;

      let nextState: GameState = stateRef.current.gameState;

      if (newTemp >= 2500) {
        nextState = 'GAMEOVER';
      } else if (newAlt <= 0) {
        newAlt = 0;
        if (newVel <= 800) {
          nextState = 'SUCCESS';
          const speedScore = Math.max(0, 800 - newVel) * 5;
          const tempScore = Math.max(0, 2500 - newTemp);
          setScore(Math.floor(speedScore + tempScore));
        } else {
          nextState = 'GAMEOVER';
        }
      }

      stateRef.current.altitude = newAlt;
      stateRef.current.velocity = newVel;
      stateRef.current.temperature = newTemp;
      stateRef.current.gameState = nextState;

      setAltitude(newAlt);
      setVelocity(newVel);
      setTemperature(newTemp);
      
      if (nextState !== 'PLAYING') {
        setGameState(nextState);
      }
    }

    if (stateRef.current?.gameState === 'PLAYING') {
      reqRef.current = requestAnimationFrame(loop);
    }
  }, []);

  useEffect(() => {
    if (stateRef.current) {
      stateRef.current.gameState = gameState;
    }
    if (gameState === 'PLAYING') {
      lastTimeRef.current = performance.now();
      reqRef.current = requestAnimationFrame(loop);
    }
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [gameState, loop]);

  const startGame = () => {
    setAltitude(40000);
    setVelocity(6000);
    setTemperature(20);
    setAngle(15);
    setAirbrakes(false);
    setScore(0);
    
    if (stateRef.current) {
      stateRef.current = {
        altitude: 40000,
        velocity: 6000,
        temperature: 20,
        angle: 15,
        airbrakes: false,
        gameState: 'PLAYING'
      };
    }
    
    setGameState('PLAYING');
  };

  const isCritical = temperature > 2000;

  return (
    <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-mono rounded-xl shadow-2xl border border-[#c4b5fd]/20 select-none">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flyBy {
          0% { transform: translateX(0); }
          100% { transform: translateX(-600px); }
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-2px, 2px) rotate(-1deg); }
          50% { transform: translate(2px, -2px) rotate(1deg); }
          75% { transform: translate(-2px, -2px) rotate(0deg); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out infinite;
        }
      `}} />

      {/* Background Gradient */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: 'linear-gradient(to bottom, transparent, #7de8c322)',
          opacity: Math.max(0, 1 - altitude / 40000)
        }}
      />

      {/* Speed Lines */}
      {gameState === 'PLAYING' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i}
              className="absolute bg-white/30 h-[1px]"
              style={{
                width: `${Math.random() * 100 + 50}px`,
                top: `${Math.random() * 100}%`,
                left: '100%',
                animation: `flyBy ${Math.max(0.1, 2000 / (velocity + 1)) * (Math.random() + 0.5)}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* HUD Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-[#0b1026] to-transparent">
        <div>
          <div className="text-[#7de8c3] text-xs mb-1 font-bold">ALTITUDE</div>
          <div className="text-2xl font-bold tracking-tighter">
            {(altitude / 1000).toFixed(1)} <span className="text-sm text-[#c4b5fd]">km</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[#7de8c3] text-xs mb-1 font-bold">VELOCITY</div>
          <div className={`text-2xl font-bold tracking-tighter ${velocity > 800 && altitude < 5000 ? 'text-[#f9a8d4] animate-pulse' : ''}`}>
            {Math.floor(velocity)} <span className="text-sm text-[#c4b5fd]">m/s</span>
          </div>
        </div>
      </div>

      {/* Altitude Bar */}
      <div className="absolute left-4 top-24 bottom-32 w-1.5 bg-[#c4b5fd]/20 rounded-full z-20">
        <div 
          className="absolute bottom-0 w-full bg-[#7de8c3] rounded-full transition-all duration-100"
          style={{ height: `${(altitude / 40000) * 100}%` }}
        />
        <div 
          className="absolute w-4 h-4 border-2 border-[#0b1026] bg-[#f9a8d4] rounded-full -left-[5px] transition-all duration-100 shadow-[0_0_8px_#f9a8d4]"
          style={{ bottom: `${(altitude / 40000) * 100}%`, transform: 'translateY(50%)' }}
        />
      </div>

      {/* Main View Area */}
      <div className={`absolute inset-0 flex items-center justify-center z-10 ${isCritical && gameState === 'PLAYING' ? 'animate-shake' : ''}`}>
        <svg viewBox="-60 -40 120 80" className="w-56 h-40 overflow-visible">
          <g style={{ transform: `rotate(${angle}deg)`, transition: 'transform 0.1s linear' }}>
            {/* Plasma Shockwave */}
            {temperature > 100 && (
              <>
                <path 
                  d="M 28 -23 Q 50 0 28 23 Q 36 0 28 -23 Z" 
                  fill="#f9a8d4" 
                  style={{ opacity: Math.min(1, (temperature - 100) / 1000) }} 
                  className="animate-pulse" 
                />
                <path 
                  d="M 25 -30 Q 70 0 25 30 Q 40 0 25 -30 Z" 
                  fill="#7de8c3" 
                  style={{ opacity: Math.min(1, (temperature - 500) / 1500) * 0.6 }} 
                  className="animate-pulse" 
                />
              </>
            )}
            
            {/* Body */}
            <path d="M -30 0 L 20 -20 L 20 20 Z" fill="#cbd5e1" />
            <path d="M -30 0 L 20 -20 L 20 20 Z" fill="#ef4444" style={{ opacity: Math.min(1, Math.max(0, (temperature - 1200) / 1300)) }} />
            
            {/* Engine */}
            <path d="M -30 -5 L -38 -10 L -38 10 L -30 5 Z" fill="#64748b" />
            
            {/* Heat shield */}
            <path d="M 20 -21 Q 30 0 20 21 L 24 21 Q 34 0 24 -21 Z" fill="#334155" />
            <path d="M 20 -21 Q 30 0 20 21 L 24 21 Q 34 0 24 -21 Z" fill="#f9a8d4" style={{ opacity: Math.min(1, Math.max(0, (temperature - 500) / 1500)) }} />
            
            {/* Airbrakes */}
            {airbrakes && (
              <>
                <path d="M -10 -13 L 5 -35 L -10 -30 Z" fill="#94a3b8" />
                <path d="M -10 13 L 5 35 L -10 30 Z" fill="#94a3b8" />
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Footer Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0b1026]/90 border-t border-[#c4b5fd]/30 backdrop-blur z-20">
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1 font-bold">
            <span className={isCritical ? 'text-[#f9a8d4] animate-pulse' : 'text-[#c4b5fd]'}>HULL TEMP</span>
            <span className={isCritical ? 'text-[#f9a8d4]' : 'text-white'}>{Math.floor(temperature)} °C</span>
          </div>
          <div className="h-2 bg-[#0b1026] border border-[#c4b5fd]/30 rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 h-full transition-all duration-100"
              style={{ 
                width: `${Math.min(100, (temperature / 2500) * 100)}%`,
                backgroundColor: temperature > 2000 ? '#f9a8d4' : temperature > 1000 ? '#7de8c3' : '#c4b5fd'
              }}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-[#c4b5fd] mb-2 font-bold">
              <span>PITCH ANGLE</span>
              <span>{angle}°</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="40" 
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-full accent-[#7de8c3] h-2 bg-[#c4b5fd]/20 rounded-lg appearance-none outline-none cursor-pointer"
            />
          </div>
          <button 
            onClick={() => setAirbrakes(!airbrakes)}
            className={`w-24 h-12 rounded-lg font-bold text-xs transition-all duration-200 border-2 ${
              airbrakes 
                ? 'bg-[#f9a8d4] border-[#f9a8d4] text-[#0b1026] shadow-[0_0_15px_#f9a8d4]' 
                : 'bg-transparent border-[#c4b5fd] text-[#c4b5fd] hover:bg-[#c4b5fd]/10'
            }`}
          >
            {airbrakes ? 'BRAKES ON' : 'BRAKES OFF'}
          </button>
        </div>
      </div>

      {/* Overlays */}
      {gameState === 'START' && (
        <div className="absolute inset-0 z-50 bg-[#0b1026]/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
          <h1 className="text-4xl font-bold text-[#7de8c3] mb-2 tracking-widest">AEROCAPTURE</h1>
          <div className="w-16 h-1 bg-[#f9a8d4] mb-6 rounded-full" />
          <p className="text-[#c4b5fd] mb-8 text-sm leading-relaxed">
            Pilot the capsule through the Martian atmosphere.
            Adjust pitch and airbrakes to manage friction heat.
            <br/><br/>
            Target: &lt; 800 m/s at 0 km.
            <br/>
            Warning: Hull melts at 2500 °C.
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-[#7de8c3] text-[#0b1026] font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_#7de8c340]"
          >
            INITIATE DESCENT
          </button>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-50 bg-[#0b1026]/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
          <h1 className="text-4xl font-bold text-[#f9a8d4] mb-2 tracking-widest">MISSION FAILED</h1>
          <div className="w-16 h-1 bg-[#ef4444] mb-6 rounded-full" />
          <p className="text-[#c4b5fd] mb-8 text-sm">
            {temperature >= 2500 
              ? 'Hull integrity compromised. The capsule burned up in the atmosphere.' 
              : `Impact velocity too high (${Math.floor(velocity)} m/s). The capsule was destroyed on impact.`}
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-transparent border-2 border-[#f9a8d4] text-[#f9a8d4] font-bold rounded-full hover:bg-[#f9a8d4]/10 transition-colors"
          >
            RETRY SIMULATION
          </button>
        </div>
      )}

      {gameState === 'SUCCESS' && (
        <div className="absolute inset-0 z-50 bg-[#0b1026]/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
          <h1 className="text-4xl font-bold text-[#7de8c3] mb-2 tracking-widest">TOUCHDOWN</h1>
          <div className="w-16 h-1 bg-[#7de8c3] mb-6 rounded-full" />
          <p className="text-[#c4b5fd] mb-2 text-sm">Successful Mars landing!</p>
          <div className="text-5xl font-bold text-white mb-8 drop-shadow-[0_0_10px_#ffffff50]">
            {score} <span className="text-lg text-[#c4b5fd] font-normal">PTS</span>
          </div>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-[#c4b5fd] text-[#0b1026] font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_#c4b5fd40]"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
