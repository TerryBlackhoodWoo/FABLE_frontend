"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const TOKEN_KEY = "fable_dashboard_token";

export function useAuth() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            setCheckingAuth(false);
            return;
        }
        setIsLoggedIn(true);

        fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { is_admin: boolean } | null) => {
                if (data) setIsAdmin(data.is_admin);
            })
            .catch(() => { })
            .finally(() => setCheckingAuth(false));
    }, []);

    const authHeaders = useCallback((): HeadersInit => {
        const token = localStorage.getItem(TOKEN_KEY);
        return { Authorization: `Bearer ${token}` };
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setIsLoggedIn(false);
        setIsAdmin(false);
        router.push("/login");
    }, [router]);

    return { isLoggedIn, isAdmin, checkingAuth, authHeaders, logout };
}