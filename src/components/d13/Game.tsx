'use client';

import React, { useState, useEffect, useRef } from 'react';

const CONSTELLATIONS = [
  {
    name: "Aries",
    points: [
      { id: 1, x: 30, y: 55 },
      { id: 2, x: 50, y: 40 },
      { id: 3, x: 65, y: 45 },
      { id: 4, x: 75, y: 65 },
    ],
    edges: [
      [1, 2], [2, 3], [3, 4]
    ]
  },
  {
    name: "Cassiopeia",
    points: [
      { id: 1, x: 20, y: 45 },
      { id: 2, x: 40, y: 70 },
      { id: 3, x: 55, y: 50 },
      { id: 4, x: 70, y: 65 },
      { id: 5, x: 85, y: 35 },
    ],
    edges: [
      [1, 2], [2, 3], [3, 4], [4, 5]
    ]
  },
  {
    name: "Cygnus",
    points: [
      { id: 1, x: 50, y: 25 },
      { id: 2, x: 50, y: 45 },
      { id: 3, x: 50, y: 65 },
      { id: 4, x: 50, y: 85 },
      { id: 5, x: 20, y: 55 },
      { id: 6, x: 35, y: 50 },
      { id: 7, x: 65, y: 50 },
      { id: 8, x: 80, y: 55 },
    ],
    edges: [
      [1, 2], [2, 3], [3, 4], // Body
      [5, 6], [6, 2],         // Left wing
      [2, 7], [7, 8]          // Right wing
    ]
  }
];

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [drawnEdges, setDrawnEdges] = useState<string[]>([]);
  const [dragStartNode, setDragStartNode] = useState<number | null>(null);
  const [pointerPos, setPointerPos] = useState<{x: number, y: number} | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bgStars, setBgStars] = useState<{x: number, y: number, r: number, delay: number}[]>([]);

  // Generate random background stars on mount
  useEffect(() => {
    const stars = Array.from({length: 60}).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: Math.random() * 2 + 1,
      delay: Math.random() * 3
    }));
    setBgStars(stars);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && !showSuccess) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState('end');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, showSuccess]);

  // Win condition check
  useEffect(() => {
    if (gameState !== 'playing' || showSuccess) return;
    const level = CONSTELLATIONS[currentLevelIdx];
    if (level && drawnEdges.length === level.edges.length) {
      setShowSuccess(true);
      setScore(s => s + 500);
      setTimeout(() => {
        if (currentLevelIdx < CONSTELLATIONS.length - 1) {
          setCurrentLevelIdx(i => i + 1);
          setDrawnEdges([]);
          setShowSuccess(false);
        } else {
          setScore(s => s + timeLeft * 10);
          setGameState('end');
          setCurrentLevelIdx(CONSTELLATIONS.length);
          setShowSuccess(false);
        }
      }, 2500);
    }
  }, [drawnEdges, currentLevelIdx, gameState, showSuccess, timeLeft]);

  const handlePointerDown = (id: number) => {
    setDragStartNode(id);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartNode !== null && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPointerPos({ x, y });

      const level = CONSTELLATIONS[currentLevelIdx];
      if (!level) return;

      const threshold = 8; // 8% threshold for snapping
      for (const point of level.points) {
        if (point.id !== dragStartNode) {
          const dx = point.x - x;
          const dy = point.y - y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < threshold) {
            const edgeId = [dragStartNode, point.id].sort((a,b) => a-b).join('-');
            const isValidEdge = level.edges.some(e => {
              const sorted = [...e].sort((a,b) => a-b).join('-');
              return sorted === edgeId;
            });
            
            if (isValidEdge && !drawnEdges.includes(edgeId)) {
              setDrawnEdges(prev => [...prev, edgeId]);
              setScore(s => s + 100);
              setDragStartNode(point.id);
              break;
            }
          }
        }
      }
    }
  };

  const handlePointerUp = () => {
    setDragStartNode(null);
    setPointerPos(null);
  };

  const currentLevel = currentLevelIdx < CONSTELLATIONS.length ? CONSTELLATIONS[currentLevelIdx] : null;

  return (
    <div 
      ref={containerRef}
      className="max-w-[430px] w-full mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans select-none touch-none rounded-2xl shadow-[0_0_40px_rgba(11,16,38,0.8)] border border-[#c4b5fd]/20"
      onPointerMove={gameState === 'playing' ? handlePointerMove : undefined}
      onPointerUp={gameState === 'playing' ? handlePointerUp : undefined}
      onPointerLeave={gameState === 'playing' ? handlePointerUp : undefined}
    >
      {/* Nebula background layer */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at 20% 30%, #c4b5fd 0%, transparent 40%), radial-gradient(circle at 80% 70%, #f9a8d4 0%, transparent 40%)'
        }}
      />

      {/* Background Stars */}
      {bgStars.map((star, i) => (
        <div key={`bg-${i}`} className="absolute rounded-full bg-white pointer-events-none"
             style={{
               left: `${star.x}%`, top: `${star.y}%`, 
               width: star.r, height: star.r,
               animation: `pulse 3s infinite ${star.delay}s`
             }} />
      ))}

      {gameState === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30 bg-gradient-to-b from-[#0b1026]/40 to-[#0b1026]">
          <div className="w-24 h-24 mb-6 relative animate-bounce">
             <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(125,232,195,0.8)]">
               <path d="M50 0 C50 40, 60 50, 100 50 C60 50, 50 60, 50 100 C50 60, 40 50, 0 50 C40 50, 50 40, 50 0 Z" fill="#7de8c3" />
             </svg>
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#7de8c3] via-[#c4b5fd] to-[#f9a8d4] mb-4 drop-shadow-lg">
            Stellar Map
          </h1>
          <p className="text-[#c4b5fd] mb-10 text-lg max-w-[280px]">Connect the scattered stars to restore the ancient constellations.</p>
          <button 
            onClick={() => {
              setGameState('playing');
              setCurrentLevelIdx(0);
              setScore(0);
              setTimeLeft(60);
              setDrawnEdges([]);
            }}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-[#f9a8d4] to-[#c4b5fd] text-[#0b1026] font-bold text-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(249,168,212,0.6)]"
          >
            Start Mission
          </button>
        </div>
      )}

      {gameState === 'playing' && currentLevel && (
        <>
          {/* Header */}
          <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 pointer-events-none">
            <div className={`font-mono text-xl font-bold bg-[#0b1026]/50 px-3 py-1 rounded-lg backdrop-blur-sm border border-[#c4b5fd]/20 shadow-lg ${timeLeft <= 10 ? 'text-[#f9a8d4] animate-pulse' : 'text-[#7de8c3]'}`}>
              ⏳ {timeLeft}s
            </div>
            <div className="text-center bg-[#0b1026]/50 px-4 py-1 rounded-lg backdrop-blur-sm border border-[#c4b5fd]/20 shadow-lg">
              <div className="text-xs text-[#c4b5fd] uppercase tracking-wider font-bold mb-0.5">{currentLevel.name}</div>
              <div className="text-[#f9a8d4] text-sm font-bold flex justify-center items-center gap-1">
                {drawnEdges.length} <span className="text-[#c4b5fd] text-xs">/</span> {currentLevel.edges.length}
              </div>
            </div>
            <div className="text-[#7de8c3] font-mono text-xl font-bold bg-[#0b1026]/50 px-3 py-1 rounded-lg backdrop-blur-sm border border-[#c4b5fd]/20 shadow-lg">
              {score}
            </div>
          </div>

          {/* SVG Lines Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Target Edges (Faint) */}
            {currentLevel.edges.map(edge => {
               const p1 = currentLevel.points.find(p => p.id === edge[0])!;
               const p2 = currentLevel.points.find(p => p.id === edge[1])!;
               return (
                 <line 
                   key={`target-${edge[0]}-${edge[1]}`}
                   x1={`${p1.x}%`} y1={`${p1.y}%`} x2={`${p2.x}%`} y2={`${p2.y}%`}
                   stroke="#c4b5fd" strokeWidth="2" strokeDasharray="6 6" opacity="0.25"
                 />
               );
            })}

            {/* Drawn Edges */}
            {drawnEdges.map(edgeId => {
               const [id1, id2] = edgeId.split('-').map(Number);
               const p1 = currentLevel.points.find(p => p.id === id1)!;
               const p2 = currentLevel.points.find(p => p.id === id2)!;
               return (
                 <line 
                   key={`drawn-${edgeId}`}
                   x1={`${p1.x}%`} y1={`${p1.y}%`} x2={`${p2.x}%`} y2={`${p2.y}%`}
                   stroke="#7de8c3" strokeWidth="4" strokeLinecap="round"
                   style={{ filter: 'drop-shadow(0 0 6px rgba(125,232,195,0.8))' }}
                 />
               );
            })}

            {/* Drag Line */}
            {dragStartNode !== null && pointerPos !== null && !showSuccess && (
              <line
                x1={`${currentLevel.points.find(p => p.id === dragStartNode)!.x}%`}
                y1={`${currentLevel.points.find(p => p.id === dragStartNode)!.y}%`}
                x2={`${pointerPos.x}%`}
                y2={`${pointerPos.y}%`}
                stroke="#f9a8d4" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 4"
                opacity="0.8"
                style={{ filter: 'drop-shadow(0 0 6px rgba(249,168,212,0.8))' }}
              />
            )}
          </svg>

          {/* Interactive Stars */}
          {currentLevel.points.map(point => {
             const isConnected = drawnEdges.some(e => e.split('-').includes(point.id.toString()));
             const isActive = dragStartNode === point.id;
             
             return (
               <div
                 key={`star-${point.id}`}
                 className="absolute transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center cursor-pointer touch-none group"
                 style={{ left: `${point.x}%`, top: `${point.y}%` }}
                 onPointerDown={(e) => {
                   if (showSuccess) return;
                   e.stopPropagation();
                   handlePointerDown(point.id);
                 }}
               >
                 <div className={`w-4 h-4 rounded-full transition-all duration-300
                   ${isActive ? 'bg-[#f9a8d4] shadow-[0_0_15px_#f9a8d4] scale-150' : 
                     isConnected ? 'bg-[#7de8c3] shadow-[0_0_10px_#7de8c3] scale-110' : 
                     'bg-[#c4b5fd] shadow-[0_0_8px_#c4b5fd] group-hover:scale-125'}
                 `} />
               </div>
             )
          })}

          {/* Success Overlay */}
          <div className={`absolute inset-0 bg-[#0b1026]/80 flex flex-col items-center justify-center z-20 transition-all duration-500 backdrop-blur-sm
            ${showSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="w-16 h-16 mb-4 relative">
               <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(125,232,195,0.8)]">
                 <path d="M50 0 C50 40, 60 50, 100 50 C60 50, 50 60, 50 100 C50 60, 40 50, 0 50 C40 50, 50 40, 50 0 Z" fill="#7de8c3" />
               </svg>
            </div>
            <h2 className="text-4xl font-bold text-[#7de8c3] mb-2 drop-shadow-[0_0_10px_rgba(125,232,195,0.8)]">
              {currentLevel.name}
            </h2>
            <p className="text-[#f9a8d4] text-xl font-medium tracking-widest uppercase mb-8">Constellation Restored</p>
            <div className="text-white text-2xl font-mono bg-[#0b1026] px-8 py-3 rounded-full border border-[#c4b5fd]/40 shadow-[0_0_20px_rgba(196,181,253,0.5)]">
              Score +500
            </div>
          </div>
        </>
      )}

      {gameState === 'end' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30 bg-[#0b1026]/90 backdrop-blur-md">
          <div className="w-20 h-20 mb-6 relative">
             <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(249,168,212,0.8)]">
               <path d="M50 0 C50 40, 60 50, 100 50 C60 50, 50 60, 50 100 C50 60, 40 50, 0 50 C40 50, 50 40, 50 0 Z" fill="#f9a8d4" />
             </svg>
          </div>
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f9a8d4] to-[#c4b5fd] mb-2 drop-shadow-lg">
            {currentLevelIdx >= CONSTELLATIONS.length ? 'Mission Accomplished' : 'Time Over'}
          </h2>
          <div className="flex flex-col items-center gap-3 mb-10 mt-6 bg-[#0b1026]/50 p-6 rounded-2xl border border-[#c4b5fd]/20">
            <p className="text-4xl text-[#7de8c3] font-mono font-bold drop-shadow-[0_0_10px_rgba(125,232,195,0.5)]">Score: {score}</p>
            {currentLevelIdx >= CONSTELLATIONS.length && (
              <p className="text-[#f9a8d4] bg-[#f9a8d4]/10 px-3 py-1 rounded-full text-sm mt-1">Includes Time Bonus: +{timeLeft * 10}</p>
            )}
            <p className="text-[#c4b5fd] mt-2 text-lg">Constellations Mapped: <span className="text-white font-bold">{Math.min(currentLevelIdx, CONSTELLATIONS.length)} / {CONSTELLATIONS.length}</span></p>
          </div>
          <button 
            onClick={() => setGameState('start')}
            className="px-10 py-4 rounded-full bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] text-[#0b1026] font-bold text-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(125,232,195,0.6)]"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
