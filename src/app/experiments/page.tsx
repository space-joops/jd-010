"use client";

import Link from "next/link";
import Stars from "@/components/Stars";

const EXPERIMENTS = [
  { id: "d1", title: "궤도 슬링샷 (Orbital Slingshot)", desc: "행성의 중력을 이용한 궤도 퍼즐" },
  { id: "d2", title: "로버 정밀 착륙 (Rover Landing)", desc: "하강 속도와 역추진 미세 조작" },
  { id: "d3", title: "외계 신호 해독 (Wow! Signal)", desc: "노이즈 속 진짜 주파수 찾기: 노이즈 속 주파수 다이얼 맞추기" },
  { id: "d4", title: "우주정거장 6자유도 도킹 (ISS Docking)", desc: "RCS 트러스터를 이용한 정밀 도킹" },
  { id: "d5", title: "블랙홀 사건의 지평선 (Event Horizon)", desc: "중력 우물에서 추진력을 모아 탈출" },
  { id: "d6", title: "라그랑주 점 탐색 (Lagrange Point)", desc: "안정적인 중력 평형점 찾기 밸런스 게임" },
  { id: "d7", title: "태양풍 실드 가동 (Solar Flare)", desc: "태양 흑점 폭발 예측 방어 타이밍" },
  { id: "d8", title: "골디락스 존 테라포밍 (Terraforming)", desc: "온도, 대기, 산소 3요소 밸런싱" },
  { id: "d9", title: "Max-Q 로켓 단 분리 (Staging)", desc: "최대 동압 구간을 버티는 단 분리" },
  { id: "d10", title: "회전 소행성 채굴 (Asteroid Mining)", desc: "빠르게 회전하는 소행성에 작살 꽂기" }
];

export default function ExperimentsHub() {
  return (
    <main className="min-h-screen bg-[#0b1026] p-6 relative overflow-y-auto font-sans pb-20">
      <Stars />
      
      <div className="max-w-2xl mx-auto relative z-10">
        <header className="text-center my-10">
          <h1 className="text-4xl font-bold text-white mb-3">우주 덕후 연구소</h1>
          <p className="text-[#7de8c3]">10가지 다양한 스페이스 미니게임 실험실</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {EXPERIMENTS.map((exp) => (
            <Link 
              key={exp.id} 
              href={`/${exp.id}`}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-[#7de8c3]/50 transition-all group flex flex-col justify-center"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="bg-[#7de8c3] text-[#0b1026] text-xs font-bold px-2 py-1 rounded">
                  {exp.id.toUpperCase()}
                </span>
                <span className="text-white/30 group-hover:text-white/70 transition-colors">→</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">{exp.title}</h2>
              <p className="text-sm text-[#f9a8d4]/80">{exp.desc || Object.values(exp)[2]}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
