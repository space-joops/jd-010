"use client";

import { useEffect, useState, useRef } from "react";
import PetSvg from "./PetSvg";

type Debris = {
  id: number;
  x: number;
  y: number;
  size: number;
};

export default function DoodleGame({ onFinish }: { onFinish?: (score: number) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [debrisList, setDebrisList] = useState<Debris[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setScore(0);
    setTimeLeft(15);
    setDebrisList([]);
    setIsPlaying(true);
    setIsGameOver(false);
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      
      if (debrisList.length < 6) {
        spawnRef.current = setTimeout(() => {
          setDebrisList(prev => [
            ...prev,
            {
              id: Date.now(),
              x: 10 + Math.random() * 80,
              y: 15 + Math.random() * 70,
              size: 30 + Math.random() * 20
            }
          ]);
        }, 200 + Math.random() * 400);
      }
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      setIsGameOver(true);
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (spawnRef.current) clearTimeout(spawnRef.current);
    };
  }, [isPlaying, timeLeft, debrisList.length]);

  const handleCatch = (id: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent double trigger on touch devices
    e.stopPropagation();
    if (!isPlaying) return;
    setDebrisList(prev => prev.filter(d => d.id !== id));
    setScore(s => s + 1);
  };

  return (
    <div className="relative w-full max-w-[430px] mx-auto h-[450px] bg-gradient-to-b from-[#0b1026] to-[#241a4d] rounded-2xl overflow-hidden shadow-2xl border border-white/10 select-none">
      {/* Background Simple Stars */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div 
            key={i} 
            className="absolute bg-[#ffe9a8] rounded-full w-1 h-1" 
            style={{ top: `${(i * 17) % 100}%`, left: `${(i * 31) % 100}%` }} 
          />
        ))}
      </div>

      {/* Score & Time UI */}
      <div className="absolute top-4 left-4 right-4 flex justify-between text-white font-bold z-10">
        <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm border border-white/10">정화량: {score}</span>
        <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm text-[#7de8c3] border border-[#7de8c3]/30">{timeLeft}초</span>
      </div>

      {/* Astropet (Center) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 pointer-events-none opacity-90">
        <PetSvg className={`w-full h-full drop-shadow-2xl ${isPlaying ? "animate-pulse" : ""}`} />
      </div>

      {/* Falling/Spawning Debris */}
      {debrisList.map(d => (
        <button
          key={d.id}
          onMouseDown={(e) => handleCatch(d.id, e)}
          onTouchStart={(e) => handleCatch(d.id, e)}
          className="absolute bg-[#c4b5fd] rounded-sm flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform cursor-pointer outline-none"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            transform: 'rotate(45deg)'
          }}
        >
          <span className="text-[12px] -rotate-45 block">🛰️</span>
        </button>
      ))}

      {/* Overlay */}
      {(!isPlaying || isGameOver) && (
        <div className="absolute inset-0 bg-[#0b1026]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
          {!isGameOver ? (
            <>
              <h3 className="text-2xl font-bold text-white mb-2">우주 정화 미니게임</h3>
              <p className="text-[#f9a8d4] text-sm mb-8 leading-relaxed">아스트로펫을 도와 15초 동안<br/>우주 쓰레기를 터치해 치워주세요!</p>
              <button 
                onClick={startGame}
                className="bg-[#7de8c3] text-[#0b1026] font-bold py-3.5 px-10 rounded-xl shadow-lg hover:bg-white transition-all transform hover:scale-105 active:scale-95"
              >
                게임 시작
              </button>
            </>
          ) : (
            <>
              <h3 className="text-3xl font-bold text-white mb-2">수고하셨습니다!</h3>
              <p className="text-[#7de8c3] text-lg mb-8">총 {score}개의 쓰레기를 정화했어요 ✨</p>
              
              <button 
                onClick={startGame}
                className="w-full max-w-[200px] border-2 border-[#7de8c3] text-[#7de8c3] font-bold py-3 px-6 rounded-xl mb-3 hover:bg-[#7de8c3]/10 transition-colors"
              >
                다시 하기
              </button>
              
              <button 
                onClick={() => onFinish && onFinish(score)}
                className="w-full max-w-[200px] bg-[#f9a8d4] text-[#0b1026] font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-white transition-colors"
              >
                알림 신청하기
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
