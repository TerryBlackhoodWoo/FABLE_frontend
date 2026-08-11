"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";

// ---------- 타입 (백엔드 schemas.py와 대응) ----------

interface SourceChunk {
  work_title: string;
  chapter: string;
  chunk_text: string;
  score: number;
}

interface CharacterImage {
  title: string;
  thumb_url: string;
  source_url: string;
  artist: string;
  license: string;
}

interface AskResponse {
  answer: string;
  speaker: string;
  sources: SourceChunk[];
  image: CharacterImage | null;
}

interface ConversationTurn {
  question: string;
  answer: string;
  speaker: string;
  sources: SourceChunk[];
  image: CharacterImage | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
const HISTORY_TURNS_SENT = 5; // 백엔드로 보낼 최근 대화 턴 수

// ---------- 시그니처 요소: 그리스 문양(meander) 띠 ----------

function MeanderStrip() {
  return (
    <svg
      viewBox="0 0 160 10"
      preserveAspectRatio="xMidYMid slice"
      className="h-[6px] w-full text-[#B0894F]/60"
      aria-hidden="true"
    >
      <pattern id="meander" width="20" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 9H5V1H15V5H9V9H20" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </pattern>
      <rect width="160" height="10" fill="url(#meander)" />
    </svg>
  );
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isLoggedIn, isAdmin, logout } = useAuth();


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, loading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!isLoggedIn) {
      alert("로그인 후 사용하세요.");
      router.push("/login");
      return;
    }

    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setQuestion("");

    const history = conversation.slice(-HISTORY_TURNS_SENT).map((t) => ({
      question: t.question,
      answer: t.answer,
      speaker: t.speaker,
    }));

    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify({ question: trimmed, history }),
      });

      if (!res.ok) {
        const body = await res.text();
        setError(`서버가 ${res.status} 오류를 반환했습니다. ${body.slice(0, 200)}`);
        return;
      }

      const data: AskResponse = await res.json();
      setConversation((prev) => [
        ...prev,
        {
          question: trimmed,
          answer: data.answer,
          speaker: data.speaker,
          sources: data.sources,
          image: data.image,
        },
      ]);
    } catch {
      setError(
        `서버에 연결할 수 없습니다. 백엔드가 ${API_URL} 에서 실행 중인지, CORS가 허용되어 있는지 확인하세요.`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#16110D] px-6 py-16 text-[#EFE4D0]">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        {/* 헤더 */}
        <header className="relative flex flex-col items-center gap-3 text-center">
          <div className="absolute right-0 top-1 flex items-center gap-3 font-[family-name:var(--font-mono)] text-xs text-[#A99A83]">
            {isLoggedIn ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="underline decoration-[#B0894F]/40 underline-offset-2 hover:text-[#C1592F]"
                  >
                    관리자
                  </Link>
                )}
                <Link
                  href="/logs"
                  className="underline decoration-[#B0894F]/40 underline-offset-2 hover:text-[#C1592F]"
                >
                  대화 로그
                </Link>
                <button
                  onClick={logout}
                  className="underline decoration-[#B0894F]/40 underline-offset-2 hover:text-[#C1592F]"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="underline decoration-[#B0894F]/40 underline-offset-2 hover:text-[#C1592F]"
              >
                로그인
              </Link>
            )}
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold tracking-tight text-[#EFE4D0]">
            FABLE
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[#A99A83]">
            원전 근거 캐릭터 챗
          </p>
        </header>

        {/* 대화 로그 */}
        <div className="flex flex-col gap-4">
          {conversation.length === 0 && !loading && !error && (
            <p className="text-center font-[family-name:var(--font-body)] text-sm text-[#A99A83]">
              질문을 남기면, 원전 속 인물이 직접 답합니다.
            </p>
          )}

          {conversation.map((turn, i) => (
            <div key={i} className="flex flex-col gap-2">
              {/* 사용자 질문 */}
              <div className="self-end rounded-sm border border-[#B0894F]/20 bg-[#1F1712] px-4 py-2.5 text-sm text-[#EFE4D0]">
                {turn.question}
              </div>

              {/* 화자 답변 카드 */}
              <section className="overflow-hidden rounded-sm border border-[#B0894F]/25 bg-[#1F1712]">
                <MeanderStrip />
                <div className="flex flex-col gap-5 p-5">
                  <div className="flex flex-col gap-2">
                    <span className="font-[family-name:var(--font-display)] text-lg font-medium text-[#C1592F]">
                      {turn.speaker}
                    </span>
                    <p className="font-[family-name:var(--font-body)] leading-relaxed text-[#EFE4D0]">
                      {turn.answer}
                    </p>
                  </div>

                  {turn.image && (
                    <div className="flex flex-col gap-2 border-t border-[#B0894F]/20 pt-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={turn.image.thumb_url}
                        alt={turn.image.title}
                        className="max-h-72 w-full rounded-sm border border-[#B0894F]/25 bg-[#16110D] object-contain"
                      />
                      <div className="flex flex-col gap-1 font-[family-name:var(--font-mono)] text-[11px] text-[#A99A83]">
                        <a
                          href={turn.image.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#B0894F] underline decoration-[#B0894F]/40 underline-offset-2 hover:text-[#C1592F]"
                        >
                          {turn.image.title}
                        </a>
                        {turn.image.artist && <span>작가: {turn.image.artist}</span>}
                        <span>{turn.image.license} · Wikimedia Commons</span>
                      </div>
                    </div>
                  )}

                  {turn.sources.length > 0 && (
                    <div className="flex flex-col gap-2 border-t border-[#B0894F]/20 pt-4">
                      <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[#A99A83]">
                        원전 근거
                      </span>
                      <ul className="flex flex-col gap-1.5">
                        {turn.sources.map((s, si) => (
                          <li
                            key={si}
                            className="flex items-baseline justify-between gap-4 font-[family-name:var(--font-mono)] text-xs text-[#A99A83]"
                          >
                            <span className="truncate">
                              {s.work_title} · {s.chapter}
                            </span>
                            <span className="shrink-0 text-[#B0894F]">{s.score.toFixed(3)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            </div>
          ))}

          {loading && (
            <p className="text-sm text-[#A99A83]">묻는 중…</p>
          )}
          {error && <p className="text-sm text-[#D9713F]">{error}</p>}
          <div ref={bottomRef} />
        </div>

        {/* 입력 카드 — 하단 고정 느낌으로 대화 로그 아래 위치 */}
        <section className="sticky bottom-4 overflow-hidden rounded-sm border border-[#B0894F]/25 bg-[#1F1712] shadow-lg shadow-black/40">
          <MeanderStrip />
          <form onSubmit={handleSubmit} className="flex gap-3 p-4">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 그래서 어떻게 됐어?"
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
      </div>
    </div>
  );
}