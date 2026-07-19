'use client';

import React, { useState, useEffect, useRef } from 'react';

const SolarPanel = () => (
  <svg width="100%" height="100%" viewBox="0 0 300 300" className="absolute inset-0 z-0 rounded-lg">
    <rect width="300" height="300" fill="#0b1026" rx="8" />
    <g stroke="#7de8c3" strokeWidth="2" strokeOpacity="0.3">
      {Array.from({length: 6}).map((_, i) => (
        <React.Fragment key={i}>
          <line x1={i * 60} y1={0} x2={i * 60} y2={300} />
          <line x1={0} y1={i * 60} x2={300} y2={i * 60} />
        </React.Fragment>
      ))}
    </g>
    <g fill="#162044">
       {Array.from({length: 5}).map((_, r) => 
         Array.from({length: 5}).map((_, c) => (
           <rect key={`${r}-${c}`} x={c*60 + 4} y={r*60 + 4} width="52" height="52" rx="4" />
         ))
       )}
    </g>
    <g stroke="#f9a8d4" strokeWidth="1" strokeOpacity="0.2">
      {Array.from({length: 5}).map((_, r) => 
         Array.from({length: 5}).map((_, c) => (
           <line key={`ref-${r}-${c}`} x1={c*60 + 10} y1={r*60 + 50} x2={c*60 + 50} y2={r*60 + 10} />
         ))
       )}
    </g>
  </svg>
);

export default function Game() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [power, setPower] = useState(0);
  const targetPower = 90;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{x: number, y: number} | null>(null);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true } as any) as CanvasRenderingContext2D | null;
    if (!ctx) return;
    
    ctx.globalCompositeOperation = 'source-over';
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#c25c34');
    gradient.addColorStop(1, '#8a3c20');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for(let i=0; i<4000; i++) {
       ctx.fillStyle = Math.random() > 0.5 ? '#d67e4b' : '#6b2d16';
       ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, Math.random()*2+1, Math.random()*2+1);
    }
  };

  useEffect(() => {
    initCanvas();
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeRemaining(t => {
          if (t <= 1) {
            setGameState('end');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      const powerTimer = setInterval(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let clear = 0;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 50) clear++;
        }
        const pct = Math.floor((clear / (canvas.width * canvas.height)) * 100);
        setPower(pct);
        
        if (pct >= targetPower) {
           setGameState('end');
        }
      }, 250);
      return () => clearInterval(powerTimer);
    }
  }, [gameState, targetPower]);

  const startGame = () => {
    initCanvas();
    setPower(0);
    setTimeRemaining(15);
    setGameState('playing');
  };

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    
    isDrawing.current = true;
    
    const { x, y } = getCanvasCoordinates(e);
    lastPos.current = { x, y };
    draw(x, y, false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || gameState !== 'playing') return;
    const { x, y } = getCanvasCoordinates(e);
    draw(x, y, true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = false;
    lastPos.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const draw = (x: number, y: number, isContinuous: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 45;

    ctx.beginPath();
    if (isContinuous && lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.arc(x, y, 22.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    lastPos.current = { x, y };
  };

  return (
    <div className="max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-[#c4b5fd] flex flex-col font-sans border border-[#3b4674] sm:rounded-2xl shadow-2xl">
      {/* UI Overlay */}
      <div className="w-full px-6 pt-6 pb-2 z-20">
        <div className="flex justify-between items-center mb-2">
          <div className="text-[#7de8c3] font-bold text-lg drop-shadow-md">POWER: {power}%</div>
          <div className={`font-bold text-lg drop-shadow-md ${timeRemaining <= 5 && gameState === 'playing' ? 'text-[#f9a8d4] animate-pulse' : 'text-[#c4b5fd]'}`}>
            TIME: {timeRemaining}s
          </div>
        </div>
        <div className="w-full bg-[#162044] h-4 rounded-full overflow-hidden border border-[#7de8c3]/30 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] transition-all duration-200 ease-out" 
            style={{ width: `${Math.min(100, power)}%` }} 
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <div className="text-xs text-[#c4b5fd]/60">Mars Rover</div>
          <div className="text-xs text-[#f9a8d4]">Target: {targetPower}%</div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center relative w-full px-4">
        <div className="relative w-full max-w-[300px] aspect-square rounded-lg shadow-[0_0_30px_rgba(11,16,38,0.8)]">
          <SolarPanel />
          <canvas 
            ref={canvasRef}
            width={300}
            height={300}
            className="absolute inset-0 z-10 touch-none cursor-crosshair rounded-lg"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerOut={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>
      </div>

      {/* Screens */}
      {gameState === 'start' && (
        <div className="absolute inset-0 z-50 bg-[#0b1026]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 mb-4 text-[#7de8c3]">
            <svg viewBox="0 0 24 24" fill="currentColor">
               <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] mb-2 tracking-wider">
            MARS ROVER
          </h1>
          <p className="text-[#f9a8d4] text-lg mb-6 font-semibold uppercase tracking-widest text-sm">Solar Panel Cleaning</p>
          <p className="text-[#c4b5fd]/90 mb-8 text-sm leading-relaxed max-w-[250px]">
            A dust storm has covered the solar panels!<br/><br/>
            Wipe them clean to restore at least <strong className="text-[#7de8c3] text-base">{targetPower}%</strong> power before time runs out.
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-[#7de8c3] text-[#0b1026] font-bold rounded-full shadow-[0_0_20px_rgba(125,232,195,0.4)] hover:shadow-[0_0_30px_rgba(125,232,195,0.6)] hover:scale-105 active:scale-95 transition-all"
          >
            START CLEANING
          </button>
        </div>
      )}

      {gameState === 'end' && (
        <div className="absolute inset-0 z-50 bg-[#0b1026]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          {power >= targetPower ? (
            <>
              <div className="w-24 h-24 mb-4 text-[#7de8c3]">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                   <polyline points="22 4 12 14.01 9 11.01"></polyline>
                 </svg>
              </div>
              <h2 className="text-3xl font-black text-[#7de8c3] mb-2">MISSION SUCCESS</h2>
              <p className="text-[#c4b5fd] mb-8">Power fully restored! The rover is back online.</p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 mb-4 text-[#f9a8d4]">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <circle cx="12" cy="12" r="10"></circle>
                   <line x1="12" y1="8" x2="12" y2="12"></line>
                   <line x1="12" y1="16" x2="12.01" y2="16"></line>
                 </svg>
              </div>
              <h2 className="text-3xl font-black text-[#f9a8d4] mb-2">MISSION FAILED</h2>
              <p className="text-[#c4b5fd] mb-8">Not enough power to operate.</p>
            </>
          )}
          
          <div className="text-2xl font-bold mb-8">
            FINAL POWER: <span className={power >= targetPower ? "text-[#7de8c3]" : "text-[#f9a8d4]"}>{power}%</span>
          </div>

          <button 
            onClick={startGame}
            className="px-8 py-3 bg-[#c4b5fd] text-[#0b1026] font-bold rounded-full shadow-[0_0_20px_rgba(196,181,253,0.4)] hover:scale-105 active:scale-95 transition-all"
          >
            TRY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
