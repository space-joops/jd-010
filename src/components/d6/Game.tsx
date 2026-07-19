"use client";
import React, { useState, useEffect, useRef } from 'react';

const COLORS = {
  space: '#0b1026',
  mint: '#7de8c3',
  pink: '#f9a8d4',
  lavender: '#c4b5fd',
  white: '#ffffff',
};

export default function Game() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [score, setScore] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ active: false, startX: 0, startY: 0, x: 0, y: 0 });
  
  const startGame = () => {
    setScore(0);
    setGameState('playing');
  };

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = getCoordinates(e);
    if (!coords) return;
    pointerRef.current = { active: true, startX: coords.x, startY: coords.y, x: coords.x, y: coords.y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointerRef.current.active) return;
    const coords = getCoordinates(e);
    if (!coords) return;
    pointerRef.current.x = coords.x;
    pointerRef.current.y = coords.y;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    pointerRef.current.active = false;
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();
    
    // Physics & Game State
    const ship = { x: 215, y: 100, vx: 50, vy: 0 };
    let moonAngle = 0;
    const points = ['L1', 'L2', 'L3', 'L4', 'L5'];
    let targetPoint = points[Math.floor(Math.random() * points.length)];
    let targetProgress = 0;
    let fuel = 100;
    let currentScore = 0;
    const trail: {x: number, y: number}[] = [];

    const stars = Array.from({length: 80}, () => ({
      x: Math.random() * 430,
      y: Math.random() * 500,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.8 + 0.2
    }));

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      moonAngle += 0.4 * dt;
      const moonX = 215 + Math.cos(moonAngle) * 140;
      const moonY = 250 + Math.sin(moonAngle) * 140;

      if (pointerRef.current.active && fuel > 0) {
        const dx = pointerRef.current.x - pointerRef.current.startX;
        const dy = pointerRef.current.y - pointerRef.current.startY;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
          const force = Math.min(dist, 50) * 8;
          ship.vx += (dx / dist) * force * dt;
          ship.vy += (dy / dist) * force * dt;
          fuel -= 10 * dt; 
        }
      }

      const distEarth = Math.hypot(215 - ship.x, 250 - ship.y);
      const forceEarth = 400000 / (distEarth * distEarth + 1000);
      ship.vx += ((215 - ship.x) / distEarth) * forceEarth * dt;
      ship.vy += ((250 - ship.y) / distEarth) * forceEarth * dt;

      const distMoon = Math.hypot(moonX - ship.x, moonY - ship.y);
      const forceMoon = 100000 / (distMoon * distMoon + 500);
      ship.vx += ((moonX - ship.x) / distMoon) * forceMoon * dt;
      ship.vy += ((moonY - ship.y) / distMoon) * forceMoon * dt;

      ship.vx *= 0.99;
      ship.vy *= 0.99;

      ship.x += ship.vx * dt;
      ship.y += ship.vy * dt;

      trail.push({ x: ship.x, y: ship.y });
      if (trail.length > 25) trail.shift();

      const getLPoint = (type: string) => {
        let dist = 0;
        let angle = moonAngle;
        if (type === 'L1') dist = 100;
        else if (type === 'L2') dist = 180;
        else if (type === 'L3') { dist = 140; angle = moonAngle + Math.PI; }
        else if (type === 'L4') { dist = 140; angle = moonAngle - Math.PI/3; }
        else if (type === 'L5') { dist = 140; angle = moonAngle + Math.PI/3; }
        return {
          x: 215 + Math.cos(angle) * dist,
          y: 250 + Math.sin(angle) * dist
        };
      };

      const targetPos = getLPoint(targetPoint);
      const distToTarget = Math.hypot(targetPos.x - ship.x, targetPos.y - ship.y);
      
      if (distToTarget < 25) {
        targetProgress += dt;
        if (targetProgress > 2) {
          currentScore += 1;
          fuel = Math.min(100, fuel + 40);
          targetProgress = 0;
          const newPoints = points.filter(p => p !== targetPoint);
          targetPoint = newPoints[Math.floor(Math.random() * newPoints.length)];
        }
      } else {
        targetProgress = Math.max(0, targetProgress - dt * 2); 
      }

      if (distEarth < 38 || distMoon < 14 || ship.x < -100 || ship.x > 530 || ship.y < -100 || ship.y > 600) {
        setScore(currentScore);
        setGameState('end');
        return;
      }

      const bgGrad = ctx.createRadialGradient(215, 250, 50, 215, 250, 300);
      bgGrad.addColorStop(0, '#131936');
      bgGrad.addColorStop(1, COLORS.space);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 430, 500);

      stars.forEach(star => {
        star.x -= 2 * dt * star.size;
        if (star.x < 0) star.x = 430;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.beginPath();
      ctx.arc(215, 250, 140, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();

      points.forEach(p => {
        const pos = getLPoint(p);
        ctx.fillStyle = 'rgba(196, 181, 253, 0.2)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(196, 181, 253, 0.4)';
        ctx.font = '8px sans-serif';
        ctx.fillText(p, pos.x + 6, pos.y + 3);
      });

      ctx.strokeStyle = COLORS.lavender;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(targetPos.x, targetPos.y, 25, 0, Math.PI * 2);
      ctx.stroke();

      if (targetProgress > 0) {
        ctx.beginPath();
        ctx.arc(targetPos.x, targetPos.y, 25, -Math.PI/2, -Math.PI/2 + (targetProgress / 2) * Math.PI * 2);
        ctx.strokeStyle = COLORS.mint;
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      const earthGrad = ctx.createRadialGradient(215-10, 250-10, 5, 215, 250, 40);
      earthGrad.addColorStop(0, '#a5f3fc');
      earthGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = earthGrad;
      ctx.beginPath();
      ctx.arc(215, 250, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(215, 250, 46, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(125, 232, 195, 0.15)';
      ctx.fill();

      const moonGrad = ctx.createRadialGradient(moonX-4, moonY-4, 2, moonX, moonY, 15);
      moonGrad.addColorStop(0, COLORS.pink);
      moonGrad.addColorStop(1, '#be185d');
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 15, 0, Math.PI * 2);
      ctx.fill();

      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.strokeStyle = 'rgba(125, 232, 195, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(ship.x, ship.y);
      const speed = Math.hypot(ship.vx, ship.vy);
      const angle = speed > 0.1 ? Math.atan2(ship.vy, ship.vx) : -Math.PI/2;
      ctx.rotate(angle);
      
      ctx.fillStyle = COLORS.white;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, -5);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fill();

      if (pointerRef.current.active && fuel > 0) {
        ctx.fillStyle = COLORS.mint;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(-14, -3 + Math.random()*6);
        ctx.lineTo(-6, 3);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      if (pointerRef.current.active) {
        const { startX, startY, x, y } = pointerRef.current;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(startX, startY, 40, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        const dx = x - startX;
        const dy = y - startY;
        const dist = Math.hypot(dx, dy);
        const maxDist = 40;
        let knobX = startX;
        let knobY = startY;
        if (dist > 0) {
          knobX = startX + (dist > maxDist ? (dx / dist) * maxDist : dx);
          knobY = startY + (dist > maxDist ? (dy / dist) * maxDist : dy);
        }
        ctx.arc(knobX, knobY, 15, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = COLORS.white;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`SCORE: ${currentScore}`, 20, 30);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(20, 42, 100, 6);
      ctx.fillStyle = fuel > 30 ? COLORS.mint : COLORS.pink;
      ctx.fillRect(20, 42, Math.max(0, fuel), 6);
      ctx.fillStyle = COLORS.white;
      ctx.font = '10px sans-serif';
      ctx.fillText('FUEL', 20, 38);

      if (fuel > 0 && fuel < 30) {
        ctx.fillStyle = `rgba(249, 168, 214, ${Math.abs(Math.sin(time / 200))})`;
        ctx.fillText('LOW FUEL', 130, 48);
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    
    return () => cancelAnimationFrame(animationId);
  }, [gameState]);

  return (
    <div className="w-full max-w-[430px] mx-auto aspect-[43/50] relative overflow-hidden bg-[#0b1026] text-white shadow-2xl sm:rounded-2xl font-sans select-none">
      <canvas
        ref={canvasRef}
        width={430}
        height={500}
        className="block touch-none w-full h-full"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {gameState === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b1026]/80 backdrop-blur-sm z-10 p-6 text-center">
          <div className="mb-6 drop-shadow-[0_0_15px_rgba(125,232,195,0.5)]">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#7de8c3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" fill="#0b1026" />
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)" />
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)" />
              <circle cx="19" cy="5" r="1.5" fill="#f9a8d4" stroke="none" />
              <circle cx="5" cy="19" r="1" fill="#c4b5fd" stroke="none" />
            </svg>
          </div>
          <h1 className="text-4xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd]">
            Lagrange Point
          </h1>
          <p className="text-gray-300 mb-8 max-w-[280px] leading-relaxed text-sm">
            지구와 달의 중력이 평형을 이루는 L1~L5 지점에 위성을 아슬아슬하게 안착시키세요!
          </p>
          <div className="text-xs text-[#f9a8d4] mb-10 bg-[#f9a8d4]/10 p-4 rounded-xl border border-[#f9a8d4]/20 text-left space-y-2">
            <p className="font-bold mb-3 text-center">MISSION BRIEFING</p>
            <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#f9a8d4]" /> 화면을 드래그해 추진기를 사용하세요.</p>
            <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#f9a8d4]" /> 타겟(L-Point)에 2초간 머무르면 득점!</p>
            <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#f9a8d4]" /> 행성 충돌이나 우주 이탈 시 게임 오버.</p>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-[#7de8c3] text-[#0b1026] font-bold text-lg rounded-full hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(125,232,195,0.4)]"
          >
            LAUNCH SATELLITE
          </button>
        </div>
      )}

      {gameState === 'end' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b1026]/90 backdrop-blur-md z-10 p-6 text-center">
          <div className="mb-4">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#f9a8d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 className="text-3xl font-black mb-2 text-[#f9a8d4] tracking-wider">MISSION FAILED</h2>
          <p className="text-gray-400 text-sm mb-8">Signal lost...</p>
          
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10 mb-8 w-full max-w-[280px]">
            <div className="text-xs text-[#c4b5fd] font-bold mb-2 tracking-widest">FINAL SCORE</div>
            <div className="text-6xl font-black text-[#7de8c3] drop-shadow-[0_0_10px_rgba(125,232,195,0.5)]">
              {score}
            </div>
          </div>
          
          <button
            onClick={startGame}
            className="px-10 py-4 bg-transparent border-2 border-[#c4b5fd] text-[#c4b5fd] font-bold text-lg rounded-full hover:bg-[#c4b5fd] hover:text-[#0b1026] transition-all transform active:scale-95"
          >
            TRY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
