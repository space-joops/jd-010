# 아스트로펫 개발 핸드오프 문서

> 다른 개발자/에이전트가 이 프로젝트를 이어받아 발전시키기 위한 상세 문서.
> 짧은 요약과 세계관은 루트의 `AGENT.md`를 먼저 읽고 오세요. (2026-07-19 기준, v0.3.0)

---

## 1. 프로젝트 정체성

**"우주로 떠나보낸 펫과 마음을 주고받는 힐링 게임."**
우주쓰레기를 먹는 생명체 "아스트로펫"을 분양받아 지구에서 유대감을 쌓고, 우주로 발사한 뒤 15분마다 돌아오는 재회 윈도우에 교감하며 우주를 정화한다.

브레인스토밍으로 확정된 4대 방향 (변경하려면 사용자와 합의 필요):

1. **감성 돌봄 중심** — 숫자 성장이 아니라 교감이 핵심. 죽음/처벌 금지. 방치하면 "시무룩"해질 뿐이고, 복귀하면 반겨준다. 죄책감이 아니라 애틋함을 주는 디자인.
2. **압축 시간** — 실제 90분 궤도의 1/6인 15분. 재회 윈도우는 각 궤도의 첫 3분.
3. **깔끔한 플랫/SVG 스타일** — 이미지 에셋 없이 코드로 그린다. 다크 우주 그라디언트 + 파스텔.
4. **실제 운영 지향** — 모바일 퍼스트, PWA, 단계적으로 서버/푸시/소셜 확장.

## 2. 현재 상태 (완료된 것)

| 버전 | 내용 |
|---|---|
| v0.1.0 (Phase 1) | 코어 루프 전체: 분양→부화→이름→육성→슈트→발사→궤도. 자동 수거·오프라인 정산·우주 편지·도감·localStorage 저장 |
| v0.2.0 (Phase 2) | PWA: manifest·아이콘·서비스워커, 설치 안내(설정 패널), SW 업데이트 배너, 재회 로컬 알림, 앱 버전 표시 |
| v0.3.0 | 젤리 쿨다운 환경 변수화, 미설치 시 설치 안내 토스트, 전 화면 하단 버전 표기 |

전 플로우를 Chrome 자동화로 실제 플레이하며 검증 완료 (정산 수치, SW 업데이트 사이클 포함).

## 3. 기술 스택 & 실행

- Next.js 15.5 (App Router, Turbopack) + React 19 + TypeScript + Tailwind CSS 4
- 외부 런타임 의존성 추가 없음. 상태 관리 라이브러리 없음 (React 훅 + localStorage)
- 서버/DB 없음 — 완전한 클라이언트 게임 (Phase 3에서 도입 예정)

```bash
npm run dev              # 개발 (서비스워커 미등록 — HMR 충돌 방지)
npm run build            # 프로덕션 빌드 (타입체크 포함)
npx next start -p 3001   # 프로덕션 실행 — SW/PWA는 여기서만 동작
node scripts/generate-icons.mjs  # PWA 아이콘 재생성 (디자인 변경 시)
```

- ⚠️ 이 개발 머신에서 **3000 포트는 무관한 다른 프로세스가 점유** 중 → 3001 사용 관례
- 환경 변수 (`.env.example` 참고, `NEXT_PUBLIC_*`은 빌드 시 인라인됨):
  - `NEXT_PUBLIC_FEED_COOLDOWN_MS` — 육성 단계 우주젤리 쿨다운(ms). 기본 20000
  - `NEXT_PUBLIC_APP_VERSION` — **직접 설정 금지.** next.config.ts가 package.json version에서 자동 주입

## 4. 코드 맵

