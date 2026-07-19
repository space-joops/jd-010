"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GameVariant, Objective } from "@/lib/arcade/types";
import { CONTROLS, HAZARDS, OBJECTIVES, THEMES } from "@/lib/arcade/variants";

/**
 * 100종 게임 카드 그리드.
 * 목표(메커니즘)별 5개 섹션으로 묶어 훑어보기 쉽게 하고,
 * 내 별점/최고 기록은 localStorage에서 한 번에 읽어 카드에 표시한다.
 */
export default function ArcadeGrid({ variants }: { variants: GameVariant[] }) {
  const [myRatings, setMyRatings] = useState<Record<string, number>>({});
  const [myBests, setMyBests] = useState<Record<string, number>>({});

  useEffect(() => {
    const ratings: Record<string, number> = {};
    const bests: Record<string, number> = {};
    for (const v of variants) {
      const r = localStorage.getItem(`astropet-rating-${v.id}`);
      if (r) ratings[v.id] = Number(r);
      const b = localStorage.getItem(`astropet-arcade-best-${v.id}`);
      if (b) bests[v.id] = Number(b);
    }
    setMyRatings(ratings);
    setMyBests(bests);
  }, [variants]);

  const groups = (Object.keys(OBJECTIVES) as Objective[]).map((obj) => ({
    obj,
    items: variants.filter((v) => v.objective === obj),
  }));

  return (
    <div className="flex flex-col gap-12">
      {groups.map(({ obj, items }) => (
        <section key={obj} aria-labelledby={`group-${obj}`}>
          <h2 id={`group-${obj}`} className="text-xl font-bold text-white">
            {OBJECTIVES[obj].label}
            <span className="ml-2 text-sm font-medium text-white/50">
              {OBJECTIVES[obj].short} · {items.length}종
            </span>
          </h2>
          <p className="mt-1 text-sm text-white/60">{OBJECTIVES[obj].rule}</p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((v) => (
              <Link
                key={v.id}
                href={`/arcade/${v.id}`}
                className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-mint/50 hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-mint">
                    {v.name}
                  </h3>
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: THEMES[v.theme].accent }}
                    aria-hidden
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-white/60">
                  <span className="rounded-full bg-white/10 px-2 py-0.5">
                    {CONTROLS[v.control].label}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5">
                    {HAZARDS[v.hazard].label}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5">
                    {THEMES[v.theme].label}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-star" aria-label={myRatings[v.id] ? `내 별점 ${myRatings[v.id]}점` : "아직 별점 없음"}>
                    {myRatings[v.id] ? "★".repeat(myRatings[v.id]) : <span className="text-white/30">☆ 별점을 남겨주세요</span>}
                  </span>
                  {myBests[v.id] !== undefined && (
                    <span className="text-white/50">최고 {myBests[v.id]}점</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
