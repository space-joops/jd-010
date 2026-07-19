import type {
  CharacterId, Control, GameVariant, Objective, Palette, PaletteId, SoundProfile,
} from "./types";

/**
 * 100종 게임 정의 (v2).
 *
 * 컨셉 10 × 조작 10의 전수 조합 — 모든 게임이 유일한 (컨셉, 조작) 쌍이라
 * 메커니즘이 전부 다르다. 캐릭터는 (i+j)%10, 팔레트는 (2i+j)%10의
 * 라틴방진 배치라 같은 행(컨셉)·열(조작)에서 절대 겹치지 않고,
 * (캐릭터, 팔레트) 쌍도 100게임에서 정확히 한 번씩만 등장한다.
 *
 * ⚠️ id(g001~g100)는 행우선 순서에서 나온다. 축 순서를 바꾸면 id 의미가
 * 달라지므로 금지. v1과는 의미가 다르며 별점 로그의 v=2로 구분한다.
 */

export const OBJECTIVES: Record<
  Objective,
  { label: string; short: string; rule: string }
> = {
  sprint: {
    label: "스프린트",
    short: "60초 스코어",
    rule: "60초 동안 우주쓰레기를 최대한 많이 먹어요.",
  },
  rush30: {
    label: "30조각 수거전",
    short: "스피드런",
    rule: "30조각을 최대한 빨리! 빠를수록 시간 보너스가 커져요.",
  },
  survival: {
    label: "서바이벌",
    short: "3목숨 생존",
    rule: "위성에 3번 부딪히면 끝. 점점 빨라지는 궤도에서 버텨요.",
  },
  picky: {
    label: "편식가",
    short: "색 맞춰먹기",
    rule: "표시된 색만 먹어요. 다른 색을 먹으면 감점! 10초마다 색이 바뀌어요.",
  },
  chain: {
    label: "콤보 러시",
    short: "연속 먹기",
    rule: "2초 안에 이어 먹으면 배수가 커져요. 끊기면 ×1로!",
  },
  giant: {
    label: "폭풍성장",
    short: "먹고 커지기",
    rule: "먹을수록 몸이 커져요. 큰 조각은 충분히 커진 뒤에만 먹을 수 있어요.",
  },
  guardian: {
    label: "지구 방위",
    short: "낙하 저지",
    rule: "지구로 떨어지는 쓰레기를 착지 전에 먹어요. 3개 놓치면 끝!",
  },
  gold: {
    label: "황금 사냥",
    short: "레어 노리기",
    rule: "가끔 나타나는 황금 조각이 25점! 반짝이는 동안에만 먹을 수 있어요.",
  },
  fever: {
    label: "피버 타임",
    short: "게이지 폭발",
    rule: "먹어서 게이지를 채우면 피버! 잠시 자석이 되고 점수도 2배예요.",
  },
  zen: {
    label: "무결점 젠",
    short: "한 조각도 놓치지 마",
    rule: "화면 밖으로 한 조각이라도 놓치면 끝. 고요하게, 완벽하게.",
  },
};

export const CONTROLS: Record<
  Control,
  { label: string; rule: string; hint: string }
> = {
  follow: {
    label: "유영",
    rule: "펫이 포인터를 부드럽게 따라와요.",
    hint: "포인터를 움직여 유영",
  },
  dash: {
    label: "대시",
    rule: "탭한 곳으로 관성 대시! 멈추기 어려우니 주의.",
    hint: "탭 = 그쪽으로 대시",
  },
  orbit: {
    label: "궤도 링",
    rule: "펫이 중심을 자동으로 공전해요. 탭하면 안쪽/바깥 링으로 갈아타요.",
    hint: "탭 = 링 전환",
  },
  gravity: {
    label: "중력자",
    rule: "누르고 있는 동안 포인터 쪽으로 끌려가요. 떼면 관성으로 표류!",
    hint: "길게 눌러 끌어당기기",
  },
  flappy: {
    label: "부스터",
    rule: "펫이 계속 가라앉아요. 탭해서 떠오르고, 좌우는 포인터를 따라가요.",
    hint: "탭 = 상승 부스트",
  },
  paddle: {
    label: "수평 캐처",
    rule: "펫은 아래쪽에 고정 — 좌우로만 움직여 받아먹어요.",
    hint: "포인터 좌우로 이동",
  },
  teleport: {
    label: "순간이동",
    rule: "탭한 곳으로 순간이동! 1초 쿨다운이 있어요.",
    hint: "탭 = 순간이동 (쿨 1초)",
  },
  magnet: {
    label: "견인 광선",
    rule: "펫은 중앙에 고정. 누르는 동안 광선으로 쓰레기를 끌어당겨요.",
    hint: "길게 눌러 견인",
  },
  bounce: {
    label: "핀볼",
    rule: "펫이 벽에 튕기며 계속 날아다녀요. 탭하면 그쪽으로 방향 전환.",
    hint: "탭 = 방향 전환",
  },
  snake: {
    label: "스네이크",
    rule: "멈출 수 없는 전진! 포인터로 방향을 조종해요. 먹으면 꼬리가 자라요.",
    hint: "포인터로 조향",
  },
};

