'use client';

import React, { useRef, useState, useEffect } from 'react';

type GameState = 'start' | 'playing' | 'gameover';

interface Asteroid {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  points: string;
  craters: {cx: number, cy: number, r: number}[];
  dead: boolean;
}

interface Missile {
  id: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  dead: boolean;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  dead: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface GameData {
  state: GameState;
  score: number;
  lives: number;
  asteroids: Asteroid[];
  missiles: Missile[];
  explosions: Explosion[];
  particles: Particle[];
  lastTime: number;
  asteroidSpawnTimer: number;
  asteroidSpawnRate: number;
}

const GAME_WIDTH = 430;
const GAME_HEIGHT = 500;
const BASE_X = GAME_WIDTH / 2;
const BASE_Y = GAME_HEIGHT - 25;
const MULTIPLIER = 2.5;
const MAX_POWER = 180;

const generateAsteroidPoints = (radius: number) => {
  const points = [];
  const numPoints = 8;
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const r = radius * (0.7 + Math.random() * 0.3);
    points.push(`${Math.cos(angle) * r},${Math.sin(angle) * r}`);
  }
  return points.join(' ');
};

export default function Game() {
  const [frameCount, setFrameCount] = useState(0);
  const [stars] = useState(() => 
    Array.from({length: 80}).map(() => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.8 + 0.2
    }))
  );

  const gameData = useRef<GameData>({
    state: 'start',
    score: 0,
    lives: 3,
    asteroids: [],
    missiles: [],
    explosions: [],
    particles: [],
    lastTime: 0,
    asteroidSpawnTimer: 0,
    asteroidSpawnRate: 2000,
  });

  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [dragCurr, setDragCurr] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    let reqId: number;
    const loop = (time: number) => {
      const data = gameData.current;
      if (!data.lastTime) data.lastTime = time;
      const dt = time - data.lastTime;
      data.lastTime = time;
      const delta = Math.min(dt, 50) / 1000;

      if (data.state === 'playing') {
        data.asteroidSpawnTimer -= dt;
        if (data.asteroidSpawnTimer <= 0) {
          const radius = 12 + Math.random() * 15;
          const x = Math.random() * (GAME_WIDTH - radius * 2) + radius;
          const targetX = BASE_X + (Math.random() - 0.5) * 200; 
          const angle = Math.atan2(GAME_HEIGHT - (-50), targetX - x);
          const speed = 40 + Math.random() * 40 + data.score * 0.2;
          
          const craters = [];
          for(let i=0; i<3; i++) {
            craters.push({
              cx: (Math.random() - 0.5) * radius * 0.8,
              cy: (Math.random() - 0.5) * radius * 0.8,
              r: Math.random() * radius * 0.3 + 2
            });
          }

          data.asteroids.push({
            id: Math.random(),
            x, y: -50,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 4,
            points: generateAsteroidPoints(radius),
            craters,
            dead: false
          });
          data.asteroidSpawnTimer = data.asteroidSpawnRate;
          data.asteroidSpawnRate = Math.max(600, data.asteroidSpawnRate - 20);
        }
      }

      // Update missiles
      data.missiles.forEach(m => {
        m.x += m.vx * delta;
        m.y += m.vy * delta;
        const dist = Math.hypot(m.tx - m.x, m.ty - m.y);
        if (dist < 15 || m.y <= m.ty) {
          m.dead = true;
          data.explosions.push({
            id: Math.random(),
            x: m.tx,
            y: m.ty,
            radius: 0,
            maxRadius: 45 + Math.random() * 15,
            life: 0,
            dead: false
          });
        }
      });
      data.missiles = data.missiles.filter(m => !m.dead);

      // Update explosions
      data.explosions.forEach(e => {
        e.life += delta * 2; 
        if (e.life >= 1) {
          e.dead = true;
        } else {
          e.radius = e.maxRadius * Math.sin(e.life * Math.PI);
        }
      });
      data.explosions = data.explosions.filter(e => !e.dead);

      // Update asteroids
      data.asteroids.forEach(a => {
        a.x += a.vx * delta;
        a.y += a.vy * delta;
        a.rotation += a.rotationSpeed * delta;

        if (data.state === 'playing') {
          // Collision with explosions
          data.explosions.forEach(e => {
            if (a.dead) return;
            const dist = Math.hypot(a.x - e.x, a.y - e.y);
            if (dist < a.radius + e.radius * 0.8) {
              a.dead = true;
              data.score += 10;
              for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 50 + Math.random() * 150;
                data.particles.push({
                  id: Math.random(),
                  x: a.x, y: a.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  life: 0.3 + Math.random() * 0.4,
                  color: '#f9a8d4',
                });
              }
            }
          });

          // Hit ground
          if (a.y + a.radius > BASE_Y + 10) {
            a.dead = true;
            data.lives -= 1;
            for (let i = 0; i < 20; i++) {
              const angle = Math.PI + (Math.random() - 0.5) * Math.PI; // upwards
              const speed = 100 + Math.random() * 200;
              data.particles.push({
                id: Math.random(),
                x: a.x, y: BASE_Y + 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.5,
                color: '#c4b5fd',
              });
            }
            if (data.lives <= 0) {
              data.state = 'gameover';
            }
          }
        }
      });
      data.asteroids = data.asteroids.filter(a => !a.dead);

      // Particles
      data.particles.forEach(p => {
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.life -= delta;
      });
      data.particles = data.particles.filter(p => p.life > 0);

      setFrameCount(f => f + 1);
      reqId = requestAnimationFrame(loop);
    };
    reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqId);
  }, []);

  const getSvgCoords = (e: React.PointerEvent) => {
    const svg = e.currentTarget as SVGSVGElement;
    let pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (ctm) {
      pt = pt.matrixTransform(ctm.inverse());
      return { x: pt.x, y: pt.y };
    }
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (GAME_WIDTH / rect.width),
      y: (e.clientY - rect.top) * (GAME_HEIGHT / rect.height)
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameData.current.state !== 'playing') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = getSvgCoords(e);
    setDragStart(coords);
    setDragCurr(coords);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart) return;
    setDragCurr(getSvgCoords(e));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragStart || !dragCurr) return;
    
    if (gameData.current.state === 'playing') {
      const dx = dragStart.x - dragCurr.x;
      const dy = dragStart.y - dragCurr.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist > 10) {
        const power = Math.min(dist, MAX_POWER);
        const angle = Math.atan2(dy, dx);
        
        const explodeDist = power * MULTIPLIER;
        const tx = BASE_X + Math.cos(angle) * explodeDist;
        const ty = BASE_Y + Math.sin(angle) * explodeDist;
        
        const speed = 600;
        const missileAngle = Math.atan2(ty - BASE_Y, tx - BASE_X);
        const vx = Math.cos(missileAngle) * speed;
        const vy = Math.sin(missileAngle) * speed;
        
        gameData.current.missiles.push({
          id: Math.random(),
          startX: BASE_X,
          startY: BASE_Y,
          x: BASE_X,
          y: BASE_Y,
          tx, ty, vx, vy, dead: false
        });
      }
    }
    
    setDragStart(null);
    setDragCurr(null);
  };

  const startGame = () => {
    const data = gameData.current;
    data.state = 'playing';
    data.score = 0;
    data.lives = 3;
    data.asteroids = [];
    data.missiles = [];
    data.explosions = [];
    data.particles = [];
    data.asteroidSpawnTimer = 0;
    data.asteroidSpawnRate = 2000;
    data.lastTime = performance.now();
    setDragStart(null);
    setDragCurr(null);
  };

  let tx = 0, ty = 0, power = 0, cannonAngle = -90;
  if (dragStart && dragCurr && gameData.current.state === 'playing') {
    const dx = dragStart.x - dragCurr.x;
    const dy = dragStart.y - dragCurr.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    power = Math.min(dist, MAX_POWER);
    const angle = Math.atan2(dy, dx);
    const explodeDist = power * MULTIPLIER;
    tx = BASE_X + Math.cos(angle) * explodeDist;
    ty = BASE_Y + Math.sin(angle) * explodeDist;
    cannonAngle = Math.atan2(ty - BASE_Y, tx - BASE_X) * 180 / Math.PI;
  }

  return (
    <div className="max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans select-none touch-none rounded-xl shadow-2xl border-4 border-[#1e1b4b]">
      <svg 
        viewBox={`0 0 ${GAME_WIDTH} ${GAME_HEIGHT}`}
        className="w-full h-full block cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1026" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
          <radialGradient id="explodeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#7de8c3" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7de8c3" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        <rect width={GAME_WIDTH} height={GAME_HEIGHT} fill="url(#bgGrad)" />

        {stars.map((star, i) => (
          <circle key={i} cx={star.x} cy={star.y} r={star.r} fill="#c4b5fd" opacity={star.opacity} />
        ))}

        {/* Base dome */}
        <path d={`M ${BASE_X - 50} ${GAME_HEIGHT} Q ${BASE_X} ${GAME_HEIGHT - 70} ${BASE_X + 50} ${GAME_HEIGHT} Z`} fill="#1e1b4b" stroke="#7de8c3" strokeWidth="2" />
        
        {/* Cannon */}
        <g transform={`translate(${BASE_X}, ${BASE_Y}) rotate(${cannonAngle})`}>
          <rect x={0} y={-6} width={35} height={12} fill="#7de8c3" rx={4} />
          <circle cx={0} cy={0} r={14} fill="#f9a8d4" />
          <circle cx={0} cy={0} r={6} fill="#1e1b4b" />
        </g>

        {/* Trajectory line */}
        {dragStart && dragCurr && gameData.current.state === 'playing' && power > 10 && (
          <g>
            <line 
              x1={BASE_X} y1={BASE_Y} x2={tx} y2={ty} 
              stroke="#7de8c3" strokeWidth="2" 
              strokeDasharray="6,6" 
              strokeDashoffset={-frameCount % 12}
              opacity={0.8} 
            />
            <circle cx={tx} cy={ty} r={12} stroke="#7de8c3" strokeWidth="2" fill="none" />
            <circle cx={tx} cy={ty} r={3} fill="#f9a8d4" />
          </g>
        )}

        {gameData.current.missiles.map(m => (
          <g key={m.id}>
            <line x1={m.startX} y1={m.startY} x2={m.x} y2={m.y} stroke="#7de8c3" strokeWidth="3" opacity="0.6" />
            <circle cx={m.x} cy={m.y} r={4} fill="#fff" />
          </g>
        ))}

        {gameData.current.explosions.map(e => (
          <g key={e.id}>
            <circle cx={e.x} cy={e.y} r={e.radius} fill="url(#explodeGrad)" />
            <circle cx={e.x} cy={e.y} r={e.radius * 0.9} stroke="#f9a8d4" strokeWidth="2" fill="none" opacity={1 - e.life} />
          </g>
        ))}

        {gameData.current.asteroids.map(a => (
          <g key={a.id} transform={`translate(${a.x}, ${a.y}) rotate(${a.rotation * 180 / Math.PI})`}>
            <polygon points={a.points} fill="#2d2a4a" stroke="#c4b5fd" strokeWidth="2" />
            {a.craters.map((c, i) => (
              <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="#1e1b4b" opacity={0.8} />
            ))}
          </g>
        ))}

        {gameData.current.particles.map(p => (
          <circle key={p.id} cx={p.x} cy={p.y} r={2.5} fill={p.color} opacity={p.life * 2} />
        ))}
      </svg>

      {gameData.current.state === 'playing' && (
        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
          <div className="text-2xl font-black text-[#7de8c3] drop-shadow-[0_0_8px_rgba(125,232,195,0.6)]">
            {gameData.current.score}
          </div>
          <div className="flex gap-1.5 mt-1">
            {Array.from({length: Math.max(0, gameData.current.lives)}).map((_, i) => (
              <svg key={i} width="18" height="18" viewBox="0 0 20 20" className="drop-shadow-[0_0_5px_rgba(249,168,212,0.8)]">
                <path d="M 10 2 L 18 18 L 2 18 Z" fill="#f9a8d4" />
              </svg>
            ))}
          </div>
        </div>
      )}

      {gameData.current.state === 'start' && (
        <div className="absolute inset-0 bg-[#0b1026]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
          <h1 className="text-5xl font-black text-[#7de8c3] mb-2 tracking-tighter drop-shadow-[0_0_10px_rgba(125,232,195,0.5)]">
            ASTEROID<br/>DEFENSE
          </h1>
          <p className="text-[#c4b5fd] mb-10 font-medium text-sm leading-relaxed max-w-[250px]">
            화면을 터치하고 당겨서<br/>미사일의 발사 궤적을 조절하세요!<br/>지구를 지켜주세요!
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-4 bg-[#f9a8d4] text-[#1e1b4b] font-black text-xl rounded-full shadow-[0_0_20px_rgba(249,168,212,0.4)] hover:scale-105 active:scale-95 transition-all"
          >
            START GAME
          </button>
        </div>
      )}

      {gameData.current.state === 'gameover' && (
        <div className="absolute inset-0 bg-[#1e1b4b]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
          <h1 className="text-5xl font-black text-[#f9a8d4] mb-4 drop-shadow-[0_0_10px_rgba(249,168,212,0.5)]">
            GAME OVER
          </h1>
          <div className="text-xl text-[#c4b5fd] font-bold mb-1">FINAL SCORE</div>
          <p className="text-6xl text-[#7de8c3] mb-10 font-black drop-shadow-[0_0_15px_rgba(125,232,195,0.6)]">
            {gameData.current.score}
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-4 bg-[#7de8c3] text-[#1e1b4b] font-black text-xl rounded-full shadow-[0_0_20px_rgba(125,232,195,0.4)] hover:scale-105 active:scale-95 transition-all"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
