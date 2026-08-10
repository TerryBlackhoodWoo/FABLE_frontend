"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

interface LogEntry {
  id: number;
  question: string;
  answer: string | null;
  speaker: string | null;
  created_at: string;
}

interface Usage {
  today_count: number;
  daily_limit: number | null;
}

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("fable_dashboard_token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function load(token: string) {
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [logsRes, usageRes, meRes] = await Promise.all([
          fetch(`${API_URL}/logs`, { headers }),
          fetch(`${API_URL}/usage`, { headers }),
          fetch(`${API_URL}/me`, { headers }),
        ]);

        if (logsRes.status === 401 || usageRes.status === 401 || meRes.status === 401) {
          localStorage.removeItem("fable_dashboard_token");
          router.push("/login");
          return;
        }

        if (!logsRes.ok || !usageRes.ok) {
          setError("데이터를 불러오지 못했습니다.");
          return;
        }

        setLogs(await logsRes.json());
        setUsage(await usageRes.json());
      } catch {
        setError(`서버에 연결할 수 없습니다. 백엔드가 ${API_URL} 에서 실행 중인지 확인하세요.`);
      } finally {
        setLoading(false);
      }
    }

    load(token);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("fable_dashboard_token");
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#16110D] px-6 py-12 text-[#EFE4D0]">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            대화 로그
          </h1>
          <div className="flex items-center gap-4 font-[family-name:var(--font-mono)] text-xs text-[#A99A83]">
            <Link
              href="/"
              className="underline decoration-[#B0894F]/40 underline-offset-2 hover:text-[#C1592F]"
            >
              채팅으로
            </Link>
            <button
              onClick={handleLogout}
              className="underline decoration-[#B0894F]/40 underline-offset-2 hover:text-[#C1592F]"
            >
              로그아웃
            </button>
          </div>
        </header>

        {usage && (
          <div className="rounded-sm border border-[#B0894F]/25 bg-[#1F1712] px-5 py-4 font-[family-name:var(--font-mono)] text-sm text-[#A99A83]">
            오늘 사용량:{" "}
            <span className="text-[#EFE4D0]">
              {usage.today_count}
              {usage.daily_limit !== null ? ` / ${usage.daily_limit}` : " (무제한)"}
            </span>
          </div>
        )}

        {loading && <p className="text-sm text-[#A99A83]">불러오는 중…</p>}
        {error && <p className="text-sm text-[#D9713F]">{error}</p>}

        {!loading && !error && logs.length === 0 && (
          <p className="text-sm text-[#A99A83]">아직 기록된 질문이 없습니다.</p>
        )}

        <div className="flex flex-col gap-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-sm border border-[#B0894F]/20 bg-[#1F1712] p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                {log.speaker && (
                  <span className="font-[family-name:var(--font-display)] text-sm font-medium text-[#C1592F]">
                    {log.speaker}
                  </span>
                )}
                <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#A99A83]">
                  {new Date(log.created_at).toLocaleString("ko-KR")}
                </span>
              </div>
              <p className="mb-1 text-sm text-[#EFE4D0]">Q. {log.question}</p>
              {log.answer && (
                <p className="text-sm text-[#A99A83]">A. {log.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}