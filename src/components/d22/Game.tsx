"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

const COLS = 10;
const ROWS = 20;
const TICK_RATE = 800;

// O, I, T, L, J, S, Z
const SHAPES = [
  [[1, 1], [1, 1]],
  [[1, 1, 1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]]
];

const COLORS = [
  '#7de8c3', '#f9a8d4', '#c4b5fd', '#38bdf8', '#fbbf24', '#a3e635', '#f87171'
];

interface Piece {
  shape: number[][];
  color: string;
  x: number;
  y: number;
}

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [grid, setGrid] = useState<string[][]>(Array(ROWS).fill(Array(COLS).fill('')));
  const [score, setScore] = useState(0);
  
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const spawnPiece = useCallback(() => {
    const typeId = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[typeId];
    const color = COLORS[typeId];
    return {
      shape,
      color,
      x: Math.floor((COLS - shape[0].length) / 2),
      y: 0
    };
  }, []);

  const resetGame = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill('')));
    setScore(0);
    setCurrentPiece(spawnPiece());
    setGameState('PLAYING');
  };

  const checkCollision = (piece: Piece, g: string[][]) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newY = piece.y + y;
          const newX = piece.x + x;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && g[newY][newX] !== '')) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const mergePiece = (piece: Piece, g: string[][]) => {
    const newGrid = g.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newY = piece.y + y;
          if (newY >= 0 && newY < ROWS) {
            newGrid[newY][piece.x + x] = piece.color;
          }
        }
      }
    }
    return newGrid;
  };

  const clearLines = (g: string[][]) => {
    let linesCleared = 0;
    const newGrid = g.filter(row => {
      if (row.every(cell => cell !== '')) {
        linesCleared++;
        return false;
      }
      return true;
    });
    
    while (newGrid.length < ROWS) {
      newGrid.unshift(Array(COLS).fill(''));
    }
    
    if (linesCleared > 0) {
      setScore(s => s + linesCleared * 100 * linesCleared);
    }
    return newGrid;
  };

  const gameLoop = useCallback((time: number) => {
    if (gameState !== 'PLAYING' || !currentPiece) return;

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;

    if (deltaTime > Math.max(100, TICK_RATE - score)) {
      lastTimeRef.current = time;
      
      const movedPiece = { ...currentPiece, y: currentPiece.y + 1 };
      
      if (checkCollision(movedPiece, grid)) {
        if (currentPiece.y <= 0) {
          setGameState('GAMEOVER');
        } else {
          const mergedGrid = mergePiece(currentPiece, grid);
          const clearedGrid = clearLines(mergedGrid);
          setGrid(clearedGrid);
          setCurrentPiece(spawnPiece());
        }
      } else {
        setCurrentPiece(movedPiece);
      }
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, currentPiece, grid, score, spawnPiece]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, gameLoop]);

  const moveLeft = () => {
    if (gameState !== 'PLAYING' || !currentPiece) return;
    const moved = { ...currentPiece, x: currentPiece.x - 1 };
    if (!checkCollision(moved, grid)) setCurrentPiece(moved);
  };

  const moveRight = () => {
    if (gameState !== 'PLAYING' || !currentPiece) return;
    const moved = { ...currentPiece, x: currentPiece.x + 1 };
    if (!checkCollision(moved, grid)) setCurrentPiece(moved);
  };

  const moveDown = () => {
    if (gameState !== 'PLAYING' || !currentPiece) return;
    const moved = { ...currentPiece, y: currentPiece.y + 1 };
    if (!checkCollision(moved, grid)) {
      setCurrentPiece(moved);
    } else {
      if (currentPiece.y <= 0) {
        setGameState('GAMEOVER');
      } else {
        const mergedGrid = mergePiece(currentPiece, grid);
        const clearedGrid = clearLines(mergedGrid);
        setGrid(clearedGrid);
        setCurrentPiece(spawnPiece());
      }
    }
  };

  const rotate = () => {
    if (gameState !== 'PLAYING' || !currentPiece) return;
    const rotatedShape = currentPiece.shape[0].map((_, index) =>
      currentPiece.shape.map(row => row[index]).reverse()
    );
    const moved = { ...currentPiece, shape: rotatedShape };
    if (!checkCollision(moved, grid)) setCurrentPiece(moved);
  };

  // Display grid merging current piece
  let displayGrid = grid.map(row => [...row]);
  if (currentPiece && gameState === 'PLAYING') {
    displayGrid = mergePiece(currentPiece, grid);
  }

  return (
    <div className="max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white select-none shadow-2xl rounded-xl ring-1 ring-white/10">
      {gameState === 'START' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center">
          <svg className="w-20 h-20 text-[#7de8c3] mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 11.25V7.5a2.25 2.25 0 10-4.5 0v3.75m0 0l-3.75-3.75m3.75 3.75l3.75-3.75m-3.75 8.25v-3.75m0 0l-3.75 3.75m3.75-3.75l3.75 3.75" />
          </svg>
          <h1 className="text-2xl font-bold mb-2">우주 기지 조립</h1>
          <p className="text-[#f9a8d4] text-sm mb-6">모듈을 맞물려 스테이션을 확장하세요.</p>
          <button 
            onClick={resetGame}
            className="px-8 py-3 bg-[#7de8c3] text-[#0b1026] font-bold rounded-full hover:bg-white transition-colors"
          >
            모듈 조립 시작
          </button>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-md">
          <div className="text-5xl mb-4">💥</div>
          <h2 className="text-3xl font-bold text-[#f87171] mb-2">조립 실패</h2>
          <p className="text-white/70 mb-2">스테이션이 한계에 도달했습니다!</p>
          <p className="text-2xl text-[#7de8c3] font-mono mb-8">SCORE: {score}</p>
          <button 
            onClick={resetGame}
            className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-[#c4b5fd] transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-0 inset-x-0 h-16 bg-white/5 border-b border-white/10 flex items-center justify-between px-6 z-10">
        <div>
          <div className="text-[10px] text-white/50 tracking-widest font-mono">ASSEMBLY SCORE</div>
          <div className="text-xl font-bold text-[#7de8c3] font-mono">{score}</div>
        </div>
      </div>

      {/* Grid */}
      <div className="absolute top-16 inset-x-0 bottom-24 flex items-center justify-center p-2">
        <div 
          className="bg-black/40 border border-white/10 rounded overflow-hidden grid"
          style={{ 
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            width: '100%',
            maxWidth: '260px',
            aspectRatio: `${COLS}/${ROWS}`
          }}
        >
          {displayGrid.map((row, y) => 
            row.map((cellColor, x) => (
              <div 
                key={`${y}-${x}`} 
                className="border-[0.5px] border-white/5"
                style={{
                  backgroundColor: cellColor || 'transparent',
                  boxShadow: cellColor ? `inset 0 0 10px rgba(0,0,0,0.5)` : 'none'
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-white/5 border-t border-white/10 flex items-center justify-between px-4 pb-2">
        <button onClick={moveLeft} className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20 active:scale-95 transition-all text-white">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={moveDown} className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20 active:scale-95 transition-all text-white">
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <button onClick={rotate} className="w-16 h-16 bg-[#7de8c3]/20 rounded-full flex items-center justify-center active:bg-[#7de8c3]/40 active:scale-95 transition-all text-[#7de8c3]">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
        <button onClick={moveRight} className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20 active:scale-95 transition-all text-white">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}
