import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Users, CheckCircle2, Circle, Clock, Copy, Check,
  ChevronDown, ChevronRight, Send, RefreshCw, Loader2,
  ShieldCheck, Scale, DollarSign, Code2, UserCog,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Status = "empty" | "in_progress" | "done";
type Role = "owner" | "legal" | "tech" | "all";

interface Entry {
  id: number;
  fieldKey: string;
  category: string;
  role: Role;
  label: string;
  hint: string | null;
  value: string | null;
  notes: string | null;
  status: Status;
  updatedBy: string | null;
  updatedAt: string;
}

// ─── Role config ───────────────────────────────────────────────────────────────

const ROLES: { key: Role | "all"; label: string; icon: typeof Users; color: string; bg: string; border: string }[] = [
  { key: "all",   label: "Все разделы",         icon: Users,   color: "text-foreground",  bg: "bg-muted/30",        border: "border-border" },
  { key: "owner", label: "Собственник (Григорий)", icon: UserCog, color: "text-violet-400", bg: "bg-violet-400/10",   border: "border-violet-400/30" },
  { key: "legal", label: "Юрист (Александра)",   icon: Scale,   color: "text-blue-400",   bg: "bg-blue-400/10",     border: "border-blue-400/30" },
  { key: "tech",  label: "Безопасность (Данил)", icon: Code2,   color: "text-amber-400",  bg: "bg-amber-400/10",    border: "border-amber-400/30" },
];

