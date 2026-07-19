import { NextResponse } from "next/server";

/**
 * 이메일 사전등록 API.
 *
 * ⚠️ 아직 DB가 없어(Phase 3에서 도입 예정) 등록 내역은 서버 로그로만 남는다.
 * Vercel Hobby의 함수 로그는 보존 기간이 짧으므로, 실제 수집을 시작하려면
 * 반드시 아래 TODO의 영속 저장소를 먼저 연결할 것 (README "알려진 한계" 참고).
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "bad-json" }, { status: 400 });
  }

  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !EMAIL_RE.test(email)
  ) {
    return NextResponse.json({ ok: false, error: "invalid-email" }, { status: 400 });
  }

  // TODO(Phase 3): Supabase/Postgres 등 영속 저장소에 저장하도록 교체
  console.log(`[preregister] ${new Date().toISOString()} ${email}`);

  return NextResponse.json({ ok: true });
}
