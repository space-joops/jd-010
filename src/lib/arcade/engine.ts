import type { GameVariant } from "./types";

/**
 * 아케이드 게임 엔진 v2 — 순수 로직 (React·캔버스·오디오 없음).
 *
 * 컨셉 10종의 규칙과 조작 10종의 이동 모델을 모두 여기서 시뮬레이션한다.
 * 모든 함수가 now(ms)를 인자로 받아 가상 시계로 헤드리스 테스트가 가능하다.
 * 그리기/입력/사운드는 components/arcade/* 담당 — stepSim이 돌려주는
 * 이벤트 목록(SimEvent)이 효과음 트리거가 된다.
 */

export const W = 360;
export const H = 520;
export const PET_R = 22;
export const DEBRIS_R = 9;
export const BIG_DEBRIS_R = 16;
/** chain: 이 간격(ms) 안에 이어 먹어야 배수 유지 */
export const EAT_GAP_MS = 2000;
/** picky: 목표 색 교체 주기(ms) */
export const MATCH_ROTATE_MS = 10000;
/** 시간제 컨셉의 판 길이(초) */
export const ROUND_SECONDS = 60;
/** teleport: 쿨다운(ms) */
export const TELEPORT_CD_MS = 1000;
/** orbit: 링 반경 (안쪽→바깥) */
export const RING_RADII = [62, 112, 162];
/** giant: 시작/최대 반지름과 큰 조각을 먹을 수 있는 최소 반지름 */
export const GIANT_START_R = 15;
export const GIANT_MAX_R = 46;
export const GIANT_BIG_EDIBLE_R = 28;
/** guardian/zen: 허용 놓침 (guardian 3, zen 1) */
export const GUARDIAN_MISSES = 3;
/** fever: 지속시간(ms)과 1회 먹기당 게이지 충전량 */
export const FEVER_MS = 6000;
export const FEVER_CHARGE = 0.12;

export type SimEvent =
  | "eat" | "eatBig" | "eatGold" | "wrong"
  | "hurt" | "miss" | "feverStart" | "teleport" | "ring";

export type Debris = {
  x: number; y: number; vx: number; vy: number;
  /** 팔레트 인덱스 0~2 (picky 판정·색상) */
  color: number;
  /** 모양 0~2 (시각 전용) */
  kind: number;
  /** gold: 황금 조각 여부와 소멸 시각 */
  gold?: boolean;
  ttl?: number;
  /** giant: 큰 조각 여부 */
  big?: boolean;
};

export type Satellite = { x: number; y: number; vx: number; w: number };

export type Sim = {
  petX: number; petY: number; petVX: number; petVY: number;
  targetX: number; targetY: number;
  /** gravity·magnet: 포인터를 누르고 있는가 */
  holding: boolean;
  debris: Debris[]; satellites: Satellite[];
  score: number; eaten: number; lives: number; misses: number;
  combo: number; lastEatAt: number;
  matchColor: number; matchSetAt: number;
  /** giant: 현재 몸 반지름 */
  size: number;
  /** fever: 게이지 0~1, 피버 종료 시각 */
  fever: number; feverUntil: number;
  /** teleport 쿨다운 / orbit 상태 / snake 조향 */
  cooldownUntil: number;
  ring: number; ringR: number; orbitAngle: number;
  heading: number;
  /** snake: 지나온 자취 (꼬리 그리기용, 시각 전용) */
  tail: { x: number; y: number }[];
  stunnedUntil: number; hurtFlashUntil: number;
  startedAt: number; elapsed: number; last: number;
  spawnAcc: number; goldAcc: number; rand: () => number;
};

export function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function isTimed(variant: GameVariant): boolean {
  return ["sprint", "picky", "chain", "giant", "gold", "fever"].includes(
    variant.objective,
  );
}

/** 현재 펫의 충돌 반지름 (giant만 가변) */
export function petRadius(sim: Sim, variant: GameVariant): number {
  return variant.objective === "giant" ? sim.size : PET_R;
}