```
src/
  lib/            ← 순수 게임 로직 (React 없음, now를 인자로 주입 → 테스트 용이)
    types.ts        GameState·Stage·Letter·DebrisId 등 전체 타입
    constants.ts    모든 튜닝 수치와 도감 정의 (밸런스 조정은 여기만)
    game.ts         정산(settle)·궤도(orbitInfo)·기분(currentMood)·액션 함수들
    letters.ts      편지 템플릿 풀(밝은 톤 7 + 그리운 톤 4) + 웰컴 편지
    storage.ts      localStorage 로드/저장 (version 체크)
    notify.ts       재회 로컬 알림 + 알림 설정 저장
    version.ts      APP_VERSION 상수
  hooks/
    useGame.ts      게임 상태 훅 — 1초 틱, 오프라인 정산, 자동 저장, 액션 API
    usePwa.ts       SW 등록/업데이트 감지, 설치 프롬프트, 알림 권한
  components/
    Game.tsx        클라이언트 루트 — 스테이지 분기, 알림 트리거, 업데이트 배너,
                    설치 토스트, 공통 버전 푸터
    PetSvg.tsx      캐릭터 (색 3종 × 표정 5종 × 슈트 3색 레이어)
    OrbitView.tsx   지구+궤도+펫 위치 시각화
    EggSvg.tsx / Stars.tsx / Gauge.tsx / Hearts.tsx / InstallToast.tsx
    screens/        Adopt → Egg → Name → Raising → Prep → Launching → Orbit
    panels/         Sheet(바텀시트 셸), LettersPanel, DebrisPanel, SettingsPanel, SettleModal
  app/
    layout.tsx      메타데이터(lang=ko, appleWebApp), 뷰포트
    manifest.ts     PWA manifest (Next 메타데이터 라우트)
public/
  sw.js           서비스워커 (아래 6장 참고)
  icons/          생성된 PWA 아이콘 (커밋됨)
scripts/
  generate-icons.mjs  의존성 없이 PNG를 직접 인코딩하는 아이콘 생성기
```

## 5. 핵심 시스템 상세

### 5.1 스테이지 머신

`GameState.stage`: `adopt → egg → name → raising → prep → launching → orbit`
각 액션 함수는 스테이지를 가드하며, **조건이 안 맞으면 원본 참조를 그대로 반환**한다.
이 규약이 중요: `useGame`의 `run()`은 `next !== settled`로 성공 여부를 판정해 UI에 돌려준다
(하트 파티클, 쿨다운 피드백 등). 새 액션을 만들 때 반드시 지킬 것.

### 5.2 시간·정산 (game.ts의 심장)

- 모든 로직은 `now: number`를 인자로 받는 순수 함수. `Date.now()`는 훅에서만 호출.
- **기분(mood)은 지연 계산**: `{mood, moodAt}` 쌍으로 저장하고 `currentMood(state, now)`로
  감쇠를 계산. 상호작용 시에만 값을 확정(materialize)한다. 틱마다 저장값을 갱신하지 않는다.
- **settle(state, now)**: 1초 틱과 오프라인 복귀를 같은 함수로 처리.
  - 수거: `progress += (6/궤도) × 기분계수 × dt`, 1을 넘을 때마다 가중치 랜덤 1개 획득
  - 기분계수 = `0.25 + 0.75 × (구간 평균 기분/100)` — 시작·끝 기분의 산술평균 근사
  - 편지: 45분마다 1통 적립, 한 번의 정산에서 최대 3통 생성(초과분은 버림), 최대 60통 보관.
    오프라인 생성분은 부재 기간에 걸쳐 도착한 것처럼 과거 시각을 배정
  - 궤도 스테이지가 아니면 `lastSettleAt`만 갱신
- **orbitInfo(launchedAt, now)**: `phase = (경과 % 15분) / 15분`. `phase < 0.2`가 재회 윈도우.
  발사 직후 phase 0 → 즉시 첫 윈도우가 열리는 것이 의도된 UX (첫 재회 연출).
- 윈도우당 1회 액션(간식·협동 수거)은 `lastSnackOrbit / lastCoopOrbit`에 궤도 번호를 기록해 제한.

### 5.3 튜닝 수치 (constants.ts — 전부 여기서만 수정)

| 항목 | 값 | 비고 |
|---|---|---|
| 궤도 주기 | 15분 | 실제 90분의 1/6 |
| 재회 윈도우 | 궤도의 첫 20% = 3분 | |
| 기분 감쇠 | 100→0까지 8시간 | |
| 자동 수거 | 기분 100 기준 궤도당 6개 | 최저 효율 25% |
| 협동 수거 | 8~12개 버스트 + 기분 +10 | 궤도당 1회 |
| 간식 | 기분 +15 | 윈도우당 1회 |
| 쓰다듬기(궤도) | 기분 +4, 쿨다운 2.5초 | 윈도우 중에만 |
| 쓰다듬기(육성) | 유대감 +6, 기분 +2, 쿨다운 2.5초 | |
| 우주젤리(육성) | 유대감 +12, 기분 +6, 쿨다운 20초(env) | |
| 알 부화 | 탭 8회 | |
| 발사 조건 | 유대감 100 | |
| 편지 | 45분당 1통, 정산당 최대 3통, 60통 보관 | 기분 50 기준 톤 분기 |
| 정산 모달 | 10분 이상 부재 + 획득 있을 때 | |

