"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

type GameState = 'START' | 'PLAYING' | 'GAMEOVER' | 'SUCCESS';

interface Command {
  time: number;
  dir: number; // -1 for left, 1 for right
}

interface Obstacle {
  id: number;
  y: number;
  x: number;
  width: number;
}

const DELAY_MS = 1500; // 1.5 seconds delay

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(50);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [progress, setProgress] = useState(0);
  const [pendingCommands, setPendingCommands] = useState<Command[]>([]);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const stateRef = useRef({
    playerX: 50,
    obstacles: [] as Obstacle[],
    progress: 0,
    commands: [] as Command[],
    score: 0,
    lastObsTime: 0,
    speedY: 30, // units per second
  });

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setPlayerX(50);
    setObstacles([]);
    setProgress(0);
    setPendingCommands([]);
    stateRef.current = {
      playerX: 50,
      obstacles: [],
      progress: 0,
      commands: [],
      score: 0,
      lastObsTime: performance.now(),
      speedY: 30
    };
  };

  const gameLoop = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    const s = stateRef.current;

    // Process commands
    const now = time;
    while (s.commands.length > 0 && now >= s.commands[0].time + DELAY_MS) {
      const cmd = s.commands.shift()!;
      s.playerX = Math.max(10, Math.min(90, s.playerX + cmd.dir * 15));
    }
    
    // Spawn obstacles
    if (now - s.lastObsTime > 1200) {
      s.lastObsTime = now;
      const width = 30 + Math.random() * 20;
      const x = Math.random() * (100 - width);
      s.obstacles.push({
        id: now,
        y: -10,
        x,
        width
      });
    }

    // Move obstacles
    s.progress += dt * 5;
    s.score += dt * 10;
    
    let collision = false;
    s.obstacles = s.obstacles.filter(obs => {
      obs.y += s.speedY * dt;
      // Check collision
      if (obs.y > 80 && obs.y < 95) { // player is around y=90
        if (s.playerX > obs.x && s.playerX < obs.x + obs.width) {
          collision = true;
        }
      }
      return obs.y < 120;
    });

    setPlayerX(s.playerX);
    setObstacles([...s.obstacles]);
    setProgress(s.progress);
    setScore(Math.floor(s.score));
    setPendingCommands([...s.commands]);

    if (collision) {
      setGameState('GAMEOVER');
      return;
    }

    if (s.progress > 300) {
      setGameState('SUCCESS');
      return;
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, gameLoop]);

  const sendCommand = (dir: number) => {
    if (gameState !== 'PLAYING') return;
    const cmd: Command = { time: performance.now(), dir };
    stateRef.current.commands.push(cmd);
    setPendingCommands([...stateRef.current.commands]);
  };

  return (
    <div className="max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white select-none shadow-2xl rounded-xl ring-1 ring-white/10">
      {/* Background Starfield */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, #0b1026 100%), url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'1\' fill=\'%23fff\'/%3E%3C/svg%3E") repeat',
          backgroundSize: '20px 20px',
          transform: `translateY(${progress % 20}px)`
        }}
      />

      {gameState === 'START' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center">
          <h1 className="text-3xl font-bold mb-2 text-[#7de8c3]">빛의 속도 딜레이</h1>
          <p className="text-[#f9a8d4] text-sm mb-6 leading-relaxed">
            지구에서 우주선까지 통신에 1.5초가 걸립니다.<br/>미리 예측하여 회피 기동을 지시하세요!
          </p>
          <button onClick={startGame} className="px-8 py-3 bg-[#7de8c3] text-[#0b1026] font-bold rounded-full hover:bg-white transition-colors">
            통신 연결
          </button>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center backdrop-blur-md">
          <div className="text-5xl mb-4">💥</div>
          <h2 className="text-3xl font-bold text-[#f87171] mb-2">우주선 파괴됨</h2>
          <p className="text-2xl text-[#7de8c3] font-mono mb-8">SCORE: {score}</p>
          <button onClick={startGame} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-[#c4b5fd] transition-colors">
            재시도
          </button>
        </div>
      )}

      {gameState === 'SUCCESS' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0b1026]/90 p-6 text-center backdrop-blur-md border border-[#7de8c3]">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-3xl font-bold text-[#7de8c3] mb-2">목적지 도달!</h2>
          <p className="text-2xl text-white font-mono mb-8">SCORE: {score}</p>
          <button onClick={startGame} className="px-8 py-3 bg-[#7de8c3] text-black font-bold rounded-full hover:bg-white transition-colors">
            다음 항해
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="absolute top-4 inset-x-4 flex justify-between z-10 font-mono text-sm border-b border-white/20 pb-2">
        <div className="flex flex-col">
          <span className="text-white/50 text-[10px]">PING DELAY</span>
          <span className="text-[#f9a8d4] font-bold">1500 ms</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-white/50 text-[10px]">PROGRESS</span>
          <span className="text-[#7de8c3] font-bold">{Math.min(100, Math.floor((progress / 300) * 100))}%</span>
        </div>
      </div>

      {/* Obstacles */}
      {obstacles.map(obs => (
        <div 
          key={obs.id}
          className="absolute bg-[#f9a8d4] shadow-[0_0_15px_rgba(249,168,212,0.6)] rounded-sm"
          style={{
            left: `${obs.x}%`,
            top: `${obs.y}%`,
            width: `${obs.width}%`,
            height: '20px'
          }}
        />
      ))}

      {/* Player Ship */}
      <div 
        className="absolute transition-all duration-300 ease-out flex flex-col items-center justify-center"
        style={{
          left: `${playerX}%`,
          bottom: '5%',
          transform: 'translateX(-50%)',
          width: '30px',
          height: '40px'
        }}
      >
        <svg viewBox="0 0 24 24" fill="#7de8c3" className="w-full h-full drop-shadow-[0_0_10px_rgba(125,232,195,0.8)]">
          <path d="M12 2L2 22l10-4 10 4L12 2z" />
        </svg>
      </div>

      {/* Pending Commands UI */}
      <div className="absolute left-2 bottom-24 flex flex-col gap-1 z-10 pointer-events-none">
        {pendingCommands.map((cmd, i) => (
          <div key={i} className="bg-white/10 text-xs px-2 py-1 rounded text-white/70 font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#f9a8d4] animate-ping" />
            CMD: {cmd.dir === -1 ? 'LEFT' : 'RIGHT'}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 inset-x-0 h-20 bg-white/5 border-t border-white/10 flex">
        <button 
          className="flex-1 border-r border-white/10 flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors group"
          onClick={() => sendCommand(-1)}
        >
          <svg className="w-8 h-8 text-white/50 group-active:text-[#7de8c3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          className="flex-1 flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors group"
          onClick={() => sendCommand(1)}
        >
          <svg className="w-8 h-8 text-white/50 group-active:text-[#7de8c3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
