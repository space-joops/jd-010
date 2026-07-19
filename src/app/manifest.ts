import type { MetadataRoute } from "next";

/** PWA manifest — Next 메타데이터 라우트 (/manifest.webmanifest로 서빙) */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "아스트로펫 — 우주로 떠나보낸 펫과 마음을 주고받다",
    short_name: "아스트로펫",
    description:
      "우주쓰레기를 먹는 생명체 '아스트로펫'과 교감하는 힐링 게임. 설치해 두면 출시 소식을 푸시로 알려드려요.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1026",
    theme_color: "#0b1026",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
