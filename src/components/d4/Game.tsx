"use client";
import React, { useState, useEffect, useRef } from 'react';

const ValueDisplay = ({ label, val, target = 0, tol = 0, noTol = false }: any) => {
  const diff = Math.abs(val - target);
  const isOk = diff <= tol;
  const color = noTol ? 'text-white' : (isOk ? 'text-[#7de8c3]' : 'text-red-400');
  const sign = val < 0 ? '-' : (val > 0 ? '+' : ' ');
  const num = Math.abs(val).toFixed(2);
  
  return (
    <div className="flex justify-between w-full text-[11px] leading-tight mb-[2px]">
      <span className="text-gray-400 mr-2">{label}</span>
      <span className={`${color} font-mono tracking-tighter`}>{sign}{num}</span>
    </div>
  );
};

const CtrlBtn = ({ label, action, colorClass, keysRef }: any) => (
  <button 
    className={`w-12 h-12 bg-slate-900/80 rounded border ${colorClass} flex items-center justify-center select-none touch-none text-sm font-bold active:scale-95 transition-all shadow-lg`}
    onPointerDown={(e) => { 
      e.preventDefault(); 
      e.currentTarget.setPointerCapture(e.pointerId); 
      keysRef.current[action] = true; 
    }}
    onPointerUp={(e) => { 
      e.preventDefault(); 
      e.currentTarget.releasePointerCapture(e.pointerId); 
      keysRef.current[action] = false; 
    }}
    onPointerCancel={(e) => { 
      e.preventDefault(); 
      keysRef.current[action] = false; 
    }}
    onContextMenu={(e) => e.preventDefault()}
  >
    {label}
  </button>
);

const TranslateBtn = ({ label, action, keysRef }: any) => (
  <CtrlBtn label={label} action={action} keysRef={keysRef} colorClass="text-[#7de8c3] border-[#7de8c3]/40 active:bg-[#7de8c3] active:text-slate-900" />
);

const RotateBtn = ({ label, action, keysRef }: any) => (
  <CtrlBtn label={label} action={action} keysRef={keysRef} colorClass="text-[#f9a8d4] border-[#f9a8d4]/40 active:bg-[#f9a8d4] active:text-slate-900" />
);

