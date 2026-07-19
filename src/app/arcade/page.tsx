import type { Metadata } from "next";
import Link from "next/link";
import ArcadeGrid from "@/components/arcade/ArcadeGrid";
import { VARIANTS } from "@/lib/arcade/variants";

export const metadata: Metadata = {
  title: "우주쓰레기 청소 아케이드 — 아스트로펫",
  description:
    "100가지 우주쓰레기 청소 미니게임을 플레이하고 별점을 남겨주세요. 여러분의 별점이 아스트로펫 본편의 방향을 정합니다.",
};

export default function ArcadePage() {
  return (
    <main className="bg-gradient-to-b from-space-deep via-space-violet to-space-deep">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/" className="text-sm text-white/50 transition hover:text-mint">
          ← 아스트로펫 홈
        </Link>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
          우주쓰레기 청소 아케이드
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
          컨셉 10종 × 조작 10종 — <strong className="text-mint">100가지 게임이
          전부 다른 조합</strong>이에요. 캐릭터 10명과 팔레트 10가지, 게임마다
          다른 효과음까지. 마음에 드는 게임에{" "}
          <span className="text-star">별점</span>을 남겨주시면, 가장 사랑받은
          조합이 아스트로펫 본편의 놀이가 됩니다.
        </p>

        <div className="mt-10">
          <ArcadeGrid variants={VARIANTS} />
        </div>

        <p className="mt-14 text-center text-xs text-white/40">
          © 2026 아스트로펫 · v{process.env.NEXT_PUBLIC_APP_VERSION}
        </p>
      </div>
    </main>
  );
}