export function createSim(variant: GameVariant, now: number): Sim {
  const magnetHome = { x: W / 2, y: H * 0.55 };
  const sim: Sim = {
    petX: variant.control === "magnet" ? magnetHome.x : W / 2,
    petY: variant.control === "magnet" ? magnetHome.y
      : variant.control === "paddle" ? H - 60
      : H * 0.7,
    petVX: variant.control === "bounce" ? 170 : 0,
    petVY: variant.control === "bounce" ? -170 : 0,
    targetX: W / 2, targetY: H * 0.7,
    holding: false,
    debris: [], satellites: [],
    score: 0, eaten: 0, lives: 3, misses: 0,
    // "먹은 적 없음"은 -Infinity (0이면 시작 직후 첫 입이 콤보로 오인)
    combo: 1, lastEatAt: Number.NEGATIVE_INFINITY,
    matchColor: 0, matchSetAt: now,
    size: variant.objective === "giant" ? GIANT_START_R : PET_R,
    fever: 0, feverUntil: 0,
    cooldownUntil: 0,
    ring: 1, ringR: RING_RADII[1], orbitAngle: -Math.PI / 2,
    heading: -Math.PI / 2,
    tail: [],
    stunnedUntil: 0, hurtFlashUntil: 0,
    startedAt: now, elapsed: 0, last: now,
    spawnAcc: 0, goldAcc: 0,
    rand: seededRand(1 + Number(variant.id.slice(1)) * 7919),
  };
  for (let i = 0; i < variant.satellites; i++) {
    sim.satellites.push({
      x: sim.rand() * W,
      y: H * (0.16 + 0.2 * i),
      vx: (sim.rand() > 0.5 ? 1 : -1) * (55 + sim.rand() * 30),
      w: 46,
    });
  }
  return sim;
}

// ---------- 입력 (컨트롤별 해석은 엔진이 담당해 테스트 가능하게) ----------

export function pointerMove(sim: Sim, x: number, y: number) {
  sim.targetX = x;
  sim.targetY = y;
}

export function pointerDown(
  sim: Sim, variant: GameVariant, x: number, y: number, now: number,
): SimEvent[] {
  sim.holding = true;
  sim.targetX = x;
  sim.targetY = y;
  switch (variant.control) {
    case "dash": {
      const dx = x - sim.petX, dy = y - sim.petY;
      const len = Math.hypot(dx, dy) || 1;
      const power = Math.min(520, len * 2.6);
      sim.petVX = (dx / len) * power;
      sim.petVY = (dy / len) * power;
      return [];
    }
    case "flappy":
      sim.petVY = -270;
      return [];
    case "teleport":
      if (now < sim.cooldownUntil) return [];
      sim.petX = Math.max(PET_R, Math.min(W - PET_R, x));
      sim.petY = Math.max(PET_R, Math.min(H - PET_R, y));
      sim.cooldownUntil = now + TELEPORT_CD_MS;
      return ["teleport"];
    case "orbit":
      sim.ring = (sim.ring + 1) % RING_RADII.length;
      return ["ring"];
    case "bounce": {
      const dx = x - sim.petX, dy = y - sim.petY;
      const len = Math.hypot(dx, dy) || 1;
      const speed = Math.hypot(sim.petVX, sim.petVY) || 240;
      sim.petVX = (dx / len) * speed;
      sim.petVY = (dy / len) * speed;
      return [];
    }
    default:
      return [];
  }
}

export function pointerUp(sim: Sim) {
  sim.holding = false;
}

// ---------- 스텝 ----------

