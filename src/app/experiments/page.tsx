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
  { id: "d10", title: "회전 소행성 채굴 (Asteroid Mining)", desc: "빠르게 회전하는 소행성에 작살 꽂기" },
  { id: "d11", title: "화성 탐사차 태양광 패널 청소 (Mars Rover Solar Panel Cleaning)", desc: "제한 시간 내에 패널의 먼지를 닦아내기" },
  { id: "d12", title: "우주 쓰레기 수거 (Space Debris Cleanup)", desc: "레이저와 그물로 궤도의 쓰레기 정리" },
  { id: "d13", title: "별자리 이어 그리기 (Constellation Mapping)", desc: "흩어진 별들을 이어 별자리를 그리는 퍼즐" },
  { id: "d14", title: "소행성 요격 (Asteroid Defense)", desc: "지구로 향하는 소행성 궤적 예측 요격" },
  { id: "d15", title: "우주 식물 가꾸기 (Space Botany)", desc: "무중력 온실 환경 밸런스 시뮬레이션" },
  { id: "d16", title: "웜홀 통과 (Wormhole Navigation)", desc: "왜곡된 시공간 터널 장애물 피하기" },
  { id: "d17", title: "펄서 신호 맞추기 (Pulsar Timing)", desc: "중성자별의 전파 주기에 맞추는 리듬 게임" },
  { id: "d18", title: "달 기지 전력 분배 (Lunar Base Power Management)", desc: "위기 상황에 맞는 생명유지장치 전력 퍼즐" },
  { id: "d19", title: "혜성 샘플 채취 (Comet Sample Return)", desc: "고속 혜성 착륙 및 코어 샘플 채취" },
  { id: "d20", title: "은하계 무역선 (Galactic Trading)", desc: "항성계를 넘나드는 무역 타이쿤" },
  { id: "d21", title: "우주 엘리베이터 건설 (Space Elevator Construction)", desc: "무게 중심 밸런싱 퍼즐" },
  { id: "d22", title: "우주 기지 모듈 조립 (Space Station Assembly)", desc: "궤도 상에서의 모듈 테트리스" },
  { id: "d23", title: "광속 여행 타임 딜레이 (Light Speed Time Delay)", desc: "상대성 이론 시차 적응 게임" },
  { id: "d24", title: "솔라 세일 돛 전개 (Solar Sail Deployment)", desc: "항성풍에 맞게 돛 각도 조절" },
  { id: "d25", title: "위성 궤도 교란 방어 (Orbit Disruption Defense)", desc: "태양풍과 운석을 막아내는 쉴드" },
  { id: "d26", title: "화성 대기 진입 (Mars Atmospheric Entry)", desc: "진입 각도와 마찰열 정밀 제어" },
  { id: "d27", title: "외계 생명체 DNA 해독 (Alien DNA Decoding)", desc: "외계 유전자 서열 패턴 매칭" },
  { id: "d28", title: "달 탐사차 배터리 생존 (Lunar Rover Battery Survival)", desc: "크레이터의 그림자 피하기" },
  { id: "d29", title: "궤도 엘리베이터 화물 하역 (Orbital Elevator Cargo)", desc: "도착지점 정밀 속도 제어" },
  { id: "d30", title: "외계 행성 대기 분석 (Exoplanet Atmosphere Analysis)", desc: "스펙트럼 흡수선 맞추기" }
];

export default function ExperimentsHub() {
  return (
    <main className="min-h-screen bg-[#0b1026] p-6 relative overflow-y-auto font-sans pb-20">
      <Stars />
      
      <div className="max-w-2xl mx-auto relative z-10">
        <header className="text-center my-10">
          <h1 className="text-4xl font-bold text-white mb-3">우주 덕후 연구소</h1>
          <p className="text-[#7de8c3]">100가지 스페이스 미니게임 프로젝트</p>
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
