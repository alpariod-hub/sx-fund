import { Link } from "wouter";
import { useGetPoolSummary, useListOracleEvents, useListTranches } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity, DollarSign, Layers, TrendingUp, CheckCircle2, Circle, Clock,
  Vote, FileText, ShieldAlert, Coins, ChevronRight, AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { TRANCHES, WATERFALL_STEPS, DEALS, POOL } from "@/lib/constants";
import { useRole, ROLES, type Role } from "@/lib/roleContext";
import { DAO_PROPOSALS, CATEGORY_META } from "@/lib/daoData";

const tvlMilestones = [
  { label: "Pilot",   sublabel: "Now",     tvl: 262_500 },
  { label: "Scale 1", sublabel: "Q4 2026", tvl: 1_000_000 },
  { label: "Scale 2", sublabel: "Q1 2027", tvl: 5_000_000 },
  { label: "Scale 3", sublabel: "Q2 2027", tvl: 10_000_000 },
];

const ROLE_TASKS: Record<Role, { icon: React.ElementType; text: string; href: string; urgent?: boolean }[]> = {
  all: [
    { icon: ShieldAlert,  text: "Создать Safe 2-of-3 мультисиг",        href: "/security",  urgent: true },
    { icon: Vote,         text: "2 открытых DAO-голосования",            href: "/dao",       urgent: true },
    { icon: FileText,     text: "KYC участников не заполнен",            href: "/legal",     urgent: true },
    { icon: Coins,        text: "NFT RWA-SX-009/010 ожидают минта",     href: "/financing" },
  ],
  owner: [
    { icon: ShieldAlert,  text: "Утвердить Safe подписантов (Григорий)", href: "/security",  urgent: true },
    { icon: Vote,         text: "Проголосовать по dao-001 и dao-005",    href: "/dao",       urgent: true },
    { icon: TrendingUp,   text: "Pool TVL: $262K → цель $1M к Q4",      href: "/pools" },
    { icon: Layers,       text: "2 сделки в работе (SX-009 / SX-010)",   href: "/deals" },
  ],
  legal: [
    { icon: FileText,     text: "Loan Agreement IT-290426 ($15,150)",    href: "/legal",     urgent: true },
    { icon: FileText,     text: "Assignment + Pledge IT-290426",         href: "/legal",     urgent: true },
    { icon: FileText,     text: "KYC участников — не завершён",          href: "/legal",     urgent: true },
    { icon: Vote,         text: "Проголосовать по dao-005 / dao-006",    href: "/dao" },
  ],
  tech: [
    { icon: ShieldAlert,  text: "Safe 2-of-3 — не создан (Данил)",      href: "/security",  urgent: true },
    { icon: Coins,        text: "ThirdWeb: создать новый deployer wallet", href: "/financing", urgent: true },
    { icon: Activity,     text: "Oracle: 1 checkpoint pending (SX-008)", href: "/oracle" },
    { icon: Vote,         text: "Проголосовать по dao-001 (infra)",      href: "/dao" },
  ],
};

