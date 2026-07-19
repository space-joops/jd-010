"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";

const G = 0.1;
const PREDICT_STEPS = 70;

const LEVELS = [
  {
    start: { x: 40, y: 310 },
    target: { x: 390, y: 40, radius: 15 },
    planets: [
      { x: 215, y: 175, radius: 35, mass: 4000, color: "#f9a8d4" }
    ]
  },
  {
    start: { x: 40, y: 175 },
    target: { x: 390, y: 175, radius: 15 },
    planets: [
      { x: 215, y: 80, radius: 30, mass: 3000, color: "#c4b5fd" },
      { x: 215, y: 270, radius: 30, mass: 3000, color: "#c4b5fd" }
    ]
  },
  {
    start: { x: 40, y: 310 },
    target: { x: 215, y: 40, radius: 15 },
    planets: [
      { x: 150, y: 220, radius: 25, mass: 2500, color: "#f9a8d4" },
      { x: 280, y: 140, radius: 35, mass: 3500, color: "#7de8c3" }
    ]
  },
  {
    start: { x: 390, y: 310 },
    target: { x: 40, y: 40, radius: 15 },
    planets: [
      { x: 300, y: 200, radius: 20, mass: 2000, color: "#c4b5fd" },
      { x: 130, y: 150, radius: 40, mass: 5000, color: "#f9a8d4" },
      { x: 250, y: 60, radius: 15, mass: 1500, color: "#7de8c3" }
    ]
  }
];

