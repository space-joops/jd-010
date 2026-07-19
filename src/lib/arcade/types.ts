/**
 * 아케이드 v2 — 컨셉 10 × 조작 10 = 100.
 * 모든 게임이 유일한 (objective, control) 쌍이라 서로 다른 메커니즘을 가진다.
 * 캐릭터·팔레트는 라틴방진으로 배치해 인접 게임과 겹치지 않는다.
 */

/** 컨셉(승리 조건·핵심 메커니즘) */
export type Objective =
  | "sprint" // 60초 동안 최대한 많이 먹기
  | "rush30" // 30조각을 최대한 빨리 (시간 보너스)
  | "survival" // 위성 3회 충돌이면 끝, 점점 빨라짐
  | "picky" // 지정 색만 먹기 (10초마다 교체)
  | "chain" // 2초 안에 이어 먹어 배수 유지
  | "giant" // 먹을수록 커짐 — 커야 큰 조각을 먹는다
  | "guardian" // 지구로 떨어지는 쓰레기를 착지 전에, 3번 놓치면 끝
  | "gold" // 희귀한 황금 조각(시한부)이 고득점
  | "fever" // 게이지를 채워 피버(자석+2배) 발동
  | "zen"; // 한 조각도 놓치면 안 되는 무한 집중 모드

/** 조작 방식 */
export type Control =
  | "follow" // 포인터를 부드럽게 따라간다
  | "dash" // 탭한 곳으로 관성 대시
  | "orbit" // 중심을 자동 공전, 탭으로 링(반경) 전환
  | "gravity" // 누르는 동안 포인터 쪽으로 끌려간다 (관성)
  | "flappy" // 계속 가라앉음, 탭으로 상승 부스트
  | "paddle" // 하단 고정, 좌우만 이동
  | "teleport" // 탭한 곳으로 순간이동 (쿨다운)
  | "magnet" // 펫은 중앙 고정, 누르면 견인 광선으로 끌어당김
  | "bounce" // 벽에 튕기며 자동 이동, 탭으로 방향 재설정
  | "snake"; // 멈출 수 없는 전진, 포인터로 조향 (먹으면 꼬리가 자란다)

export type CharacterId =
  | "mongle" // 몽글이 — 둥근 젤리
  | "nemobot" // 네모봇 — 각진 청소 로봇
  | "haepari" // 해파리 — 촉수가 하늘하늘
  | "byeoltong" // 별똥이 — 별 모양
  | "nyangbyeol" // 냥별이 — 고양이 귀
  | "agorae" // 아기고래 — 지느러미와 물줄기
  | "yuryeong" // 유령이 — 물결치는 밑단
  | "seongge" // 성게 — 몽실한 가시
  | "umyu" // 우뮤 — 돔을 쓴 UFO
  | "olchaeng"; // 올챙이 — 긴 꼬리

export type PaletteId =
  | "mint" | "pink" | "lavender" | "star" | "aurora"
  | "dawn" | "abyss" | "amethyst" | "comet" | "ember";

export type GameVariant = {
  /** g001 ~ g100 — URL이자 별점/기록 키. v2에서 의미가 재배정됨(로그의 v=2로 구분) */
  id: string;
  name: string;
  description: string;
  objective: Objective;
  control: Control;
  character: CharacterId;
  palette: PaletteId;
  /** 양념 장애물 — 일부 게임에만 위성이 지나간다 (서바이벌은 항상) */
  satellites: number;
};

export type Palette = {
  label: string;
  bgTop: string;
  bgBottom: string;
  pet: string;
  petLight: string;
  debris: [string, string, string];
  accent: string;
};

/** 게임별 사운드 정체성 — 파형 × 음계 루트가 100게임 모두 다르다 */
export type SoundProfile = {
  wave: OscillatorType;
  /** 먹기 음의 루트 주파수(Hz) */
  root: number;
  /** 루트 대비 반음 오프셋 음계 (먹을 때마다 사다리처럼 올라간다) */
  scale: number[];
};