도감 가중치: 페인트 34 / 볼트 30 / 단열재 15 / 페어링 12 / 태양전지판 5.5 / 폐위성 3 / 공구가방 0.5 (전설, 2008년 실화 모티브).

⚠️ 현재 수치는 **데모 친화적**(육성 ~1분 완료). 실운영 전 밸런스 패스 필요 — 9.1 참고.

### 5.4 저장 (storage.ts)

localStorage 키:

| 키 | 내용 |
|---|---|
| `astropet-save-v1` | GameState 전체 (JSON) |
| `astropet-alarm-v1` | 재회 알림 on/off ("1"/"0") |
| `astropet-install-snooze-v1` | 설치 토스트 숨김 만료 timestamp |

- 저장은 `useGame`의 `useEffect([state])`에서 매 상태 변화(≈1초)마다 수행.
- ⚠️ **`loadGame`은 `version !== 1`이면 null을 반환해 세이브를 버린다.**
  스키마를 바꾸면 반드시 마이그레이션 함수를 추가할 것 (버리지 말고 변환).
  필드 "추가"만 하는 경우엔 로드 후 기본값 채우는 방식으로 하위호환 가능.

### 5.5 useGame 훅 패턴

- `stateRef`로 최신 상태를 미러링 → 액션은 `settle(현재, now)` 후 적용하고 `commit()`.
  (틱과의 경합을 피하면서 액션이 항상 정산된 최신 상태를 보는 구조)
- 1초 `setInterval` 틱 + `visibilitychange`(탭 복귀) 시 정산. 복귀 정산에서
  10분 이상 부재 + 획득이 있으면 `report`를 세팅 → `SettleModal` 표시.
- React StrictMode의 이펙트 2회 실행에 안전 (정산은 dt 기반이라 멱등에 가깝고,
  `enterOrbit` 등은 스테이지 가드로 재실행 무해).

### 5.6 렌더링·비주얼

- 모바일 퍼스트: `max-w-[430px]` 중앙 프레임, `fixed inset-0` + `h-full` (스크롤 없음).
- 팔레트: 배경 #0b1026→#241a4d, 민트 #7de8c3, 핑크 #f9a8d4, 라벤더 #c4b5fd, 별노랑 #ffe9a8.
  Tailwind 토큰은 `globals.css`의 `@theme`에 정의 (`bg-mint`, `text-star` 등).
- 애니메이션은 전부 `globals.css`의 keyframes + 유틸 클래스 (`anim-bob`, `pet-eye`(깜빡임),
  `anim-ring`, `anim-rocket` 등). JS 애니메이션 없음.
- `PetSvg`: 표정은 `getExpression(state, now)`가 결정 — 발사/윈도우 = excited,
  기분 70+/40+/미만 = happy/neutral/lonely. 그라디언트 id는 `astro-body-${color}`로 결정적.
- `OrbitView` 좌표계: viewBox 360×240, 지구 중심 (180,330) r150, 궤도 r210.
  펫 위치 `x = 180 + 210sin(2πp)`, `y = 330 − 210cos(2πp)` (p=phase, 0=상공).
  `y < 252`일 때만 보임 → 상공 부근에서만 나타나고 반대편에선 지구 뒤로 숨는 연출.

## 6. PWA 구조

- **등록**: `usePwa`가 프로덕션에서만 `/sw.js?v=<APP_VERSION>` 등록. dev는 미등록.
- **버전링**: SW는 자신의 URL 쿼리에서 버전을 읽어 캐시 이름(`astropet-<v>`)에 사용.
  URL이 바뀌면 새 SW로 취급되는 브라우저 규칙을 이용 → **배포 시 package.json 버전만 올리면 됨**.
