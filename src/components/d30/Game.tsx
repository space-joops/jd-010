"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';

const ELEMENTS = [
  { id: 'O2', name: 'Oxygen (O2)', lines: [68, 72, 76] },
  { id: 'H2O', name: 'Water (H2O)', lines: [58, 65, 82, 89] },
  { id: 'CO2', name: 'Carbon Dioxide (CO2)', lines: [15, 25, 38, 48] },
  { id: 'CH4', name: 'Methane (CH4)', lines: [42, 52, 85] },
  { id: 'Na', name: 'Sodium (Na)', lines: [48, 51] },
  { id: 'He', name: 'Helium (He)', lines: [12, 32, 66] },
  { id: 'H', name: 'Hydrogen (H)', lines: [28, 45, 62, 80] },
  { id: 'N2', name: 'Nitrogen (N2)', lines: [18, 22, 92] },
];

const MAX_ROUNDS = 5;
const ROUND_TIME = 15;

const Spectrum = ({ lines, height = 'h-12', className = '' }: { lines: number[], height?: string, className?: string }) => {
  return (
    <div className={`relative w-full rounded overflow-hidden ${height} ${className}`}
         style={{ background: 'linear-gradient(to right, #4b0082, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)' }}>
      {lines.map((line, i) => (
        <div 
          key={i} 
          className="absolute top-0 bottom-0 bg-[#0b1026] w-[3px]" 
          style={{ left: `${line}%`, transform: 'translateX(-50%)' }} 
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40 pointer-events-none" />
    </div>
  );
};

export default function Game() {
  const [gameState, setGameState] = useState<'start' | 'play' | 'end'>('start');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [targetElement, setTargetElement] = useState<typeof ELEMENTS[0] | null>(null);
  const [options, setOptions] = useState<typeof ELEMENTS>([]);
  const [noiseLines, setNoiseLines] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const STARS = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      top: `${(i * 17) % 100}%`,
      left: `${(i * 23 + i * i) % 100}%`,
      size: `${(i % 3) + 1}px`,
      delay: `${i % 5}s`,
      opacity: (i % 5 + 2) / 10
    }));
  }, []);

  useEffect(() => {
    if (gameState === 'play' && timeLeft > 0 && !feedback) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && !feedback) {
      handleTimeOut();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState, timeLeft, feedback]);

  const startGame = () => {
    setScore(0);
    setRound(1);
    setGameState('play');
    setupRound();
  };

  const setupRound = () => {
    const shuffled = [...ELEMENTS].sort(() => Math.random() - 0.5);
    const target = shuffled[0];
    const roundOptions = shuffled.slice(0, 4).sort(() => Math.random() - 0.5);
    
    if (!roundOptions.find(o => o.id === target.id)) {
      roundOptions[0] = target;
      roundOptions.sort(() => Math.random() - 0.5);
    }
    
    setTargetElement(target);
    setOptions(roundOptions);
    
    const noise = [
      Math.floor(Math.random() * 90) + 5,
      Math.floor(Math.random() * 90) + 5
    ];
    setNoiseLines(noise);
    
    setTimeLeft(ROUND_TIME);
    setFeedback(null);
    setSelectedOptionId(null);
  };

  const handleChoice = (opt: typeof ELEMENTS[0]) => {
    if (feedback) return;
    setSelectedOptionId(opt.id);
    
    if (opt.id === targetElement?.id) {
      setFeedback('correct');
      setScore(s => s + 100 + timeLeft * 10);
    } else {
      setFeedback('wrong');
    }
    
    setTimeout(() => {
      if (round >= MAX_ROUNDS) {
        setGameState('end');
      } else {
        setRound(r => r + 1);
        setupRound();
      }
    }, 1500);
  };

  const handleTimeOut = () => {
    setFeedback('wrong');
    setTimeout(() => {
      if (round >= MAX_ROUNDS) {
        setGameState('end');
      } else {
        setRound(r => r + 1);
        setupRound();
      }
    }, 1500);
  };

  return (
    <div className="max-w-[430px] w-full mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] rounded-xl shadow-[0_0_50px_rgba(11,16,38,0.8)] border border-[#c4b5fd]/20 text-white font-sans">
      
      {/* Background Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map((star, i) => (
          <div 
            key={i} 
            className="absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animation: `pulse ${2 + parseInt(star.delay)}s infinite`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 h-full">
        {gameState === 'start' && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
            <div className="w-24 h-24 rounded-full bg-[#0b1026] border-4 border-[#7de8c3] flex items-center justify-center shadow-[0_0_30px_rgba(125,232,195,0.4)] relative">
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#f9a8d4] animate-spin" style={{ animationDuration: '3s' }} />
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7de8c3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
            </div>
            
            <div>
              <h1 className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] mb-2 drop-shadow-[0_0_10px_rgba(125,232,195,0.4)]">
                EXO-SPECTRA
              </h1>
              <div className="h-[1px] w-1/2 mx-auto bg-gradient-to-r from-transparent via-[#f9a8d4] to-transparent" />
            </div>

            <p className="text-[#c4b5fd] text-sm leading-relaxed px-4">
              Analyze the light spectrum of distant exoplanets. Identify the missing absorption lines to discover the atmospheric elements!
            </p>
            
            <button 
              onClick={startGame} 
              className="mt-4 px-8 py-3 bg-transparent border-2 border-[#7de8c3] text-[#7de8c3] font-bold rounded-full hover:bg-[#7de8c3] hover:text-[#0b1026] transition-all flex items-center shadow-[0_0_15px_rgba(125,232,195,0.3)] group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:fill-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              START ANALYSIS
            </button>
          </div>
        )}

        {gameState === 'play' && targetElement && (
          <div className="flex flex-col h-full p-5 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center text-xs font-bold tracking-widest text-[#7de8c3]">
              <div className="flex items-center space-x-2 bg-black/40 px-3 py-1 rounded-full border border-[#7de8c3]/30">
                <span>ROUND {round}/{MAX_ROUNDS}</span>
              </div>
              <div className="flex items-center space-x-2 bg-black/40 px-3 py-1 rounded-full border border-[#f9a8d4]/30 text-[#f9a8d4]">
                <span>SCORE {score}</span>
              </div>
            </div>

            {/* Timer bar */}
            <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / ROUND_TIME) * 100}%` }}
              />
            </div>

            {/* Observed Spectrum */}
            <div className="flex flex-col space-y-2 mt-2 bg-black/40 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="flex justify-between items-center text-[10px] text-[#c4b5fd] uppercase tracking-widest">
                <span>Observed Planet Spectrum</span>
                <span className="text-[#f9a8d4] animate-pulse">Scanning...</span>
              </div>
              <Spectrum lines={[...targetElement.lines, ...noiseLines]} height="h-16" className="border border-white/20 shadow-[0_0_20px_rgba(196,181,253,0.15)]" />
            </div>

            <div className="text-[10px] text-[#7de8c3] text-center uppercase tracking-widest mt-2">
              Select Matching Signature
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-2.5 flex-1 overflow-y-auto pb-2">
              {options.map((opt) => {
                const isSelected = opt.id === selectedOptionId;
                const isCorrect = opt.id === targetElement.id;
                
                let ringClass = 'border-white/10 hover:border-[#c4b5fd]/50 bg-black/40';
                if (feedback) {
                  if (isCorrect) {
                    ringClass = 'border-[#7de8c3] bg-[#7de8c3]/10 shadow-[0_0_15px_rgba(125,232,195,0.3)]';
                  } else if (isSelected) {
                    ringClass = 'border-red-500/50 bg-red-500/10';
                  } else {
                    ringClass = 'border-white/5 bg-black/20 opacity-40';
                  }
                }

                return (
                  <button 
                    key={opt.id}
                    onClick={() => handleChoice(opt)}
                    disabled={!!feedback}
                    className={`relative flex flex-col p-2.5 rounded-xl border backdrop-blur-sm transition-all duration-300 ${ringClass}`}
                  >
                    <div className="flex justify-between items-center mb-1.5 w-full">
                      <span className="text-xs font-bold text-white/90">{opt.name}</span>
                      
                      {feedback && isCorrect && (
                        <span className="text-[#7de8c3]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </span>
                      )}
                      {feedback && !isCorrect && isSelected && (
                        <span className="text-red-400">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </span>
                      )}
                    </div>
                    <Spectrum lines={opt.lines} height="h-8" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {gameState === 'end' && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#7de8c3]/10 border-2 border-[#7de8c3] flex items-center justify-center text-[#7de8c3] mb-2 shadow-[0_0_30px_rgba(125,232,195,0.2)]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white tracking-widest mb-1">ANALYSIS COMPLETE</h2>
              <p className="text-[#c4b5fd] text-xs uppercase tracking-widest">Final Report</p>
            </div>

            <div className="py-6 w-full bg-black/40 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="text-5xl font-black text-[#f9a8d4] drop-shadow-[0_0_15px_rgba(249,168,212,0.6)] mb-2">
                {score}
              </div>
              <div className="text-xs text-[#c4b5fd] tracking-widest">POINTS EARNED</div>
            </div>
            
            <button 
              onClick={startGame} 
              className="mt-4 px-8 py-3 bg-[#7de8c3] text-[#0b1026] font-bold rounded-full hover:scale-105 transition-transform flex items-center shadow-[0_0_20px_rgba(125,232,195,0.4)]"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
              NEW SCAN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
