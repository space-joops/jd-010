"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameVariant } from "@/lib/arcade/types";
import {
  BIG_DEBRIS_R, GIANT_BIG_EDIBLE_R, GUARDIAN_MISSES, H,
  PET_R, RING_RADII, ROUND_SECONDS, TELEPORT_CD_MS, W,
  createSim, isTimed, petRadius, pointerDown, pointerMove, pointerUp,
  seededRand, stepSim, type Sim,
} from "@/lib/arcade/engine";
import {
  CHARACTERS, CONTROLS, OBJECTIVES, PALETTES, soundProfileOf,
} from "@/lib/arcade/variants";
import {
  initAudio, loadMuted, playEvents, playFinish, playStart, setMuted,
} from "@/lib/arcade/sound";
import { CHARACTER_ART } from "./characterArt";

/**
 * 아케이드 화면·입력·사운드 담당 (규칙은 lib/arcade/engine.ts).
 * rAF 루프에서 stepSim을 돌리고, 반환된 이벤트로 효과음을 낸다.
 * HUD는 표시값이 바뀔 때만 setState해 리렌더를 최소화한다.
 */

type Hud = {
  score: number; timeLeft: number; eaten: number; lives: number;
  misses: number; combo: number; matchColor: number; fever: number;
  inFever: boolean; size: number;
};

const HUD0: Hud = {
  score: 0, timeLeft: ROUND_SECONDS, eaten: 0, lives: 3,
  misses: 0, combo: 1, matchColor: 0, fever: 0, inFever: false, size: PET_R,
};