export const CHARACTERS: Record<CharacterId, { name: string; blurb: string }> = {
  mongle: { name: "몽글이", blurb: "탱글탱글 젤리 몸" },
  nemobot: { name: "네모봇", blurb: "각 잡힌 청소 로봇" },
  haepari: { name: "해파리", blurb: "촉수가 하늘하늘" },
  byeoltong: { name: "별똥이", blurb: "떨어진 꼬마 별" },
  nyangbyeol: { name: "냥별이", blurb: "우주 고양이" },
  agorae: { name: "아기고래", blurb: "성운을 헤엄치는 고래" },
  yuryeong: { name: "유령이", blurb: "수줍은 우주 유령" },
  seongge: { name: "성게", blurb: "몽실몽실 가시돌이" },
  umyu: { name: "우뮤", blurb: "돔을 쓴 꼬마 UFO" },
  olchaeng: { name: "올챙이", blurb: "꼬리가 긴 개구쟁이" },
};

export const PALETTES: Record<PaletteId, Palette> = {
  mint: {
    label: "민트 궤도", bgTop: "#0b1026", bgBottom: "#123a34",
    pet: "#7de8c3", petLight: "#a9f2d9",
    debris: ["#ffe9a8", "#f9a8d4", "#c4b5fd"], accent: "#7de8c3",
  },
  pink: {
    label: "핑크 성운", bgTop: "#1a0b26", bgBottom: "#4d1a3a",
    pet: "#f9a8d4", petLight: "#fcd1e8",
    debris: ["#7de8c3", "#ffe9a8", "#c4b5fd"], accent: "#f9a8d4",
  },
  lavender: {
    label: "라벤더 무중력", bgTop: "#0e0b26", bgBottom: "#2f2260",
    pet: "#c4b5fd", petLight: "#ddd4fe",
    debris: ["#7de8c3", "#f9a8d4", "#ffe9a8"], accent: "#c4b5fd",
  },
  star: {
    label: "별빛 폭풍", bgTop: "#1c1426", bgBottom: "#4d3d1a",
    pet: "#ffe9a8", petLight: "#fff4cd",
    debris: ["#7de8c3", "#f9a8d4", "#c4b5fd"], accent: "#ffe9a8",
  },
  aurora: {
    label: "오로라 해류", bgTop: "#071a26", bgBottom: "#1a4d40",
    pet: "#8be8e0", petLight: "#c2f4ef",
    debris: ["#ffe9a8", "#f9a8d4", "#c4b5fd"], accent: "#8be8e0",
  },
  dawn: {
    label: "새벽 궤도", bgTop: "#160b26", bgBottom: "#5a2d1a",
    pet: "#ffc38b", petLight: "#ffe0c2",
    debris: ["#7de8c3", "#f9a8d4", "#c4b5fd"], accent: "#ffc38b",
  },
  abyss: {
    label: "심해 성간", bgTop: "#050d1f", bgBottom: "#0d2b5e",
    pet: "#8bb8ff", petLight: "#c2d9ff",
    debris: ["#7de8c3", "#ffe9a8", "#f9a8d4"], accent: "#8bb8ff",
  },
  amethyst: {
    label: "자수정 안개", bgTop: "#170b26", bgBottom: "#4a1a5e",
    pet: "#d8a8f9", petLight: "#ecd1fc",
    debris: ["#7de8c3", "#ffe9a8", "#8bb8ff"], accent: "#d8a8f9",
  },
  comet: {
    label: "혜성 꼬리", bgTop: "#0b1626", bgBottom: "#1a4a4d",
    pet: "#a8f4ff", petLight: "#d6faff",
    debris: ["#ffe9a8", "#f9a8d4", "#c4b5fd"], accent: "#a8f4ff",
  },
  ember: {
    label: "잉걸불 성운", bgTop: "#1c0b16", bgBottom: "#5e1a2b",
    pet: "#ff9d9d", petLight: "#ffc9c9",
    debris: ["#7de8c3", "#ffe9a8", "#c4b5fd"], accent: "#ff9d9d",
  },
};

