"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// Types
type GameState = "start" | "playing" | "end";

type Debris = {
  id: number;
  x: number;
  y: number;
  vx: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
};

type Net = {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  state: "idle" | "shooting" | "expanding" | "retracting";
  progress: number;
};

const GAME_WIDTH = 430;
const GAME_HEIGHT = 500;
const NET_SPEED = 600; 
const SATELLITE_Y = GAME_HEIGHT - 60;
const SATELLITE_X = GAME_WIDTH / 2;
const COLORS = ["#7de8c3", "#f9a8d4", "#c4b5fd", "#ffffff"];

export default function Game() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number>(0);

  const [debrisList, setDebrisList] = useState<Debris[]>([]);
  const [net, setNet] = useState<Net>({ active: false, x: SATELLITE_X, y: SATELLITE_Y, radius: 10, state: "idle", progress: 0 });

  const debrisRef = useRef<Debris[]>([]);
  const netRef = useRef<Net>({ active: false, x: SATELLITE_X, y: SATELLITE_Y, radius: 10, state: "idle", progress: 0 });
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(30);
  const gameStateRef = useRef<GameState>("start");

  useEffect(() => { debrisRef.current = debrisList; }, [debrisList]);
  useEffect(() => { netRef.current = net; }, [net]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setTimeLeft(30);
    setDebrisList([]);
    setNet({ active: false, x: SATELLITE_X, y: SATELLITE_Y, radius: 10, state: "idle", progress: 0 });
    
    scoreRef.current = 0;
    timeLeftRef.current = 30;
    debrisRef.current = [];
    spawnTimerRef.current = 0;
    gameStateRef.current = "playing";
  };

  const fireNet = () => {
    if (gameStateRef.current !== "playing" || netRef.current.state !== "idle") return;
    
    setNet({
      active: true,
      x: SATELLITE_X,
      y: SATELLITE_Y,
      radius: 15,
      state: "shooting",
      progress: 0
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    fireNet();
  };

  const update = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined && previousTimeRef.current !== null) {
      const deltaTime = (time - previousTimeRef.current) / 1000;
      
      if (gameStateRef.current === "playing") {
        spawnTimerRef.current += deltaTime;
        if (spawnTimerRef.current > 0.8) {
          spawnTimerRef.current = 0;
          const isLeft = Math.random() > 0.5;
          const newDebris: Debris = {
            id: Math.random(),
            x: isLeft ? -50 : GAME_WIDTH + 50,
            y: 50 + Math.random() * (GAME_HEIGHT - 200),
            vx: (isLeft ? 1 : -1) * (100 + Math.random() * 150),
            size: 15 + Math.random() * 20,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 360,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
          };
          debrisRef.current = [...debrisRef.current, newDebris];
        }

        debrisRef.current = debrisRef.current.map(d => ({
          ...d,
          x: d.x + d.vx * deltaTime,
          rotation: d.rotation + d.rotationSpeed * deltaTime
        })).filter(d => d.x > -100 && d.x < GAME_WIDTH + 100);

        let currentNet = { ...netRef.current };
        if (currentNet.state === "shooting") {
          currentNet.y -= NET_SPEED * deltaTime;
          if (currentNet.y < 50) {
            currentNet.state = "expanding";
          }
        } else if (currentNet.state === "expanding") {
          currentNet.progress += deltaTime * 5;
          currentNet.radius = 15 + currentNet.progress * 60;
          if (currentNet.progress >= 1) {
            currentNet.state = "retracting";
            currentNet.progress = 0;
          }
        } else if (currentNet.state === "retracting") {
          currentNet.progress += deltaTime * 5;
          currentNet.radius = 75 - currentNet.progress * 75;
          if (currentNet.progress >= 1) {
            currentNet.state = "idle";
            currentNet.active = false;
            currentNet.y = SATELLITE_Y;
          }
        }

        if (currentNet.state === "expanding" || currentNet.state === "retracting") {
          debrisRef.current = debrisRef.current.filter(d => {
            const dx = d.x - currentNet.x;
            const dy = d.y - currentNet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < currentNet.radius + d.size / 2) {
              scoreRef.current += 10;
              setScore(scoreRef.current);
              return false;
            }
            return true;
          });
        }

        setDebrisList(debrisRef.current);
        setNet(currentNet);

        const newTimeLeft = timeLeftRef.current - deltaTime;
        if (newTimeLeft <= 0) {
          setGameState("end");
          setTimeLeft(0);
        } else {
          setTimeLeft(newTimeLeft);
        }
      }
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(update);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [update]);

  return (
    <div className="max-w-[430px] mx-auto h-[500px] relative overflow-hidden bg-[#0b1026] text-white font-sans select-none" onPointerDown={handlePointerDown}>
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: (Math.random() * 3 + 1) + "px",
              height: (Math.random() * 3 + 1) + "px",
              left: (Math.random() * 100) + "%",
              top: (Math.random() * 100) + "%",
              opacity: Math.random() * 0.5 + 0.2,
              animationDelay: (Math.random() * 2) + "s",
              animationDuration: (Math.random() * 2 + 2) + "s"
            }}
          />
        ))}
      </div>

      <div className="absolute top-4 left-4 z-10">
        <div className="text-[#7de8c3] font-bold text-xl drop-shadow-[0_0_5px_#7de8c3]">SCORE: {score}</div>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <div className="text-[#f9a8d4] font-bold text-xl drop-shadow-[0_0_5px_#f9a8d4]">TIME: {Math.ceil(timeLeft)}</div>
      </div>

      {gameState === "playing" && (
        <>
          {debrisList.map(d => (
            <div
              key={d.id}
              className="absolute"
              style={{
                left: d.x,
                top: d.y,
                width: d.size,
                height: d.size,
                transform: "translate(-50%, -50%) rotate(" + d.rotation + "deg)",
                color: d.color
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full drop-shadow-[0_0_8px_currentColor]">
                {d.size % 3 < 1 ? (
                  <path d="M12 2L2 22h20L12 2z" />
                ) : d.size % 3 < 2 ? (
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                ) : (
                  <circle cx="12" cy="12" r="10" />
                )}
              </svg>
            </div>
          ))}

          {net.active && (
            <div
              className="absolute rounded-full border-2 border-[#7de8c3] flex items-center justify-center transition-all"
              style={{
                left: net.x,
                top: net.y,
                width: net.radius * 2,
                height: net.radius * 2,
                transform: "translate(-50%, -50%)",
                opacity: net.state === "shooting" ? 0.8 : (1 - net.progress) * 0.8,
                backgroundColor: "rgba(125, 232, 195, 0.1)",
                boxShadow: "0 0 15px #7de8c3, inset 0 0 10px #7de8c3"
              }}
            >
              {(net.state === "expanding" || net.state === "retracting") && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <path d="M0,50 Q25,25 50,0 T100,50 T50,100 T0,50" fill="none" stroke="#7de8c3" strokeWidth="1" strokeDasharray="4 2" />
                  <path d="M25,25 Q50,50 75,25 T75,75 T25,75 T25,25" fill="none" stroke="#7de8c3" strokeWidth="1" strokeDasharray="2 4" />
                </svg>
              )}
            </div>
          )}

          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: SATELLITE_X, top: SATELLITE_Y, width: 60, height: 60 }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_#c4b5fd]">
              <rect x="40" y="30" width="20" height="50" fill="#c4b5fd" />
              <polygon points="50,10 60,30 40,30" fill="#7de8c3" />
              <rect x="10" y="40" width="25" height="15" fill="#f9a8d4" className="animate-pulse" />
              <rect x="65" y="40" width="25" height="15" fill="#f9a8d4" className="animate-pulse" />
              <line x1="35" y1="47.5" x2="40" y2="47.5" stroke="#fff" strokeWidth="2" />
              <line x1="60" y1="47.5" x2="65" y2="47.5" stroke="#fff" strokeWidth="2" />
            </svg>
          </div>
        </>
      )}

      {(gameState === "start" || gameState === "end") && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-20">
          <div className="text-center bg-[#0b1026]/90 border border-[#c4b5fd] p-8 rounded-2xl shadow-[0_0_30px_rgba(196,181,253,0.3)]">
            <h1 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#7de8c3] via-[#c4b5fd] to-[#f9a8d4]">
              SPACE NET<br/>CATCHER
            </h1>
            <p className="text-[#c4b5fd] mb-6 text-sm">Tap the screen to shoot nets and catch space debris!</p>
            
            {gameState === "end" && (
              <div className="mb-6 p-4 bg-white/10 rounded-xl border border-[#f9a8d4]/30">
                <p className="text-gray-300 mb-1">Final Score</p>
                <p className="text-4xl font-bold text-[#f9a8d4] drop-shadow-[0_0_8px_#f9a8d4]">{score}</p>
              </div>
            )}

            <button
              className="pointer-events-auto px-8 py-3 bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] text-[#0b1026] font-bold rounded-full hover:scale-105 active:scale-95 transition-transform shadow-[0_0_15px_#7de8c3]"
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
            >
              {gameState === "start" ? "START MISSION" : "PLAY AGAIN"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
