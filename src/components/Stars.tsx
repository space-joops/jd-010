/**
 * 별 배경 — 절대 위치 점들을 CSS twinkle로 반짝인다.
 *
 * 위치·크기·딜레이는 인덱스 기반 의사난수로 "모듈 로드 시 1회" 계산한다.
 * Math.random()을 렌더마다 쓰면 서버/클라이언트 결과가 달라져
 * hydration mismatch가 나므로 반드시 결정적이어야 한다.
 */
const rand = (seed: number) => {
  const x = Math.sin(seed * 999.7) * 10000;
  return x - Math.floor(x);
};

const STARS = Array.from({ length: 46 }, (_, i) => ({
  left: `${(rand(i + 1) * 100).toFixed(2)}%`,
  top: `${(rand(i + 101) * 100).toFixed(2)}%`,
  size: 1 + rand(i + 201) * 1.6,
  delay: `${(rand(i + 301) * 3).toFixed(2)}s`,
  // 대부분 흰 별, 1/6 정도만 노란 별로 포인트
  gold: rand(i + 401) < 0.17,
}));

export default function Stars() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {STARS.map((s, i) => (
        <span
          key={i}
          className={`anim-twinkle absolute rounded-full ${
            s.gold ? "bg-star" : "bg-white"
          }`}
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}
