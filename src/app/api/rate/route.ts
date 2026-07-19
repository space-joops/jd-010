import { NextResponse } from "next/server";
import { getVariant } from "@/lib/arcade/variants";

/**
 * 게임 별점 수집 API.
 *
 * ⚠️ 사전등록(/api/preregister)과 같은 한계 — DB가 없어 서버 로그로만 남는다.
 * 취향 분석(축별 집계)을 하려면 Phase 3에서 영속 저장소 연결이 선행되어야 한다.
 * 로그 한 줄에 축 정보를 함께 남겨 로그만으로도 1차 분석이 가능하게 한다.
 */
export async function POST(req: Request) {
  let body: { gameId?: unknown; stars?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad-json" }, { status: 400 });
  }

  const { gameId, stars } = body;
  const variant = typeof gameId === "string" ? getVariant(gameId) : undefined;
  if (
    !variant ||
    typeof stars !== "number" ||
    !Number.isInteger(stars) ||
    stars < 1 ||
    stars > 5
  ) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // TODO(Phase 3): 영속 저장소에 저장하도록 교체
  console.log(
    `[rate] ${new Date().toISOString()} ${variant.id} stars=${stars} ` +
      `objective=${variant.objective} control=${variant.control} hazard=${variant.hazard} theme=${variant.theme}`,
  );

  return NextResponse.json({ ok: true });
}
