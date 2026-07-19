export default function EggSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`w-32 h-32 ${className}`}>
      <defs>
        <linearGradient id="egg-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7de8c3" />
          <stop offset="100%" stopColor="#f9a8d4" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="50" rx="35" ry="45" fill="url(#egg-grad)" />
      {/* cute sleeping face */}
      <path d="M35 45 Q40 50 45 45" stroke="#0b1026" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M55 45 Q60 50 65 45" stroke="#0b1026" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="35" cy="53" r="3.5" fill="#f9a8d4" opacity="0.8" />
      <circle cx="65" cy="53" r="3.5" fill="#f9a8d4" opacity="0.8" />
    </svg>
  );
}
