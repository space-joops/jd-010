import type { GameVariant } from "./types";

/**
 * 아케이드 게임 엔진 — 순수 로직 (React·캔버스 없음).
 *
 * 모든 함수가 now(ms)를 인자로 받는 결정적 시뮬레이션이라
 * 가상 시계로 헤드리스 테스트가 가능하다 (본편 lib/game.ts와 같은 설계 원칙).
 * 그리기와 입력은 components/arcade/GameCanvas.tsx가 담당한다.
 */

export const W = 360;
export const H = 520;
export const PET_R = 22;
export const DEBRIS_R = 9;
/** combo 모드: 이 간격(ms) 안에 이어 먹어야 배수 유지 */
export const EAT_GAP_MS = 2000;
/** colorMatch 모드: 목표 색 교체 주기(ms) */
export const MATCH_ROTATE_MS = 10000;
/** 시간제 모드(score60/colorMatch/combo)의 판 길이(초) */
export const ROUND_SECONDS = 60;

export type Debris = {
  x: number; y: number; vx: number; vy: number;
  /** 팔레트 인덱스 0~2 (colorMatch 판정에 사용) */
  color: number;
  /** 모양 종류 0~2 (볼트/조각/패널 — 시각 전용) */
  kind: number;
};

export type Satellite = { x: number; y: number; vx: number; w: number };

export type Sim = {
  petX: number; petY: number; petVX: number; petVY: number;
  targetX: number; targetY: number;
  debris: Debris[]; satellites: Satellite[];
  score: number; eaten: number; lives: number;
  combo: number; lastEatAt: number;
  matchColor: number; matchSetAt: number;
  stunnedUntil: number; hurtFlashUntil: number;
  startedAt: number; elapsed: number; last: number;
  spawnAcc: number; rand: () => number;
};

/** 선형 합동 의사난수 — 변형별 결정적 스폰/배치 */
export function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function isTimed(variant: GameVariant): boolean {
  return (
    variant.objective === "score60" ||
    variant.objective === "colorMatch" ||
    variant.objective === "combo"
  );
}

export function createSim(variant: GameVariant, now: number): Sim {
  const sim: Sim = {
    petX: W / 2, petY: H * 0.7, petVX: 0, petVY: 0,
    targetX: W / 2, targetY: H * 0.7,
    debris: [], satellites: [],
    score: 0, eaten: 0, lives: 3,
    // "먹은 적 없음"은 -Infinity — 0이면 시작 직후(now<2s) 첫 입이 콤보로 오인된다
    combo: 1, lastEatAt: Number.NEGATIVE_INFINITY,
    matchColor: 0, matchSetAt: now,
    stunnedUntil: 0, hurtFlashUntil: 0,
    startedAt: now, elapsed: 0, last: now,
    spawnAcc: 0,
    rand: seededRand(1 + Number(variant.id.slice(1)) * 7919),
  };
  // 서바이벌은 위성이 본체 메커니즘 — hazard 축은 위성 수를 늘린다
  const satCount =
    variant.objective === "survival"
      ? variant.hazard === "satellites" ? 3 : 2
      : variant.hazard === "satellites" ? 2 : 0;
  for (let i = 0; i < satCount; i++) {
    sim.satellites.push({
      x: sim.rand() * W,
      y: H * (0.18 + 0.22 * i),
      vx: (sim.rand() > 0.5 ? 1 : -1) * (55 + sim.rand() * 30),
      w: 46,
    });
  }
  return sim;
}

/**
 * 시뮬레이션 한 스텝. dt는 내부에서 sim.last와 now의 차로 계산하고
 * 탭 복귀 등의 점프를 막기 위해 50ms로 클램프한다.
 * @returns finished — 이 스텝에서 판이 끝났는가
 */
