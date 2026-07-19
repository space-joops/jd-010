import type { CharacterId, Palette } from "@/lib/arcade/types";

/**
 * 캐릭터 10종 캔버스 드로잉 — 실루엣이 전부 다르다 (이미지 에셋 금지 원칙).
 *
 * 모든 함수는 (0,0)이 캐릭터 중심인 좌표계에 r(반지름) 크기로 그린다.
 * 호출부(GameCanvas)가 translate/알파를 관리한다.
 * blink: 0(감음)~1(뜸), t: 시간(ms) — 잔망스러운 흔들림용.
 */

type Ctx = CanvasRenderingContext2D;

function eyes(c: Ctx, r: number, blink: number, dx = 0.36, dy = -0.1, size = 0.16) {
  c.fillStyle = "#1c2340";
  c.beginPath(); c.ellipse(-r * dx, r * dy, r * size, r * size * blink, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(r * dx, r * dy, r * size, r * size * blink, 0, 0, Math.PI * 2); c.fill();
  if (blink > 0.5) {
    c.fillStyle = "#ffffff";
    c.beginPath(); c.arc(-r * dx + r * 0.05, r * dy - r * 0.05, r * 0.05, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * dx + r * 0.05, r * dy - r * 0.05, r * 0.05, 0, Math.PI * 2); c.fill();
  }
}

function mouth(c: Ctx, r: number, y = 0.28) {
  c.strokeStyle = "#1c2340";
  c.lineWidth = Math.max(1.5, r * 0.09);
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-r * 0.18, r * y);
  c.quadraticCurveTo(0, r * (y + 0.16), r * 0.18, r * y);
  c.stroke();
}

export const CHARACTER_ART: Record<
  CharacterId,
  (c: Ctx, r: number, p: Palette, blink: number, t: number) => void