export default function Hub() {
  const { role, setRole, meta } = useRole();
  const { isLoading: isSummaryLoading } = useGetPoolSummary();
  const { data: oracleEvents, isLoading: isEventsLoading } = useListOracleEvents();
  const { isLoading: isTranchesLoading } = useListTranches();

  const recentEvents = (oracleEvents || []).slice(0, 4);
  const isLoading = isSummaryLoading || isEventsLoading || isTranchesLoading;
  const tasks = ROLE_TASKS[role];
  const openProposals = DAO_PROPOSALS.filter(p => p.status === "open").slice(0, 3);

  const showFinance = role === "all" || role === "owner";
  const showOracle  = role === "all" || role === "tech";

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header + Role switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SED-Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Единый центр управления · RWA Agricultural Trade Finance
          </p>
        </div>
        <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/50 border border-border/60 flex-wrap">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                role === r.id
                  ? `${r.bg} ${r.color} shadow-sm`
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Role priority actions */}
      <Card className={`border-l-2 ${meta.color.replace("text-", "border-")}`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-sm flex items-center gap-2 ${meta.color}`}>
            <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${meta.bg} ${meta.color}`}>
              {meta.initials}
            </span>
            {meta.labelRu} — приоритетные задачи
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tasks.map((t, i) => {
              const Icon = t.icon;
              return (
                <Link key={i} href={t.href}>
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md border transition-colors cursor-pointer group
                    ${t.urgent
                      ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
                      : "border-border/60 bg-muted/20 hover:bg-muted/40"}`}>
                    <Icon size={15} className={t.urgent ? "text-red-400 shrink-0" : "text-muted-foreground shrink-0"} />
                    <span className={`text-xs flex-1 ${t.urgent ? "text-red-300" : "text-foreground"}`}>{t.text}</span>
                    {t.urgent && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
                    <ChevronRight size={12} className="text-muted-foreground/50 shrink-0 group-hover:text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {showFinance && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "NAV", value: formatCurrency(POOL.nav), sub: "USDC on Polygon", Icon: DollarSign, color: "text-primary" },
            { label: "Underlying", value: `€${(POOL.underlying / 1000).toFixed(0)}K`, sub: "EUR collateral", Icon: Layers, color: "" },
            { label: "Blended Yield", value: `${POOL.blendedYieldMin}–${POOL.blendedYieldMax}%`, sub: "APR blended", Icon: TrendingUp, color: "text-emerald-400" },
            { label: "LTV", value: `${POOL.ltv}%`, sub: "Loan-to-value", Icon: Activity, color: "" },
          ].map((kpi) => (
            <Card key={kpi.label} className="hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <kpi.Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* DAO Open Proposals widget + Tranches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DAO widget */}
        <Card className="lg:col-span-1 border-amber-400/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Vote className="h-4 w-4 text-amber-400" />
                DAO — открытые голосования
              </CardTitle>
              <Link href="/dao">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-amber-400 hover:text-amber-300">
                  Все <ChevronRight size={12} />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {openProposals.map((p) => {
              const cat = CATEGORY_META[p.category];
              return (
                <Link key={p.id} href="/dao">
                  <div className="flex items-start gap-2 p-2.5 rounded-md border border-border/40 hover:border-amber-400/30 hover:bg-amber-400/5 transition-colors cursor-pointer group">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${cat.bg} ${cat.color}`}>
                      {cat.label.slice(0, 4)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{p.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        До {new Date(p.deadline).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} · кворум {p.quorum}
                      </div>
                    </div>
                    <ChevronRight size={12} className="text-muted-foreground/40 group-hover:text-amber-400 shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
            <Link href="/dao">
              <Button variant="outline" size="sm" className="w-full mt-1 text-xs border-amber-400/30 text-amber-400 hover:bg-amber-400/10">
                Перейти к голосованиям →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Tranches — always visible */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TRANCHES.map((t) => (
            <Card key={t.id} className={`border ${t.bgClass} hover:opacity-90 transition-opacity`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className={`text-base font-bold ${t.colorClass}`}>{t.name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.label}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.badgeClass}`}>{t.allocation}%</span>
                </div>
                <div className="text-lg font-mono font-bold">{t.yieldMin}–{t.yieldMax}%</div>
                <div className="text-[10px] text-muted-foreground">APR</div>
                <div className="mt-2 pt-2 border-t border-border/40 flex justify-between text-[10px] text-muted-foreground">
                  <span>Deployed</span>
                  <span className="font-mono">{formatCurrency(t.tvl)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* TVL Chart + Waterfall (finance/owner/all) */}
      {showFinance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">TVL Growth Trajectory — Pilot → Scale 3</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              {isLoading ? (
                <div className="h-full bg-muted/20 rounded animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tvlMilestones} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <defs>
                      <linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      tickFormatter={(v) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(0)}M` : `$${(v / 1000).toFixed(0)}K`}
                      stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={52}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 12 }}
                      formatter={(v: number) => [formatCurrency(v), "Target TVL"]}
                    />
                    <Area type="monotone" dataKey="tvl" stroke="#7C3AED" strokeWidth={2.5} fill="url(#tvlGrad)"
                      dot={{ fill: "#7C3AED", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: "#7C3AED" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Waterfall (8 Steps)</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WATERFALL_STEPS} layout="vertical" margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="label" width={95} fontSize={9} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 11 }} formatter={(v: number) => [formatCurrency(v), "Amount"]} />
                  <Bar dataKey="amount" radius={[0, 3, 3, 0]}>
                    {WATERFALL_STEPS.map((step) => <Cell key={step.id} fill={step.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Oracle timeline (tech/all) */}
      {showOracle && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Asset Oracle Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {DEALS.map((deal) => (
                <div key={deal.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium font-mono">{deal.id}</div>
                      <div className="text-xs text-muted-foreground">{deal.type} · {deal.tenor}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${deal.status === "active" ? "bg-emerald-400/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                        {deal.status === "active" ? "Active" : "Upcoming"}
                      </span>
                      <div className="text-xs text-muted-foreground mt-1">{deal.oracleCompleted}/{deal.oracleTotal} checkpoints</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {deal.checkpoints.map((cp) => (
                      <div key={cp.id} className="flex-1 flex flex-col items-center gap-1">
                        {cp.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : cp.status === "pending" ? (
                          <Clock className="h-4 w-4 text-amber-400" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/30" />
                        )}
                        <div className={`h-1 w-full rounded-full ${cp.status === "completed" ? "bg-emerald-400" : cp.status === "pending" ? "bg-amber-400" : "bg-muted/40"}`} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Oracle Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {recentEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No recent events.</p>
                ) : recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm font-medium">{event.eventType}</div>
                      <div className="text-xs font-mono text-muted-foreground mt-0.5">{event.assetTokenId}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleDateString()}</div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${event.status === "confirmed" ? "bg-emerald-400/15 text-emerald-400" : "bg-amber-400/15 text-amber-400"}`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
