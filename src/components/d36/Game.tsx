"use client";

import React, { useState, useEffect, useRef } from 'react';

type Point = { x: number; y: number };
type NodeData = { id: string; color: string; p1: Point; p2: Point };
type LevelData = { size: number; nodes: NodeData[] };

const LEVELS: LevelData[] = [
  {
    size: 4,
    nodes: [
      { id: 'mint', color: '#7de8c3', p1: {x:0,y:0}, p2: {x:3,y:3} },
      { id: 'pink', color: '#f9a8d4', p1: {x:0,y:1}, p2: {x:2,y:3} },
      { id: 'lavender', color: '#c4b5fd', p1: {x:0,y:2}, p2: {x:0,y:3} },
    ]
  },
  {
    size: 5,
    nodes: [
      { id: 'mint', color: '#7de8c3', p1: {x:0,y:0}, p2: {x:4,y:4} },
      { id: 'pink', color: '#f9a8d4', p1: {x:0,y:1}, p2: {x:3,y:4} },
      { id: 'lavender', color: '#c4b5fd', p1: {x:0,y:2}, p2: {x:2,y:4} },
      { id: 'gold', color: '#fbbf24', p1: {x:0,y:3}, p2: {x:1,y:4} },
    ]
  },
  {
    size: 5,
    nodes: [
      { id: 'mint', color: '#7de8c3', p1: {x:0,y:0}, p2: {x:1,y:0} },
      { id: 'pink', color: '#f9a8d4', p1: {x:1,y:1}, p2: {x:2,y:1} },
      { id: 'lavender', color: '#c4b5fd', p1: {x:2,y:2}, p2: {x:2,y:3} },
      { id: 'gold', color: '#fbbf24', p1: {x:3,y:3}, p2: {x:4,y:3} },
    ]
  }
];

const ptEq = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