export default function Game() {
  const [, setRenderTick] = useState(0);
  
  const keys = useRef<any>({
    txP: false, txN: false,
    tyP: false, tyN: false,
    tzP: false, tzN: false,
    rpP: false, rpN: false,
    ryP: false, ryN: false,
    rrP: false, rrN: false
  });

  const gameState = useRef({
    x: 4.5, y: -3.2, z: 25.0,
    pitch: -8.0, yaw: 5.5, roll: 12.0,
    vx: 0, vy: 0, vz: -0.2,
    vpitch: 0, vyaw: 0, vroll: 0,
    status: 'start',
    startTime: 0,
    endTime: 0
  });

  const [stars] = useState(() => 
    Array.from({length: 150}).map(() => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      return {
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.8 + 0.2
      }
    })
  );

  useEffect(() => {
    let lastTime = performance.now();
    let reqId: number;
    let isUnmounted = false;

    const loop = (time: number) => {
      if (isUnmounted) return;
      
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      
      let s = gameState.current;
      
      if (s.status === 'playing') {
        const k = keys.current;
        const transAcc = 0.8;
        const rotAcc = 8.0;
        
        if (k.txP) s.vx += transAcc * dt;
        if (k.txN) s.vx -= transAcc * dt;
        if (k.tyP) s.vy += transAcc * dt;
        if (k.tyN) s.vy -= transAcc * dt;
        if (k.tzP) s.vz -= transAcc * dt; 
        if (k.tzN) s.vz += transAcc * dt; 
        
        if (k.rpP) s.vpitch += rotAcc * dt;
        if (k.rpN) s.vpitch -= rotAcc * dt;
        if (k.ryP) s.vyaw += rotAcc * dt;
        if (k.ryN) s.vyaw -= rotAcc * dt;
        if (k.rrP) s.vroll += rotAcc * dt;
        if (k.rrN) s.vroll -= rotAcc * dt;
        
        s.vx *= 0.99;
        s.vy *= 0.99;
        s.vz *= 0.99;
        s.vpitch *= 0.95;
        s.vyaw *= 0.95;
        s.vroll *= 0.95;
        
        const maxV = 2.0;
        const maxRotV = 20.0;
        s.vx = Math.max(-maxV, Math.min(maxV, s.vx));
        s.vy = Math.max(-maxV, Math.min(maxV, s.vy));
        s.vz = Math.max(-maxV, Math.min(maxV, s.vz));
        s.vpitch = Math.max(-maxRotV, Math.min(maxRotV, s.vpitch));
        s.vyaw = Math.max(-maxRotV, Math.min(maxRotV, s.vyaw));
        s.vroll = Math.max(-maxRotV, Math.min(maxRotV, s.vroll));
        
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.z += s.vz * dt;
        s.pitch += s.vpitch * dt;
        s.yaw += s.vyaw * dt;
        s.roll += s.vroll * dt;
        
        if (s.z <= 0) {
          s.endTime = performance.now();
          const isAligned = 
            Math.abs(s.x) <= 0.2 &&
            Math.abs(s.y) <= 0.2 &&
            Math.abs(s.pitch) <= 2.0 &&
            Math.abs(s.yaw) <= 2.0 &&
            Math.abs(s.roll) <= 2.0 &&
            Math.abs(s.vz) <= 0.1 &&
            Math.abs(s.vx) <= 0.05 &&
            Math.abs(s.vy) <= 0.05;
            
          s.status = isAligned ? 'success' : 'crash';
        }
      }
      
      setRenderTick(t => t + 1);
      reqId = requestAnimationFrame(loop);
    };
    
    reqId = requestAnimationFrame(loop);
    return () => {
      isUnmounted = true;
      cancelAnimationFrame(reqId);
    };
  }, []);

  const s = gameState.current;

  const getProjector = () => (worldX: number, worldY: number, worldZ: number) => {
    let dx = worldX - s.x;
    let dy = worldY - s.y;
    let dz = s.z - worldZ;

    let pitch_rad = s.pitch * Math.PI / 180;
    let yaw_rad = s.yaw * Math.PI / 180;
    let roll_rad = s.roll * Math.PI / 180;

    let cy = Math.cos(yaw_rad), sy = Math.sin(yaw_rad);
    let cp = Math.cos(pitch_rad), sp = Math.sin(pitch_rad);
    let cr = Math.cos(roll_rad), sr = Math.sin(roll_rad);

    let dx1 = dx * cy - dz * sy;
    let dz1 = dx * sy + dz * cy;
    let dy1 = dy;

    let dy2 = dy1 * cp - dz1 * sp;
    let dz2 = dy1 * sp + dz1 * cp;
    let dx2 = dx1;

    let dx3 = dx2 * cr - dy2 * sr;
    let dy3 = dx2 * sr + dy2 * cr;
    let dz3 = dz2;

    let scale = 250 / Math.max(dz3, 0.1);
    return {
      x: 215 + dx3 * scale,
      y: 150 - dy3 * scale,
      z: dz3,
      valid: dz3 > 0.1
    };
  };

  const projector = getProjector();

  const renderStars = () => {
    let pitch_rad = s.pitch * Math.PI / 180;
    let yaw_rad = s.yaw * Math.PI / 180;
    let roll_rad = s.roll * Math.PI / 180;

    let cy = Math.cos(yaw_rad), sy = Math.sin(yaw_rad);
    let cp = Math.cos(pitch_rad), sp = Math.sin(pitch_rad);
    let cr = Math.cos(roll_rad), sr = Math.sin(roll_rad);

    return stars.map((star, i) => {
      let dx1 = star.x * cy - star.z * sy;
      let dz1 = star.x * sy + star.z * cy;
      let dy1 = star.y;

      let dy2 = dy1 * cp - dz1 * sp;
      let dz2 = dy1 * sp + dz1 * cp;
      let dx2 = dx1;

      let dx3 = dx2 * cr - dy2 * sr;
      let dy3 = dx2 * sr + dy2 * cr;
      let dz3 = dz2;

      if (dz3 <= 0) return null;
      
      let f = 400;
      let screenX = 215 + (dx3 / dz3) * f;
      let screenY = 150 - (dy3 / dz3) * f;

      if (screenX < -20 || screenX > 450 || screenY < -20 || screenY > 320) return null;

      return <circle key={`star-${i}`} cx={screenX} cy={screenY} r={star.r} fill="#ffffff" opacity={star.o} />
    });
  };

  const renderRings = () => {
    const ringData = [
      { z: -8, color: '#7de8c3' },
      { z: -6, color: '#c4b5fd' },
      { z: -4, color: '#c4b5fd' },
      { z: -2, color: '#c4b5fd' },
      { z: 0, color: '#f9a8d4' },
    ];
    
    return ringData.map(ring => {
      const pts = [];
      for(let i=0; i<16; i++) {
        const angle = (i/16)*Math.PI*2;
        pts.push(projector(Math.cos(angle)*2.5, Math.sin(angle)*2.5, ring.z));
      }
      if(pts.some(p => !p.valid)) return null;
      const opacity = ring.z === 0 ? 1 : (ring.z === -8 ? 0.8 : 0.4);
      return <polygon key={`ring-${ring.z}`} points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={ring.color} strokeWidth="1.5" opacity={opacity} />
    });
  };

  const renderLines = () => {
    const angles = [0, Math.PI/2, Math.PI, Math.PI*1.5];
    return angles.map((angle, i) => {
      const p1 = projector(Math.cos(angle)*2.5, Math.sin(angle)*2.5, 0);
      const p2 = projector(Math.cos(angle)*2.5, Math.sin(angle)*2.5, -8);
      if (!p1.valid || !p2.valid) return null;
      return <line key={`line-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#c4b5fd" strokeWidth="1" opacity="0.4" />
    });
  };

  const renderCrosshair = () => {
    const p1 = projector(2.5, 0, 0);
    const p2 = projector(-2.5, 0, 0);
    const p3 = projector(0, 2.5, 0);
    const p4 = projector(0, -2.5, 0);
    if (!p1.valid || !p2.valid || !p3.valid || !p4.valid) return null;
    return (
      <g stroke="#f9a8d4" strokeWidth="1.5">
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />
        <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} />
      </g>
    );
  };

  return (
    <div className="max-w-[430px] w-full mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans rounded-xl shadow-[0_0_50px_rgba(11,16,38,1)] border-4 border-[#0b1026] select-none touch-none">
      
      {/* Viewport */}
      <div className="w-full h-[300px] relative">
        <svg width="100%" height="100%" viewBox="0 0 430 300">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <rect width="100%" height="100%" fill="#0b1026" />
          
          {renderStars()}
          
          <g filter="url(#glow)">
            {renderRings()}
            {renderLines()}
            {renderCrosshair()}
          </g>

          <g stroke="#7de8c3" strokeWidth="1.5" opacity="0.8">
            <circle cx="215" cy="150" r="40" fill="none" strokeDasharray="4 4" />
            <line x1="200" y1="150" x2="230" y2="150" />
            <line x1="215" y1="135" x2="215" y2="165" />
            <circle cx="215" cy="150" r="2" fill="#7de8c3" />
          </g>
        </svg>

        <div className="absolute top-2 left-2 flex flex-col gap-2 w-[85px] pointer-events-none">
          <div className="bg-slate-900/60 backdrop-blur p-1.5 rounded border border-slate-700/50">
            <div className="text-gray-500 text-[9px] mb-1 border-b border-slate-700/50 pb-0.5">POS (m)</div>
            <ValueDisplay label="X" val={s.x} tol={0.2} />
            <ValueDisplay label="Y" val={s.y} tol={0.2} />
            <ValueDisplay label="Z" val={s.z} noTol /> 
          </div>
          <div className="bg-slate-900/60 backdrop-blur p-1.5 rounded border border-slate-700/50">
            <div className="text-gray-500 text-[9px] mb-1 border-b border-slate-700/50 pb-0.5">RATE (m/s)</div>
            <ValueDisplay label="X" val={s.vx} tol={0.05} />
            <ValueDisplay label="Y" val={s.vy} tol={0.05} />
            <ValueDisplay label="Z" val={s.vz} tol={0.1} />
          </div>
        </div>

        <div className="absolute top-2 right-2 flex flex-col gap-2 w-[85px] pointer-events-none">
          <div className="bg-slate-900/60 backdrop-blur p-1.5 rounded border border-slate-700/50">
            <div className="text-gray-500 text-[9px] mb-1 border-b border-slate-700/50 pb-0.5">ROT (°)</div>
            <ValueDisplay label="P" val={s.pitch} tol={2.0} />
            <ValueDisplay label="Y" val={s.yaw} tol={2.0} />
            <ValueDisplay label="R" val={s.roll} tol={2.0} />
          </div>
          <div className="bg-slate-900/60 backdrop-blur p-1.5 rounded border border-slate-700/50">
            <div className="text-gray-500 text-[9px] mb-1 border-b border-slate-700/50 pb-0.5">RATE (°/s)</div>
            <ValueDisplay label="P" val={s.vpitch} tol={1.0} />
            <ValueDisplay label="Y" val={s.vyaw} tol={1.0} />
            <ValueDisplay label="R" val={s.vroll} tol={1.0} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full h-[200px] flex bg-slate-950 border-t border-slate-800">
        
        <div className="flex-1 flex flex-col items-center justify-center p-2 relative">
          <div className="absolute top-2 text-[10px] text-[#7de8c3] font-bold tracking-widest opacity-60">TRANSLATE</div>
          
          <div className="mt-4 grid grid-cols-3 gap-2 place-items-center">
            <div />
            <TranslateBtn label="Y+" action="tyP" keysRef={keys} />
            <div />
            <TranslateBtn label="X-" action="txN" keysRef={keys} />
            <TranslateBtn label="Y-" action="tyN" keysRef={keys} />
            <TranslateBtn label="X+" action="txP" keysRef={keys} />
          </div>
          
          <div className="mt-4 flex gap-4 w-full justify-center">
            <TranslateBtn label="FWD" action="tzP" keysRef={keys} />
            <TranslateBtn label="BCK" action="tzN" keysRef={keys} />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-2 relative border-l border-slate-800">
          <div className="absolute top-2 text-[10px] text-[#f9a8d4] font-bold tracking-widest opacity-60">ROTATE</div>
          
          <div className="mt-4 grid grid-cols-3 gap-2 place-items-center">
            <div />
            <RotateBtn label="P+" action="rpP" keysRef={keys} />
            <div />
            <RotateBtn label="Y-" action="ryN" keysRef={keys} />
            <RotateBtn label="P-" action="rpN" keysRef={keys} />
            <RotateBtn label="Y+" action="ryP" keysRef={keys} />
          </div>
          
          <div className="mt-4 flex gap-4 w-full justify-center text-lg">
            <RotateBtn label="↺" action="rrN" keysRef={keys} />
            <RotateBtn label="↻" action="rrP" keysRef={keys} />
          </div>
        </div>

      </div>

      {/* Overlays */}
      {s.status === 'start' && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-[#7de8c3] tracking-widest mb-2 animate-pulse">ISS DOCKING</h1>
          <p className="text-sm text-slate-300 text-center max-w-[85%] mb-8 leading-relaxed">
            Align all parameters to <span className="text-[#7de8c3]">GREEN</span>.<br/>
            Final contact tolerance:<br/>
            Pos &le; 0.2m, Rot &le; 2.0°<br/>
            Speed &le; 0.1m/s
          </p>
          <button 
            onClick={() => {
              gameState.current.startTime = performance.now();
              gameState.current.status = 'playing';
            }}
            className="px-8 py-3 bg-[#7de8c3]/10 border border-[#7de8c3] text-[#7de8c3] font-bold rounded-lg hover:bg-[#7de8c3] hover:text-black transition-all shadow-[0_0_20px_rgba(125,232,195,0.3)]"
          >
            INITIATE
          </button>
        </div>
      )}

      {(s.status === 'success' || s.status === 'crash') && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-10 backdrop-blur-md">
          <h1 className={`text-3xl font-bold tracking-widest mb-4 ${s.status === 'success' ? 'text-[#7de8c3]' : 'text-red-500'}`}>
            {s.status === 'success' ? 'DOCKING SUCCESS' : 'DOCKING FAILED'}
          </h1>
          <p className="text-sm text-slate-300 mb-6 text-center max-w-[80%]">
            {s.status === 'success' ? 'Welcome to the station, Commander.' : 'Alignment out of tolerance. Vessel destroyed.'}
          </p>
          
          <div className="text-xl text-white font-mono mb-8 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700">
            TIME: {((s.endTime - s.startTime) / 1000).toFixed(1)}s
          </div>

          <button 
            onClick={() => {
              gameState.current = {
                x: 4.5, y: -3.2, z: 25.0,
                pitch: -8.0, yaw: 5.5, roll: 12.0,
                vx: 0, vy: 0, vz: -0.2,
                vpitch: 0, vyaw: 0, vroll: 0,
                status: 'playing',
                startTime: performance.now(),
                endTime: 0
              };
            }}
            className="px-8 py-3 bg-slate-800 border border-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors"
          >
            RETRY
          </button>
        </div>
      )}
    </div>
  );
}
