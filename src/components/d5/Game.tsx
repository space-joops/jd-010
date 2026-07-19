'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

const W = 430;
const H = 500;
const DT = 0.8;
const MAX_TRAJ_STEPS = 120;
const POWER_MULT = 0.08;

const calcTrajectory = (sx, sy, svx, svy, bHoles) => {
    let x = sx, y = sy, vx = svx, vy = svy;
    const pts = [];
    for(let i=0; i<MAX_TRAJ_STEPS; i++) {
        if (i % 2 === 0) pts.push({x, y});
        let fx = 0, fy = 0;
        let crashed = false;
        for (const bh of bHoles) {
            const dx = bh.x - x;
            const dy = bh.y - y;
            const distSq = dx*dx + dy*dy;
            const dist = Math.sqrt(distSq);
            if (dist < bh.r - 2) {
                crashed = true; break;
            }
            const force = bh.mass / distSq;
            fx += (dx/dist) * force;
            fy += (dy/dist) * force;
        }
        if (crashed) break;
        
        vx += fx * DT;
        vy += fy * DT;
        x += vx * DT;
        y += vy * DT;
        
        if (x < -50 || x > W + 50 || y < -50 || y > H + 50) break;
    }
    return pts;
};

export default function Game() {
    const [gameState, setGameState] = useState('start'); 
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const latestLevel = useRef(1);

    const [shipPos, setShipPos] = useState({ x: W/2, y: H - 50 });
    const [blackHoles, setBlackHoles] = useState([]);
    const [portal, setPortal] = useState({ x: W/2, y: 50, r: 25 });
    
    const [dragStart, setDragStart] = useState(null);
    const [dragCurrent, setDragCurrent] = useState(null);
    const [trajectory, setTrajectory] = useState([]);
    const [trail, setTrail] = useState([]);
    
    const [stars] = useState(() => Array.from({length: 60}, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.5 + Math.random() * 1.5,
        o: 0.1 + Math.random() * 0.7
    })));

    const requestRef = useRef();
    const stateRef = useRef({
        ship: { x: W/2, y: H - 50, vx: 0, vy: 0 },
        blackHoles: [],
        portal: { x: W/2, y: 50, r: 25 },
        trail: [],
        gameState: 'start',
    });

    useEffect(() => {
        latestLevel.current = level;
    }, [level]);

    const initLevel = useCallback((levelIndex) => {
        const shipX = 50 + Math.random() * (W - 100);
        const portalX = 50 + Math.random() * (W - 100);
        
        const numHoles = Math.min(3, 1 + Math.floor(levelIndex / 3));
        const newHoles = [];
        
        for (let i = 0; i < numHoles; i++) {
            newHoles.push({
                x: 100 + Math.random() * (W - 200),
                y: 150 + Math.random() * (H - 300),
                mass: 12000 + Math.random() * 20000,
                r: 25 + Math.random() * 15
            });
        }
        
        const newState = {
            ship: { x: shipX, y: H - 50, vx: 0, vy: 0 },
            portal: { x: portalX, y: 50, r: 25 },
            blackHoles: newHoles,
            trail: [],
            gameState: 'aim'
        };
        
        stateRef.current = newState;
        setShipPos(newState.ship);
        setBlackHoles(newState.blackHoles);
        setPortal(newState.portal);
        setGameState('aim');
        setTrail([]);
        setTrajectory([]);
    }, []);

    const startGame = () => {
        setScore(0);
        setLevel(1);
        initLevel(1);
    };
    
    const nextLevel = () => {
        const next = level + 1;
        setLevel(next);
        initLevel(next);
    };

    const updatePhysics = useCallback(() => {
        let { ship, blackHoles, portal, trail, gameState } = stateRef.current;
        if (gameState !== 'fly') return;

        let fx = 0, fy = 0;
        let nextState = 'fly';
        
        for (const bh of blackHoles) {
            const dx = bh.x - ship.x;
            const dy = bh.y - ship.y;
            const distSq = dx*dx + dy*dy;
            const dist = Math.sqrt(distSq);
            
            if (dist < bh.r - 2) {
                nextState = 'gameover';
                break;
            }
            
            const force = bh.mass / distSq;
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
        }
        
        const pdx = portal.x - ship.x;
        const pdy = portal.y - ship.y;
        if (Math.sqrt(pdx*pdx + pdy*pdy) < portal.r) {
            nextState = 'success';
        }
        
        if (ship.x < -50 || ship.x > W + 50 || ship.y < -50 || ship.y > H + 50) {
            nextState = 'gameover';
        }
        
        if (nextState === 'fly') {
            const nvx = ship.vx + fx * DT;
            const nvy = ship.vy + fy * DT;
            const nx = ship.x + nvx * DT;
            const ny = ship.y + nvy * DT;
            
            const newTrail = [...trail, {x: nx, y: ny}];
            if (newTrail.length > 30) newTrail.shift();
            
            stateRef.current.ship = { x: nx, y: ny, vx: nvx, vy: nvy };
            stateRef.current.trail = newTrail;
            
            setShipPos(stateRef.current.ship);
            setTrail(newTrail);
            
            requestRef.current = requestAnimationFrame(updatePhysics);
        } else {
            stateRef.current.gameState = nextState;
            setGameState(nextState);
            if (nextState === 'success') {
                setScore(s => s + 100 * latestLevel.current);
            }
        }
    }, []);

    useEffect(() => {
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const handlePointerDown = (e) => {
        if (gameState !== 'aim') return;
        const rect = e.currentTarget.getBoundingClientRect();
        const scaleX = W / rect.width;
        const scaleY = H / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        setDragStart({ x, y });
        setDragCurrent({ x, y });
    };
    
    const handlePointerMove = (e) => {
        if (gameState !== 'aim' || !dragStart) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const scaleX = W / rect.width;
        const scaleY = H / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        setDragCurrent({ x, y });
        
        const vx = (dragStart.x - x) * POWER_MULT;
        const vy = (dragStart.y - y) * POWER_MULT;
        
        const traj = calcTrajectory(stateRef.current.ship.x, stateRef.current.ship.y, vx, vy, stateRef.current.blackHoles);
        setTrajectory(traj);
    };
    
    const handlePointerUp = () => {
        if (gameState !== 'aim' || !dragStart) return;
        
        const vx = (dragStart.x - dragCurrent.x) * POWER_MULT;
        const vy = (dragStart.y - dragCurrent.y) * POWER_MULT;
        
        const distSq = (dragStart.x - dragCurrent.x)**2 + (dragStart.y - dragCurrent.y)**2;
        if (distSq < 100) { 
            setDragStart(null);
            setTrajectory([]);
            return;
        }
        
        stateRef.current.ship.vx = vx;
        stateRef.current.ship.vy = vy;
        stateRef.current.gameState = 'fly';
        stateRef.current.trail = [];
        
        setGameState('fly');
        setDragStart(null);
        setTrajectory([]);
        setTrail([]);
        
        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    const shipAngle = gameState === 'aim' 
        ? (dragStart && dragCurrent ? Math.atan2(dragStart.y - dragCurrent.y, dragStart.x - dragCurrent.x) * 180 / Math.PI + 90 : 0)
        : Math.atan2(stateRef.current.ship.vy, stateRef.current.ship.vx) * 180 / Math.PI + 90;

    return (
        <div className="w-full h-full bg-[#0b1026] relative select-none font-sans overflow-hidden">
            <svg 
                width="100%" height="100%" 
                viewBox={`0 0 ${W} ${H}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="touch-none block"
            >
                {/* Stars */}
                {stars.map((s, i) => (
                    <circle key={`star-${i}`} cx={s.x} cy={s.y} r={s.r} fill="#ffffff" opacity={s.o} />
                ))}
                
                {/* Portal */}
                <g transform={`translate(${portal.x}, ${portal.y})`}>
                    <circle r={portal.r} stroke="#c4b5fd" strokeWidth="2" strokeDasharray="4 4" fill="none">
                        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
                    </circle>
                    <circle r={portal.r * 0.6} fill="#c4b5fd" fillOpacity="0.2">
                         <animate attributeName="fill-opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
                    </circle>
                </g>

                {/* Black Holes */}
                {blackHoles.map((bh, i) => (
                    <g key={`bh-${i}`}>
                        <circle cx={bh.x} cy={bh.y} r={bh.r * 3} stroke="#c4b5fd" strokeWidth="1" strokeDasharray="2 6" fill="none" opacity="0.2" />
                        <circle cx={bh.x} cy={bh.y} r={bh.r * 5} stroke="#c4b5fd" strokeWidth="1" strokeDasharray="2 8" fill="none" opacity="0.1" />
                        
                        <circle cx={bh.x} cy={bh.y} r={bh.r * 1.5} fill="url(#bh-glow)" />
                        
                        <ellipse cx={bh.x} cy={bh.y} rx={bh.r * 2} ry={bh.r * 0.4} stroke="#f9a8d4" strokeWidth="2" fill="none">
                            <animateTransform attributeName="transform" type="rotate" from={`0 ${bh.x} ${bh.y}`} to={`360 ${bh.x} ${bh.y}`} dur="3s" repeatCount="indefinite" />
                        </ellipse>
                        
                        <circle cx={bh.x} cy={bh.y} r={bh.r} fill="#000000" />
                    </g>
                ))}

                {/* Trajectory */}
                {trajectory.length > 0 && gameState === 'aim' && (
                    <polyline 
                        points={trajectory.map(p => `${p.x},${p.y}`).join(' ')} 
                        fill="none" 
                        stroke="#ffffff" 
                        strokeWidth="1.5" 
                        strokeDasharray="4 4" 
                        opacity="0.6" 
                    />
                )}

                {/* Aim Line */}
                {dragStart && dragCurrent && gameState === 'aim' && (
                    <line 
                        x1={shipPos.x} y1={shipPos.y} 
                        x2={shipPos.x - (dragCurrent.x - dragStart.x)} 
                        y2={shipPos.y - (dragCurrent.y - dragStart.y)} 
                        stroke="#f9a8d4" 
                        strokeWidth="2" 
                        opacity="0.5" 
                        strokeDasharray="2 2"
                    />
                )}

                {/* Trail */}
                {trail.length > 1 && gameState === 'fly' && (
                    <polyline 
                        points={trail.map(p => `${p.x},${p.y}`).join(' ')} 
                        fill="none" 
                        stroke="#7de8c3" 
                        strokeWidth="2" 
                        opacity="0.5" 
                    />
                )}

                {/* Ship */}
                {(gameState === 'aim' || gameState === 'fly') && (
                    <g transform={`translate(${shipPos.x}, ${shipPos.y}) rotate(${shipAngle})`}>
                        {gameState === 'fly' && (
                            <polygon points="-4,6 4,6 0,14" fill="#f9a8d4">
                                <animate attributeName="opacity" values="1;0.4;1" dur="0.1s" repeatCount="indefinite"/>
                            </polygon>
                        )}
                        <polygon points="0,-10 7,8 0,5 -7,8" fill="#7de8c3" />
                    </g>
                )}

                <defs>
                    <radialGradient id="bh-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#f9a8d4" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#0b1026" stopOpacity="0" />
                    </radialGradient>
                </defs>
            </svg>

            {/* Overlays */}
            {(gameState === 'aim' || gameState === 'fly') && (
                <div className="absolute top-4 left-4 pointer-events-none">
                    <p className="text-[#7de8c3] font-mono text-sm font-bold shadow-black drop-shadow-md">LEVEL {level}</p>
                    <p className="text-[#f9a8d4] font-mono text-sm font-bold shadow-black drop-shadow-md">SCORE {score}</p>
                </div>
            )}

            {gameState === 'aim' && !dragStart && (
                <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-[#c4b5fd] font-mono text-sm animate-pulse tracking-widest bg-[#0b1026]/50 inline-block px-4 py-1 rounded-full">
                        DRAG TO CALCULATE ESCAPE VECTOR
                    </p>
                </div>
            )}

            {gameState === 'start' && (
                <div className="absolute inset-0 bg-[#0b1026]/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#7de8c3] to-[#c4b5fd] mb-2 tracking-tighter text-center">EVENT<br/>HORIZON</h1>
                    <p className="text-[#f9a8d4] text-xs mb-8 text-center px-8 font-mono opacity-80">
                        Warning: Critical gravity detected.<br/>
                        Calculate escape velocity to reach the portal.
                    </p>
                    <button onClick={startGame} className="px-8 py-3 bg-[#7de8c3]/10 border border-[#7de8c3] text-[#7de8c3] rounded-full font-bold tracking-widest hover:bg-[#7de8c3] hover:text-[#0b1026] transition-all">
                        INITIATE
                    </button>
                </div>
            )}

            {gameState === 'success' && (
                <div className="absolute inset-0 bg-[#0b1026]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <h2 className="text-[#7de8c3] text-4xl font-black mb-2 tracking-widest">ESCAPED</h2>
                    <p className="text-white font-mono mb-8 text-sm">SCORE: {score}</p>
                    <button onClick={nextLevel} className="px-8 py-3 bg-[#7de8c3] text-[#0b1026] rounded-full font-bold tracking-widest hover:brightness-125 transition-all shadow-[0_0_20px_#7de8c3]">
                        NEXT JUMP
                    </button>
                </div>
            )}

            {gameState === 'gameover' && (
                <div className="absolute inset-0 bg-[#0b1026]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <h2 className="text-[#f9a8d4] text-3xl font-black mb-2 tracking-widest text-center">SPAGHETTIFIED</h2>
                    <p className="text-white font-mono mb-8 text-sm">FINAL SCORE: {score}</p>
                    <button onClick={startGame} className="px-8 py-3 bg-[#f9a8d4]/10 border border-[#f9a8d4] text-[#f9a8d4] rounded-full font-bold tracking-widest hover:bg-[#f9a8d4] hover:text-[#0b1026] transition-all">
                        RETRY
                    </button>
                </div>
            )}
        </div>
    );
}
