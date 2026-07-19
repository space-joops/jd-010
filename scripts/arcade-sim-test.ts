/**
 * 아케이드 엔진 v2 헤드리스 시뮬레이션 테스트.
 *
 * 실행: npx -y tsx scripts/arcade-sim-test.ts
 * 가상 시계로 컨셉 10종의 규칙과 조작 10종의 이동 모델을 전부 검증한다.
 */
import {
  EAT_GAP_MS, FEVER_MS, GIANT_BIG_EDIBLE_R, GIANT_START_R, GUARDIAN_MISSES,
  H, MATCH_ROTATE_MS, PET_R, RING_RADII, ROUND_SECONDS, TELEPORT_CD_MS, W,
  createSim, isTimed, petRadius, pointerDown, pointerMove, pointerUp,
  stepSim, type Sim, type SimEvent,
} from "../src/lib/arcade/engine";
import { VARIANTS, soundProfileOf } from "../src/lib/arcade/variants";
import type { Control, GameVariant, Objective } from "../src/lib/arcade/types";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name} ${detail}`);
  }
}

function byPair(objective: Objective, control: Control): GameVariant {
  const v = VARIANTS.find((x) => x.objective === objective && x.control === control);
  if (!v) throw new Error(`variant ${objective}/${control} not found`);
  return v;
}

const FRAME = 1000 / 60;

function plant(sim: Sim, opts: Partial<Sim["debris"][number]> = {}) {
  sim.debris.push({ x: sim.petX, y: sim.petY, vx: 0, vy: 0, color: 0, kind: 0, ...opts });
}

function run(
  sim: Sim, v: GameVariant, from: number, seconds: number,
  each?: (now: number, i: number) => void,
): { now: number; finished: boolean; events: SimEvent[] } {
  let now = from;
  const events: SimEvent[] = [];
  const frames = Math.round((seconds * 1000) / FRAME);
  for (let i = 0; i < frames; i++) {
    now += FRAME;
    each?.(now, i);
    const r = stepSim(sim, v, now);
    events.push(...r.events);
    if (r.finished) return { now, finished: true, events };
  }
  return { now, finished: false, events };
}

// ---------- 컨셉 10종 ----------

{
  console.log("sprint");
  const v = byPair("sprint", "follow");
  const sim = createSim(v, 1000);
  const r = run(sim, v, 1000, 62, (_, i) => { if (i % 120 === 0) plant(sim); });
  check("60초에 종료", r.finished && Math.abs(sim.elapsed - ROUND_SECONDS) < 0.1, `${sim.elapsed}`);
  check("먹은 수 × 10점", sim.score === sim.eaten * 10, `${sim.score}/${sim.eaten}`);
}

{
  console.log("rush30");
  const v = byPair("rush30", "follow");
  const sim = createSim(v, 1000);
  const r = run(sim, v, 1000, 40, (_, i) => { if (i % 30 === 0) plant(sim); });
  check("30개에 즉시 종료", r.finished && sim.eaten === 30, `${sim.eaten}`);
  const bonus = Math.max(0, Math.round(600 - sim.elapsed * 5));
  check("점수 = 300 + 시간 보너스", sim.score === 300 + bonus, `${sim.score}`);
}

{
  console.log("survival");
  const v = byPair("survival", "follow");
  const sim = createSim(v, 1000);
  check("위성 3기", sim.satellites.length === 3, `${sim.satellites.length}`);
  const r = run(sim, v, 1000, 120, () => {
    const s = sim.satellites[0];
    sim.petX = s.x; sim.petY = s.y; sim.targetX = s.x; sim.targetY = s.y;
  });
  check("3회 충돌로 종료 + hurt 이벤트", r.finished && sim.lives === 0 && r.events.filter((e) => e === "hurt").length === 3, `lives=${sim.lives}`);
}

{
  console.log("picky");
  const v = byPair("picky", "follow");
  const sim = createSim(v, 1000);
  let now = 1000;
  sim.debris = [];
  plant(sim, { color: sim.matchColor });
  let r = stepSim(sim, v, (now += FRAME));
  check("목표 색 +10 (eat 이벤트)", sim.score === 10 && r.events.includes("eat"), `${sim.score}`);
  sim.debris = [];
  plant(sim, { color: (sim.matchColor + 1) % 3 });
  r = stepSim(sim, v, (now += FRAME));
  check("오답 -20·wrong 이벤트·eaten 불변", sim.score === 0 && r.events.includes("wrong") && sim.eaten === 1, `${sim.score}`);
  const before = sim.matchColor;
  stepSim(sim, v, (now += MATCH_ROTATE_MS + FRAME));
  check("10초마다 색 교체", sim.matchColor === (before + 1) % 3);
}

{
  console.log("chain");
  const v = byPair("chain", "follow");
  const sim = createSim(v, 1000);
  let now = 1000;
  sim.debris = []; plant(sim);
  stepSim(sim, v, (now += FRAME)); // 첫 입 ×1 = 10
  sim.debris = []; plant(sim);
  stepSim(sim, v, (now += 500)); // 연속 ×2 = +20
  check("연속 배수 상승 (10+20)", sim.score === 30 && sim.combo === 2, `${sim.score}/${sim.combo}`);
  stepSim(sim, v, (now += EAT_GAP_MS + 100));
  check("공백 시 배수 초기화", sim.combo === 1);
}

{
  console.log("giant");
  const v = byPair("giant", "follow");
  const sim = createSim(v, 1000);
  let now = 1000;
  check("작게 시작", sim.size === GIANT_START_R && petRadius(sim, v) === GIANT_START_R);
  sim.debris = []; plant(sim, { big: true });
  stepSim(sim, v, (now += FRAME));
  check("작을 땐 큰 조각을 못 먹는다", sim.eaten === 0 && sim.debris.length === 1);
  for (let k = 0; k < 12; k++) {
    sim.debris = []; plant(sim);
    stepSim(sim, v, (now += FRAME));
  }
  check("먹으면 몸집이 자란다", sim.size > GIANT_START_R + 10, `${sim.size}`);
  sim.size = GIANT_BIG_EDIBLE_R + 1;
  sim.debris = []; plant(sim, { big: true });
  const r = stepSim(sim, v, (now += FRAME));
  check("커지면 큰 조각 +30 (eatBig)", r.events.includes("eatBig") && sim.score >= 120 + 30, `${sim.score}`);
}

{
  console.log("guardian");
  const v = byPair("guardian", "follow");
  const sim = createSim(v, 1000);
  let now = 1000;
  // 놓침 3번: 바닥 바로 위에 빠른 낙하 조각을 심고 펫은 구석에
  sim.petX = PET_R; sim.petY = PET_R; sim.targetX = PET_R; sim.targetY = PET_R;
  let finished = false;
  const evts: SimEvent[] = [];
  for (let m = 0; m < GUARDIAN_MISSES && !finished; m++) {
    sim.debris = [{ x: W - 30, y: H + 1, vx: 0, vy: 100, color: 0, kind: 0 }];
    const r = stepSim(sim, v, (now += FRAME));
    finished = r.finished; evts.push(...r.events);
  }
  check("3번 놓치면 종료 + miss 이벤트", finished && sim.misses >= GUARDIAN_MISSES && evts.includes("miss"), `misses=${sim.misses}`);
}

{
  console.log("gold");
  const v = byPair("gold", "follow");
  const sim = createSim(v, 1000);
  let now = 1000;
  sim.debris = []; plant(sim);
  stepSim(sim, v, (now += FRAME));
  check("일반 조각은 5점", sim.score === 5, `${sim.score}`);
  sim.debris = []; plant(sim, { gold: true, ttl: now + 3500 });
  const r = stepSim(sim, v, (now += FRAME));
  check("황금 조각은 +25 (eatGold)", sim.score === 30 && r.events.includes("eatGold"), `${sim.score}`);
  sim.debris = [{ x: 50, y: 50, vx: 0, vy: 0, color: 0, kind: 1, gold: true, ttl: now + 100 }];
  stepSim(sim, v, (now += 200));
  check("시한이 지나면 사라진다 (놓침 아님)", sim.debris.length === 0 && !isTimedFinish(sim, v), "");
  function isTimedFinish(s: Sim, vv: GameVariant) { return !isTimed(vv) && s.misses > 0; }
}

{
  console.log("fever");
  const v = byPair("fever", "follow");
  const sim = createSim(v, 1000);
  let now = 1000;
  let feverStarted = false;
  for (let k = 0; k < 20 && !feverStarted; k++) {
    sim.debris = []; plant(sim);
    const r = stepSim(sim, v, (now += FRAME));
    feverStarted = r.events.includes("feverStart");
  }
  check("게이지가 차면 피버 발동", feverStarted && sim.feverUntil > now, "");
  const base = sim.score;
  sim.debris = []; plant(sim);
  stepSim(sim, v, (now += FRAME));
  check("피버 중 2배 점수", sim.score === base + 20, `${sim.score - base}`);
  stepSim(sim, v, (now += FEVER_MS + 100));
  sim.debris = []; plant(sim);
  stepSim(sim, v, (now += FRAME));
  check("피버 종료 후 원래 점수", sim.score === base + 30, `${sim.score - base}`);
}

{
  console.log("zen");
  const v = byPair("zen", "follow");
  const sim = createSim(v, 1000);
  let now = 1000;
  sim.petX = PET_R; sim.petY = PET_R; sim.targetX = PET_R; sim.targetY = PET_R;
  sim.debris = [{ x: 180, y: H + 20, vx: 0, vy: 50, color: 0, kind: 0 }];
  const r = stepSim(sim, v, (now += FRAME));
  check("한 조각 놓치면 즉시 종료", r.finished && r.events.includes("miss"), "");
}

// ---------- 조작 10종 ----------

{
  console.log("follow");
  const v = byPair("sprint", "follow");
  const sim = createSim(v, 1000);
  pointerMove(sim, 300, 100);
  run(sim, v, 1000, 2);
  check("목표에 수렴", Math.hypot(sim.petX - 300, sim.petY - 100) < 8);
}

{
  console.log("dash");
  const v = byPair("sprint", "dash");
  const sim = createSim(v, 1000);
  pointerDown(sim, v, 300, 100, 1000);
  check("탭 방향 속도", sim.petVX > 0 && sim.petVY < 0);
  run(sim, v, 1000, 3);
  check("감속되어 멈춘다", Math.hypot(sim.petVX, sim.petVY) < 12, `${Math.hypot(sim.petVX, sim.petVY)}`);
}

{
  console.log("orbit");
  const v = byPair("sprint", "orbit");
  const sim = createSim(v, 1000);
  run(sim, v, 1000, 2);
  const dist = Math.hypot(sim.petX - W / 2, sim.petY - H / 2);
  check("가운데 링 반경 유지", Math.abs(dist - RING_RADII[1]) < 6, `${dist}`);
  const ev = pointerDown(sim, v, 0, 0, 3000);
  check("탭으로 링 전환 (ring 이벤트)", sim.ring !== 1 && ev.includes("ring"));
}

{
  console.log("gravity");
  const v = byPair("sprint", "gravity");
  const sim = createSim(v, 1000);
  const x0 = sim.petX;
  pointerDown(sim, v, 340, 100, 1000);
  run(sim, v, 1000, 1);
  check("누르는 동안 포인터 쪽 가속", sim.petX > x0 + 30, `${sim.petX - x0}`);
  pointerUp(sim);
  check("떼면 견인 종료", sim.holding === false);
}

{
  console.log("flappy");
  const v = byPair("sprint", "flappy");
  const sim = createSim(v, 1000);
  const y0 = sim.petY;
  run(sim, v, 1000, 1);
  check("가만히 두면 가라앉는다", sim.petY > y0, `${sim.petY - y0}`);
  pointerDown(sim, v, sim.petX, sim.petY, 2000);
  check("탭하면 상승 속도", sim.petVY < -200);
}

{
  console.log("paddle");
  const v = byPair("sprint", "paddle");
  const sim = createSim(v, 1000);
  pointerMove(sim, 40, 100);
  run(sim, v, 1000, 1.5);
  check("y 고정 + x 추적", sim.petY === H - 60 && Math.abs(sim.petX - 40) < 8, `${sim.petX},${sim.petY}`);
}

{
  console.log("teleport");
  const v = byPair("sprint", "teleport");
  const sim = createSim(v, 1000);
  const ev = pointerDown(sim, v, 300, 120, 1000);
  check("탭 지점으로 순간이동 + 이벤트", sim.petX === 300 && sim.petY === 120 && ev.includes("teleport"));
  const ev2 = pointerDown(sim, v, 60, 400, 1000 + TELEPORT_CD_MS / 2);
  check("쿨다운 중엔 무시", sim.petX === 300 && ev2.length === 0);
  pointerDown(sim, v, 60, 400, 1000 + TELEPORT_CD_MS + 10);
  check("쿨다운 후 재이동", sim.petX === 60);
}

{
  console.log("magnet");
  const v = byPair("sprint", "magnet");
  const sim = createSim(v, 1000);
  sim.debris = [{ x: sim.petX + 100, y: sim.petY, vx: 0, vy: 0, color: 0, kind: 0 }];
  pointerDown(sim, v, sim.petX, sim.petY, 1000);
  run(sim, v, 1000, 1.5);
  check("펫은 고정, 쓰레기가 끌려와 먹힌다", sim.eaten === 1 && sim.petX === W / 2, `eaten=${sim.eaten}`);
}

{
  console.log("bounce");
  const v = byPair("sprint", "bounce");
  const sim = createSim(v, 1000);
  const speeds: number[] = [];
  run(sim, v, 1000, 4, () => speeds.push(Math.hypot(sim.petVX, sim.petVY)));
  check("속도가 유지된다 (자동 비행)", Math.min(...speeds) > 200, `${Math.min(...speeds)}`);
  check("화면 안에 머문다 (벽 반사)", sim.petX >= PET_R - 1 && sim.petX <= W - PET_R + 1 && sim.petY >= PET_R - 1 && sim.petY <= H - PET_R + 1);
}

{
  console.log("snake");
  const v = byPair("sprint", "snake");
  const sim = createSim(v, 1000);
  pointerMove(sim, W / 2, 40); // 위쪽으로 조향 유지
  run(sim, v, 1000, 1.2);
  check("멈추지 않고 전진", sim.tail.length > 5);
  const v2 = byPair("zen", "snake");
  const s2 = createSim(v2, 1000);
  s2.petX = 5; s2.petY = H / 2; s2.heading = Math.PI; // 왼쪽 벽 밖으로
  pointerMove(s2, -100, H / 2);
  run(s2, v2, 1000, 0.5);
  check("랩어라운드로 반대편 등장", s2.petX > W / 2, `${s2.petX}`);
}

// ---------- 변형·사운드 무결성 ----------

{
  console.log("변형 정의");
  check("정확히 100종", VARIANTS.length === 100, `${VARIANTS.length}`);
  check("id 중복 없음", new Set(VARIANTS.map((x) => x.id)).size === 100);
  check("이름 중복 없음", new Set(VARIANTS.map((x) => x.name)).size === 100);
  check("(컨셉,조작) 쌍이 전부 유일", new Set(VARIANTS.map((x) => `${x.objective}/${x.control}`)).size === 100);
  const rows = new Map<string, Set<string>>();
  for (const x of VARIANTS) {
    if (!rows.has(x.objective)) rows.set(x.objective, new Set());
    rows.get(x.objective)!.add(x.character);
  }
  check("같은 컨셉 행에서 캐릭터 10명 전원 등장", [...rows.values()].every((s) => s.size === 10));
  check("(캐릭터,팔레트) 쌍도 전부 유일", new Set(VARIANTS.map((x) => `${x.character}/${x.palette}`)).size === 100);
  const sounds = new Set(VARIANTS.map((x) => {
    const p = soundProfileOf(x);
    return `${p.wave}/${p.root.toFixed(2)}/${p.scale.join(",")}`;
  }));
  check("사운드 프로필도 전부 다르다", sounds.size === 100, `${sounds.size}`);
}

console.log(failures === 0 ? "\n모든 검증 통과 ✅" : `\n실패 ${failures}건 ❌`);
process.exit(failures === 0 ? 0 : 1);