export default function GameCanvas({
  variant,
  onFinish,
}: {
  variant: GameVariant;
  onFinish?: (score: number) => void;
}) {
  const palette = PALETTES[variant.palette];
  const timed = isTimed(variant);
  const profile = soundProfileOf(variant);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Sim | null>(null);
  const rafRef = useRef(0);
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [hud, setHud] = useState<Hud>(HUD0);
  const [best, setBest] = useState<number | null>(null);
  const [mute, setMute] = useState(false);
  const bestKey = `astropet-arcade-best-${variant.id}`;

  useEffect(() => {
    const saved = localStorage.getItem(bestKey);
    if (saved) setBest(Number(saved));
    setMute(loadMuted());
  }, [bestKey]);

  const finish = useCallback(
    (sim: Sim) => {
      cancelAnimationFrame(rafRef.current);
      setPhase("over");
      playFinish(profile);
      const prev = Number(localStorage.getItem(bestKey) || 0);
      if (sim.score > prev) {
        localStorage.setItem(bestKey, String(sim.score));
        setBest(sim.score);
      }
      onFinish?.(sim.score);
    },
    // profile은 variant에서 파생되는 안정값
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bestKey, onFinish, variant],
  );

  const start = useCallback(() => {
    initAudio(); // 사용자 제스처 안에서 AudioContext 생성
    playStart(profile);
    simRef.current = createSim(variant, performance.now());
    setHud({ ...HUD0, size: simRef.current.size });
    setPhase("playing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  const toggleMute = () => {
    const next = !mute;
    setMute(next);
    setMuted(next);
    if (!next) initAudio();
  };

  // ---------- 메인 루프 ----------
  useEffect(() => {
    if (phase !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const loop = (now: number) => {
      const sim = simRef.current;
      if (!sim) return;

      const { finished, events } = stepSim(sim, variant, now);
      playEvents(events, profile);
      draw(ctx, sim, now);

      const next: Hud = {
        score: sim.score,
        timeLeft: timed
          ? Math.max(0, Math.ceil(ROUND_SECONDS - sim.elapsed))
          : Math.floor(sim.elapsed),
        eaten: sim.eaten, lives: sim.lives, misses: sim.misses,
        combo: sim.combo, matchColor: sim.matchColor,
        fever: sim.fever, inFever: now < sim.feverUntil,
        size: sim.size,
      };
      setHud((h) => (JSON.stringify(h) === JSON.stringify(next) ? h : next));

      if (finished) { finish(sim); return; }
      rafRef.current = requestAnimationFrame(loop);
    };

    const draw = (c: CanvasRenderingContext2D, sim: Sim, now: number) => {
      const grad = c.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, palette.bgTop);
      grad.addColorStop(1, palette.bgBottom);
      c.fillStyle = grad;
      c.fillRect(0, 0, W, H);

      // 별 (게임별 결정적 배치)
      const starRand = seededRand(Number(variant.id.slice(1)) * 31);
      c.fillStyle = "rgba(255,255,255,0.7)";
      for (let i = 0; i < 40; i++) {
        const sx = starRand() * W, sy = starRand() * H, tw = starRand();
        c.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(now / 900 + tw * 6));
        c.fillRect(sx, sy, 1.6, 1.6);
      }
      c.globalAlpha = 1;

      // orbit: 링 가이드
      if (variant.control === "orbit") {
        c.strokeStyle = "rgba(255,255,255,0.12)";
        c.lineWidth = 1;
        for (const r of RING_RADII) {
          c.beginPath(); c.arc(W / 2, H / 2, r, 0, Math.PI * 2); c.stroke();
        }
      }

      // guardian: 지구 지평선
      if (variant.objective === "guardian") {
        c.fillStyle = "#1a2b5e";
        c.beginPath(); c.ellipse(W / 2, H + 60, W * 0.9, 90, 0, Math.PI, 0); c.fill();
        c.strokeStyle = "rgba(125,232,195,0.5)";
        c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, H - 26); c.lineTo(W, H - 26); c.stroke();
      }

      // fever: 발동 중 배경 글로우
      if (variant.objective === "fever" && now < sim.feverUntil) {
        c.fillStyle = "rgba(255,233,168,0.08)";
        c.fillRect(0, 0, W, H);
      }

      // magnet: 견인 광선
      if (variant.control === "magnet" && sim.holding) {
        c.fillStyle = "rgba(255,255,255,0.07)";
        c.beginPath(); c.arc(sim.petX, sim.petY, 150, 0, Math.PI * 2); c.fill();
      }

      // 쓰레기
      for (const d of sim.debris) {
        c.save();
        c.translate(d.x, d.y);
        if (d.gold) {
          const left = d.ttl ? Math.max(0, d.ttl - now) / 3500 : 1;
          c.globalAlpha = 0.4 + 0.6 * left;
          c.fillStyle = "#ffe9a8";
          c.rotate(now / 300);
          c.beginPath();
          for (let k = 0; k < 8; k++) {
            const rad = k % 2 === 0 ? 11 : 4.5;
            const a = (k * Math.PI) / 4;
            c[k === 0 ? "moveTo" : "lineTo"](rad * Math.cos(a), rad * Math.sin(a));
          }
          c.closePath(); c.fill();
        } else {
          const r = d.big ? BIG_DEBRIS_R : 7;
          c.fillStyle = palette.debris[d.color];
          if (d.big && sim.size < GIANT_BIG_EDIBLE_R) c.globalAlpha = 0.8;
          c.rotate((d.x + d.y) / 40);
          if (d.big) {
            c.fillRect(-r, -r * 0.6, r * 2, r * 1.2);
            c.fillStyle = "rgba(255,255,255,0.3)";
            c.fillRect(-r, -r * 0.6, r * 2, r * 0.3);
          } else if (d.kind === 0) c.fillRect(-6, -6, 12, 12);
          else if (d.kind === 1) { c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill(); }
          else c.fillRect(-9, -4, 18, 8);
        }
        c.restore();
      }

      // 위성
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

      // snake 꼬리
      if (variant.control === "snake" && sim.tail.length > 1) {
        for (let i = 0; i < sim.tail.length; i++) {
          const p = sim.tail[i];
          const a = (i / sim.tail.length) * 0.5;
          c.fillStyle = palette.pet;
          c.globalAlpha = a;
          c.beginPath(); c.arc(p.x, p.y, 4 + (i / sim.tail.length) * 6, 0, Math.PI * 2); c.fill();
        }
        c.globalAlpha = 1;
      }

      // 캐릭터
      const stunned = now < sim.stunnedUntil;
      const hurt = now < sim.hurtFlashUntil;
      c.save();
      c.translate(sim.petX, sim.petY);
      if (stunned) c.globalAlpha = 0.55;
      if (hurt) {
        c.globalAlpha *= 0.9;
        c.filter = "brightness(1.4)";
      }
      const blink = Math.sin(now / 500) > 0.97 ? 0.15 : 1;
      CHARACTER_ART[variant.character](c, petRadius(sim, variant), palette, blink, now);
      c.filter = "none";
      c.restore();
      c.globalAlpha = 1;

      // teleport 쿨다운 링
      if (variant.control === "teleport" && now < sim.cooldownUntil) {
        const p = 1 - (sim.cooldownUntil - now) / TELEPORT_CD_MS;
        c.strokeStyle = "rgba(255,255,255,0.5)";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(sim.petX, sim.petY, petRadius(sim, variant) + 8, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
        c.stroke();
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // profile은 variant 파생 안정값
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, variant, palette, timed, finish]);

  // ---------- 입력 ----------
  const toLocal = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const onMove = (e: React.PointerEvent) => {
    const sim = simRef.current;
    if (!sim || phase !== "playing") return;
    const p = toLocal(e);
    pointerMove(sim, p.x, p.y);
  };
  const onDown = (e: React.PointerEvent) => {
    const sim = simRef.current;
    if (!sim || phase !== "playing") return;
    const p = toLocal(e);
    playEvents(pointerDown(sim, variant, p.x, p.y, performance.now()), profile);
  };
  const onUp = () => {
    const sim = simRef.current;
    if (sim) pointerUp(sim);
  };

  // ---------- HUD 우측 표시 (컨셉별) ----------
  const rightHud = () => {
    switch (variant.objective) {
      case "rush30":
        return <span>{hud.eaten} / 30</span>;
      case "survival":
        return (
          <span aria-label={`남은 목숨 ${hud.lives}`}>
            {"❤".repeat(hud.lives)}{"·".repeat(Math.max(0, 3 - hud.lives))}
          </span>
        );
      case "guardian":
        return (
          <span aria-label={`놓친 쓰레기 ${hud.misses}`}>
            {"🛡".repeat(Math.max(0, GUARDIAN_MISSES - hud.misses))}{"·".repeat(hud.misses)}
          </span>
        );
      case "zen":
        return <span>{hud.eaten}조각 · 무결점</span>;
      case "giant":
        return <span>몸집 {Math.round((hud.size / PET_R) * 100)}%</span>;
      default:
        return <span>{hud.timeLeft}초</span>;
    }
  };

  return (
    <div className="mx-auto w-full max-w-[400px]">
      {/* HUD */}
      <div className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-white/80">
        <span>점수 {hud.score}</span>
        {variant.objective === "chain" && <span className="text-star">×{hud.combo}</span>}
        {variant.objective === "picky" && (
          <span className="flex items-center gap-1.5">
            이 색만!
            <span
              className="inline-block h-4 w-4 rounded-full border border-white/40"
              style={{ background: palette.debris[hud.matchColor] }}
            />
          </span>
        )}
        {variant.objective === "fever" && (
          <span className="flex items-center gap-1.5" aria-label="피버 게이지">
            {hud.inFever ? (
              <span className="animate-pulse text-star">FEVER!</span>
            ) : (
              <span className="h-2 w-16 overflow-hidden rounded-full bg-white/15">
                <span
                  className="block h-full rounded-full bg-star transition-[width]"
                  style={{ width: `${Math.round(hud.fever * 100)}%` }}
                />
              </span>
            )}
          </span>
        )}
        {rightHud()}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerMove={onMove}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          className="block w-full touch-none select-none"
          aria-label={`${variant.name} 게임 화면`}
        />

        {/* 음소거 토글 */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={mute ? "소리 켜기" : "소리 끄기"}
          className="absolute right-2 top-2 rounded-full bg-black/30 px-2.5 py-1.5 text-sm backdrop-blur-sm"
        >
          {mute ? "🔇" : "🔊"}
        </button>

        {phase !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-space-deep/80 px-6 text-center backdrop-blur-sm">
            {phase === "ready" ? (
              <>
                <p className="text-xs font-semibold tracking-widest text-white/50">
                  {CHARACTERS[variant.character].name} · {CHARACTERS[variant.character].blurb}
                </p>
                <p className="text-sm leading-relaxed text-white/85">
                  {OBJECTIVES[variant.objective].rule}
                </p>
                <p className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs text-mint">
                  🕹 {CONTROLS[variant.control].hint}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-white">게임 종료!</p>
                <p className="text-3xl font-extrabold text-mint">{hud.score}점</p>
                {best !== null && (
                  <p className="text-xs text-white/60">내 최고 기록: {best}점</p>
                )}
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
