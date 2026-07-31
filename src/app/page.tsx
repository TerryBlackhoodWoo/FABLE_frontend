"use client";

import { useState, FormEvent } from "react";

// ---------- 타입 (백엔드 schemas.py의 AskResponse와 대응) ----------

interface SourceChunk {
  work_title: string;
  chapter: string;
  chunk_text: string;
  score: number;
}

interface AskResponse {
  answer: string;
  speaker: string;
  sources: SourceChunk[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// ---------- 시그니처 요소: 그리스 문양(meander) 띠 ----------
// 장식은 이 한 곳에만 — 카드 상단 hairline으로만 사용

function MeanderStrip() {
  return (
    <svg
      viewBox="0 0 160 10"
      preserveAspectRatio="xMidYMid slice"
      className="h-[6px] w-full text-[#B0894F]/60"
      aria-hidden="true"
    >
      <pattern id="meander" width="20" height="10" patternUnits="userSpaceOnUse">
        <path
          d="M0 9H5V1H15V5H9V9H20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </pattern>
      <rect width="160" height="10" fill="url(#meander)" />
    </svg>
  );
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`서버가 ${res.status} 응답을 반환했습니다.`);
      }

      const data: AskResponse = await res.json();
      setResult(data);
    } catch {
      setError(
        `서버에 연결할 수 없습니다. 백엔드가 ${API_URL} 에서 실행 중인지 확인하세요.`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#16110D] px-6 py-16 text-[#EFE4D0]">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10">
        {/* 헤더 */}
        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold tracking-tight text-[#EFE4D0]">
            FABLE
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[#A99A83]">
            원전 근거 캐릭터 챗
          </p>
        </header>

        {/* 입력 카드 */}
        <section className="overflow-hidden rounded-sm border border-[#B0894F]/25 bg-[#1F1712]">
          <MeanderStrip />
          <form onSubmit={handleSubmit} className="flex gap-3 p-5">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 아킬레우스는 왜 화가 났어?"
              disabled={loading}
              className="flex-1 rounded-sm border border-[#B0894F]/30 bg-[#16110D] px-4 py-3 font-[family-name:var(--font-body)] text-[#EFE4D0] placeholder:text-[#A99A83]/60 outline-none focus-visible:border-[#C1592F] focus-visible:ring-2 focus-visible:ring-[#C1592F]/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="shrink-0 rounded-sm bg-[#C1592F] px-6 py-3 font-[family-name:var(--font-body)] font-medium text-[#16110D] transition-colors hover:bg-[#D9713F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C1592F] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "묻는 중…" : "묻기"}
            </button>
          </form>
        </section>

        {/* 에러 */}
        {error && (
          <p className="font-[family-name:var(--font-body)] text-sm text-[#D9713F]">
            {error}
          </p>
        )}

        {/* 빈 상태 안내 */}
        {!result && !error && !loading && (
          <p className="text-center font-[family-name:var(--font-body)] text-sm text-[#A99A83]">
            질문을 남기면, 원전 속 인물이 직접 답합니다.
          </p>
        )}

        {/* 결과 */}
        {result && (
          <section className="overflow-hidden rounded-sm border border-[#B0894F]/25 bg-[#1F1712]">
            <MeanderStrip />
            <div className="flex flex-col gap-6 p-6">
              {/* 화자 + 답변 */}
              <div className="flex flex-col gap-2">
                <span className="font-[family-name:var(--font-display)] text-lg font-medium text-[#C1592F]">
                  {result.speaker}
                </span>
                <p className="font-[family-name:var(--font-body)] leading-relaxed text-[#EFE4D0]">
                  {result.answer}
                </p>
              </div>

              {/* 출처 */}
              {result.sources.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-[#B0894F]/20 pt-4">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[#A99A83]">
                    원전 근거
                  </span>
                  <ul className="flex flex-col gap-1.5">
                    {result.sources.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-baseline justify-between gap-4 font-[family-name:var(--font-mono)] text-xs text-[#A99A83]"
                      >
                        <span className="truncate">
                          {s.work_title} · {s.chapter}
                        </span>
                        <span className="shrink-0 text-[#B0894F]">
                          {s.score.toFixed(3)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}