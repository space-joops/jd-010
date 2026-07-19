'use client';

import React, { useState } from 'react';

type GameState = 'START' | 'PLAYING' | 'GAME_OVER' | 'VICTORY';

interface System {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
}

interface Scenario {
  day: number;
  title: string;
  description: string;
  totalPower: number;
  requirements: Record<string, number>;
}

const SYSTEMS: System[] = [
  {
    id: 'life',
    name: '생명 유지',
    color: '#7de8c3',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
      </svg>
    ),
  },
  {
    id: 'heat',
    name: '온도 제어',
    color: '#f9a8d4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
      </svg>
    ),
  },
  {
    id: 'comms',
    name: '외부 통신',
    color: '#c4b5fd',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11a9 9 0 0 1 9 9" />
        <path d="M4 4a16 16 0 0 1 16 16" />
        <circle cx="5" cy="19" r="1" />
      </svg>
    ),
  },
  {
    id: 'shield',
    name: '보호막',
    color: '#38bdf8',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  }
];

const SCENARIOS: Scenario[] = [
  {
    day: 1,
    title: '안정적인 시작',
    description: '달 기지에 오신 것을 환영합니다. 기본 시스템이 안정적으로 가동될 수 있도록 전력을 분배하세요.',
    totalPower: 100,
    requirements: { life: 30, heat: 20, comms: 10, shield: 10 },
  },
  {
    day: 2,
    title: '소규모 운석우',
    description: '기지 근처로 운석우가 떨어지고 있습니다. 보호막에 충분한 전력을 공급하여 기지를 보호하세요.',
    totalPower: 100,
    requirements: { life: 30, heat: 20, comms: 10, shield: 40 },
  },
  {
    day: 3,
    title: '태양광 패널 오염',
    description: '달 표면의 먼지로 인해 태양광 패널의 효율이 감소했습니다. 제한된 전력으로 버티세요.',
    totalPower: 80,
    requirements: { life: 30, heat: 30, comms: 10, shield: 10 },
  },
  {
    day: 4,
    title: '본부 긴급 통신',
    description: '지구 본부에서 중요한 데이터 전송을 요청했습니다. 통신 시스템 출력을 최대로 높이세요.',
    totalPower: 90,
    requirements: { life: 30, heat: 20, comms: 40, shield: 0 },
  },
  {
    day: 5,
    title: '대형 모래폭풍',
    description: '관측 사상 최대 규모의 모래폭풍이 기지를 덮칩니다! 모든 에너지를 생존에 집중하세요.',
    totalPower: 70,
    requirements: { life: 40, heat: 30, comms: 0, shield: 0 },
  }
];

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [allocations, setAllocations] = useState<Record<string, number>>({ life: 0, heat: 0, comms: 0, shield: 0 });
  const [score, setScore] = useState(0);
  const [failMessage, setFailMessage] = useState('');

  const scenario = SCENARIOS[currentDayIndex];
  const currentAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remainingPower = scenario ? scenario.totalPower - currentAllocated : 0;

  const handleAllocationChange = (id: string, newVal: number) => {
    const totalOthers = currentAllocated - allocations[id];
    const maxAllowed = scenario.totalPower - totalOthers;
    const finalVal = Math.min(newVal, maxAllowed);
    setAllocations(prev => ({ ...prev, [id]: finalVal }));
  };

  const handleEngage = () => {
    for (const sys of SYSTEMS) {
      if (allocations[sys.id] < scenario.requirements[sys.id]) {
        setFailMessage(`[경고] ${sys.name} 전력 부족! 기지 기능이 정지되었습니다.`);
        setGameState('GAME_OVER');
        return;
      }
    }

    const earnedScore = 100 + remainingPower * 10;
    setScore(prev => prev + earnedScore);

    if (currentDayIndex < SCENARIOS.length - 1) {
      setCurrentDayIndex(prev => prev + 1);
      setAllocations({ life: 0, heat: 0, comms: 0, shield: 0 });
    } else {
      setGameState('VICTORY');
    }
  };

  const resetGame = () => {
    setGameState('START');
    setCurrentDayIndex(0);
    setScore(0);
    setAllocations({ life: 0, heat: 0, comms: 0, shield: 0 });
    setFailMessage('');
  };

  return (
    <div className="w-full h-full bg-[#0b1026] font-sans selection:bg-[#7de8c3]/30">
      {gameState === 'START' && (
        <div className="p-6 h-full flex flex-col justify-center items-center text-center">
          <div className="w-24 h-24 text-[#7de8c3] mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] mb-4 tracking-tight">
            LUNAR BASE<br/>POWER MGMT
          </h1>
          <p className="text-white/60 mb-10 text-sm max-w-[280px] leading-relaxed">
            달 기지의 관리자가 되어 한정된 전력을 각 시스템에 분배하세요. 모든 위협으로부터 기지를 5일간 생존시켜야 합니다.
          </p>
          <button 
            onClick={() => setGameState('PLAYING')}
            className="px-10 py-4 rounded-full bg-[#f9a8d4] text-[#0b1026] font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(249,168,212,0.4)]"
          >
            SYSTEM START
          </button>
        </div>
      )}

      {gameState === 'PLAYING' && scenario && (
        <div className="p-5 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-5">
            <div>
              <h2 className="text-[#7de8c3] font-black text-xl tracking-wider">DAY {scenario.day}</h2>
              <p className="text-xs text-white/60 mt-1 uppercase tracking-widest">{scenario.title}</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-white/50 mb-1 tracking-widest">TOTAL POWER</div>
              <div className="text-2xl font-mono text-[#f9a8d4] font-bold">{scenario.totalPower} <span className="text-sm">kW</span></div>
            </div>
          </div>

          {/* Scenario Description */}
          <div className="bg-[#121833] p-4 rounded-xl mb-6 border border-[#2a345c] text-sm text-white/80 leading-relaxed shadow-lg">
            {scenario.description}
          </div>

          {/* System Controls */}
          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            {SYSTEMS.map(sys => {
              const allocation = allocations[sys.id];
              const requirement = scenario.requirements[sys.id];
              const isMet = allocation >= requirement;

              return (
                <div key={sys.id} className="relative">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5" style={{ color: sys.color }}>
                        {sys.icon}
                      </div>
                      <span className="font-semibold text-white/90 text-sm">{sys.name}</span>
                    </div>
                    <div className="font-mono text-xs">
                      <span className="font-bold text-lg" style={{ color: isMet ? sys.color : '#fff' }}>{allocation}</span> 
                      <span className="text-white/40"> / {requirement} kW</span>
                    </div>
                  </div>
                  
                  <div className="relative w-full h-8 bg-[#121833] rounded-lg overflow-hidden border border-[#2a345c]">
                    {/* Requirement Marker */}
                    <div 
                      className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10" 
                      style={{ left: `${requirement}%` }}
                    />
                    <div 
                      className="absolute top-0 bottom-0 w-full bg-red-500/10 z-0" 
                      style={{ width: `${requirement}%` }}
                    />
                    
                    {/* Allocated Fill */}
                    <div 
                      className="absolute top-0 bottom-0 left-0 transition-all duration-200 ease-out z-0" 
                      style={{ width: `${allocation}%`, backgroundColor: sys.color }} 
                    />
                    
                    {/* Invisible Input */}
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="5"
                      value={allocation}
                      onChange={(e) => handleAllocationChange(sys.id, parseInt(e.target.value))}
                      className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-5 mt-auto">
            <div className="flex justify-between items-center mb-4 bg-[#121833] p-3 rounded-lg border border-[#2a345c]">
              <span className="text-xs text-white/50 tracking-widest font-semibold">REMAINING POWER</span>
              <span className={`text-xl font-mono font-bold ${remainingPower > 0 ? 'text-[#c4b5fd]' : remainingPower === 0 ? 'text-white' : 'text-red-400'}`}>
                {remainingPower} kW
              </span>
            </div>
            <button 
              onClick={handleEngage}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] text-[#0b1026] font-black text-lg tracking-widest hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(125,232,195,0.3)]"
            >
              ENGAGE SYSTEMS
            </button>
          </div>
        </div>
      )}

      {gameState === 'GAME_OVER' && (
        <div className="p-6 h-full flex flex-col justify-center items-center text-center">
          <div className="w-24 h-24 text-red-500 mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-red-500 mb-4 tracking-tighter">SYSTEM FAILURE</h1>
          <p className="text-white/80 mb-2 font-medium">Day {currentDayIndex + 1} 생존 실패</p>
          <div className="bg-red-950/50 p-4 rounded-lg border border-red-500/30 text-red-300 text-sm mb-10 w-full">
            {failMessage}
          </div>
          <button 
            onClick={resetGame}
            className="px-10 py-4 rounded-full bg-[#121833] text-white font-bold hover:bg-[#1a2244] transition-all border border-white/10"
          >
            REBOOT SYSTEM
          </button>
        </div>
      )}

      {gameState === 'VICTORY' && (
        <div className="p-6 h-full flex flex-col justify-center items-center text-center">
          <div className="w-24 h-24 text-[#7de8c3] mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#7de8c3] to-[#c4b5fd] mb-2 tracking-tighter leading-tight">
            MISSION<br/>ACCOMPLISHED
          </h1>
          <p className="text-white/60 mb-8 text-sm">5일간 기지를 성공적으로 유지했습니다.</p>
          
          <div className="bg-[#121833] p-6 rounded-2xl border border-[#c4b5fd]/30 mb-10 w-full shadow-[0_0_20px_rgba(196,181,253,0.1)]">
            <div className="text-xs text-white/50 mb-2 tracking-widest">FINAL SCORE</div>
            <div className="text-5xl font-mono font-black text-[#f9a8d4]">{score}</div>
          </div>

          <button 
            onClick={resetGame}
            className="px-10 py-4 rounded-full bg-[#c4b5fd] text-[#0b1026] font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(196,181,253,0.4)]"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
