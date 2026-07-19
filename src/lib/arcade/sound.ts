"use client";

import type { SoundProfile } from "./types";
import type { SimEvent } from "./engine";

/**
 * 절차 생성 효과음 — Web Audio만 사용 (오디오 파일·의존성 없음).
 *
 * 게임마다 SoundProfile(파형 × 음계 × 루트)이 달라 100게임이 전부
 * 다르게 들린다. 먹을 때마다 음계 사다리를 한 칸씩 올라가고,
 * 잠시 쉬면 처음 음으로 돌아온다 (연속 먹기의 상승감).
 *
 * AudioContext는 반드시 사용자 제스처(시작 버튼) 이후 initAudio()로 생성.
 */

const MUTE_KEY = "astropet-arcade-mute";

let ctx: AudioContext | null = null;
let muted = false;
let ladder = 0;
let lastNoteAt = 0;

export function loadMuted(): boolean {
  muted = typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  localStorage.setItem(MUTE_KEY, m ? "1" : "0");
}

/** 사용자 제스처 핸들러 안에서 호출할 것 (autoplay 정책) */
export function initAudio() {
  if (muted) return;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
}

function note(
  freq: number, wave: OscillatorType,
  t0: number, dur: number, peak = 0.14, glideTo?: number,
) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** 짧은 노이즈 버스트 (충돌·놓침) */
function thud(t0: number) {
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * 0.12);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.16, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 300;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
}

const semi = (root: number, s: number) => root * Math.pow(2, s / 12);

/** 엔진 이벤트 → 효과음 */
export function playEvents(events: SimEvent[], profile: SoundProfile) {
  if (muted || !ctx || events.length === 0) return;
  const t = ctx.currentTime;
  for (const e of events) {
    switch (e) {
      case "eat":
      case "eatBig": {
        // 1.2초 안에 이어 먹으면 음계 사다리 상승, 쉬면 리셋
        if (performance.now() - lastNoteAt > 1200) ladder = 0;
        lastNoteAt = performance.now();
        const s = profile.scale[ladder % profile.scale.length] +
          12 * Math.floor(ladder / profile.scale.length);
        ladder = (ladder + 1) % (profile.scale.length * 2);
        note(semi(profile.root, s), profile.wave, t, e === "eatBig" ? 0.22 : 0.13,
          e === "eatBig" ? 0.18 : 0.13);
        break;
      }
      case "eatGold":
        note(semi(profile.root, 12), "triangle", t, 0.1, 0.15);
        note(semi(profile.root, 16), "triangle", t + 0.07, 0.1, 0.15);
        note(semi(profile.root, 19), "triangle", t + 0.14, 0.22, 0.16);
        break;
      case "feverStart":
        for (let k = 0; k < 5; k++) {
          note(semi(profile.root, profile.scale[k % profile.scale.length] + 12),
            profile.wave, t + k * 0.06, 0.12, 0.15);
        }
        break;
      case "teleport":
        note(semi(profile.root, 19), profile.wave, t, 0.16, 0.12, semi(profile.root, 7));
        break;
      case "ring":
        note(semi(profile.root, 7), profile.wave, t, 0.09, 0.1, semi(profile.root, 12));
        break;
      case "wrong":
        note(semi(profile.root, -5), "sawtooth", t, 0.16, 0.12, semi(profile.root, -10));
        break;
      case "hurt":
      case "miss":
        thud(t);
        break;
    }
  }
}

/** 판 시작·종료 시그널 */
export function playStart(profile: SoundProfile) {
  if (muted || !ctx) return;
  ladder = 0;
  const t = ctx.currentTime;
  note(semi(profile.root, 0), profile.wave, t, 0.1, 0.1);
  note(semi(profile.root, 7), profile.wave, t + 0.09, 0.14, 0.11);
}

export function playFinish(profile: SoundProfile) {
  if (muted || !ctx) return;
  const t = ctx.currentTime;
  [0, 4, 7, 12].forEach((s, k) =>
    note(semi(profile.root, s), profile.wave, t + k * 0.09, 0.2, 0.13),
  );
}
