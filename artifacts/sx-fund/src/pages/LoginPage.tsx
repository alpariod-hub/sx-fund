import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { setAdminToken } from "@/lib/auth";

const schema = z.object({
  password: z.string().min(1, "Password required"),
});

type FormValues = z.infer<typeof schema>;

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function LoginPage({ onAuth }: { onAuth: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
  });

  const onSubmit = async ({ password }: FormValues) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Неверный пароль");
        return;
      }
      const { token } = await res.json();
      setAdminToken(token);
      onAuth();
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold font-mono">
            SX
          </div>
          <span className="font-bold tracking-wider font-mono text-lg">SX FUND</span>
        </div>

        <Card className="bg-card/50 border-border/60">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>Введите пароль для доступа к панели управления</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••••••"
                          autoFocus
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && (
                  <p className="text-sm text-destructive font-medium">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Проверяю..." : "Войти"}
                </Button>
              </form>
            </Form>
            <p className="text-center text-xs text-muted-foreground mt-4">
              <a href="/" className="hover:text-foreground transition-colors">← Вернуться на сайт</a>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-50">
          Сессия сбрасывается при закрытии браузера
        </p>
      </div>
    </div>
  );
}