> = {
  /** 몽글이 — 둥근 젤리 + 안테나 */
  mongle(c, r, p, blink) {
    c.fillStyle = "#c4b5fd";
    c.fillRect(-r * 0.06, -r * 1.5, r * 0.12, r * 0.5);
    c.fillStyle = "#ffe9a8";
    c.beginPath(); c.arc(0, -r * 1.6, r * 0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = p.pet;
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = p.petLight; c.globalAlpha *= 0.55;
    c.beginPath(); c.ellipse(0, r * 0.45, r * 0.6, r * 0.36, 0, 0, Math.PI * 2); c.fill();
    c.globalAlpha /= 0.55;
    eyes(c, r, blink); mouth(c, r);
  },
  /** 네모봇 — 각진 몸 + 리벳 + 안테나 전구 */
  nemobot(c, r, p, blink) {
    c.strokeStyle = p.petLight; c.lineWidth = r * 0.1;
    c.beginPath(); c.moveTo(0, -r); c.lineTo(0, -r * 1.4); c.stroke();
    c.fillStyle = "#ff9d9d";
    c.beginPath(); c.arc(0, -r * 1.5, r * 0.16, 0, Math.PI * 2); c.fill();
    c.fillStyle = p.pet;
    const w = r * 1.7;
    c.beginPath();
    if (c.roundRect) c.roundRect(-w / 2, -r * 0.85, w, r * 1.7, r * 0.25);
    else c.rect(-w / 2, -r * 0.85, w, r * 1.7); // 구형 Safari 폴백
    c.fill();
    c.fillStyle = p.petLight;
    c.fillRect(-w / 2 + r * 0.15, r * 0.35, w - r * 0.3, r * 0.28);
    c.fillStyle = p.bgTop;
    [-1, 1].forEach((s) => { c.beginPath(); c.arc(s * (w / 2 - r * 0.18), -r * 0.6, r * 0.07, 0, Math.PI * 2); c.fill(); });
    eyes(c, r, blink, 0.34, -0.15, 0.14); mouth(c, r, 0.14);
  },
  /** 해파리 — 돔 + 하늘거리는 촉수 */
  haepari(c, r, p, blink, t) {
    c.fillStyle = p.pet;
    c.beginPath(); c.arc(0, -r * 0.1, r, Math.PI, 0); c.lineTo(r, r * 0.25); c.lineTo(-r, r * 0.25); c.closePath(); c.fill();
    c.strokeStyle = p.petLight; c.lineWidth = r * 0.14; c.lineCap = "round";
    for (let i = -2; i <= 2; i++) {
      const sway = Math.sin(t / 300 + i) * r * 0.14;
      c.beginPath();
      c.moveTo(i * r * 0.38, r * 0.22);
      c.quadraticCurveTo(i * r * 0.38 + sway, r * 0.75, i * r * 0.38 - sway, r * 1.15);
      c.stroke();
    }
    eyes(c, r, blink, 0.36, -0.2); mouth(c, r, 0.02);
  },
  /** 별똥이 — 오각 별 */
  byeoltong(c, r, p, blink) {
    c.fillStyle = p.pet;
    c.beginPath();
    for (let k = 0; k < 10; k++) {
      const rad = k % 2 === 0 ? r * 1.25 : r * 0.55;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      c[k === 0 ? "moveTo" : "lineTo"](rad * Math.cos(a), rad * Math.sin(a));
    }
    c.closePath(); c.fill();
    c.fillStyle = p.petLight; c.globalAlpha *= 0.5;
    c.beginPath(); c.arc(0, r * 0.15, r * 0.42, 0, Math.PI * 2); c.fill();
    c.globalAlpha /= 0.5;
    eyes(c, r, blink, 0.3, -0.05, 0.14); mouth(c, r, 0.24);
  },
  /** 냥별이 — 귀 + 수염 */
  nyangbyeol(c, r, p, blink) {
    c.fillStyle = p.pet;
    c.beginPath(); c.moveTo(-r * 0.85, -r * 0.4); c.lineTo(-r * 0.55, -r * 1.25); c.lineTo(-r * 0.15, -r * 0.75); c.fill();
    c.beginPath(); c.moveTo(r * 0.85, -r * 0.4); c.lineTo(r * 0.55, -r * 1.25); c.lineTo(r * 0.15, -r * 0.75); c.fill();
    c.fillStyle = "#f9a8d4";
    c.beginPath(); c.moveTo(-r * 0.6, -r * 0.55); c.lineTo(-r * 0.5, -r * 1.0); c.lineTo(-r * 0.28, -r * 0.68); c.fill();
    c.fillStyle = p.pet;
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = p.petLight; c.lineWidth = Math.max(1, r * 0.05);
    [[-1, -0.05], [-1, 0.1], [1, -0.05], [1, 0.1]].forEach(([s, y]) => {
      c.beginPath(); c.moveTo(s * r * 0.55, r * (y + 0.15)); c.lineTo(s * r * 1.1, r * y); c.stroke();
    });
    eyes(c, r, blink); mouth(c, r);
  },
  /** 아기고래 — 몸통 + 꼬리 + 물줄기 */
  agorae(c, r, p, blink, t) {
    const flap = Math.sin(t / 260) * 0.25;
    c.fillStyle = p.pet;
    c.beginPath(); c.ellipse(0, 0, r * 1.2, r * 0.85, 0, 0, Math.PI * 2); c.fill();
    c.save();
    c.translate(-r * 1.15, 0); c.rotate(flap);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-r * 0.55, -r * 0.45); c.lineTo(-r * 0.55, r * 0.45); c.closePath(); c.fill();
    c.restore();
    c.fillStyle = p.petLight; c.globalAlpha *= 0.5;
    c.beginPath(); c.ellipse(r * 0.1, r * 0.4, r * 0.7, r * 0.32, 0, 0, Math.PI * 2); c.fill();
    c.globalAlpha /= 0.5;
    c.strokeStyle = "#a8f4ff"; c.lineWidth = r * 0.09; c.lineCap = "round";
    c.beginPath(); c.moveTo(r * 0.2, -r * 0.85); c.quadraticCurveTo(r * 0.1, -r * 1.25, r * 0.4, -r * 1.35); c.stroke();
    c.beginPath(); c.moveTo(r * 0.2, -r * 0.85); c.quadraticCurveTo(r * 0.35, -r * 1.2, r * 0.05, -r * 1.4); c.stroke();
    eyes(c, r, blink, 0.42, -0.12, 0.13); mouth(c, r, 0.2);
  },
  /** 유령이 — 물결 밑단 */
  yuryeong(c, r, p, blink, t) {
    c.fillStyle = p.pet;
    c.beginPath();
    c.arc(0, -r * 0.15, r, Math.PI, 0);
    const waves = 4;
    for (let k = 0; k <= waves * 2; k++) {
      const x = r - (k * r) / waves;
      const y = r * 0.75 + (k % 2 === 0 ? 0 : r * 0.22) + Math.sin(t / 350 + k) * r * 0.05;
      c.lineTo(x, y);
    }
    c.closePath(); c.fill();
    c.fillStyle = "#f9a8d4"; c.globalAlpha *= 0.7;
    c.beginPath(); c.arc(-r * 0.55, r * 0.1, r * 0.13, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(r * 0.55, r * 0.1, r * 0.13, 0, Math.PI * 2); c.fill();
    c.globalAlpha /= 0.7;
    eyes(c, r, blink, 0.32, -0.18); mouth(c, r, 0.08);
  },
  /** 성게 — 몽실한 가시 */
  seongge(c, r, p, blink) {
    c.strokeStyle = p.petLight; c.lineWidth = r * 0.12; c.lineCap = "round";
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6;
      c.beginPath();
      c.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
      c.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3);
      c.stroke();
    }
    c.fillStyle = p.pet;
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    eyes(c, r, blink); mouth(c, r);
  },
  /** 우뮤 — 돔 쓴 UFO */
  umyu(c, r, p, blink) {
    c.fillStyle = "rgba(255,255,255,0.25)";
    c.beginPath(); c.arc(0, -r * 0.35, r * 0.75, Math.PI, 0); c.fill();
    c.fillStyle = p.petLight;
    c.beginPath(); c.arc(0, -r * 0.35, r * 0.55, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(0, -r * 0.35);
    eyes(c, r * 0.55, blink, 0.4, 0, 0.2); mouth(c, r * 0.55, 0.35);
    c.restore();
    c.fillStyle = p.pet;
    c.beginPath(); c.ellipse(0, r * 0.25, r * 1.35, r * 0.5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffe9a8";
    [-0.9, 0, 0.9].forEach((x) => {
      c.beginPath(); c.arc(x * r, r * 0.45, r * 0.1, 0, Math.PI * 2); c.fill();
    });
  },
  /** 올챙이 — 큰 머리 + 살랑이는 꼬리 */
  olchaeng(c, r, p, blink, t) {
    const sway = Math.sin(t / 220) * r * 0.35;
    c.strokeStyle = p.pet; c.lineWidth = r * 0.35; c.lineCap = "round";
    c.beginPath();
    c.moveTo(-r * 0.7, 0);
    c.quadraticCurveTo(-r * 1.4, sway, -r * 2.0, -sway * 0.6);
    c.stroke();
    c.fillStyle = p.pet;
    c.beginPath(); c.ellipse(0, 0, r * 1.05, r * 0.95, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = p.petLight; c.globalAlpha *= 0.5;
    c.beginPath(); c.ellipse(r * 0.15, r * 0.35, r * 0.55, r * 0.3, 0, 0, Math.PI * 2); c.fill();
    c.globalAlpha /= 0.5;
    eyes(c, r, blink, 0.38, -0.15); mouth(c, r, 0.22);
  },
};
