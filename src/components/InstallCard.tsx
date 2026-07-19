"use client";

import { usePwa } from "@/hooks/usePwa";

/**
 * PWA 설치 안내 카드.
 * 환경별로 안내가 갈린다: 설치 가능(Chrome 계열) → 버튼,
 * iOS → 공유 시트 안내, 그 외 → 브라우저 메뉴 안내, 이미 설치됨 → 감사 문구.
 */
export default function InstallCard() {
  const { canInstall, promptInstall, installed, isIos } = usePwa();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-sm">
      <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
        <rect x="9" y="4" width="22" height="32" rx="4" fill="#c4b5fd" />
        <rect x="12" y="8" width="16" height="21" rx="2" fill="#0b1026" />
        <circle cx="20" cy="33" r="1.6" fill="#0b1026" />
        <path d="M20 12 l1.8 4.6 4.8 .4 -3.7 3.1 1.1 4.7 -4-2.5 -4 2.5 1.1-4.7 -3.7-3.1 4.8-.4Z" fill="#ffe9a8" />
      </svg>

      <h3 className="mt-4 text-lg font-bold text-lavender">앱으로 설치하기</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/70">
        홈 화면에 설치해 두면, 아스트로펫이 출시되는 날{" "}
        <strong className="text-white/90">푸시 알림</strong>으로 가장 먼저
        알려드려요.
      </p>

      {installed ? (
        <p className="mt-4 rounded-xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm font-medium text-mint">
          이미 설치되어 있어요. 출시 알림으로 만나요! 🛰
        </p>
      ) : canInstall ? (
        <button
          type="button"
          onClick={promptInstall}
          className="mt-4 rounded-full bg-lavender px-6 py-3 text-sm font-bold text-ink transition hover:brightness-110"
        >
          홈 화면에 설치
        </button>
      ) : (
        <p className="mt-4 text-xs leading-relaxed text-white/50">
          {isIos
            ? "iOS에서는 Safari의 공유 버튼 → “홈 화면에 추가”로 설치할 수 있어요."
            : "Chrome·Edge라면 주소창 오른쪽의 설치 아이콘으로, 그 외 브라우저는 메뉴의 “앱 설치”로 추가할 수 있어요."}
        </p>
      )}
    </div>
  );
}
