import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Send, ArrowLeft, Shield } from "lucide-react";
import { setSession } from "@/lib/auth";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Step = "username" | "otp";

export default function LoginPage({ onAuth }: { onAuth: (username: string) => void }) {
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("");

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().replace(/^@/, "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 403 ? "Аккаунт не найден в списке доступа" : (data.error ?? "Ошибка"));
        return;
      }
      setHint(data.hint ?? "");
      setStep("otp");
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().replace(/^@/, ""), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("Неверный или истёкший код");
        setCode("");
        return;
      }
      setSession(data.token, data.username);
      onAuth(data.username);
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold font-mono">SX</div>
          <span className="font-bold tracking-wider font-mono text-lg">SX FUND</span>
        </div>

        <Card className="bg-card/50 border-border/60">

          {/* Step 1 — Telegram username */}
          {step === "username" && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <CardTitle>Admin Access</CardTitle>
                <CardDescription>Введите ваш Telegram username для получения кода</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={requestOtp} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Telegram Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                      <Input
                        className="pl-7"
                        placeholder="alpariod"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                        autoCapitalize="none"
                        autoCorrect="off"
                      />
                    </div>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full gap-2" disabled={loading || !username.trim()}>
                    <Send className="w-4 h-4" />
                    {loading ? "Отправляю код..." : "Получить код в Telegram"}
                  </Button>
                </form>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  <a href="/" className="hover:text-foreground transition-colors">← Вернуться на сайт</a>
                </p>
              </CardContent>
            </>
          )}

          {/* Step 2 — OTP code */}
          {step === "otp" && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <Shield className="w-5 h-5" />
                </div>
                <CardTitle>Введите код</CardTitle>
                <CardDescription>
                  {hint || "Код отправлен в Telegram"}<br />
                  <span className="font-mono text-foreground">@{username}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={verifyOtp} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">6-значный код</label>
                    <Input
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="text-center text-2xl tracking-widest font-mono h-14"
                      inputMode="numeric"
                      autoFocus
                      maxLength={6}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                    {loading ? "Проверяю..." : "Войти"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setStep("username"); setCode(""); setError(""); }}
                    className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" /> Изменить username
                  </button>
                </form>
                <p className="text-center text-xs text-muted-foreground mt-4 opacity-60">Код действует 5 минут</p>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-50">
          Сессия сбрасывается при закрытии браузера
        </p>
      </div>
    </div>
  );
}