function spawnDebris(
  sim: Sim, variant: GameVariant, speedUp: number, dt: number, now: number,
) {
  const o = variant.objective;
  // 컨셉별 스폰 리듬: guardian은 점점 몰아치고, zen은 드물고 느리다
  const rate =
    o === "guardian" ? Math.min(2.4, 1.0 + sim.elapsed / 25)
    : o === "zen" ? 1.0
    : 2.2;
  sim.spawnAcc += rate * speedUp * dt;
  const cap = o === "zen" ? 10 : 26;
  while (sim.spawnAcc >= 1 && sim.debris.length < cap) {
    sim.spawnAcc -= 1;
    const fromTop = o === "guardian" || o === "zen" || sim.rand() < 0.5;
    const d: Debris = {
      x: fromTop ? 20 + sim.rand() * (W - 40) : -DEBRIS_R,
      y: fromTop ? -DEBRIS_R : sim.rand() * H * 0.7,
      vx:
        o === "guardian" ? (sim.rand() - 0.5) * 30
        : o === "zen" ? (sim.rand() - 0.5) * 16
        : (sim.rand() - 0.3) * 60 * speedUp,
      vy:
        o === "guardian" ? (55 + sim.rand() * 45) * (1 + sim.elapsed / 60)
        : o === "zen" ? 26 + sim.rand() * 14
        : (20 + sim.rand() * 40) * speedUp,
      color: Math.floor(sim.rand() * 3),
      kind: Math.floor(sim.rand() * 3),
    };
    if (o === "giant" && sim.rand() < 0.22) d.big = true;
    if (o === "gold") d.vy *= 0.8;
    sim.debris.push(d);
  }
  // gold: 4~7초마다 황금 조각 1개 (3.5초 시한부)
  if (o === "gold") {
    sim.goldAcc += dt;
    if (sim.goldAcc > 4 + sim.rand() * 3) {
      sim.goldAcc = 0;
      sim.debris.push({
        x: 30 + sim.rand() * (W - 60), y: 30 + sim.rand() * (H - 120),
        vx: 0, vy: 0, color: 0, kind: 1, gold: true, ttl: now + 3500,
      });
    }
  }
}

function movePet(sim: Sim, variant: GameVariant, dt: number, now: number) {
  if (now < sim.stunnedUntil) return;
  switch (variant.control) {
    case "follow":
      sim.petX += (sim.targetX - sim.petX) * Math.min(1, dt * 7);
      sim.petY += (sim.targetY - sim.petY) * Math.min(1, dt * 7);
      break;
    case "dash":
      sim.petX += sim.petVX * dt;
      sim.petY += sim.petVY * dt;
      sim.petVX *= 1 - Math.min(1, dt * 1.6);
      sim.petVY *= 1 - Math.min(1, dt * 1.6);
      break;
    case "orbit": {
      sim.orbitAngle += dt * 1.7;
      sim.ringR += (RING_RADII[sim.ring] - sim.ringR) * Math.min(1, dt * 8);
      sim.petX = W / 2 + sim.ringR * Math.cos(sim.orbitAngle);
      sim.petY = H / 2 + sim.ringR * Math.sin(sim.orbitAngle);
      break;
    }
    case "gravity": {
      if (sim.holding) {
        const dx = sim.targetX - sim.petX, dy = sim.targetY - sim.petY;
        const len = Math.hypot(dx, dy) || 1;
        sim.petVX += (dx / len) * 520 * dt;
        sim.petVY += (dy / len) * 520 * dt;
      }
      const sp = Math.hypot(sim.petVX, sim.petVY);
      if (sp > 400) { sim.petVX *= 400 / sp; sim.petVY *= 400 / sp; }
      sim.petX += sim.petVX * dt;
      sim.petY += sim.petVY * dt;
      sim.petVX *= 1 - Math.min(1, dt * 0.5);
      sim.petVY *= 1 - Math.min(1, dt * 0.5);
      break;
    }
    case "flappy":
      sim.petVY += 380 * dt;
      sim.petY += sim.petVY * dt;
      sim.petX += (sim.targetX - sim.petX) * Math.min(1, dt * 4);
      if (sim.petY > H - PET_R) { sim.petY = H - PET_R; sim.petVY = 0; }
      if (sim.petY < PET_R) { sim.petY = PET_R; sim.petVY = 0; }
      break;
    case "paddle":
      sim.petY = H - 60;
      sim.petX += (sim.targetX - sim.petX) * Math.min(1, dt * 12);
      break;
    case "teleport":
      break; // 이동은 탭에서만
    case "magnet": {
      // 펫은 홈 고정, 견인은 먹기 단계에서 처리
      sim.petX = W / 2;
      sim.petY = H * 0.55;
      break;
    }
    case "bounce": {
      sim.petX += sim.petVX * dt;
      sim.petY += sim.petVY * dt;
      if (sim.petX < PET_R || sim.petX > W - PET_R) sim.petVX *= -1;
      if (sim.petY < PET_R || sim.petY > H - PET_R) sim.petVY *= -1;
      break;
    }
    case "snake": {
      const want = Math.atan2(sim.targetY - sim.petY, sim.targetX - sim.petX);
      let diff = want - sim.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const maxTurn = 4.2 * dt;
      sim.heading += Math.max(-maxTurn, Math.min(maxTurn, diff));
      sim.petX += Math.cos(sim.heading) * 230 * dt;
      sim.petY += Math.sin(sim.heading) * 230 * dt;
      // 스네이크는 화면을 감아 도는 랩어라운드
      if (sim.petX < -PET_R) sim.petX = W + PET_R;
      if (sim.petX > W + PET_R) sim.petX = -PET_R;
      if (sim.petY < -PET_R) sim.petY = H + PET_R;
      if (sim.petY > H + PET_R) sim.petY = -PET_R;
      break;
    }
  }
  if (variant.control !== "snake") {
    sim.petX = Math.max(PET_R, Math.min(W - PET_R, sim.petX));
    sim.petY = Math.max(PET_R, Math.min(H - PET_R, sim.petY));
  }
  // 꼬리 자취 (snake 시각용 — 프레임당 1점, 상한은 먹은 수에 비례)
  if (variant.control === "snake") {
    sim.tail.push({ x: sim.petX, y: sim.petY });
    const maxTail = Math.min(40, 8 + sim.eaten * 2);
    while (sim.tail.length > maxTail) sim.tail.shift();
  }
}

