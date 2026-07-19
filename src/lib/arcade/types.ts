/** 아케이드 미니게임 변형(variant)의 4개 축 — 조합 5×2×2×5 = 정확히 100종 */

/** 목표(승리 조건) — 게임의 핵심 메커니즘을 가른다 */
export type Objective =
  | "score60" // 60초 동안 최대한 많이 먹기
  | "collect30" // 30조각을 최대한 빨리 수거
  | "survival" // 위성에 3번 부딪히면 끝, 버티며 먹기
  | "colorMatch" // 지정된 색의 쓰레기만 골라 먹기 (60초)
  | "combo"; // 끊기지 않게 연속으로 먹어 배수 쌓기 (60초)

/** 조작 방식 */
export type Control =
  | "follow" // 포인터를 부드럽게 따라다닌다
  | "dash"; // 탭/클릭한 지점으로 관성 대시

/** 위험 요소 */
export type Hazard =
  | "clean" // 장애물 없음
  | "satellites"; // 가로지르는 위성 — 부딪히면 감점(생존 모드에선 목숨)

/** 비주얼 테마 (배경·펫·쓰레기 팔레트) */
export type ThemeId = "mint" | "pink" | "lavender" | "star" | "aurora";

export type GameVariant = {
  /** g001 ~ g100 — URL이자 별점/기록 저장 키 */
  id: string;
  name: string;
  description: string;
  objective: Objective;
  control: Control;
  hazard: Hazard;
  theme: ThemeId;
};

export type Theme = {
  label: string;
  /** 배경 그라디언트 위→아래 */
  bgTop: string;
  bgBottom: string;
  pet: string;
  petLight: string;
  /** 쓰레기 조각 팔레트 (colorMatch 모드에선 이 중에서 목표 색이 정해진다) */
  debris: [string, string, string];
  accent: string;
};
