"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameVariant } from "@/lib/arcade/types";
import {
  DEBRIS_R, H, PET_R, ROUND_SECONDS, W,
  createSim, isTimed, seededRand, stepSim,
  type Sim,
} from "@/lib/arcade/engine";
import { OBJECTIVES, THEMES } from "@/lib/arcade/variants";

/**
 * 아케이드 게임의 화면·입력 담당.
 * 시뮬레이션 규칙은 전부 lib/arcade/engine.ts(순수 로직)에 있고,
 * 이 컴포넌트는 rAF 루프에서 stepSim을 돌리며 캔버스에 그린다.
 * HUD는 표시값이 바뀔 때만 setState해 리렌더를 최소화한다.
 */

type Hud = {
  score: number; timeLeft: number; eaten: number; lives: number;
  combo: number; matchColor: number;
};

export default function GameCanvas({
  variant,
  onFinish,
}: {
  variant: GameVariant;
  /** 판이 끝날 때 최종 점수를 부모(별점 유도 등)에 알린다 */
  onFinish?: (score: number) => void;
}) {
  const theme = THEMES[variant.theme];
  const timed = isTimed(variant);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Sim | null>(null);
  const rafRef = useRef(0);
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [hud, setHud] = useState<Hud>({ score: 0, timeLeft: ROUND_SECONDS, eaten: 0, lives: 3, combo: 1, matchColor: 0 });
  const [best, setBest] = useState<number | null>(null);
  const bestKey = `astropet-arcade-best-${variant.id}`;

  useEffect(() => {
    const saved = localStorage.getItem(bestKey);
    if (saved) setBest(Number(saved));
  }, [bestKey]);

  const finish = useCallback(
    (sim: Sim) => {
      cancelAnimationFrame(rafRef.current);
      setPhase("over");
      const prev = Number(localStorage.getItem(bestKey) || 0);
      if (sim.score > prev) {
        localStorage.setItem(bestKey, String(sim.score));
        setBest(sim.score);
      }
      onFinish?.(sim.score);
    },
    [bestKey, onFinish],
  );

  const start = useCallback(() => {
    simRef.current = createSim(variant, performance.now());
    setHud({ score: 0, timeLeft: ROUND_SECONDS, eaten: 0, lives: 3, combo: 1, matchColor: 0 });
    setPhase("playing");
  }, [variant]);

  // 메인 루프 — phase가 playing인 동안만 rAF를 돈다
  useEffect(() => {
    if (phase !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const loop = (now: number) => {
      const sim = simRef.current;
      if (!sim) return;

      const finished = stepSim(sim, variant, now);
      draw(ctx, sim, now);

      const next: Hud = {
        score: sim.score,
        timeLeft: timed
          ? Math.max(0, Math.ceil(ROUND_SECONDS - sim.elapsed))
          : Math.floor(sim.elapsed),
        eaten: sim.eaten, lives: sim.lives, combo: sim.combo, matchColor: sim.matchColor,
      };
      setHud((h) =>
        h.score !== next.score || h.timeLeft !== next.timeLeft || h.eaten !== next.eaten ||
        h.lives !== next.lives || h.combo !== next.combo || h.matchColor !== next.matchColor
          ? next : h,
      );

      if (finished) { finish(sim); return; }
      rafRef.current = requestAnimationFrame(loop);
    };

    const draw = (c: CanvasRenderingContext2D, sim: Sim, now: number) => {
      const grad = c.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, theme.bgTop);
      grad.addColorStop(1, theme.bgBottom);
      c.fillStyle = grad;
      c.fillRect(0, 0, W, H);

      // 별 (변형별 결정적 배치)
      const starRand = seededRand(Number(variant.id.slice(1)) * 31);
      c.fillStyle = "rgba(255,255,255,0.7)";
      for (let i = 0; i < 40; i++) {
        const sx = starRand() * W, sy = starRand() * H, tw = starRand();
        c.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(now / 900 + tw * 6));
        c.fillRect(sx, sy, 1.6, 1.6);
      }
      c.globalAlpha = 1;

      // 쓰레기 — 종류별 모양 (볼트/페인트 조각/패널)
      for (const d of sim.debris) {
        c.fillStyle = theme.debris[d.color];
        c.save();
        c.translate(d.x, d.y);
        c.rotate((d.x + d.y) / 40);
        if (d.kind === 0) c.fillRect(-6, -6, 12, 12);
        else if (d.kind === 1) { c.beginPath(); c.arc(0, 0, 7, 0, Math.PI * 2); c.fill(); }
        else c.fillRect(-9, -4, 18, 8);
        c.restore();
      }

      // 위성 — 본체 + 양쪽 패널
      for (const s of sim.satellites) {
        c.save();
        c.translate(s.x, s.y);
        c.fillStyle = "#8fa3c8";
        c.fillRect(-10, -7, 20, 14);
        c.fillStyle = "#4d6396";
        c.fillRect(-s.w / 2, -4, s.w / 2 - 12, 8);
        c.fillRect(12, -4, s.w / 2 - 12, 8);
        c.restore();
      }

      // 펫
      const hurt = now < sim.hurtFlashUntil;
      const stunned = now < sim.stunnedUntil;
      c.save();
      c.translate(sim.petX, sim.petY);
      if (stunned) c.globalAlpha = 0.55;
      c.fillStyle = "#c4b5fd";
      c.fillRect(-1.5, -PET_R - 12, 3, 10);
      c.fillStyle = "#ffe9a8";
      c.beginPath(); c.arc(0, -PET_R - 14, 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = hurt ? "#ff8f8f" : theme.pet;
      c.beginPath(); c.arc(0, 0, PET_R, 0, Math.PI * 2); c.fill();
      c.fillStyle = theme.petLight;
      c.globalAlpha *= 0.55;
      c.beginPath(); c.ellipse(0, PET_R * 0.45, PET_R * 0.6, PET_R * 0.36, 0, 0, Math.PI * 2); c.fill();
      c.globalAlpha = stunned ? 0.55 : 1;
      c.fillStyle = "#1c2340";
      const blink = Math.sin(now / 500) > 0.97 ? 0.2 : 1;
      c.beginPath(); c.ellipse(-8, -3, 3.4, 3.4 * blink, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(8, -3, 3.4, 3.4 * blink, 0, 0, Math.PI * 2); c.fill();
      c.restore();
      c.globalAlpha = 1;
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, variant, theme, timed, finish]);

  // 포인터 → 논리 좌표 변환 (CSS 축소 반영)
  const toLocal = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const sim = simRef.current;
    if (!sim || variant.control !== "follow") return;
    const p = toLocal(e);
    sim.targetX = p.x;
    sim.targetY = p.y;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const sim = simRef.current;
    if (!sim || variant.control !== "dash") return;
    const p = toLocal(e);
    const dx = p.x - sim.petX, dy = p.y - sim.petY;
    const len = Math.hypot(dx, dy) || 1;
    const power = Math.min(520, len * 2.6);
    sim.petVX = (dx / len) * power;
    sim.petVY = (dy / len) * power;
  };

  return (
    <div className="mx-auto w-full max-w-[400px]">
      {/* HUD */}
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-white/80">
        <span>점수 {hud.score}</span>
        {variant.objective === "collect30" ? (
          <span>{hud.eaten} / 30</span>
        ) : variant.objective === "survival" ? (
          <span aria-label={`남은 목숨 ${hud.lives}`}>{"❤".repeat(hud.lives)}{"·".repeat(3 - hud.lives)}</span>
        ) : (
          <span>{hud.timeLeft}초</span>
        )}
        {variant.objective === "combo" && <span className="text-star">×{hud.combo}</span>}
        {variant.objective === "colorMatch" && (
          <span className="flex items-center gap-1.5">
            이 색만!
            <span
              className="inline-block h-4 w-4 rounded-full border border-white/40"
              style={{ background: theme.debris[hud.matchColor] }}
            />
          </span>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          className="block w-full touch-none select-none"
          aria-label={`${variant.name} 게임 화면`}
        />

        {phase !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-space-deep/80 px-6 text-center backdrop-blur-sm">
            {phase === "ready" ? (
              <>
                <p className="text-sm leading-relaxed text-white/80">{OBJECTIVES[variant.objective].rule}</p>
                <p className="text-xs leading-relaxed text-white/50">{variant.description}</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-white">게임 종료!</p>
                <p className="text-3xl font-extrabold text-mint">{hud.score}점</p>
                {best !== null && <p className="text-xs text-white/60">내 최고 기록: {best}점</p>}
              </>
            )}
            <button
              type="button"
              onClick={start}
              className="rounded-full bg-mint px-8 py-3 text-sm font-bold text-ink transition hover:brightness-110"
            >
              {phase === "ready" ? "시작하기" : "다시하기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
