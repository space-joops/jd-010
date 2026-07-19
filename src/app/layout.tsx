import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "아스트로펫 — 우주로 떠나보낸 펫과 마음을 주고받다",
  description:
    "우주쓰레기를 먹는 신비한 생명체 '아스트로펫'과 유대를 쌓고, 우주로 떠나보낸 뒤 15분마다 돌아오는 재회의 순간에 교감하는 힐링 게임. 곧 만나요!",
  appleWebApp: {
    capable: true,
    title: "아스트로펫",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
