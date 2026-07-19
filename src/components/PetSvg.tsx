/**
 * 아스트로펫 캐릭터 — 이미지 에셋 없이 순수 SVG로 그린다 (프로젝트 비주얼 원칙).
 * 눈 깜빡임(.pet-eye)은 globals.css의 CSS 애니메이션이 담당한다.
 */
export default function PetSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 140"
      className={className}
      role="img"
      aria-label="둥실 떠 있는 아스트로펫 캐릭터"
    >
      <defs>
        <linearGradient id="astro-teaser-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a9f2d9" />
          <stop offset="100%" stopColor="#7de8c3" />
        </linearGradient>
      </defs>

      {/* 안테나 — 별빛 전구가 은은하게 빛난다 */}
      <line
        x1="70"
        y1="38"
        x2="70"
        y2="20"
        stroke="#c4b5fd"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="70" cy="15" r="9" fill="#ffe9a8" opacity="0.25" />
      <circle cx="70" cy="15" r="5" fill="#ffe9a8" />

      {/* 몸통 */}
      <ellipse cx="70" cy="84" rx="45" ry="41" fill="url(#astro-teaser-body)" />
      {/* 배 */}
      <ellipse cx="70" cy="99" rx="27" ry="17" fill="#eafff6" opacity="0.55" />

      {/* 눈 — 그룹째로 깜빡인다 */}
      <g className="pet-eye">
        <circle cx="53" cy="78" r="5.5" fill="#1c2340" />
        <circle cx="87" cy="78" r="5.5" fill="#1c2340" />
        <circle cx="55" cy="76" r="1.8" fill="#ffffff" />
        <circle cx="89" cy="76" r="1.8" fill="#ffffff" />
      </g>

      {/* 입 · 볼터치 */}
      <path
        d="M64 90 q6 5.5 12 0"
        stroke="#1c2340"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="44" cy="88" r="5" fill="#f9a8d4" opacity="0.7" />
      <circle cx="96" cy="88" r="5" fill="#f9a8d4" opacity="0.7" />
    </svg>
  );
}
