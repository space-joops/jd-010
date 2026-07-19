/**
 * 아케이드 엔진 헤드리스 시뮬레이션 테스트.
 *
 * 실행: npx -y tsx scripts/arcade-sim-test.ts
 * 가상 시계로 stepSim을 60fps 간격으로 돌리며 5가지 목표 메커니즘을 검증한다.
 * (브라우저 없이 순수 로직만 — engine.ts가 React와 분리된 이유)
 */
import {
  EAT_GAP_MS, MATCH_ROTATE_MS, PET_R,
  createSim, stepSim, type Sim,
} from "../src/lib/arcade/engine";
import { VARIANTS } from "../src/lib/arcade/variants";
import type { GameVariant } from "../src/lib/arcade/types";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name} ${detail}`);
  }
}

function pick(pred: (v: GameVariant) => boolean): GameVariant {
  const v = VARIANTS.find(pred);
  if (!v) throw new Error("variant not found");
  return v;
}

const FRAME = 1000 / 60;

/** now 기준으로 펫 입 앞에 쓰레기를 놓는다 (스폰 난수와 무관하게 판정만 검증) */
function plantDebris(sim: Sim, color = 0) {
  sim.debris.push({ x: sim.petX, y: sim.petY, vx: 0, vy: 0, color, kind: 0 });
}

// ---------- 1. score60: 60초에 끝나고, 먹은 만큼 점수 ----------
{
  console.log("score60 (스프린트)");
  const v = pick((x) => x.objective === "score60" && x.control === "follow" && x.hazard === "clean");
  let now = 1000;
  const sim = createSim(v, now);
  let finished = false;
  let frames = 0;
  while (!finished && frames < 60 * 65) {
    now += FRAME;
    frames++;
    if (frames % 120 === 0) plantDebris(sim); // 2초마다 하나씩 먹여준다
    finished = stepSim(sim, v, now);
  }
  check("60초 시점에 종료된다", finished && Math.abs(sim.elapsed - 60) < 0.1, `elapsed=${sim.elapsed.toFixed(2)}`);
  check("먹은 수 × 10점", sim.score === sim.eaten * 10, `score=${sim.score} eaten=${sim.eaten}`);
  check("자동 스폰이 동작한다", sim.debris.length > 0 || sim.eaten > 29);
}

// ---------- 2. collect30: 30개째에 즉시 종료 + 시간 보너스 ----------
{
  console.log("collect30 (수거전)");
  const v = pick((x) => x.objective === "collect30" && x.hazard === "clean");
  let now = 1000;
  const sim = createSim(v, now);
  let finished = false;
  for (let i = 0; i < 60 * 30 && !finished; i++) {
    now += FRAME;
    if (i % 30 === 0) plantDebris(sim); // 0.5초마다 하나
    finished = stepSim(sim, v, now);
  }
  check("30개를 먹으면 종료된다", finished && sim.eaten === 30, `eaten=${sim.eaten}`);
  const bonus = Math.max(0, Math.round(600 - sim.elapsed * 5));
  check("점수 = 300 + 시간 보너스", sim.score === 300 + bonus, `score=${sim.score} bonus=${bonus}`);
}

// ---------- 3. survival: 위성 3회 충돌로 종료, 스턴 무적 확인 ----------
{
  console.log("survival (서바이벌)");
  const v = pick((x) => x.objective === "survival" && x.control === "follow");
  let now = 1000;
  const sim = createSim(v, now);
  check("위성이 존재한다", sim.satellites.length >= 2, `${sim.satellites.length}`);
  let finished = false;
  let frames = 0;
  while (!finished && frames < 60 * 120) {
    now += FRAME;
    frames++;
    // 펫을 첫 위성 위치로 계속 순간이동 — 스턴이 풀릴 때마다 다시 부딪힌다
    const s = sim.satellites[0];
    sim.petX = s.x; sim.petY = s.y;
    sim.targetX = s.x; sim.targetY = s.y;
    finished = stepSim(sim, v, now);
  }
  check("3회 충돌로 종료된다", finished && sim.lives === 0, `lives=${sim.lives}`);
  check("스턴 무적으로 즉사하지 않는다 (충돌 간 간격 존재)", sim.elapsed > 1.5, `elapsed=${sim.elapsed.toFixed(2)}`);
}

// ---------- 4. colorMatch: 목표 색만 득점, 오답 감점, 색 로테이션 ----------
{
  console.log("colorMatch (편식가)");
  const v = pick((x) => x.objective === "colorMatch" && x.hazard === "clean");
  let now = 1000;
  const sim = createSim(v, now);
  sim.debris = []; // 자동 스폰 개입 제거를 위해 비우고 심는다
  plantDebris(sim, sim.matchColor);
  stepSim(sim, v, (now += FRAME));
  check("목표 색을 먹으면 +10", sim.score === 10 && sim.eaten === 1, `score=${sim.score}`);
  sim.debris = [];
  plantDebris(sim, (sim.matchColor + 1) % 3);
  stepSim(sim, v, (now += FRAME));
  check("다른 색을 먹으면 -20 (0 하한)", sim.score === 0 && sim.eaten === 1, `score=${sim.score}`);
  const before = sim.matchColor;
  stepSim(sim, v, (now += MATCH_ROTATE_MS + FRAME));
  check("10초마다 목표 색이 바뀐다", sim.matchColor === (before + 1) % 3, `${before}→${sim.matchColor}`);
}

// ---------- 5. combo: 연속 먹기 배수, 끊기면 초기화 ----------
{
  console.log("combo (콤보 러시)");
  const v = pick((x) => x.objective === "combo" && x.hazard === "clean");
  let now = 1000;
  const sim = createSim(v, now);
  sim.debris = [];
  plantDebris(sim);
  stepSim(sim, v, (now += FRAME)); // 첫 입: ×1 → 10점
  sim.debris = [];
  plantDebris(sim);
  stepSim(sim, v, (now += 500)); // 0.5초 뒤 연속: ×2 → +20
  check("연속으로 먹으면 배수 상승 (10+20)", sim.score === 30 && sim.combo === 2, `score=${sim.score} combo=${sim.combo}`);
  stepSim(sim, v, (now += EAT_GAP_MS + 100)); // 2초 초과 공백
  check("공백이 생기면 배수 초기화", sim.combo === 1, `combo=${sim.combo}`);
}

// ---------- 6. 위성 감점 모드(비서바이벌): 점수 -50, 목숨 무손실 ----------
{
  console.log("satellites 감점 (스프린트+회피)");
  const v = pick((x) => x.objective === "score60" && x.hazard === "satellites" && x.control === "follow");
  let now = 1000;
  const sim = createSim(v, now);
  sim.score = 100;
  const s = sim.satellites[0];
  sim.petX = s.x; sim.petY = s.y; sim.targetX = s.x; sim.targetY = s.y;
  stepSim(sim, v, (now += FRAME));
  check("위성 충돌 시 -50", sim.score === 50, `score=${sim.score}`);
  check("목숨은 줄지 않는다", sim.lives === 3, `lives=${sim.lives}`);
}

// ---------- 7. 펫 이동: follow는 목표로 수렴, dash는 감속 ----------
{
  console.log("이동 모델");
  const vf = pick((x) => x.control === "follow" && x.hazard === "clean" && x.objective === "score60");
  let now = 1000;
  const sim = createSim(vf, now);
  sim.targetX = 300; sim.targetY = 100;
  for (let i = 0; i < 120; i++) stepSim(sim, vf, (now += FRAME));
  check("follow: 2초 안에 목표 근접", Math.hypot(sim.petX - 300, sim.petY - 100) < 8, `(${sim.petX.toFixed(0)},${sim.petY.toFixed(0)})`);

  const vd = pick((x) => x.control === "dash" && x.hazard === "clean" && x.objective === "score60");
  now = 1000;
  const sd = createSim(vd, now);
  sd.petVX = 400;
  for (let i = 0; i < 180; i++) stepSim(sd, vd, (now += FRAME));
  check("dash: 관성이 감속되어 멈춘다", Math.abs(sd.petVX) < 10, `vx=${sd.petVX.toFixed(1)}`);
  check("경계 밖으로 나가지 않는다", sd.petX >= PET_R && sd.petX <= 360 - PET_R, `x=${sd.petX.toFixed(0)}`);
}

// ---------- 8. 변형 무결성 ----------
{
  console.log("변형 정의");
  check("정확히 100종", VARIANTS.length === 100, `${VARIANTS.length}`);
  check("id 중복 없음", new Set(VARIANTS.map((x) => x.id)).size === 100);
  check("이름 중복 없음", new Set(VARIANTS.map((x) => x.name)).size === 100);
}

console.log(failures === 0 ? "\n모든 검증 통과 ✅" : `\n실패 ${failures}건 ❌`);
process.exit(failures === 0 ? 0 : 1);