- **업데이트 플로우**: 새 SW가 waiting → `updateReady` → Game.tsx 하단 배너 "새 버전이
  준비됐어요" → 클릭 시 `SKIP_WAITING` 메시지 → `controllerchange` → 자동 reload.
  activate 시 이전 버전 캐시 삭제. (v0.2.0→v0.3.0 실배포로 전 사이클 검증됨)
- **캐싱 전략**: 네비게이션 = 네트워크 우선(오프라인 시 캐시된 셸), `/_next/static/`·아이콘 =
  캐시 우선(내용 해시라 안전). API 캐싱 없음 (아직 API 없음 — Phase 3에서 전략 재검토).
- **설치**: `beforeinstallprompt` 캡처 → 설정 패널 버튼 + 미설치 시 상단 토스트(24h 스누즈).
  iOS는 프롬프트가 없어 안내문으로 대체. 설치 여부는 `display-mode: standalone`으로 감지.
- **알림**: 윈도우가 열리는 순간(틱에서 false→true 전이) + 탭이 백그라운드 + 권한 허용 +
  토글 on일 때 `reg.showNotification`. 클릭하면 게임 창 포커스(sw.js notificationclick).
  **탭을 완전히 닫으면 알림 불가** — 진짜 푸시는 Phase 3.
- **아이콘**: `scripts/generate-icons.mjs`가 zlib만으로 PNG 인코딩 (192/512/maskable 512/
  apple-touch 180). 캐릭터 디자인 바꾸면 스크립트 내 그리기 코드도 갱신 후 재실행.

## 7. 검증·테스트 방법

자동화 테스트는 아직 없음 (9.3 참고). 현재는 수동 + 브라우저 자동화로 검증한다.

```bash
npm run build && npx next start -p 3001
```

**시간 여행 치트** (개발자 콘솔) — 오프라인 정산·편지·기분 감쇠 테스트:

```js
const k='astropet-save-v1', s=JSON.parse(localStorage.getItem(k));
const H=3600e3; s.lastSettleAt-=2*H; s.moodAt-=2*H; s.launchedAt-=2*H+5*60e3;
localStorage.setItem(k, JSON.stringify(s)); location.reload();
// → "다시 만났어요" 모달: 수거 ~40개대, 편지 2통, 기분 -25 예상
```

**육성 스킵**: `s.bond=100` 저장 후 reload → 발사 CTA.
**처음부터**: 설정 패널 초기화, 또는 `localStorage.clear()`.

브라우저 자동화(Claude in Chrome 등) 팁:
- 스크린샷이 뷰포트 상단만 캡처되는 경우가 있음 → 하단 UI는 `read_page`(접근성 트리)나
  `getBoundingClientRect` 측정으로 확인할 것. 레이아웃 버그로 오판하지 말 것.
- 좌표 클릭보다 요소 ref 클릭이 안정적.

체크리스트 (릴리스 전):
- [ ] 신규 시작: 분양→부화→이름→육성→발사→궤도 진입
- [ ] 윈도우: 쓰다듬기 하트, 간식/협동 수거 1회 제한, 남은 시간 바
- [ ] 새로고침 후 상태 유지, 시간 여행 치트로 정산 모달
- [ ] 편지 수신/읽음 뱃지, 도감 발견/미발견 표시
- [ ] prod에서 SW activated·캐시 버전 확인, 버전업 배포 시 업데이트 배너
- [ ] 하단 버전 표기가 package.json과 일치

## 8. 배포·버전업 절차

1. `package.json`의 `version` 올리기 (semver: 기능=minor, 수정=patch)
2. `npm run build` → 배포 (HTTPS 필수 — SW/알림/설치 모두 secure context 요구, localhost는 예외)
3. 기존 사용자는 다음 접속 때 업데이트 배너로 새 버전 수신
4. 커밋 메시지에 버전 명시 관례: `"... (v0.3.0)"`

호스팅 미정. Vercel이 가장 마찰 없음 (Next 15 + 정적/SSR 혼합, sw.js는 public이라 그대로 서빙).

## 9. 추가 개발 계획

### 9.1 즉시 가치 있는 개선 (서버 불필요 — 다음 작업으로 추천)

