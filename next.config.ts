import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  env: {
    // 버전의 단일 소스는 package.json — 배포 시 version만 올리면
    // 화면 하단 표기가 자동으로 따라온다 (DEVELOPMENT.md 관례, 직접 설정 금지)
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
};

export default nextConfig;
