import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GameCanvas from "@/components/arcade/GameCanvas";
import StarRating from "@/components/arcade/StarRating";
import {
  CHARACTERS, CONTROLS, OBJECTIVES, PALETTES, VARIANTS, getVariant,
} from "@/lib/arcade/variants";

/** 100개 게임 페이지를 빌드 시 전부 정적 생성 */
export function generateStaticParams() {
  return VARIANTS.map((v) => ({ id: v.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const variant = getVariant(id);
  if (!variant) return {};
  return {
    title: `${variant.name} — 우주쓰레기 청소 아케이드`,
    description: variant.description,
  };
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const variant = getVariant(id);
  if (!variant) notFound();

  const idx = VARIANTS.findIndex((v) => v.id === variant.id);
  const prev = VARIANTS[(idx + VARIANTS.length - 1) % VARIANTS.length];
  const next = VARIANTS[(idx + 1) % VARIANTS.length];

  return (
    <main className="min-h-dvh bg-gradient-to-b from-space-deep via-space-violet to-space-deep">
      <div className="mx-auto max-w-xl px-6 py-10">
        <div className="flex items-center justify-between text-sm">
          <Link href="/arcade" className="text-white/50 transition hover:text-mint">
            ← 아케이드 목록
          </Link>
          <span className="text-white/40">{variant.id.toUpperCase()}</span>
        </div>

        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white">
          {variant.name}
        </h1>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-white/60">
          <span className="rounded-full bg-white/10 px-2 py-0.5">
            {OBJECTIVES[variant.objective].short}
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5">
            🕹 {CONTROLS[variant.control].label}
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5">
            {CHARACTERS[variant.character].name} — {CHARACTERS[variant.character].blurb}
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5">
            {PALETTES[variant.palette].label}
          </span>
          {variant.satellites > 0 && (
            <span className="rounded-full bg-white/10 px-2 py-0.5">🛰 위성 주의</span>
          )}
        </div>

        <div className="mt-6">
          <GameCanvas variant={variant} />
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <StarRating gameId={variant.id} />
        </div>

        <div className="mt-6 flex justify-between gap-4 text-sm">
          <Link href={`/arcade/${prev.id}`} className="text-white/50 transition hover:text-mint">
            ← {prev.name}
          </Link>
          <Link href={`/arcade/${next.id}`} className="text-right text-white/50 transition hover:text-mint">
            {next.name} →
          </Link>
        </div>
      </div>
    </main>
  );
}
