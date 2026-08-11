"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

interface AccountView {
    id: string;
    account_type: string;
    label: string | null;
    daily_limit: number | null;
    is_active: boolean;
    is_admin: boolean;
    username: string | null;
    today_count: number;
}

interface LogEntry {
    id: number;
    account_label: string | null;
    account_type: string | null;
    question: string;
    answer: string | null;
    speaker: string | null;
    created_at: string;
}

export default function AdminPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<AccountView[]>([]);
    const [showInactive, setShowInactive] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const [type, setType] = useState<"developer" | "deployment">("deployment");
    const [label, setLabel] = useState("");
    const [dailyLimit, setDailyLimit] = useState("100");
    const [creating, setCreating] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);

    const [loginFormFor, setLoginFormFor] = useState<string | null>(null);
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [savingLogin, setSavingLogin] = useState(false);

    function authHeaders(): HeadersInit {
        const token = localStorage.getItem("fable_dashboard_token");
        return { Authorization: `Bearer ${token}` };
    }

    async function loadAll() {
        try {
            const [accRes, logRes] = await Promise.all([
                fetch(`${API_URL}/admin/accounts`, { headers: authHeaders() }),
                fetch(`${API_URL}/admin/logs`, { headers: authHeaders() }),
            ]);

            if (accRes.status === 401) {
                localStorage.removeItem("fable_dashboard_token");
                router.push("/login");
                return;
            }
            if (accRes.status === 403) {
                router.push("/");
                return;
            }
            if (!accRes.ok || !logRes.ok) {
                setError("데이터를 불러오지 못했습니다.");
                return;
            }

            setAccounts(await accRes.json());
            setLogs(await logRes.json());
        } catch {
            setError(`서버에 연결할 수 없습니다. 백엔드가 ${API_URL} 에서 실행 중인지 확인하세요.`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const token = localStorage.getItem("fable_dashboard_token");
        if (!token) {
            router.push("/login");
            return;
        }
        loadAll();
    }, [router]);

    async function handleCreate(e: FormEvent) {
        e.preventDefault();
        if (creating) return;

        setCreating(true);
        setError(null);
        setNewKey(null);

        try {
            const res = await fetch(`${API_URL}/admin/accounts`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({
                    account_type: type,
                    label: label || null,
                    daily_limit: type === "deployment" ? Number(dailyLimit) : null,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.detail ?? `계정 생성에 실패했습니다 (${res.status})`);
                return;
            }

            const data: { api_key: string } = await res.json();
            setNewKey(data.api_key);
            setLabel("");
            await loadAll();
        } catch {
            setError(`서버에 연결할 수 없습니다. 백엔드가 ${API_URL} 에서 실행 중인지 확인하세요.`);
        } finally {
            setCreating(false);
        }
    }

    async function toggleAdmin(account: AccountView) {
        setActionError(null);
        try {
            const res = await fetch(`${API_URL}/admin/accounts/${account.id}/admin`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ is_admin: !account.is_admin }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setActionError(body.detail ?? `권한 변경에 실패했습니다 (${res.status})`);
                return;
            }
            await loadAll();
        } catch {
            setActionError(`서버에 연결할 수 없습니다. 백엔드가 ${API_URL} 에서 실행 중인지 확인하세요.`);
        }
    }

    async function deactivateAccount(account: AccountView) {
        if (!confirm(`"${account.label ?? "(라벨 없음)"}" 계정을 비활성화할까요? API 키가 즉시 무효화됩니다.`)) {
            return;
        }
        setActionError(null);
        try {
            const res = await fetch(`${API_URL}/admin/accounts/${account.id}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setActionError(body.detail ?? `비활성화에 실패했습니다 (${res.status})`);
                return;
            }
            await loadAll();
        } catch {
            setActionError(`서버에 연결할 수 없습니다. 백엔드가 ${API_URL} 에서 실행 중인지 확인하세요.`);
        }
    }

    function openLoginForm(account: AccountView) {
        setLoginFormFor(account.id);
        setLoginUsername(account.username ?? "");
        setLoginPassword("");
        setActionError(null);
    }

    async function saveLogin(accountId: string) {
        if (!loginUsername.trim() || !loginPassword.trim() || savingLogin) return;
        setSavingLogin(true);
        setActionError(null);
        try {
            const res = await fetch(`${API_URL}/admin/accounts/${accountId}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setActionError(body.detail ?? `로그인 정보 설정에 실패했습니다 (${res.status})`);
                return;
            }
            setLoginFormFor(null);
            setLoginPassword("");
            await loadAll();
        } catch {
            setActionError(`서버에 연결할 수 없습니다. 백엔드가 ${API_URL} 에서 실행 중인지 확인하세요.`);
        } finally {
            setSavingLogin(false);
        }
    }
    const inactiveCount = accounts.filter((a) => !a.is_active).length;
    const visibleAccounts = accounts
        .filter((a) => showInactive || a.is_active)
        .sort((a, b) => Number(b.is_admin) - Number(a.is_admin));

    return (
        <div className="min-h-screen bg-[#16110D] px-6 py-12 text-[#EFE4D0]">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
                <header className="flex items-center justify-between">
                    <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                        관리자
                    </h1>
                    <div className="flex items-center gap-4 font-[family-name:var(--font-mono)] text-xs text-[#A99A83]">
                        <Link
                            href="/logs"
                            className="underline decoration-[#B0894F]/40 underline-offset-2 hover:text-[#C1592F]"
                        >
                            내 대화 로그
                        </Link>
                        <Link
                            href="/"
                            className="underline decoration-[#B0894F]/40 underline-offset-2 hover:text-[#C1592F]"
                        >
                            채팅으로
                        </Link>
                    </div>
                </header>

                {error && <p className="text-sm text-[#D9713F]">{error}</p>}
                {actionError && <p className="text-sm text-[#D9713F]">{actionError}</p>}

                {/* 계정 생성 폼 */}
                <form
                    onSubmit={handleCreate}
                    className="flex flex-col gap-4 rounded-sm border border-[#B0894F]/25 bg-[#1F1712] p-5"
                >
                    <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[#A99A83]">
                        새 배포용 계정 만들기
                    </span>

                    <div className="flex flex-wrap gap-3">
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as "developer" | "deployment")}
                            className="rounded-sm border border-[#B0894F]/30 bg-[#16110D] px-3 py-2 text-sm text-[#EFE4D0] outline-none focus-visible:border-[#C1592F]"
                        >
                            <option value="deployment">deployment (배포용, 한도 있음)</option>
                            <option value="developer">developer (개발용, 무제한)</option>
                        </select>

                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="라벨 (예: 블로그X 제휴)"
                            className="flex-1 rounded-sm border border-[#B0894F]/30 bg-[#16110D] px-3 py-2 text-sm text-[#EFE4D0] outline-none placeholder:text-[#A99A83]/60 focus-visible:border-[#C1592F]"
                        />

                        {type === "deployment" && (
                            <input
                                type="number"
                                value={dailyLimit}
                                onChange={(e) => setDailyLimit(e.target.value)}
                                placeholder="일일 한도"
                                className="w-28 rounded-sm border border-[#B0894F]/30 bg-[#16110D] px-3 py-2 text-sm text-[#EFE4D0] outline-none focus-visible:border-[#C1592F]"
                            />
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={creating}
                        className="self-start rounded-sm bg-[#C1592F] px-5 py-2.5 text-sm font-medium text-[#16110D] transition-colors hover:bg-[#D9713F] disabled:opacity-40"
                    >
                        {creating ? "생성 중…" : "계정 생성"}
                    </button>

                    {newKey && (
                        <div className="rounded-sm border border-[#C1592F]/50 bg-[#16110D] p-3 font-[family-name:var(--font-mono)] text-xs text-[#EFE4D0]">
                            발급된 API 키 (지금만 표시됩니다, 꼭 복사해두세요):
                            <br />
                            <span className="text-[#C1592F]">{newKey}</span>
                        </div>
                    )}
                </form>

                {/* 계정 목록 */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[#A99A83]">
                            전체 계정
                        </span>
                        {inactiveCount > 0 && (
                            <button
                                onClick={() => setShowInactive((v) => !v)}
                                className="font-[family-name:var(--font-mono)] text-[11px] text-[#A99A83] underline decoration-[#B0894F]/40 underline-offset-2 hover:text-[#C1592F]"
                            >
                                {showInactive ? "비활성 계정 숨기기" : `비활성 계정 보기 (${inactiveCount})`}
                            </button>
                        )}
                    </div>
                    {loading && <p className="text-sm text-[#A99A83]">불러오는 중…</p>}
                    {!loading &&
                        visibleAccounts.map((a) => (
                            <div
                                key={a.id}
                                className="flex flex-col gap-3 rounded-sm border border-[#B0894F]/20 bg-[#1F1712] p-4 text-sm"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="flex items-center gap-2 text-[#EFE4D0]">
                                            {a.label ?? "(라벨 없음)"}
                                            {a.is_admin && (
                                                <span className="rounded-sm bg-[#C1592F]/20 px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[#C1592F]">
                                                    관리자
                                                </span>
                                            )}
                                        </span>
                                        <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#A99A83]">
                                            {a.account_type} · {a.is_active ? "활성" : "비활성"}
                                            {a.username && ` · 로그인: ${a.username}`}
                                        </span>
                                    </div>
                                    <span className="shrink-0 font-[family-name:var(--font-mono)] text-xs text-[#B0894F]">
                                        {a.today_count}
                                        {a.daily_limit !== null ? ` / ${a.daily_limit}` : " (무제한)"}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2 border-t border-[#B0894F]/15 pt-3 font-[family-name:var(--font-mono)] text-[11px]">
                                    <button
                                        onClick={() => toggleAdmin(a)}
                                        className="rounded-sm border border-[#B0894F]/30 px-2.5 py-1 text-[#A99A83] hover:border-[#C1592F] hover:text-[#C1592F]"
                                    >
                                        {a.is_admin ? "관리자 해제" : "관리자로 지정"}
                                    </button>
                                    <button
                                        onClick={() => openLoginForm(a)}
                                        className="rounded-sm border border-[#B0894F]/30 px-2.5 py-1 text-[#A99A83] hover:border-[#C1592F] hover:text-[#C1592F]"
                                    >
                                        {a.username ? "로그인 정보 변경" : "로그인 정보 만들기"}
                                    </button>
                                    {a.is_active && (
                                        <button
                                            onClick={() => deactivateAccount(a)}
                                            className="rounded-sm border border-[#D9713F]/40 px-2.5 py-1 text-[#D9713F] hover:border-[#D9713F] hover:bg-[#D9713F]/10"
                                        >
                                            삭제(비활성화)
                                        </button>
                                    )}
                                </div>

                                {loginFormFor === a.id && (
                                    <div className="flex flex-wrap items-center gap-2 border-t border-[#B0894F]/15 pt-3">
                                        <input
                                            type="text"
                                            value={loginUsername}
                                            onChange={(e) => setLoginUsername(e.target.value)}
                                            placeholder="아이디"
                                            className="rounded-sm border border-[#B0894F]/30 bg-[#16110D] px-2.5 py-1.5 text-xs text-[#EFE4D0] outline-none placeholder:text-[#A99A83]/60 focus-visible:border-[#C1592F]"
                                        />
                                        <input
                                            type="password"
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            placeholder="비밀번호"
                                            className="rounded-sm border border-[#B0894F]/30 bg-[#16110D] px-2.5 py-1.5 text-xs text-[#EFE4D0] outline-none placeholder:text-[#A99A83]/60 focus-visible:border-[#C1592F]"
                                        />
                                        <button
                                            onClick={() => saveLogin(a.id)}
                                            disabled={savingLogin}
                                            className="rounded-sm bg-[#C1592F] px-3 py-1.5 text-xs font-medium text-[#16110D] hover:bg-[#D9713F] disabled:opacity-40"
                                        >
                                            {savingLogin ? "저장 중…" : "저장"}
                                        </button>
                                        <button
                                            onClick={() => setLoginFormFor(null)}
                                            className="rounded-sm px-2 py-1.5 text-xs text-[#A99A83] hover:text-[#EFE4D0]"
                                        >
                                            취소
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                </div>

                {/* 전체 대화 이력 */}
                <div className="flex flex-col gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[#A99A83]">
                        전체 대화 이력
                    </span>
                    {logs.map((log) => (
                        <div key={log.id} className="rounded-sm border border-[#B0894F]/20 bg-[#1F1712] p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#B0894F]">
                                    {log.account_label ?? "(알 수 없음)"} · {log.speaker}
                                </span>
                                <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#A99A83]">
                                    {new Date(log.created_at).toLocaleString("ko-KR")}
                                </span>
                            </div>
                            <p className="text-sm text-[#EFE4D0]">Q. {log.question}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}