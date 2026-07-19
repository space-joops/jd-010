import type {
  Control,
  GameVariant,
  Hazard,
  Objective,
  Theme,
  ThemeId,
} from "./types";

/**
 * 100종의 미니게임 정의.
 *
 * 손으로 100개를 나열하는 대신 4개 축의 전수 조합으로 생성한다
 * (목표 5 × 조작 2 × 위험 2 × 테마 5 = 100).
 * 이렇게 하면 별점 반응을 "어떤 축의 어떤 값이 인기인가"로 해석할 수 있어
 * 우주덕후 취향 파악이라는 실험 목적에 맞는다.
 *
 * ⚠️ 순서가 곧 id(g001~g100)다. 축의 순서·값을 바꾸면 기존 별점/기록의
 * id가 어긋나므로, 변형을 추가할 땐 반드시 배열 끝에만 덧붙일 것.
 */

export const THEMES: Record<ThemeId, Theme> = {
  mint: {
    label: "민트 궤도",
    bgTop: "#0b1026",
    bgBottom: "#123a34",
    pet: "#7de8c3",
    petLight: "#a9f2d9",
    debris: ["#ffe9a8", "#f9a8d4", "#c4b5fd"],
    accent: "#7de8c3",
  },
  pink: {
    label: "핑크 성운",
    bgTop: "#1a0b26",
    bgBottom: "#4d1a3a",
    pet: "#f9a8d4",
    petLight: "#fcd1e8",
    debris: ["#7de8c3", "#ffe9a8", "#c4b5fd"],
    accent: "#f9a8d4",
  },
  lavender: {
    label: "라벤더 무중력",
    bgTop: "#0e0b26",
    bgBottom: "#2f2260",
    pet: "#c4b5fd",
    petLight: "#ddd4fe",
    debris: ["#7de8c3", "#f9a8d4", "#ffe9a8"],
    accent: "#c4b5fd",
  },
  star: {
    label: "별빛 폭풍",
    bgTop: "#1c1426",
    bgBottom: "#4d3d1a",
    pet: "#ffe9a8",
    petLight: "#fff4cd",
    debris: ["#7de8c3", "#f9a8d4", "#c4b5fd"],
    accent: "#ffe9a8",
  },
  aurora: {
    label: "오로라 해류",
    bgTop: "#071a26",
    bgBottom: "#1a4d40",
    pet: "#8be8e0",
    petLight: "#c2f4ef",
    debris: ["#ffe9a8", "#f9a8d4", "#c4b5fd"],
    accent: "#8be8e0",
  },
};

export const OBJECTIVES: Record<
  Objective,
  { label: string; short: string; rule: string }
> = {
  score60: {
    label: "스프린트",
    short: "60초 스코어",
    rule: "60초 동안 우주쓰레기를 최대한 많이 먹어요.",
  },
  collect30: {
    label: "30조각 수거전",
    short: "스피드런",
    rule: "30조각을 최대한 빨리 수거해요. 빠를수록 보너스!",
  },
  survival: {
    label: "서바이벌",
    short: "3목숨 생존",
    rule: "위성에 3번 부딪히면 끝. 점점 빨라지는 궤도에서 버티며 먹어요.",
  },
  colorMatch: {
    label: "편식가",
    short: "색 맞춰먹기",
    rule: "지금 표시된 색의 쓰레기만 먹어요. 다른 색을 먹으면 감점!",
  },
  combo: {
    label: "콤보 러시",
    short: "연속 먹기",
    rule: "2초 안에 계속 이어 먹으면 배수가 커져요. 끊기면 초기화!",
  },
};

export const CONTROLS: Record<Control, { label: string; rule: string }> = {
  follow: { label: "유영", rule: "펫이 손가락(마우스)을 부드럽게 따라와요." },
  dash: { label: "대시", rule: "탭한 곳으로 관성 대시! 멈추기 어려우니 주의." },
};

export const HAZARDS: Record<Hazard, { label: string; rule: string }> = {
  clean: { label: "청정 궤도", rule: "장애물이 없는 평화로운 구역이에요." },
  satellites: {
    label: "위성 회피",
    rule: "가로지르는 위성을 조심해요. 부딪히면 손해!",
  },
};

const objectives: Objective[] = [
  "score60",
  "collect30",
  "survival",
  "colorMatch",
  "combo",
];
const controls: Control[] = ["follow", "dash"];
const hazards: Hazard[] = ["clean", "satellites"];
const themes: ThemeId[] = ["mint", "pink", "lavender", "star", "aurora"];

function buildVariants(): GameVariant[] {
  const list: GameVariant[] = [];
  for (const objective of objectives) {
    for (const control of controls) {
      for (const hazard of hazards) {
        for (const theme of themes) {
          const n = list.length + 1;
          const t = THEMES[theme];
          const name = `${t.label} ${CONTROLS[control].label} ${
            hazard === "satellites" ? "회피 " : ""
          }${OBJECTIVES[objective].label}`;
          list.push({
            id: `g${String(n).padStart(3, "0")}`,
            name,
            description: `${OBJECTIVES[objective].rule} ${CONTROLS[control].rule} ${HAZARDS[hazard].rule}`,
            objective,
            control,
            hazard,
            theme,
          });
        }
      }
    }
  }
  return list;
}

export const VARIANTS: GameVariant[] = buildVariants();

const byId = new Map(VARIANTS.map((v) => [v.id, v]));

export function getVariant(id: string): GameVariant | undefined {
  return byId.get(id);
}