export default function Game() {
    const [gameState, setGameState] = useState("start");
    const [levelIndex, setLevelIndex] = useState(0);
    const [fuel, setFuel] = useState(200);
    const [angle, setAngle] = useState(45);
    const [power, setPower] = useState(50);
    
    const [shipPos, setShipPos] = useState({x: 0, y: 0});
    const [shipTrail, setShipTrail] = useState<{x:number, y:number}[]>([]);
    
    const requestRef = useRef<number | null>(null);
    const shipStateRef = useRef({x: 0, y: 0, vx: 0, vy: 0});

    const stars = useMemo(() => Array.from({length: 80}).map(() => ({
        x: Math.random() * 430,
        y: Math.random() * 350,
        r: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.3
    })), []);

    const prediction = useMemo(() => {
        if (gameState !== "playing") return [];
        
        const level = LEVELS[levelIndex];
        let x = level.start.x;
        let y = level.start.y;
        const rad = (angle * Math.PI) / 180;
        let vx = Math.cos(rad) * (power / 10);
        let vy = -Math.sin(rad) * (power / 10);
        
        const path = [];
        for (let i = 0; i < PREDICT_STEPS; i++) {
            path.push({x, y});
            
            let ax = 0; let ay = 0;
            for (const p of level.planets) {
                const dx = p.x - x;
                const dy = p.y - y;
                const distSq = dx*dx + dy*dy;
                const dist = Math.sqrt(distSq);
                if (dist > p.radius) {
                    const f = (G * p.mass) / distSq;
                    ax += f * (dx / dist);
                    ay += f * (dy / dist);
                }
            }
            vx += ax; vy += ay;
            x += vx; y += vy;
            
            let crashed = false;
            for (const p of level.planets) {
                const dx = p.x - x; const dy = p.y - y;
                if (Math.sqrt(dx*dx + dy*dy) < p.radius + 4) crashed = true;
            }
            if (crashed) break;
            
            const tx = level.target.x - x; const ty = level.target.y - y;
            if (Math.sqrt(tx*tx + ty*ty) < level.target.radius + 4) {
                path.push({x, y});
                break;
            }
        }
        return path;
    }, [angle, power, levelIndex, gameState]);

    const gameLoop = () => {
        const level = LEVELS[levelIndex];
        let { x, y, vx, vy } = shipStateRef.current;
        
        let ax = 0; let ay = 0;
        for (const p of level.planets) {
            const dx = p.x - x;
            const dy = p.y - y;
            const distSq = dx*dx + dy*dy;
            const dist = Math.sqrt(distSq);
            if (dist > 5) {
                const f = (G * p.mass) / distSq;
                ax += f * (dx / dist);
                ay += f * (dy / dist);
            }
        }
        vx += ax; vy += ay;
        x += vx; y += vy;
        
        shipStateRef.current = { x, y, vx, vy };
        
        setShipPos({x, y});
        setShipTrail(prev => {
            const newTrail = [...prev, {x, y}];
            if (newTrail.length > 300) newTrail.shift();
            return newTrail;
        });
        
        const tx = level.target.x - x;
        const ty = level.target.y - y;
        if (Math.sqrt(tx*tx + ty*ty) < level.target.radius + 4) {
            setGameState("level_cleared");
            return;
        }
        
        for (const p of level.planets) {
            const px = p.x - x;
            const py = p.y - y;
            if (Math.sqrt(px*px + py*py) < p.radius + 4) {
                setGameState("game_over");
                return;
            }
        }
        
        if (x < -100 || x > 530 || y < -100 || y > 450) {
            setGameState("game_over");
            return;
        }
        
        requestRef.current = requestAnimationFrame(gameLoop);
    };

    useEffect(() => {
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const launch = () => {
        if (fuel < power) return;
        setFuel(f => f - power);
        setGameState("launched");
        setShipTrail([]);
        
        const rad = (angle * Math.PI) / 180;
        shipStateRef.current = {
            x: LEVELS[levelIndex].start.x,
            y: LEVELS[levelIndex].start.y,
            vx: Math.cos(rad) * (power / 10),
            vy: -Math.sin(rad) * (power / 10)
        };
        
        requestRef.current = requestAnimationFrame(gameLoop);
    };

    const resetGame = () => {
        setLevelIndex(0);
        setFuel(200);
        setGameState("playing");
        setAngle(45);
        setPower(50);
        setShipTrail([]);
    };

    const currentLevel = LEVELS[levelIndex];
    const shipX = gameState === "playing" ? currentLevel.start.x : shipPos.x;
    const shipY = gameState === "playing" ? currentLevel.start.y : shipPos.y;
    const shipRot = gameState === "playing" 
        ? -angle 
        : (Math.atan2(shipStateRef.current.vy, shipStateRef.current.vx) * 180 / Math.PI);

    return (
        <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] sm:rounded-2xl shadow-2xl sm:border border-[#131b3e] flex flex-col font-sans">
            <div className="flex-1 w-full relative">
                <svg width="100%" height="100%" viewBox="0 0 430 350" style={{ display: "block" }}>
                    <defs>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    
                    {/* Stars */}
                    {stars.map((s, i) => (
                        <circle key={"star" + i} cx={s.x} cy={s.y} r={s.r} fill="#ffffff" opacity={s.opacity} />
                    ))}
                    
                    {/* Start Base */}
                    <circle cx={currentLevel.start.x} cy={currentLevel.start.y} r={12} fill="none" stroke="#4b5563" strokeWidth="2" strokeDasharray="2 2" />
                    
                    {/* Planets */}
                    {currentLevel.planets.map((p, i) => (
                        <g key={"planet" + i}>
                            <circle cx={p.x} cy={p.y} r={p.radius + 10} fill={p.color} opacity="0.1" filter="url(#glow)" />
                            <circle cx={p.x} cy={p.y} r={p.radius} fill={p.color} />
                            <circle cx={p.x - p.radius * 0.3} cy={p.y - p.radius * 0.2} r={p.radius * 0.2} fill="#000000" opacity="0.15" />
                            <circle cx={p.x + p.radius * 0.4} cy={p.y + p.radius * 0.3} r={p.radius * 0.15} fill="#000000" opacity="0.1" />
                        </g>
                    ))}
                    
                    {/* Target */}
                    <g>
                        <circle cx={currentLevel.target.x} cy={currentLevel.target.y} r={currentLevel.target.radius + 8} fill="none" stroke="#7de8c3" strokeWidth="1" strokeDasharray="3 3">
                            <animateTransform attributeName="transform" type="rotate" from={"0 " + currentLevel.target.x + " " + currentLevel.target.y} to={"360 " + currentLevel.target.x + " " + currentLevel.target.y} dur="5s" repeatCount="indefinite" />
                        </circle>
                        <circle cx={currentLevel.target.x} cy={currentLevel.target.y} r={currentLevel.target.radius} fill="none" stroke="#7de8c3" strokeWidth="2" />
                        <circle cx={currentLevel.target.x} cy={currentLevel.target.y} r={currentLevel.target.radius - 6} fill="#7de8c3" filter="url(#glow)" opacity="0.8">
                            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
                        </circle>
                    </g>
                    
                    {/* Prediction */}
                    {gameState === "playing" && prediction.length > 0 && (
                        <polyline 
                            points={prediction.map(p => p.x + "," + p.y).join(" ")} 
                            fill="none" 
                            stroke="#ffffff" 
                            strokeWidth="2" 
                            strokeDasharray="4 4" 
                            opacity="0.4" 
                        />
                    )}
                    
                    {/* Trail */}
                    {gameState === "launched" && shipTrail.length > 1 && (
                        <polyline 
                            points={shipTrail.map(p => p.x + "," + p.y).join(" ")} 
                            fill="none" 
                            stroke="#7de8c3" 
                            strokeWidth="2" 
                            opacity="0.8" 
                        />
                    )}
                    
                    {/* Ship */}
                    {(gameState === "playing" || gameState === "launched") && (
                        <g transform={"translate(" + shipX + ", " + shipY + ") rotate(" + shipRot + ")"}>
                            <polygon points="-6,-5 8,0 -6,5" fill="#ffffff" filter="url(#glow)"/>
                            {gameState === "launched" && (
                                <polygon points="-6,-3 -12,0 -6,3" fill="#f9a8d4" opacity="0.8">
                                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.2s" repeatCount="indefinite" />
                                </polygon>
                            )}
                        </g>
                    )}
                </svg>
                
                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center pointer-events-none">
                    <div className="bg-[#131b3e]/80 backdrop-blur-sm px-4 py-2 rounded-full border border-[#c4b5fd]/30">
                        <span className="text-[#c4b5fd] font-bold text-sm">MISSION {levelIndex + 1} / {LEVELS.length}</span>
                    </div>
                    <div className="bg-[#131b3e]/80 backdrop-blur-sm px-4 py-2 rounded-full border border-[#f9a8d4]/30 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#f9a8d4] animate-pulse"></div>
                        <span className="text-[#f9a8d4] font-bold text-sm">FUEL: {fuel}</span>
                    </div>
                </div>
            </div>
            
            <div className="h-[150px] shrink-0 w-full bg-[#131b3e] p-5 shadow-[0_-10px_30px_rgba(11,16,38,0.5)] border-t border-[#c4b5fd]/20 relative z-20">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <span className="text-[#c4b5fd] text-sm w-12 font-bold">Angle</span>
                        <input 
                            type="range" min="0" max="360" value={angle} 
                            onChange={e => setAngle(Number(e.target.value))}
                            className="flex-1 h-2 bg-[#0b1026] rounded-lg cursor-pointer"
                            style={{ accentColor: "#c4b5fd" }}
                            disabled={gameState !== "playing"}
                        />
                        <span className="text-white text-sm w-8 text-right font-mono">{angle}°</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[#f9a8d4] text-sm w-12 font-bold">Power</span>
                        <input 
                            type="range" min="10" max="100" value={power} 
                            onChange={e => setPower(Number(e.target.value))}
                            className="flex-1 h-2 bg-[#0b1026] rounded-lg cursor-pointer"
                            style={{ accentColor: "#f9a8d4" }}
                            disabled={gameState !== "playing"}
                        />
                        <span className="text-white text-sm w-8 text-right font-mono">{power}</span>
                    </div>
                    <button 
                        onClick={launch}
                        disabled={gameState !== "playing" || fuel < power}
                        className={"w-full mt-1 py-2.5 font-black text-lg rounded-xl transition-all " + (
                            gameState === "playing" && fuel >= power
                                ? "bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] text-[#0b1026] shadow-[0_0_15px_rgba(125,232,195,0.4)] hover:scale-[1.02]"
                                : "bg-[#0b1026] text-gray-500 cursor-not-allowed"
                        )}
                    >
                        {gameState === "playing" ? "LAUNCH (-" + power + " FUEL)" : "CALCULATING..."}
                    </button>
                </div>
            </div>

            {/* Overlays */}
            {gameState === "start" && (
                <div className="absolute inset-0 z-50 bg-[#0b1026] flex flex-col items-center justify-center p-6 text-center border-4 border-[#131b3e] sm:rounded-xl">
                    <div className="w-20 h-20 mb-6 relative">
                        <svg viewBox="0 0 100 100" style={{ animation: "spin 4s linear infinite" }}>
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#7de8c3" strokeWidth="4" strokeDasharray="20 10" />
                            <circle cx="50" cy="50" r="20" fill="#f9a8d4" />
                        </svg>
                        <style>{"@keyframes spin { 100% { transform: rotate(360deg); } }"}</style>
                    </div>
                    <h1 className="text-4xl font-black text-[#7de8c3] mb-2 tracking-tighter">
                        D34
                    </h1>
                    <h2 className="text-xl font-bold text-white mb-4">GRAVITY ASSIST</h2>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                        중력을 이용해 스윙바이 궤도를 계산하세요.<br/>
                        연료를 아끼며 모든 목적지에 도달해야 합니다.
                    </p>
                    <button 
                        onClick={() => setGameState("playing")}
                        className="px-8 py-4 bg-white text-[#0b1026] font-black text-lg rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform"
                    >
                        START MISSION
                    </button>
                </div>
            )}

            {gameState === "game_over" && fuel >= 10 && (
                <div className="absolute inset-0 bg-[#0b1026]/80 flex flex-col items-center justify-center p-6 text-center z-40 backdrop-blur-sm">
                    <h2 className="text-3xl font-bold text-[#f9a8d4] mb-4">MISSION FAILED</h2>
                    <p className="text-white mb-6">궤도를 이탈했거나 충돌했습니다.</p>
                    <button 
                        onClick={() => {
                            setGameState("playing");
                            setShipTrail([]);
                        }}
                        className="px-6 py-3 bg-[#c4b5fd] text-[#0b1026] font-bold rounded-full hover:scale-105 transition-transform"
                    >
                        RETRY
                    </button>
                </div>
            )}

            {(gameState === "game_over" && fuel < 10) && (
                <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center p-6 text-center z-50">
                    <h2 className="text-4xl font-black text-white mb-4">OUT OF FUEL</h2>
                    <p className="text-red-200 mb-8">더 이상 엔진을 가동할 수 없습니다...</p>
                    <button 
                        onClick={resetGame}
                        className="px-6 py-3 bg-white text-red-900 font-bold rounded-full hover:scale-105 transition-transform"
                    >
                        RESTART GAME
                    </button>
                </div>
            )}

            {gameState === "level_cleared" && (
                <div className="absolute inset-0 bg-[#0b1026]/80 flex flex-col items-center justify-center p-6 text-center z-40 backdrop-blur-sm">
                    <h2 className="text-3xl font-bold text-[#7de8c3] mb-4">TARGET REACHED!</h2>
                    <p className="text-white mb-6">훌륭한 궤도 계산입니다.</p>
                    <button 
                        onClick={() => {
                            if (levelIndex + 1 < LEVELS.length) {
                                setLevelIndex(l => l + 1);
                                setGameState("playing");
                                setAngle(45);
                                setPower(50);
                                setShipTrail([]);
                            } else {
                                setGameState("all_cleared");
                            }
                        }}
                        className="px-6 py-3 bg-[#7de8c3] text-[#0b1026] font-bold rounded-full hover:scale-105 transition-transform"
                    >
                        NEXT MISSION
                    </button>
                </div>
            )}

            {gameState === "all_cleared" && (
                <div className="absolute inset-0 bg-[#0b1026]/90 flex flex-col items-center justify-center p-6 text-center z-50">
                    <h2 className="text-4xl font-black text-[#f9a8d4] mb-4">MISSION ACCOMPLISHED</h2>
                    <p className="text-white mb-6">모든 궤도 비행을 성공적으로 마쳤습니다!</p>
                    <div className="text-2xl font-bold text-[#7de8c3] mb-8">
                        남은 연료: {fuel}
                    </div>
                    <button 
                        onClick={resetGame}
                        className="px-6 py-3 bg-white text-[#0b1026] font-bold rounded-full hover:scale-105 transition-transform"
                    >
                        PLAY AGAIN
                    </button>
                </div>
            )}
        </div>
    );
}