export function stepSim(sim: Sim, variant: GameVariant, now: number): boolean {
  const dt = Math.min(0.05, (now - sim.last) / 1000);
  sim.last = now;
  sim.elapsed = (now - sim.startedAt) / 1000;

  // 서바이벌 난이도 상승: 90초에 걸쳐 최대 +80% 가속
  const speedUp =
    variant.objective === "survival" ? 1 + Math.min(0.8, sim.elapsed / 90) : 1;

  // --- 펫 이동 ---
  const stunned = now < sim.stunnedUntil;
  if (!stunned) {
    if (variant.control === "follow") {
      sim.petX += (sim.targetX - sim.petX) * Math.min(1, dt * 7);
      sim.petY += (sim.targetY - sim.petY) * Math.min(1, dt * 7);
    } else {
      sim.petX += sim.petVX * dt;
      sim.petY += sim.petVY * dt;
      sim.petVX *= 1 - Math.min(1, dt * 1.6); // 우주 마찰(감속)
      sim.petVY *= 1 - Math.min(1, dt * 1.6);
    }
  }
  sim.petX = Math.max(PET_R, Math.min(W - PET_R, sim.petX));
  sim.petY = Math.max(PET_R, Math.min(H - PET_R, sim.petY));

  // --- 쓰레기 스폰/이동 ---
  sim.spawnAcc += dt * 2.2 * speedUp;
  while (sim.spawnAcc >= 1 && sim.debris.length < 26) {
    sim.spawnAcc -= 1;
    const edge = sim.rand();
    sim.debris.push({
      x: edge < 0.5 ? -DEBRIS_R : sim.rand() * W,
      y: edge < 0.5 ? sim.rand() * H : -DEBRIS_R,
      vx: (sim.rand() - 0.3) * 60 * speedUp,
      vy: (20 + sim.rand() * 40) * speedUp,
      color: Math.floor(sim.rand() * 3),
      kind: Math.floor(sim.rand() * 3),
    });
  }
  for (const d of sim.debris) {
    d.x += d.vx * dt;
    d.y += d.vy * dt;
  }
  sim.debris = sim.debris.filter(
    (d) => d.y < H + 20 && d.x > -30 && d.x < W + 30,
  );

  // --- colorMatch: 목표 색 주기 교체 ---
  if (
    variant.objective === "colorMatch" &&
    now - sim.matchSetAt > MATCH_ROTATE_MS
  ) {
    sim.matchColor = (sim.matchColor + 1) % 3;
    sim.matchSetAt = now;
  }

  // --- combo: 시간 초과 시 배수 초기화 ---
  if (
    variant.objective === "combo" &&
    sim.combo > 1 &&
    now - sim.lastEatAt > EAT_GAP_MS
  ) {
    sim.combo = 1;
  }

  // --- 먹기 판정 ---
  if (!stunned) {
    for (let i = sim.debris.length - 1; i >= 0; i--) {
      const d = sim.debris[i];
      const dx = d.x - sim.petX;
      const dy = d.y - sim.petY;
      if (dx * dx + dy * dy > (PET_R + DEBRIS_R) ** 2) continue;
      sim.debris.splice(i, 1);
      if (variant.objective === "colorMatch" && d.color !== sim.matchColor) {
        sim.score = Math.max(0, sim.score - 20);
        sim.hurtFlashUntil = now + 250;
        continue;
      }
      sim.eaten += 1;
      if (variant.objective === "combo") {
        if (now - sim.lastEatAt <= EAT_GAP_MS) sim.combo = Math.min(5, sim.combo + 1);
        sim.lastEatAt = now;
        sim.score += 10 * sim.combo;
      } else {
        sim.score += 10;
      }
      if (variant.objective === "collect30" && sim.eaten >= 30) {
        // 빠를수록 큰 시간 보너스 (120초에 소진)
        sim.score += Math.max(0, Math.round(600 - sim.elapsed * 5));
        return true;
      }
    }
  }

  // --- 위성 이동/충돌 ---
  for (const s of sim.satellites) {
    s.x += s.vx * dt * speedUp;
    if (s.x < -s.w) s.x = W + s.w;
    if (s.x > W + s.w) s.x = -s.w;
    const dx = s.x - sim.petX;
    const dy = s.y - sim.petY;
    if (!stunned && dx * dx + dy * dy < (PET_R + 14) ** 2) {
      sim.stunnedUntil = now + 900;
      sim.hurtFlashUntil = now + 400;
      if (variant.objective === "survival") {
        sim.lives -= 1;
        if (sim.lives <= 0) return true;
      } else {
        sim.score = Math.max(0, sim.score - 50);
      }
    }
  }

  // --- 시간 종료 ---
  if (isTimed(variant) && sim.elapsed >= ROUND_SECONDS) return true;

  return false;
}
