"use client";

import { useEffect, useState } from "react";

/**
 * 게임 별점 (1~5).
 * 서버(/api/rate)로 보내고, 내 별점은 localStorage에 남겨 다시 보여준다.
 * 별점 수정은 자유 — 마지막 값이 내 별점이 된다.
 */
const keyOf = (gameId: string) => `astropet-rating-${gameId}`;

export default function StarRating({ gameId }: { gameId: string }) {
  const [mine, setMine] = useState(0);
  const [hover, setHover] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "saved" | "error">("idle");

  useEffect(() => {
    setMine(Number(localStorage.getItem(keyOf(gameId)) || 0));
  }, [gameId]);

  const rate = async (stars: number) => {
    setMine(stars);
    setStatus("sending");
    try {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, stars }),
      });
      if (!res.ok) throw new Error();
      localStorage.setItem(keyOf(gameId), String(stars));
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div role="radiogroup" aria-label="별점 남기기" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={mine === n}
            aria-label={`${n}점`}
            onClick={() => rate(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className={`text-2xl transition ${
              n <= (hover || mine) ? "text-star" : "text-white/25"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="text-xs text-white/50" aria-live="polite">
        {status === "saved"
          ? "별점이 등록됐어요. 고마워요!"
          : status === "error"
            ? "전송에 실패했어요. 다시 눌러주세요."
            : mine > 0
              ? `내 별점 ${mine}점`
              : "이 게임, 몇 점인가요?"}
      </p>
    </div>
  );
}