export default function Game() {
  const [screen, setScreen] = useState<'start' | 'playing' | 'end'>('start');
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const levelData = LEVELS[currentLevelIdx];
  const [paths, setPaths] = useState<Record<string, Point[]>>({});
  const [drawingId, setDrawingId] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (screen === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (screen === 'playing' && timeLeft === 0) {
      setScreen('end');
    }
  }, [screen, timeLeft]);

  useEffect(() => {
    if (screen !== 'playing') return;
    
    let isWin = true;
    for (const node of levelData.nodes) {
      const path = paths[node.id];
      if (!path || path.length < 2) {
        isWin = false;
        break;
      }
      const start = path[0];
      const end = path[path.length - 1];
      const hasP1 = ptEq(start, node.p1) || ptEq(end, node.p1);
      const hasP2 = ptEq(start, node.p2) || ptEq(end, node.p2);
      if (!hasP1 || !hasP2) {
        isWin = false;
        break;
      }
    }
    
    if (isWin) {
      const levelScore = timeLeft * 10;
      setScore(s => s + levelScore);
      if (currentLevelIdx < LEVELS.length - 1) {
        setCurrentLevelIdx(idx => idx + 1);
        setPaths({});
        setTimeLeft(60);
      } else {
        setScreen('end');
      }
    }
  }, [paths, levelData, screen, currentLevelIdx, timeLeft]);

  const startGame = () => {
    setScreen('playing');
    setCurrentLevelIdx(0);
    setScore(0);
    setPaths({});
    setTimeLeft(60);
  };

  const getCellFromEvent = (e: React.PointerEvent | PointerEvent) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cellSize = rect.width / levelData.size;
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    if (cx >= 0 && cx < levelData.size && cy >= 0 && cy < levelData.size) {
      return { x: cx, y: cy };
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    const cell = getCellFromEvent(e);
    if (!cell) return;

    for (const node of levelData.nodes) {
      if (ptEq(node.p1, cell) || ptEq(node.p2, cell)) {
        setDrawingId(node.id);
        setPaths(prev => ({
          ...prev,
          [node.id]: [cell]
        }));
        return;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawingId) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;

    setPaths(prev => {
      const currentPath = prev[drawingId] || [];
      const lastCell = currentPath[currentPath.length - 1];
      if (!lastCell) return prev;
      if (ptEq(lastCell, cell)) return prev;

      const dx = Math.abs(lastCell.x - cell.x);
      const dy = Math.abs(lastCell.y - cell.y);
      if (dx + dy !== 1) return prev;

      const otherEndpoint = levelData.nodes.find(n => 
        n.id !== drawingId && (ptEq(n.p1, cell) || ptEq(n.p2, cell))
      );
      if (otherEndpoint) return prev;

      const thisNode = levelData.nodes.find(n => n.id === drawingId)!;
      const isTarget = ptEq(thisNode.p1, cell) || ptEq(thisNode.p2, cell);

      if (currentPath.length === 1 && isTarget) {
        return prev;
      }

      const isLastTarget = currentPath.length > 1 && (ptEq(thisNode.p1, lastCell) || ptEq(thisNode.p2, lastCell));
      const idx = currentPath.findIndex(p => ptEq(p, cell));

      if (isLastTarget && idx === -1) return prev;

      if (idx !== -1) {
        return { ...prev, [drawingId]: currentPath.slice(0, idx + 1) };
      }

      const newPaths = { ...prev };
      for (const key in newPaths) {
        if (key !== drawingId) {
          const otherPath = newPaths[key];
          const breakIdx = otherPath.findIndex(p => ptEq(p, cell));
          if (breakIdx !== -1) {
            newPaths[key] = otherPath.slice(0, breakIdx);
          }
        }
      }

      newPaths[drawingId] = [...currentPath, cell];
      return newPaths;
    });
  };

  const handlePointerUp = () => {
    setDrawingId(null);
  };

  const cellSize = 100; 

  return (
    <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans flex flex-col items-center select-none shadow-2xl shadow-[#c4b5fd]/20 rounded-xl border border-[#7de8c3]/20">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg width="100%" height="100%">
          <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#7de8c3" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#gridPattern)" />
        </svg>
      </div>

      {screen === 'start' && (
        <div className="z-10 flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="w-20 h-20 mb-6 relative animate-bounce">
             <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="40" width="60" height="20" rx="4" fill="#fbbf24"/>
                <rect x="35" y="20" width="30" height="60" rx="4" fill="#7de8c3"/>
                <circle cx="50" cy="50" r="8" fill="#f9a8d4"/>
             </svg>
          </div>
          <h1 className={"text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#7de8c3] to-[#c4b5fd] mb-4 drop-shadow-lg tracking-tight"}>
            Orbital Repair
          </h1>
          <p className="text-gray-300 mb-8 text-sm leading-relaxed max-w-[250px]">
            The comms satellite is malfunctioning. Reroute the circuitry by connecting matching nodes without crossing wires.
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-[#f9a8d4] text-[#0b1026] font-bold rounded-full hover:bg-[#c4b5fd] transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(249,168,212,0.6)]"
          >
            INITIATE REPAIR
          </button>
        </div>
      )}

      {screen === 'playing' && (
        <div className="z-10 flex flex-col items-center w-full h-full p-4">
          <div className="flex justify-between w-full px-4 mb-6 pt-4">
            <div className="flex flex-col">
              <span className="text-xs text-[#c4b5fd] font-bold tracking-widest">SYSTEM</span>
              <span className="text-lg font-mono">D-36 // L{currentLevelIdx + 1}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs text-[#7de8c3] font-bold tracking-widest">TIME</span>
              <span className={"text-lg font-mono " + (timeLeft < 10 ? 'text-[#f9a8d4] animate-pulse' : 'text-white')}>
                {"00:" + timeLeft.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div 
            className="relative w-[340px] h-[340px] bg-[#0b1026]/80 rounded-lg border-2 border-[#c4b5fd]/30 shadow-[0_0_30px_rgba(125,232,195,0.1)] touch-none backdrop-blur-md"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onContextMenu={e => e.preventDefault()}
          >
            <svg 
              ref={svgRef}
              className="w-full h-full" 
              viewBox={"0 0 " + (levelData.size * cellSize) + " " + (levelData.size * cellSize)}
            >
              {Array.from({length: levelData.size}).map((_, i) => (
                <React.Fragment key={"grid-" + i}>
                  <line x1={0} y1={i * cellSize} x2={levelData.size * cellSize} y2={i * cellSize} stroke="#c4b5fd" strokeOpacity="0.1" strokeWidth="2" />
                  <line x1={i * cellSize} y1={0} x2={i * cellSize} y2={levelData.size * cellSize} stroke="#c4b5fd" strokeOpacity="0.1" strokeWidth="2" />
                </React.Fragment>
              ))}

              {Object.entries(paths).map(([id, path]) => {
                const node = levelData.nodes.find(n => n.id === id)!;
                if (path.length < 2) return null;
                const pathData = path.map((p, i) => 
                  (i === 0 ? 'M' : 'L') + " " + (p.x * cellSize + cellSize/2) + " " + (p.y * cellSize + cellSize/2)
                ).join(' ');
                
                return (
                  <path 
                    key={"path-" + id}
                    d={pathData}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_8px_currentColor]"
                    style={{ color: node.color }}
                  />
                );
              })}

              {levelData.nodes.map(node => (
                <React.Fragment key={"node-" + node.id}>
                  <circle 
                    cx={node.p1.x * cellSize + cellSize/2} 
                    cy={node.p1.y * cellSize + cellSize/2} 
                    r="18" 
                    fill="#0b1026"
                    stroke={node.color}
                    strokeWidth="6"
                    className="drop-shadow-[0_0_10px_currentColor]"
                    style={{ color: node.color }}
                  />
                  <circle 
                    cx={node.p1.x * cellSize + cellSize/2} 
                    cy={node.p1.y * cellSize + cellSize/2} 
                    r="8" 
                    fill={node.color}
                  />
                  <circle 
                    cx={node.p2.x * cellSize + cellSize/2} 
                    cy={node.p2.y * cellSize + cellSize/2} 
                    r="18" 
                    fill="#0b1026"
                    stroke={node.color}
                    strokeWidth="6"
                    className="drop-shadow-[0_0_10px_currentColor]"
                    style={{ color: node.color }}
                  />
                  <circle 
                    cx={node.p2.x * cellSize + cellSize/2} 
                    cy={node.p2.y * cellSize + cellSize/2} 
                    r="8" 
                    fill={node.color}
                  />
                </React.Fragment>
              ))}

              {drawingId && paths[drawingId] && paths[drawingId].length > 0 && (
                <rect 
                  x={paths[drawingId][paths[drawingId].length - 1].x * cellSize}
                  y={paths[drawingId][paths[drawingId].length - 1].y * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={levelData.nodes.find(n => n.id === drawingId)?.color}
                  fillOpacity="0.2"
                  className="animate-pulse pointer-events-none"
                />
              )}
            </svg>
          </div>
          
          <div className="mt-8 text-[#7de8c3]/60 text-xs text-center max-w-[250px]">
            Drag from one node to its matching color. Wires cannot cross.
          </div>
        </div>
      )}

      {screen === 'end' && (
        <div className="z-10 flex flex-col items-center justify-center h-full p-6 text-center">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#7de8c3] to-[#f9a8d4] mb-2">
            REPAIR COMPLETE
          </h2>
          <div className="text-6xl font-mono text-white my-6 drop-shadow-[0_0_15px_rgba(249,168,212,0.5)]">
            {score}
          </div>
          <p className="text-[#c4b5fd] mb-8 text-sm">
            Total Efficiency Score
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-[#7de8c3] text-[#0b1026] font-bold rounded-full hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(125,232,195,0.6)]"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