/**
 * 시뮬레이션 한 스텝. dt는 sim.last 기준으로 계산해 50ms로 클램프한다.
 */
export function stepSim(
  sim: Sim, variant: GameVariant, now: number,
): { finished: boolean; events: SimEvent[] } {
  const events: SimEvent[] = [];
  const dt = Math.min(0.05, (now - sim.last) / 1000);
  sim.last = now;
  sim.elapsed = (now - sim.startedAt) / 1000;

  const speedUp =
    variant.objective === "survival" ? 1 + Math.min(0.8, sim.elapsed / 90) : 1;
  const inFever = variant.objective === "fever" && now < sim.feverUntil;

  movePet(sim, variant, dt, now);
  spawnDebris(sim, variant, speedUp, dt, now);

  // magnet 견인 / fever 자석
  const pull = variant.control === "magnet" && sim.holding ? 380 : inFever ? 300 : 0;
  const pullRange = variant.control === "magnet" && sim.holding ? 150 : 210;
  if (pull > 0) {
    for (const d of sim.debris) {
      const dx = sim.petX - d.x, dy = sim.petY - d.y;
      const len = Math.hypot(dx, dy);
      if (len > 1 && len < pullRange) {
        d.vx += (dx / len) * pull * dt;
        d.vy += (dy / len) * pull * dt;
      }
    }
  }

  for (const d of sim.debris) { d.x += d.vx * dt; d.y += d.vy * dt; }

  // 이탈 처리 — guardian은 지구 지평선(H-26) 착지가 실점, zen은 어떤 이탈도 즉시 종료
  const bottom = variant.objective === "guardian" ? H - 26 : H + 20;
  const out: Debris[] = [];
  sim.debris = sim.debris.filter((d) => {
    const expired = d.ttl !== undefined && now > d.ttl;
    const gone = expired || d.y > bottom || d.x < -30 || d.x > W + 30;
    if (gone && !expired) out.push(d); // 시한부(gold) 소멸은 놓침이 아니다
    return !gone;
  });
  if (variant.objective === "guardian" && out.length) {
    sim.misses += out.length;
    sim.hurtFlashUntil = now + 300;
    events.push("miss");
    if (sim.misses >= GUARDIAN_MISSES) return { finished: true, events };
  }
  if (variant.objective === "zen" && out.length) {
    events.push("miss");
    return { finished: true, events };
  }

  // picky 색 로테이션 / chain 배수 리셋 / fever 게이지 감쇠
  if (variant.objective === "picky" && now - sim.matchSetAt > MATCH_ROTATE_MS) {
    sim.matchColor = (sim.matchColor + 1) % 3;
    sim.matchSetAt = now;
  }
  if (variant.objective === "chain" && sim.combo > 1 && now - sim.lastEatAt > EAT_GAP_MS) {
    sim.combo = 1;
  }
  if (variant.objective === "fever" && !inFever) {
    sim.fever = Math.max(0, sim.fever - 0.03 * dt);
  }

  // --- 먹기 판정 ---
  const stunned = now < sim.stunnedUntil;
  if (!stunned) {
    const pr = petRadius(sim, variant);
    for (let i = sim.debris.length - 1; i >= 0; i--) {
      const d = sim.debris[i];
      const r = d.big ? BIG_DEBRIS_R : DEBRIS_R;
      const dx = d.x - sim.petX, dy = d.y - sim.petY;
      if (dx * dx + dy * dy > (pr + r) ** 2) continue;
      // giant: 아직 작으면 큰 조각은 못 먹는다 (그대로 둔다)
      if (d.big && sim.size < GIANT_BIG_EDIBLE_R) continue;
      sim.debris.splice(i, 1);
      if (variant.objective === "picky" && d.color !== sim.matchColor) {
        sim.score = Math.max(0, sim.score - 20);
        sim.hurtFlashUntil = now + 250;
        events.push("wrong");
        continue;
      }
      sim.eaten += 1;
      let gain = 10;
      if (variant.objective === "gold") gain = d.gold ? 25 : 5;
      if (variant.objective === "giant") {
        gain = d.big ? 30 : 10;
        sim.size = Math.min(GIANT_MAX_R, sim.size + (d.big ? 2.2 : 1.1));
      }
      if (variant.objective === "chain") {
        if (now - sim.lastEatAt <= EAT_GAP_MS) sim.combo = Math.min(5, sim.combo + 1);
        gain = 10 * sim.combo;
      }
      if (variant.objective === "fever") {
        if (inFever) gain *= 2;
        else {
          sim.fever += FEVER_CHARGE;
          if (sim.fever >= 1) {
            sim.fever = 0;
            sim.feverUntil = now + FEVER_MS;
            events.push("feverStart");
          }
        }
      }
      sim.lastEatAt = now;
      sim.score += gain;
      events.push(d.gold ? "eatGold" : d.big ? "eatBig" : "eat");
      if (variant.objective === "rush30" && sim.eaten >= 30) {
        sim.score += Math.max(0, Math.round(600 - sim.elapsed * 5));
        return { finished: true, events };
      }
    }
  }

  // --- 위성 ---
  for (const s of sim.satellites) {
    s.x += s.vx * dt * speedUp;
    if (s.x < -s.w) s.x = W + s.w;
    if (s.x > W + s.w) s.x = -s.w;
    const dx = s.x - sim.petX, dy = s.y - sim.petY;
    if (!stunned && dx * dx + dy * dy < (petRadius(sim, variant) + 14) ** 2) {
      sim.stunnedUntil = now + 900;
      sim.hurtFlashUntil = now + 400;
      events.push("hurt");
      if (variant.objective === "survival") {
        sim.lives -= 1;
        if (sim.lives <= 0) return { finished: true, events };
      } else {
        sim.score = Math.max(0, sim.score - 50);
      }
    }
  }

  if (isTimed(variant) && sim.elapsed >= ROUND_SECONDS) {
    return { finished: true, events };
  }
  return { finished: false, events };
}
