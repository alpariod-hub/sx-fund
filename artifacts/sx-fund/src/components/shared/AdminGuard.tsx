import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import LoginPage from "@/pages/LoginPage";
import { getSession, clearSession } from "@/lib/auth";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function verifySession(token: string, username: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify`, {
      headers: {
        "x-admin-token": token,
        "x-admin-user": username,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ok" | "login">("loading");
  const [adminUser, setAdminUser] = useState("");
  const [, navigate] = useLocation();

  const check = async () => {
    const session = getSession();
    if (!session) { setStatus("login"); return; }
    const valid = await verifySession(session.token, session.username);
    if (!valid) { clearSession(); setStatus("login"); return; }
    setAdminUser(session.username);
    setStatus("ok");
  };

  useEffect(() => { check(); }, []);

  const handleAuth = (username: string) => {
    setAdminUser(username);
    setStatus("ok");
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="text-muted-foreground font-mono text-sm animate-pulse">Проверка доступа...</div>
      </div>
    );
  }

  if (status === "login") {
    return <LoginPage onAuth={handleAuth} />;
  }

  return (
    <>
      {children}
      {/* Session bar */}
      <div className="fixed top-0 right-0 z-[9999] flex items-center gap-3 m-3 px-3 py-1.5 bg-card/90 border border-border/60 rounded-lg backdrop-blur text-xs text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
        <span className="font-mono">@{adminUser}</span>
        <button
          onClick={handleLogout}
          className="hover:text-destructive transition-colors ml-1"
          title="Выйти"
        >
          Выйти
        </button>
      </div>
    </>
  );
}
