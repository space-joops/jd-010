export default function Stars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
      {Array.from({ length: 40 }).map((_, i) => {
        const width = Math.random() * 3 + 1;
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const animDuration = Math.random() * 3 + 2;
        const animDelay = Math.random() * 2;
        
        return (
          <div
            key={i}
            className="absolute bg-star rounded-full"
            style={{
              width: `${width}px`,
              height: `${width}px`,
              top: `${top}%`,
              left: `${left}%`,
              animation: `twinkle ${animDuration}s infinite ${animDelay}s`
            }}
          />
        );
      })}
    </div>
  );
}
