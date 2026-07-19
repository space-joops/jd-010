'use client';
import React, { useState, useEffect, useRef } from 'react';

const Visualizer = ({ signalStrength, success }: { signalStrength: number, success: boolean }) => {
  const path1GlowRef = useRef<SVGPathElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const path3Ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    let time = 0;
    let rafId: number;

    const chaos = 1 - signalStrength / 100;
    const wave1Amp = success ? 40 : 15 + chaos * 35;
    const wave1Freq = success ? 4 : 5 + chaos * 10;
    const wave2Amp = success ? 0 : chaos * 40;
    const wave2Freq = 15;
    const wave3Amp = success ? 0 : chaos * 35;
    const wave3Freq = 25;

    const getPath = (amp: number, freq: number, phaseOffset: number) => {
      let d = 'M 0 50 ';
      for (let i = 0; i <= 100; i += 2) {
        const y = 50 + Math.sin((i * freq + phaseOffset) * Math.PI / 180) * amp;
        d += `L ${i} ${y} `;
      }
      return d;
    };

    const render = () => {
      time += 1;
      const d1 = getPath(wave1Amp, wave1Freq, time * 5);
      if (path1GlowRef.current) path1GlowRef.current.setAttribute('d', d1);
      if (path1Ref.current) path1Ref.current.setAttribute('d', d1);
      if (path2Ref.current) path2Ref.current.setAttribute('d', getPath(wave2Amp, wave2Freq, -time * 10));
      if (path3Ref.current) path3Ref.current.setAttribute('d', getPath(wave3Amp, wave3Freq, time * 8));
      
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [signalStrength, success]);

  const chaos = 1 - signalStrength / 100;

  return (
    <div className={`relative w-full h-56 bg-[#0b1026] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(125,232,195,0.15)] border transition-colors duration-300 ${success ? 'border-[#7de8c3]' : 'border-[#c4b5fd]/30'}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {!success && (
          <>
            <path ref={path3Ref} stroke="#c4b5fd" strokeWidth="1" fill="none" opacity={0.4 + chaos * 0.6} />
            <path ref={path2Ref} stroke="#f9a8d4" strokeWidth="1" fill="none" opacity={0.4 + chaos * 0.6} />
          </>
        )}
        
        <path ref={path1GlowRef} stroke="#7de8c3" strokeWidth={success ? 8 : 4} fill="none" opacity={0.3} />
        <path ref={path1Ref} stroke={success ? '#ffffff' : '#7de8c3'} strokeWidth={2 + (signalStrength/100)*2} fill="none" />
      </svg>
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(125,232,195,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(125,232,195,0.1)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] pointer-events-none" />
      
      {/* Scanline */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none" />

      {success && (
        <div className="absolute inset-0 bg-[#7de8c3]/20 animate-pulse pointer-events-none" />
      )}
    </div>
  );
};

export default function Game() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  
  const [frequency, setFrequency] = useState(50);
  const [targetFrequency, setTargetFrequency] = useState(0);
  const [signalStrength, setSignalStrength] = useState(0);
  const [decodeProgress, setDecodeProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const getNewTarget = (current: number) => {
    let newTarget = current;
    while (Math.abs(newTarget - current) < 25) {
      newTarget = Math.floor(Math.random() * 80) + 10;
    }
    return newTarget;
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setFrequency(50);
    setTargetFrequency(getNewTarget(50));
    setDecodeProgress(0);
    setGameState('playing');
  };

  useEffect(() => {
    const dist = Math.abs(frequency - targetFrequency);
    const strength = Math.max(0, 100 - dist * 15);
    setSignalStrength(strength);
  }, [frequency, targetFrequency]);

  useEffect(() => {
    if (gameState !== 'playing' || isSuccess) return;
    
    let interval: NodeJS.Timeout;
    if (signalStrength > 90) {
      interval = setInterval(() => {
        setDecodeProgress(prev => {
          if (prev >= 100) {
            setScore(s => s + 1);
            setIsSuccess(true);
            setTimeout(() => {
              setTargetFrequency(getNewTarget(frequency));
              setIsSuccess(false);
              setDecodeProgress(0);
            }, 600);
            return 100;
          }
          return prev + 4;
        });
      }, 40);
    } else {
      setDecodeProgress(prev => Math.max(0, prev - 5));
    }
    
    return () => clearInterval(interval);
  }, [signalStrength, gameState, isSuccess, frequency]);

  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('end');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  return (
    <div className="max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans border border-[#c4b5fd]/20 rounded-2xl shadow-2xl flex flex-col">
      <style>{`
        .custom-slider {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        .custom-slider:focus {
          outline: none;
        }
        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 36px;
          width: 12px;
          border-radius: 2px;
          background: #7de8c3;
          cursor: pointer;
          margin-top: -16px;
          box-shadow: 0 0 15px #7de8c3, inset 0 0 5px rgba(0,0,0,0.5);
          border: 1px solid #fff;
        }
        .custom-slider::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: rgba(196, 181, 253, 0.3);
          border-radius: 2px;
          box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
        }
        
        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.05;
          pointer-events: none;
        }
      `}</style>
      
      <div className="absolute inset-0 noise-bg" />

      {gameState === 'start' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="w-20 h-20 mb-6 rounded-full border-4 border-[#7de8c3] flex items-center justify-center shadow-[0_0_30px_rgba(125,232,195,0.4)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#7de8c3" strokeWidth="2" className="w-10 h-10">
              <path d="M4 12h4l2-6 4 12 2-6h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] mb-2 tracking-wider">
            WOW! SIGNAL
          </h1>
          <p className="text-[#f9a8d4] mb-12 text-sm font-mono opacity-80">
            DECODE THE ALIEN FREQUENCIES
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-[#7de8c3]/10 border border-[#7de8c3] text-[#7de8c3] font-mono font-bold rounded hover:bg-[#7de8c3] hover:text-[#0b1026] transition-all duration-300 shadow-[0_0_15px_rgba(125,232,195,0.3)] hover:shadow-[0_0_25px_rgba(125,232,195,0.6)]"
          >
            INITIALIZE SCAN
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex-1 flex flex-col p-5 z-10">
          <div className="flex justify-between items-center mb-6 text-sm font-mono">
            <div className="flex flex-col">
              <span className="text-[#f9a8d4]/70 text-xs">TIMER</span>
              <span className="text-[#f9a8d4] font-bold text-lg">{timeLeft}s</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[#7de8c3]/70 text-xs">DECODED</span>
              <span className="text-[#7de8c3] font-bold text-lg">{score}</span>
            </div>
          </div>
          
          <Visualizer signalStrength={signalStrength} success={isSuccess} />
          
          <div className="mt-10 flex-1 flex flex-col items-center">
            <div className="flex justify-between w-full px-2 mb-2">
              <span className="text-[#c4b5fd]/50 text-xs font-mono">0.0 MHz</span>
              <span className="text-[#c4b5fd] font-mono tracking-widest text-sm">TUNER</span>
              <span className="text-[#c4b5fd]/50 text-xs font-mono">100.0 MHz</span>
            </div>
            
            <div className="text-3xl font-mono text-white mb-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              {frequency.toFixed(1)} <span className="text-sm text-[#c4b5fd]">MHz</span>
            </div>
            
            <div className="w-full px-2 relative group">
              <input 
                type="range" 
                min="0" max="100" step="0.1"
                value={frequency}
                onChange={(e) => setFrequency(parseFloat(e.target.value))}
                className="custom-slider w-full"
              />
              <div className="absolute top-8 left-0 right-0 flex justify-between px-2 pointer-events-none opacity-30">
                {[...Array(11)].map((_, i) => (
                  <div key={i} className="w-[1px] h-2 bg-[#c4b5fd]"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-auto pt-4">
            <div className="flex justify-between text-[10px] font-mono mb-1">
              <span className={signalStrength > 90 ? 'text-[#7de8c3]' : 'text-[#f9a8d4]'}>
                {isSuccess ? 'SIGNAL ACQUIRED' : signalStrength > 90 ? 'LOCKING SIGNAL...' : 'SEEKING...'}
              </span>
              <span className="text-[#c4b5fd]">{Math.floor(decodeProgress)}%</span>
            </div>
            <div className="w-full bg-[#c4b5fd]/10 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] transition-all duration-100 ease-out"
                style={{ width: `${decodeProgress}%`, boxShadow: '0 0 10px #7de8c3' }}
              />
            </div>
          </div>
        </div>
      )}

      {gameState === 'end' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 animate-in fade-in duration-500">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f9a8d4] to-[#c4b5fd] mb-2 tracking-widest">
            TRANSMISSION OVER
          </h2>
          <p className="text-[#c4b5fd] mb-8 text-sm font-mono">
            CONNECTION LOST
          </p>
          
          <div className="bg-[#c4b5fd]/10 border border-[#c4b5fd]/30 rounded-xl p-6 w-full mb-10 backdrop-blur-sm">
            <div className="text-xs text-[#c4b5fd] font-mono mb-2">SIGNALS DECODED</div>
            <div className="text-6xl font-black text-[#7de8c3] drop-shadow-[0_0_15px_rgba(125,232,195,0.5)]">
              {score}
            </div>
          </div>

          <button 
            onClick={startGame}
            className="w-full py-4 bg-gradient-to-r from-[#7de8c3]/20 to-[#c4b5fd]/20 border border-[#c4b5fd]/50 text-white font-mono font-bold rounded-lg hover:from-[#7de8c3]/40 hover:to-[#c4b5fd]/40 transition-all duration-300"
          >
            ESTABLISH NEW LINK
          </button>
        </div>
      )}
    </div>
  );
}
