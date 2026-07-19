'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

type GameState = {
  status: 'start' | 'playing' | 'gameover';
  score: number;
  cameraY: number;
  nextCometId: number;
  player: {
    x: number;
    y: number;
    state: 'orbiting' | 'flying';
    orbitAngle: number;
    orbitSpeed: number;
    orbitRadius: number;
    currentCometId: number | null;
    lastCometId: number | null;
    vx: number;
    vy: number;
  };
  comets: {
    id: number;
    x: number;
    y: number;
    radius: number;
    gravityRadius: number;
    color: string;
  }[];
  particles: {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
  }[];
};

export default function Game() {
  const [, setFrameCount] = useState(0);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const stars = useRef(Array.from({ length: 70 }).map(() => ({
    id: Math.random(),
    x: Math.random() * 430,
    y: Math.random() * 500,
    size: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.6 + 0.2
  })));

  const gameState = useRef<GameState>({
    status: 'start',
    score: 0,
    cameraY: 0,
    nextCometId: 5,
    player: {
      x: 215,
      y: 290,
      state: 'orbiting',
      orbitAngle: -Math.PI / 2,
      orbitSpeed: 300 / 60,
      orbitRadius: 60,
      currentCometId: 1,
      lastCometId: null,
      vx: 0,
      vy: 0,
    },
    comets: [
      { id: 1, x: 215, y: 350, radius: 15, gravityRadius: 60, color: '#c4b5fd' },
      { id: 2, x: 130, y: 150, radius: 18, gravityRadius: 70, color: '#7de8c3' },
      { id: 3, x: 300, y: -50, radius: 14, gravityRadius: 55, color: '#f9a8d4' },
      { id: 4, x: 200, y: -250, radius: 16, gravityRadius: 65, color: '#c4b5fd' },
    ],
    particles: [],
  });

  const resetGame = useCallback(() => {
    gameState.current = {
      status: 'start',
      score: 0,
      cameraY: 0,
      nextCometId: 5,
      player: {
        x: 215,
        y: 290,
        state: 'orbiting',
        orbitAngle: -Math.PI / 2,
        orbitSpeed: 300 / 60,
        orbitRadius: 60,
        currentCometId: 1,
        lastCometId: null,
        vx: 0,
        vy: 0,
      },
      comets: [
        { id: 1, x: 215, y: 350, radius: 15, gravityRadius: 60, color: '#c4b5fd' },
        { id: 2, x: 130, y: 150, radius: 18, gravityRadius: 70, color: '#7de8c3' },
        { id: 3, x: 300, y: -50, radius: 14, gravityRadius: 55, color: '#f9a8d4' },
        { id: 4, x: 200, y: -250, radius: 16, gravityRadius: 65, color: '#c4b5fd' },
      ],
      particles: [],
    };
  }, []);

  const spawnParticles = (x: number, y: number, vx: number, vy: number, count: number, color: string) => {
    const state = gameState.current;
    for (let i = 0; i < count; i++) {
      state.particles.push({
        id: Math.random(),
        x,
        y,
        vx: vx + (Math.random() - 0.5) * 150,
        vy: vy + (Math.random() - 0.5) * 150,
        life: 1.0 + Math.random() * 0.5,
        color
      });
    }
  };

  const updatePhysics = (dt: number) => {
    const state = gameState.current;
    if (state.status !== 'playing') {
      if (state.status === 'start' && state.player.state === 'orbiting') {
        state.player.orbitAngle += state.player.orbitSpeed * dt;
        const comet = state.comets[0];
        if (comet) {
          state.player.x = comet.x + state.player.orbitRadius * Math.cos(state.player.orbitAngle);
          state.player.y = comet.y + state.player.orbitRadius * Math.sin(state.player.orbitAngle);
        }
      }
      return;
    }

    const p = state.player;

    if (p.state === 'orbiting' && p.currentCometId !== null) {
      const comet = state.comets.find(c => c.id === p.currentCometId);
      if (comet) {
        p.orbitAngle += p.orbitSpeed * dt;
        p.x = comet.x + p.orbitRadius * Math.cos(p.orbitAngle);
        p.y = comet.y + p.orbitRadius * Math.sin(p.orbitAngle);

        if (Math.random() < 0.2) {
          const trailVx = -Math.sin(p.orbitAngle) * Math.sign(p.orbitSpeed) * 50;
          const trailVy = Math.cos(p.orbitAngle) * Math.sign(p.orbitSpeed) * 50;
          spawnParticles(p.x, p.y, trailVx, trailVy, 1, '#ffffff');
        }
      }
    } else if (p.state === 'flying') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (Math.random() < 0.4) {
        spawnParticles(p.x, p.y, -p.vx * 0.2, -p.vy * 0.2, 1, '#7de8c3');
      }

      for (const comet of state.comets) {
        if (comet.id === p.lastCometId) continue;
        
        const dist = Math.hypot(p.x - comet.x, p.y - comet.y);
        
        if (dist <= comet.radius + 5) {
          state.status = 'gameover';
          spawnParticles(p.x, p.y, p.vx * 0.5, p.vy * 0.5, 30, '#ff4444');
          break;
        }

        if (dist <= comet.gravityRadius) {
          p.state = 'orbiting';
          p.currentCometId = comet.id;
          p.orbitRadius = dist;
          p.orbitAngle = Math.atan2(p.y - comet.y, p.x - comet.x);
          
          const cross = (p.x - comet.x) * p.vy - (p.y - comet.y) * p.vx;
          p.orbitSpeed = (cross > 0 ? 1 : -1) * (300 / dist);
          
          spawnParticles(p.x, p.y, p.vx * 0.1, p.vy * 0.1, 15, comet.color);
          break;
        }
      }
    }

    if (p.y < state.cameraY + 250) {
      state.cameraY = p.y - 250;
    }

    const currentHeightScore = Math.max(0, Math.floor((350 - p.y) / 10));
    if (currentHeightScore > state.score) {
      state.score = currentHeightScore;
    }

    const minCometY = Math.min(...state.comets.map(c => c.y));
    if (minCometY > state.cameraY - 600) {
      for (let i = 0; i < 3; i++) {
        let valid = false;
        let attempts = 0;
        while (!valid && attempts < 10) {
          const x = 50 + Math.random() * 330;
          const y = minCometY - 100 - Math.random() * 300;
          valid = state.comets.every(c => Math.hypot(c.x - x, c.y - y) > 100);
          if (valid) {
            const colors = ['#7de8c3', '#f9a8d4', '#c4b5fd'];
            state.comets.push({
              id: state.nextCometId++,
              x,
              y,
              radius: 12 + Math.random() * 8,
              gravityRadius: 50 + Math.random() * 30,
              color: colors[Math.floor(Math.random() * colors.length)],
            });
          }
          attempts++;
        }
      }
    }

    state.comets = state.comets.filter(c => c.y < state.cameraY + 800);

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const pt = state.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt * 2.0;
      if (pt.life <= 0) {
        state.particles.splice(i, 1);
      }
    }
    
    if (p.x < -50 || p.x > 480 || p.y > state.cameraY + 600) {
      state.status = 'gameover';
    }
  };

  useEffect(() => {
    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      updatePhysics(dt);
      setFrameCount(f => f + 1);

      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handleInteraction = () => {
    const state = gameState.current;
    if (state.status === 'start') {
      state.status = 'playing';
    } else if (state.status === 'playing') {
      const p = state.player;
      if (p.state === 'orbiting' && p.currentCometId !== null) {
        p.state = 'flying';
        const flyV = 500;
        p.vx = -Math.sin(p.orbitAngle) * Math.sign(p.orbitSpeed) * flyV;
        p.vy = Math.cos(p.orbitAngle) * Math.sign(p.orbitSpeed) * flyV;
        p.lastCometId = p.currentCometId;
        p.currentCometId = null;
        
        spawnParticles(p.x, p.y, -p.vx * 0.2, -p.vy * 0.2, 10, '#f9a8d4');
      }
    } else if (state.status === 'gameover') {
      resetGame();
    }
  };

  const state = gameState.current;
  const p = state.player;

  let playerRotation = 0;
  if (p.state === 'orbiting') {
    playerRotation = p.orbitAngle + (p.orbitSpeed > 0 ? Math.PI / 2 : -Math.PI / 2);
  } else {
    playerRotation = Math.atan2(p.vy, p.vx);
  }
  const rotDeg = playerRotation * 180 / Math.PI;

  return (
    <div 
      className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] select-none touch-none cursor-pointer shadow-2xl rounded-xl ring-4 ring-[#c4b5fd]/20"
      onPointerDown={handleInteraction}
    >
      <svg width="100%" height="100%" viewBox="0 0 430 500" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {stars.current.map(star => {
          const renderY = (star.y - state.cameraY * 0.2) % 500;
          const finalY = renderY < 0 ? renderY + 500 : renderY;
          return (
            <circle key={star.id} cx={star.x} cy={finalY} r={star.size} fill="#ffffff" opacity={star.opacity} />
          );
        })}

        {state.comets.map(comet => (
          <g key={comet.id}>
            <circle 
              cx={comet.x} 
              cy={comet.y - state.cameraY} 
              r={comet.gravityRadius} 
              fill="none" 
              stroke={comet.color} 
              strokeWidth="1.5" 
              strokeDasharray="4 6" 
              opacity="0.4" 
            />
            <circle 
              cx={comet.x} 
              cy={comet.y - state.cameraY} 
              r={comet.radius} 
              fill={comet.color} 
              filter="url(#glow)" 
            />
            <circle 
              cx={comet.x - comet.radius * 0.3} 
              cy={comet.y - state.cameraY - comet.radius * 0.3} 
              r={comet.radius * 0.4} 
              fill="#ffffff" 
              opacity="0.6" 
            />
          </g>
        ))}

        {state.particles.map(pt => (
          <circle 
            key={pt.id} 
            cx={pt.x} 
            cy={pt.y - state.cameraY} 
            r={2 + pt.life * 2} 
            fill={pt.color} 
            opacity={Math.max(0, pt.life)} 
          />
        ))}

        {state.status !== 'gameover' && (
          <g transform={`translate(${p.x}, ${p.y - state.cameraY}) rotate(${rotDeg + 90})`}>
            <path d="M 0 -12 L 8 8 L 0 4 L -8 8 Z" fill="#ffffff" filter="url(#glow)" />
            <path d="M -4 8 L 0 14 L 4 8 Z" fill="#7de8c3" opacity="0.8" />
          </g>
        )}
      </svg>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-4">
        <div className="text-white font-mono text-xl text-right drop-shadow-md z-10">
          SCORE: {state.score}
        </div>
      </div>

      {state.status === 'start' && (
        <div className="absolute top-0 left-0 w-full h-full bg-[#0b1026]/70 flex flex-col items-center justify-center backdrop-blur-sm z-20">
          <h1 className="text-4xl font-bold text-[#c4b5fd] mb-4 tracking-wider text-center drop-shadow-[0_0_10px_rgba(196,181,253,0.8)]">
            OORT CLOUD<br/>SLINGSHOT
          </h1>
          <p className="text-[#7de8c3] mb-8 font-mono text-sm text-center px-6 leading-relaxed">
            Tap to detach from gravity.<br/>
            Sling from comet to comet to escape!
          </p>
          <button className="px-8 py-3 bg-[#f9a8d4] text-[#0b1026] font-bold rounded-full text-lg shadow-[0_0_15px_rgba(249,168,212,0.6)] pointer-events-none">
            START LAUNCH
          </button>
        </div>
      )}

      {state.status === 'gameover' && (
        <div className="absolute top-0 left-0 w-full h-full bg-[#0b1026]/80 flex flex-col items-center justify-center backdrop-blur-md z-20">
          <h1 className="text-5xl font-bold text-[#ff4444] mb-2 drop-shadow-[0_0_15px_rgba(255,68,68,0.8)]">LOST IN SPACE</h1>
          <p className="text-white text-2xl mb-8 font-mono font-bold">FINAL SCORE: {state.score}</p>
          <button className="px-8 py-3 bg-[#7de8c3] text-[#0b1026] font-bold rounded-full text-lg shadow-[0_0_15px_rgba(125,232,195,0.6)] pointer-events-none">
            TRY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
