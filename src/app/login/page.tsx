"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.detail ?? `로그인에 실패했습니다 (${res.status})`);
        return;
      }

      const data: { access_token: string } = await res.json();
      localStorage.setItem("fable_dashboard_token", data.access_token);
      router.push("/logs");
    } catch {
      setError(`서버에 연결할 수 없습니다. 백엔드가 ${API_URL} 에서 실행 중인지 확인하세요.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#16110D] px-6 text-[#EFE4D0]">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/fable-title.png" alt="FABLE" className="mx-auto mb-8 block h-12 w-auto" />

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-sm border border-[#B0894F]/25 bg-[#1F1712] p-6"
        >
          <div className="flex flex-col gap-1.5">
            <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#A99A83]">
              아이디
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
              className="rounded-sm border border-[#B0894F]/30 bg-[#16110D] px-3 py-2.5 text-[#EFE4D0] outline-none focus-visible:border-[#C1592F] focus-visible:ring-2 focus-visible:ring-[#C1592F]/40 disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#A99A83]">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="rounded-sm border border-[#B0894F]/30 bg-[#16110D] px-3 py-2.5 text-[#EFE4D0] outline-none focus-visible:border-[#C1592F] focus-visible:ring-2 focus-visible:ring-[#C1592F]/40 disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="font-[family-name:var(--font-body)] text-sm text-[#D9713F]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="mt-2 rounded-sm bg-[#C1592F] py-2.5 font-medium text-[#16110D] transition-colors hover:bg-[#D9713F] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "로그인 중…" : "로그인"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="font-[family-name:var(--font-mono)] text-xs text-[#A99A83] underline decoration-[#B0894F]/40 underline-offset-2 hover:text-[#C1592F]"
          >
            ← 채팅으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}