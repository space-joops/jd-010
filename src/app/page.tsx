import InstallCard from "@/components/InstallCard";
import PetSvg from "@/components/PetSvg";
import PreregisterForm from "@/components/PreregisterForm";
import Stars from "@/components/Stars";

/** 컨셉 카드 아이콘도 전부 코드로 그린 SVG (이미지 에셋 금지 원칙) */
const CONCEPTS = [
  {
    title: "마음으로 키우는 펫",
    body: "숫자 성장이 아니라 교감이 전부예요. 죽음도 벌칙도 없어요. 잠시 자리를 비워도 펫은 시무룩할 뿐, 돌아오면 언제나 반겨줘요.",
    icon: (
      <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
        <path
          d="M20 33 C10 26 5 20 5 14 a7.5 7.5 0 0 1 15-1.5 A7.5 7.5 0 0 1 35 14 c0 6 -5 12 -15 19Z"
          fill="#f9a8d4"
        />
        <circle cx="27" cy="10" r="2" fill="#ffe9a8" />
      </svg>
    ),
  },
  {
    title: "15분마다, 다시 만나요",
    body: "우주로 떠난 펫은 15분에 한 번 지구 상공으로 돌아와요. 짧은 재회의 창에서 쓰다듬고, 간식을 주고, 함께 우주를 청소해요.",
    icon: (
      <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
        <circle cx="20" cy="22" r="9" fill="#7de8c3" opacity="0.9" />
        <ellipse
          cx="20"
          cy="22"
          rx="16"
          ry="6.5"
          fill="none"
          stroke="#c4b5fd"
          strokeWidth="2"
          transform="rotate(-18 20 22)"
        />
        <circle cx="33" cy="14" r="2.5" fill="#ffe9a8" />
      </svg>
    ),
  },
  {
    title: "우주가 깨끗해져요",
    body: "아스트로펫의 주식은 우주쓰레기. 펫이 궤도에서 수거해 온 조각들이 도감에 쌓이고, 지구 궤도는 조금씩 맑아져요.",
    icon: (
      <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
        <path
          d="M20 4 l3.6 9.4 L34 17 l-9.4 3.6 L21 30 l-3.6-9.4 L8 17 l9.4-3.6Z"
          fill="#ffe9a8"
        />
        <circle cx="31" cy="30" r="3" fill="#7de8c3" />
        <circle cx="9" cy="31" r="2" fill="#c4b5fd" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main className="bg-gradient-to-b from-space-deep via-space-violet to-space-deep">
      {/* ---------- 히어로 ---------- */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
        <Stars />

        {/* 지평선 너머 지구 실루엣 — 민트빛 대기광 */}
        <div
          aria-hidden
          className="absolute -bottom-52 left-1/2 h-80 w-[170vw] -translate-x-1/2 rounded-[100%] bg-[#141b46] shadow-[0_-10px_70px_rgba(125,232,195,0.28)]"
        />

        <div className="relative flex flex-col items-center">
          <span className="rounded-full border border-lavender/40 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-widest text-lavender">
            우주 힐링 게임 · COMING SOON
          </span>

          <PetSvg className="anim-bob mt-8 h-40 w-40 drop-shadow-[0_0_24px_rgba(125,232,195,0.35)]" />

          <h1 className="mt-6 bg-gradient-to-r from-mint via-star to-pink bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
            아스트로펫
          </h1>

          <p className="mt-4 text-lg font-semibold text-white/90">
            우주로 떠나보낸 펫과, 마음을 주고받다
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
            우주쓰레기를 먹는 신비한 생명체 &lsquo;아스트로펫&rsquo;.
            <br />
            지구에서 유대를 쌓아 우주로 떠나보내면,
            <br />
            15분마다 당신의 하늘 위로 돌아옵니다.
          </p>

          <a
            href="#concept"
            aria-label="게임 소개로 스크롤"
            className="anim-drift mt-12 text-2xl text-mint"
          >
            ↓
          </a>
        </div>
      </section>

      {/* ---------- 컨셉 소개 ---------- */}
      <section id="concept" className="relative mx-auto max-w-md px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-white">
          어떤 게임인가요?
        </h2>

        <div className="mt-10 flex flex-col gap-5">
          {CONCEPTS.map((c) => (
            <article
              key={c.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              {c.icon}
              <h3 className="mt-4 text-lg font-bold text-mint">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {c.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- 출시 소식 받기 (사전등록 + PWA 설치) ---------- */}
      <section id="signup" className="relative mx-auto max-w-md px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-white">
          가장 먼저 만나보세요
        </h2>
        <p className="mt-3 text-center text-sm text-white/60">
          이메일 또는 앱 설치, 편한 쪽으로 출시 소식을 받아보세요.
        </p>

        <div className="mt-10 flex flex-col gap-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
              <rect x="4" y="9" width="32" height="23" rx="4" fill="#7de8c3" />
              <path
                d="M6 12 l14 11 14-11"
                fill="none"
                stroke="#0b1026"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="33" cy="9" r="4" fill="#f9a8d4" />
            </svg>
            <h3 className="mt-4 text-lg font-bold text-mint">이메일 사전등록</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              출시 소식과 분양 시작 알림을 메일로 보내드려요.
            </p>
            <div className="mt-4">
              <PreregisterForm />
            </div>
          </div>

          <InstallCard />
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <Stars />
        <div className="relative">
          <h2 className="text-3xl font-extrabold text-white">
            곧 만나요 <span aria-hidden>🚀</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            아스트로펫은 지금 우주복을 갈아입는 중이에요.
            <br />
            먼 하늘에서 반짝이는 것이 보인다면, 그건 아마 우리예요.
          </p>
          <a
            href="#signup"
            className="mt-8 inline-block rounded-full bg-mint px-8 py-3 text-sm font-bold text-ink transition hover:brightness-110"
          >
            출시 소식 받기
          </a>
        </div>
      </section>

      {/* ---------- 푸터 ---------- */}
      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-white/40">
        © 2026 아스트로펫 · v{process.env.NEXT_PUBLIC_APP_VERSION}
      </footer>
    </main>
  );
}
