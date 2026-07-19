# 아스트로펫 (AstroPet)

> 우주로 떠나보낸 펫과 마음을 주고받는 힐링 게임 — 현재는 **티저 페이지** 단계입니다.
> v0.2.0: 이메일 사전등록 + PWA 설치(설치 시 출시 푸시 알림 안내) 추가.
> v0.3.0: 우주쓰레기 청소 아케이드 — 취향 실험용 미니게임 100종 + 별점.
> v0.4.0: 아케이드 v2 — 100게임 전부 유일한 (컨셉×조작) 조합, 캐릭터 10종·사운드 추가.

우주쓰레기를 먹는 신비한 생명체 "아스트로펫"을 분양받아 지구에서 유대를 쌓고,
우주로 발사한 뒤 15분마다 돌아오는 재회 윈도우에 교감하며 우주를 정화하는 게임입니다.
세계관·기획·개발 히스토리는 [DEVELOPMENT.md](DEVELOPMENT.md), 작업 규칙은 [AGENT.md](AGENT.md)를 참고하세요.

## 기술 스택

- Next.js 15.5 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS 4 (`src/app/globals.css`의 `@theme`에 팔레트 토큰 정의)
- 외부 런타임 의존성 없음 — 모든 그래픽은 코드로 그린 SVG + CSS 애니메이션

## 실행 방법

```bash
npm install
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드 (타입체크 포함)
PORT=3020 npx next start   # 프로덕션 실행
```

- 포트는 하드코딩하지 않고 `PORT` 환경 변수로 지정합니다.
  AGENT.md 규칙에 따라 브랜치 번호 기반 포트를 사용하세요 (예: `20/step-1` → **3020**).
- 화면 하단 버전 표기는 `package.json`의 `version`을 next.config.ts가
  `NEXT_PUBLIC_APP_VERSION`으로 자동 주입한 값입니다. 직접 설정하지 마세요.

## 구조

```
src/
  app/
    layout.tsx     메타데이터(lang=ko, appleWebApp) · 전역 스타일 로드
    page.tsx       티저 페이지 (히어로 → 컨셉 3장 → 소식받기 → CTA → 푸터)
    manifest.ts    PWA manifest (Next 메타데이터 라우트)
    globals.css    팔레트 토큰 · 키프레임 (JS 애니메이션 없음)
    api/preregister/route.ts  이메일 사전등록 API (아래 한계 참고)
  components/
    PetSvg.tsx           아스트로펫 캐릭터 (순수 SVG)
    Stars.tsx            반짝이는 별 배경 (결정적 의사난수 — hydration 안전)
    PreregisterForm.tsx  이메일 사전등록 폼 (중복 제출은 localStorage로 방지)
    InstallCard.tsx      PWA 설치 카드 (설치 시 출시 푸시 알림 안내)
  hooks/
    usePwa.ts      SW 등록(프로덕션 전용) · 설치 프롬프트 · 설치 상태 감지
public/
  sw.js            서비스워커 — ?v= 쿼리 버전링, 셸/정적 자원 캐싱
  icons/           생성된 PWA 아이콘 (커밋됨)
scripts/
  generate-icons.mjs  의존성 없이 PNG를 직접 인코딩하는 아이콘 생성기
                      (캐릭터 디자인 변경 시 수정 후 재실행)
```

## 아케이드 (미니게임 100종 실험, v2)

"전세계 우주덕후가 무엇을 좋아하는가"를 별점으로 측정하기 위한 실험 기능입니다.

- **컨셉 10 × 조작 10 = 100** — 모든 게임이 세상에 하나뿐인 (컨셉, 조작) 쌍이라
  메커니즘이 전부 다릅니다 (v1은 같은 조합이 20개씩 반복돼 "다 비슷하다"는 피드백).
  - 컨셉: 스프린트 / 30조각 수거전 / 서바이벌 / 편식가 / 콤보 러시 /
    폭풍성장 / 지구 방위 / 황금 사냥 / 피버 타임 / 무결점 젠
  - 조작: 유영 / 대시 / 궤도 링 / 중력자 / 부스터 / 수평 캐처 /
    순간이동 / 견인 광선 / 핀볼 / 스네이크
- **캐릭터 10종**(몽글이·네모봇·해파리·별똥이·냥별이·아기고래·유령이·성게·우뮤·올챙이)과
  **팔레트 10종**은 라틴방진 배치 — 같은 컨셉 행/조작 열에서 겹치지 않고,
  (캐릭터, 팔레트) 쌍도 100게임에 정확히 한 번씩. 전부 캔버스 코드 드로잉.
- **사운드**: Web Audio 절차 생성(파일·의존성 없음). 게임마다 파형×음계×루트가
  달라 100게임이 전부 다르게 들립니다. 먹을수록 음계 사다리가 올라가는 상승감,
  음소거 토글(localStorage 유지).
- `/arcade` 허브(컨셉별 그룹) → `/arcade/g001`~`g100` (빌드 시 전부 정적 생성).
- 게임 규칙·입력 해석은 `src/lib/arcade/engine.ts`의 **순수 로직**(React/캔버스 없음,
  now 주입)이고, `GameCanvas.tsx`는 rAF 루프·드로잉·사운드 트리거만 담당합니다.
- 엔진 검증: `npx -y tsx scripts/arcade-sim-test.ts` — 가상 시계로 컨셉 10종 규칙,
  조작 10종 이동 모델, 변형·사운드 무결성을 헤드리스로 시뮬레이션합니다.
- ⚠️ **id(g001~g100)는 조합 순서에서 나오며, v2에서 의미가 재배정됐습니다.**
  별점 로그의 `v=2` 필드로 v1 로그와 구분하세요. 축 순서 변경 금지.

## PWA 메모

- 서비스워커는 **프로덕션 빌드에서만** 등록됩니다 (`npm run dev`에선 미등록 — HMR 충돌 방지).
- `sw.js?v=<version>` URL 버전링: 배포 시 `package.json` version만 올리면 브라우저가 새 SW로 갱신합니다.
- 설치 버튼은 Chrome 계열의 `beforeinstallprompt`를 사용하고, iOS는 안내 문구로 대체합니다.

## 알려진 한계

- **사전등록 이메일은 아직 영속 저장되지 않습니다.** DB가 없어(Phase 3에서 도입 예정)
  `/api/preregister`는 검증 후 서버 로그에만 남깁니다. Vercel Hobby 함수 로그는 보존
  기간이 짧으므로, 실제 수집을 시작하려면 Supabase/Postgres 등 저장소 연결이 선행되어야 합니다.
- **게임 별점(`/api/rate`)도 같은 한계**입니다 — 서버 로그로만 남고, 페이지의 별 표시는
  본인 것(localStorage)만 보입니다. 전 유저 평균 별점·축별 집계는 DB 연결 후 가능합니다.
- "설치하면 출시 푸시 알림" 안내의 실제 Web Push 발송(VAPID + 서버 크론)은 Phase 3 항목입니다.

## 로드맵

티저 이후 게임 본편(분양→육성→발사→궤도 교감)과 서버/푸시 기능이 이어집니다.
상세 단계별 계획은 [DEVELOPMENT.md](DEVELOPMENT.md) 9장을 참고하세요.