const objectives: Objective[] = [
  "sprint", "rush30", "survival", "picky", "chain",
  "giant", "guardian", "gold", "fever", "zen",
];
const controls: Control[] = [
  "follow", "dash", "orbit", "gravity", "flappy",
  "paddle", "teleport", "magnet", "bounce", "snake",
];
const characters: CharacterId[] = [
  "mongle", "nemobot", "haepari", "byeoltong", "nyangbyeol",
  "agorae", "yuryeong", "seongge", "umyu", "olchaeng",
];
const palettes: PaletteId[] = [
  "mint", "pink", "lavender", "star", "aurora",
  "dawn", "abyss", "amethyst", "comet", "ember",
];

/** 게임별 사운드 정체성: 파형은 조작 열, 음계는 컨셉 행, 루트는 캐릭터로 변주 */
const WAVES: OscillatorType[] = ["sine", "triangle", "square", "sawtooth"];
const SCALES: number[][] = [
  [0, 2, 4, 7, 9], // 메이저 펜타토닉 (sprint)
  [0, 3, 5, 7, 10], // 마이너 펜타토닉 (rush30)
  [0, 2, 3, 7, 8], // 어둑한 선법 (survival)
  [0, 4, 5, 9, 11], // 산뜻 (picky)
  [0, 2, 4, 6, 8], // 온음계 — 몽환 (chain)
  [0, 5, 7, 12, 17], // 넓은 도약 (giant)
  [0, 1, 5, 7, 8], // 긴장 (guardian)
  [0, 4, 7, 11, 14], // 메이저7 반짝 (gold)
  [0, 3, 6, 9, 12], // 디미니시 질주 (fever)
  [0, 7, 12, 19, 24], // 완전5도 명상 (zen)
];

function buildVariants(): GameVariant[] {
  const list: GameVariant[] = [];
  for (let i = 0; i < objectives.length; i++) {
    for (let j = 0; j < controls.length; j++) {
      const objective = objectives[i];
      const control = controls[j];
      const character = characters[(i + j) % 10];
      const palette = palettes[(2 * i + j) % 10];
      // 양념 위성: 서바이벌은 항상, 낙하/젠(자체 긴장)엔 없음, 나머지는 행마다 2게임
      const satellites =
        objective === "survival"
          ? 3
          : objective === "guardian" || objective === "zen"
            ? 0
            : (i + j) % 5 === 0
              ? 2
              : 0;
      list.push({
        id: `g${String(list.length + 1).padStart(3, "0")}`,
        name: `${CHARACTERS[character].name}의 ${CONTROLS[control].label} ${OBJECTIVES[objective].label}`,
        description: `${OBJECTIVES[objective].rule} ${CONTROLS[control].rule}${
          satellites && objective !== "survival" ? " 위성도 지나다니니 조심!" : ""
        }`,
        objective, control, character, palette, satellites,
      });
    }
  }
  return list;
}

export const VARIANTS: GameVariant[] = buildVariants();

const byId = new Map(VARIANTS.map((v) => [v.id, v]));

export function getVariant(id: string): GameVariant | undefined {
  return byId.get(id);
}

/** 반음 → 주파수. 캐릭터 인덱스로 루트를 살짝 옮겨 100게임이 전부 다르게 들린다 */
export function soundProfileOf(variant: GameVariant): SoundProfile {
  const i = objectives.indexOf(variant.objective);
  const j = controls.indexOf(variant.control);
  const k = characters.indexOf(variant.character);
  // 캐릭터 인덱스를 그대로 반음으로 — 10개의 서로 다른 루트 (D3~B3 부근)
  const rootSemitone = -7 + k;
  return {
    wave: WAVES[j % 4],
    root: 220 * Math.pow(2, rootSemitone / 12),
    scale: SCALES[i],
  };
}
