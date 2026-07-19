"use client";

import { useEffect, useState } from "react";

/** 중복 제출 방지용 로컬 플래그 (서버 저장과 별개로 UX만 담당) */
const DONE_KEY = "astropet-prereg-v1";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PreregisterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );

  // localStorage는 클라이언트 전용이라 마운트 후에 읽는다 (hydration 안전)
  useEffect(() => {
    if (localStorage.getItem(DONE_KEY)) setStatus("done");
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/preregister", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      localStorage.setItem(DONE_KEY, "1");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <p className="rounded-2xl border border-mint/30 bg-mint/10 px-5 py-4 text-sm font-medium text-mint">
        등록됐어요! 출시 소식을 메일로 보내드릴게요 💌
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="prereg-email" className="sr-only">
        이메일 주소
      </label>
      <input
        id="prereg-email"
        type="email"
        required
        placeholder="이메일 주소"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/40 focus:border-mint/60 focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full bg-mint px-6 py-3 text-sm font-bold text-ink transition hover:brightness-110 disabled:opacity-60"
      >
        {status === "sending" ? "등록 중…" : "사전등록"}
      </button>
      {status === "error" && (
        <p className="text-xs text-pink sm:w-full" role="alert">
          이메일 주소를 다시 확인해 주세요.
        </p>
      )}
    </form>
  );
}
