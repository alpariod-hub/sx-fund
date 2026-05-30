import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import LoginPage from "@/pages/LoginPage";
import { getAdminToken, clearAdminToken } from "@/lib/auth";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function verifyToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify`, {
      headers: { "x-admin-token": token },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ok" | "login">("loading");
  const [, navigate] = useLocation();

  const check = async () => {
    const token = getAdminToken();
    if (!token) { setStatus("login"); return; }
    const valid = await verifyToken(token);
    if (!valid) { clearAdminToken(); setStatus("login"); return; }
    setStatus("ok");
  };

  useEffect(() => { check(); }, []);

  const handleAuth = () => setStatus("ok");

  const handleLogout = () => {
    clearAdminToken();
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
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 z-[9999] text-xs text-muted-foreground hover:text-foreground bg-card/80 border border-border/60 rounded px-2 py-1 backdrop-blur transition-colors"
        title="Выйти из панели"
      >
        Выйти
      </button>
    </>
  );
}
