/**
 * PWA 아이콘 생성기 — 외부 의존성 없이 RGBA 버퍼에 직접 그려 PNG로 인코딩한다.
 * (프로젝트 원칙: 이미지 에셋을 손으로 만들지 않고 코드로 그린다)
 *
 * 실행: node scripts/generate-icons.mjs
 * 출력: public/icons/{icon-192,icon-512,maskable-512,apple-touch-180}.png
 * 캐릭터 디자인(PetSvg.tsx)이 바뀌면 여기 그리기 코드도 함께 갱신할 것.
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

// ---------- PNG 인코딩 (표준 스펙 최소 구현) ----------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  // 스캔라인마다 필터 바이트 0(None)을 붙인다
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- 그리기 도우미 ----------

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

/** 알파 합성(over)으로 타원을 채운다. 가장자리 1px은 부드럽게(안티앨리어싱). */
function fillEllipse(buf, size, cx, cy, rx, ry, [r, g, b], alpha = 1) {
  const x0 = Math.max(0, Math.floor((cx - rx) * size) - 1);
  const x1 = Math.min(size - 1, Math.ceil((cx + rx) * size) + 1);
  const y0 = Math.max(0, Math.floor((cy - ry) * size) - 1);
  const y1 = Math.min(size - 1, Math.ceil((cy + ry) * size) + 1);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x / size - cx) / rx;
      const dy = (y / size - cy) / ry;
      const d = Math.sqrt(dx * dx + dy * dy);
      // d=1이 타원 경계 — 경계 밖 1px 폭까지 알파를 선형 감쇠
      const edge = Math.min(rx, ry) * size;
      const a = Math.max(0, Math.min(1, (1 - d) * edge)) * alpha;
      if (a <= 0) continue;
      const i = (y * size + x) * 4;
      buf[i] = buf[i] * (1 - a) + r * a;
      buf[i + 1] = buf[i + 1] * (1 - a) + g * a;
      buf[i + 2] = buf[i + 2] * (1 - a) + b * a;
      buf[i + 3] = Math.min(255, buf[i + 3] + a * 255);
    }
  }
}

/** 배경: 다크 우주 세로 그라디언트 + 결정적 의사난수 별 */
function drawBackground(buf, size) {
  const top = hex("#0b1026");
  const bottom = hex("#241a4d");
  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) buf[i + c] = top[c] + (bottom[c] - top[c]) * t;
      buf[i + 3] = 255;
    }
  }
  const rand = (n) => {
    const v = Math.sin(n * 999.7) * 10000;
    return v - Math.floor(v);
  };
  for (let s = 0; s < 24; s++) {
    fillEllipse(
      buf, size,
      rand(s + 1), rand(s + 101),
      1.2 / size * (1 + rand(s + 201)), 1.2 / size * (1 + rand(s + 201)),
      hex("#ffffff"), 0.5 + rand(s + 301) * 0.5,
    );
  }
}

/** 캐릭터 — PetSvg.tsx와 같은 비율. f: 축소 배율(maskable 안전 영역용) */
function drawPet(buf, size, f = 1) {
  const s = (v) => 0.5 + (v - 0.5) * f; // 중심 기준 스케일
  const mint = hex("#7de8c3");
  const ink = hex("#1c2340");
  // 안테나 (광륜은 어두운 배경에서 탁하게 보여 넣지 않는다)
  fillEllipse(buf, size, s(0.5), s(0.245), 0.012 * f, 0.05 * f, hex("#c4b5fd"));
  fillEllipse(buf, size, s(0.5), s(0.175), 0.042 * f, 0.042 * f, hex("#ffe9a8"));
  // 몸통·배
  fillEllipse(buf, size, s(0.5), s(0.585), 0.315 * f, 0.29 * f, mint);
  fillEllipse(buf, size, s(0.5), s(0.69), 0.185 * f, 0.115 * f, hex("#eafff6"), 0.55);
  // 눈 + 흰 하이라이트
  fillEllipse(buf, size, s(0.405), s(0.545), 0.039 * f, 0.039 * f, ink);
  fillEllipse(buf, size, s(0.595), s(0.545), 0.039 * f, 0.039 * f, ink);
  fillEllipse(buf, size, s(0.418), s(0.532), 0.013 * f, 0.013 * f, hex("#ffffff"));
  fillEllipse(buf, size, s(0.608), s(0.532), 0.013 * f, 0.013 * f, hex("#ffffff"));
  // 볼터치
  fillEllipse(buf, size, s(0.335), s(0.615), 0.034 * f, 0.034 * f, hex("#f9a8d4"), 0.7);
  fillEllipse(buf, size, s(0.665), s(0.615), 0.034 * f, 0.034 * f, hex("#f9a8d4"), 0.7);
}

function renderIcon(size, { padded = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  drawBackground(buf, size);
  // maskable은 바깥 20%가 잘릴 수 있어 캐릭터를 안전 영역 안으로 축소
  drawPet(buf, size, padded ? 0.74 : 1);
  return encodePng(size, buf);
}

mkdirSync(OUT_DIR, { recursive: true });
const jobs = [
  ["icon-192.png", renderIcon(192)],
  ["icon-512.png", renderIcon(512)],
  ["maskable-512.png", renderIcon(512, { padded: true })],
  ["apple-touch-180.png", renderIcon(180, { padded: true })],
];
for (const [name, png] of jobs) {
  writeFileSync(join(OUT_DIR, name), png);
  console.log(`✓ ${name} (${png.length.toLocaleString()} bytes)`);
}
