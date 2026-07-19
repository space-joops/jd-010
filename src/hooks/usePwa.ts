"use client";

import { useCallback, useEffect, useState } from "react";

/** Chrome 계열이 쏘는 비표준 이벤트 — 타입이 lib.dom에 없어 직접 정의 */
type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * PWA 보조 훅: 서비스워커 등록 + 설치 프롬프트 캡처 + 설치 상태 감지.
 *
 * - SW는 프로덕션에서만 등록한다 (dev는 HMR과 충돌 — 게임 본편과 동일 관례).
 * - sw.js URL 쿼리의 버전이 바뀌면 브라우저가 새 SW로 취급하므로
 *   배포 시 package.json version만 올리면 갱신된다.
 */
export function usePwa() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`/sw.js?v=${process.env.NEXT_PUBLIC_APP_VERSION}`)
        .catch(() => {
          /* SW 실패는 치명적이지 않다 — 페이지는 그대로 동작 */
        });
    }

    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt = (e: Event) => {
      // 브라우저 기본 미니 인포바를 막고 우리 버튼에서 띄운다
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    // 수락이든 거절이든 이벤트는 1회용이라 버린다
    if (outcome === "accepted") setInstallEvent(null);
  }, [installEvent]);

  return { canInstall: installEvent !== null, promptInstall, installed, isIos };
}