const ROLE_LINKS: Record<string, string> = {
  owner: "?role=owner",
  legal: "?role=legal",
  tech:  "?role=tech",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function statusIcon(status: Status) {
  if (status === "done")        return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
  if (status === "in_progress") return <Clock className="h-4 w-4 text-amber-400 shrink-0" />;
  return <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />;
}

function progress(entries: Entry[]) {
  const done = entries.filter(e => e.status === "done").length;
  return entries.length ? Math.round((done / entries.length) * 100) : 0;
}

function progressColor(pct: number) {
  if (pct >= 80) return "bg-emerald-400";
  if (pct >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Workspace() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const roleParam = (searchParams.get("role") ?? "all") as Role | "all";

  const [activeRole, setActiveRole] = useState<Role | "all">(roleParam);
  const [entries, setEntries]     = useState<Entry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [seeding, setSeeding]     = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [copiedRole, setCopied]   = useState<string | null>(null);
  const [yourName, setYourName]   = useState(() => localStorage.getItem("ws_name") ?? "");
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Load entries
  const load = async () => {
    try {
      const res = await fetch("/api/workspace/entries");
      if (res.ok) {
        const data = await res.json() as Entry[];
        setEntries(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Seed if empty
  useEffect(() => {
    if (!loading && entries.length === 0) {
      setSeeding(true);
      fetch("/api/workspace/seed", { method: "POST" })
        .then(() => load())
        .finally(() => setSeeding(false));
    }
  }, [loading, entries.length]);

  // Sync role to URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeRole === "all") { url.searchParams.delete("role"); }
    else { url.searchParams.set("role", activeRole); }
    window.history.replaceState({}, "", url.toString());
  }, [activeRole]);

  const saveName = (v: string) => {
    setYourName(v);
    localStorage.setItem("ws_name", v);
  };

  // Debounced save on change
  const handleChange = (key: string, field: "value" | "notes", val: string) => {
    setEntries(prev =>
      prev.map(e => e.fieldKey === key ? {
        ...e,
        [field]: val,
        status: field === "value" ? (val.trim() ? "done" : "empty") : e.status,
      } : e)
    );
    clearTimeout(saveTimers.current[key + field]);
    saveTimers.current[key + field] = setTimeout(() => {
      fetch(`/api/workspace/entries/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [field]: val,
          updatedBy: yourName || "Anonymous",
          ...(field === "value" ? { status: val.trim() ? "done" : "empty" } : {}),
        }),
      }).catch(() => {});
    }, 600);
  };

  // Copy shareable link
  const copyLink = (role: string) => {
    const url = `${window.location.origin}${window.location.pathname}${ROLE_LINKS[role]}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(role);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  // Filter entries by role
  const visibleEntries = activeRole === "all"
    ? entries
    : entries.filter(e => e.role === activeRole || e.role === "all");

  // Group by category
  const byCategory = visibleEntries.reduce<Record<string, Entry[]>>((acc, e) => {
    (acc[e.category] ??= []).push(e);
    return acc;
  }, {});

  const totalPct   = progress(visibleEntries);
  const activeRoleCfg = ROLES.find(r => r.key === activeRole) ?? ROLES[0]!;

  if (loading || seeding) {
    return (
      <div className="p-8 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {seeding ? "Инициализация чеклиста..." : "Загрузка..."}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Team Workspace
          </h1>
          <p className="text-muted-foreground mt-1">
            Совместное заполнение данных для презентации инвесторам. Каждая роль имеет свою ссылку.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2 shrink-0">
          <RefreshCw className="h-4 w-4" /> Обновить
        </Button>
      </div>

      {/* Your name */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <UserCog className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium">Ваше имя (для отслеживания кто заполнил):</span>
            <Input
              className="max-w-xs h-8 text-sm"
              placeholder="Собственник 1, Юрист, Иван..."
              value={yourName}
              onChange={e => saveName(e.target.value)}
            />
            <span className="text-xs text-muted-foreground ml-auto">
              Сохраняется локально в браузере
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Overall progress */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Общий прогресс {activeRoleCfg.label}</span>
            <span className="font-mono text-sm font-bold text-primary">{totalPct}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor(totalPct)}`}
              style={{ width: `${totalPct}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            {visibleEntries.filter(e => e.status === "done").length} из {visibleEntries.length} заполнено
          </div>
        </CardContent>
      </Card>

      {/* Role tabs + shareable links */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {ROLES.map(r => {
            const Icon = r.icon;
            const isActive = activeRole === r.key;
            const roleEntries = r.key === "all" ? entries : entries.filter(e => e.role === r.key || e.role === "all");
            const pct = progress(roleEntries);
            return (
              <button
                key={r.key}
                onClick={() => setActiveRole(r.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  isActive ? `${r.bg} ${r.border} ${r.color}` : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {r.label}
                {r.key !== "all" && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${isActive ? r.bg : "bg-muted"}`}>
                    {pct}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Shareable links for each role */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ROLES.filter(r => r.key !== "all").map(r => {
            const Icon = r.icon;
            const copied = copiedRole === r.key;
            return (
              <button
                key={r.key}
                onClick={() => copyLink(r.key as string)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs transition-all hover:opacity-90 ${r.bg} ${r.border}`}
              >
                <Icon className={`h-3.5 w-3.5 ${r.color} shrink-0`} />
                <div className="text-left flex-1 min-w-0">
                  <div className={`font-semibold ${r.color}`}>{r.label}</div>
                  <div className="text-muted-foreground truncate">ссылка для роли</div>
                </div>
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          👆 Нажми на карточку роли — скопируется прямая ссылка для отправки участнику команды.
          Каждый видит только свой раздел.
        </p>
      </div>

      {/* Checklist sections */}
      <div className="space-y-4">
        {Object.entries(byCategory).map(([category, catEntries]) => {
          const catPct = progress(catEntries);
          const isCollapsed = collapsed[category];
          return (
            <Card key={category} className={catPct === 100 ? "border-emerald-400/20" : ""}>
              <CardHeader
                className="py-3 cursor-pointer"
                onClick={() => setCollapsed(p => ({ ...p, [category]: !p[category] }))}
              >
                <div className="flex items-center gap-3">
                  {isCollapsed
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  <CardTitle className="text-sm flex-1">{category}</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${progressColor(catPct)}`}
                        style={{ width: `${catPct}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground w-8 text-right">{catPct}%</span>
                  </div>
                </div>
              </CardHeader>

              {!isCollapsed && (
                <CardContent className="pt-0 space-y-3">
                  {catEntries.map(entry => (
                    <div key={entry.fieldKey} className="group">
                      <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/5 hover:border-muted-foreground/20 transition-colors">
                        <div className="mt-0.5">{statusIcon(entry.status)}</div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <div className="text-sm font-medium">{entry.label}</div>
                              {entry.hint && (
                                <div className="text-xs text-muted-foreground mt-0.5">{entry.hint}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {entry.role !== "all" && (
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${
                                  entry.role === "owner"   ? "bg-violet-400/10 text-violet-400 border-violet-400/30" :
                                  entry.role === "legal"   ? "bg-blue-400/10 text-blue-400 border-blue-400/30" :
                                  entry.role === "finance" ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/30" :
                                  "bg-amber-400/10 text-amber-400 border-amber-400/30"
                                }`}>
                                  {entry.role}
                                </span>
                              )}
                              {entry.updatedBy && (
                                <span className="text-[10px] text-muted-foreground">
                                  ✎ {entry.updatedBy}
                                </span>
                              )}
                            </div>
                          </div>

                          <Input
                            className="h-8 text-sm font-mono"
                            placeholder="Введите значение..."
                            value={entry.value ?? ""}
                            onChange={e => handleChange(entry.fieldKey, "value", e.target.value)}
                          />

                          <Input
                            className="h-7 text-xs text-muted-foreground"
                            placeholder="Заметка (опционально)..."
                            value={entry.notes ?? ""}
                            onChange={e => handleChange(entry.fieldKey, "notes", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Notion Dashboard link */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📓</span>
                <div className="font-semibold text-sm text-blue-300">Notion Project Dashboard</div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Документы, договора, трекинг 11 сделок, IM — всё в одном месте.<br />
                <span className="text-blue-400/70">База «Сделки — Трекинг»: 10 дебиторка (Схема А) + 1 форвард (Схема Б, Финляндия €243K)</span>
              </p>
            </div>
            <a
              href="https://www.notion.so/SX-Fund-Project-Dashboard-36f80ec8ce2d81858a69c10e729664bc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-sm font-medium hover:bg-blue-500/25 transition-colors shrink-0"
            >
              <Send className="h-4 w-4" />
              Открыть Notion →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