1. **밸런스 운영 패스**: 데모 수치 → 운영 수치. 제안:
   육성 유대감을 하루 2~3회 접속 × 2~3일에 완성되게 (쓰다듬기 +2, 젤리 +5, 젤리 쿨다운 4h 등),
   `.env`로 데모/운영 프로필 분리 (`NEXT_PUBLIC_BALANCE=demo|prod` 방식 확장 고려)
2. **편지 확충**: 템플릿 20+개, 마일스톤 편지(수거 100/1,000개, 궤도 100바퀴, 함께한 7일),
   전설 아이템 발견 편지. 편지에 그날 수거량 등 실데이터 삽입(`{count}` 치환)
3. **전설 연출**: 공구가방 획득 시 전용 모달 + 실화 설명 카드
4. **성장 시각화**: 누적 수거량에 따라 펫 곁에 별/배지, 슈트 데칼 해금 — 감성 보상
5. **사운드**: Web Audio로 짧은 효과음 (탭, 부화, 발사, 알림) + 음소거 토글
6. **접근성/품질**: `prefers-reduced-motion` 대응, 진동(Vibration API) 옵션,
   Lighthouse PWA 점검, 아이폰 노치 safe-area(`env(safe-area-inset-*)`) 패딩
7. **게임 저장 내보내기/가져오기**: JSON 파일로 백업 (서버 이전 전 안전망)

### 9.2 Phase 3 — 계정·서버·푸시 (큰 덩어리)

권장 스택: **Supabase** (Auth + Postgres + Edge Functions) 또는 Next API Route + Postgres.

- **인증**: 익명 시작 → 소셜 로그인 승격 (기존 localStorage 세이브를 가입 시 서버로 병합
  하는 마이그레이션 플로우가 핵심. 절대 세이브를 버리지 말 것)
- **서버 시간 검증**: 정산을 서버로 이전. 클라이언트는 낙관적 UI로 즉시 반영하되
  서버 정산 결과로 보정. `lib/game.ts`가 이미 순수 함수라 서버에서 재사용 가능 —
  이 구조를 깨뜨리지 말 것 (동형 로직이 설계 의도)
- **Web Push**: VAPID 키 + 구독 저장. `launchedAt`과 궤도 주기로 **다음 윈도우 시각이
  결정적으로 계산**되므로 서버 크론이 윈도우 몇 분 전 푸시 예약 가능.
  야간 수면 궤도(무음 시간대 설정)를 이때 함께 설계
- **안티치트**: launchedAt·수거량 서버 소유, 클라이언트 조작 무시

### 9.3 Phase 4 — 소셜

- 리더보드 (총 수거량, 주간), 친구 펫 방문
- **공유 카드**: 펫+수거 통계를 OG 이미지로 생성 (`@vercel/og` 또는 satori) → SNS 자랑
- **인류 누적 정화량**: 전 유저 합산 게이지 — 세계관의 "인류 기여 자부심" 구현

### 9.4 기술 부채·테스트

- `lib/game.ts` 단위 테스트 (vitest 권장): settle 경계값(장기 부재, 기분 0 클램프,
  편지 캡), orbitInfo 위상, 액션 가드. 순수 함수라 테스트 작성이 쉬움
- 세이브 마이그레이션 프레임 (version 필드 활용) — 스키마 변경 전에 먼저 만들 것
- CI (GitHub Actions): build + lint + test
- 에러 리포팅 (Sentry 등)은 운영 배포 시점에

## 10. 알려진 한계·주의사항 요약

- 시간이 클라이언트 신뢰 → 시계 조작으로 치팅 가능 (Phase 3 해결 예정, 현재는 수용)
- 알림은 탭이 살아있어야 동작. 백그라운드 탭은 틱이 분당 1회로 스로틀 → 알림이 최대
  1분 늦을 수 있음 (수용된 트레이드오프)
- 세이브는 브라우저 로컬 전용 — 브라우저 데이터 삭제 시 소실 (9.1-7 백업 기능 권장)
- `loadGame`의 version 불일치 = 세이브 폐기 (마이그레이션 미구현 — 스키마 변경 시 필수)
- dev 모드에선 SW 미등록이라 PWA 기능은 prod 빌드로만 확인 가능
- 편지 생성에 `Math.random` 사용 — 서버 이전 시 시드/결정성 고려
- 육성 단계에서는 기분이 0까지 떨어져도 페널티 없음 (의도), 궤도에서만 수거 효율에 반영
