import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LockKeyhole, CheckCircle2, Clock, Circle, ArrowRight,
  ShieldCheck, Zap, FileCode2, ExternalLink, AlertCircle,
} from "lucide-react";
import { DEALS, INFRASTRUCTURE } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";

// ─── Escrow state derived from oracle checkpoints ──────────────────────────────

type EscrowState = {
  label: string;
  labelEn: string;
  color: string;
  bg: string;
  border: string;
  icon: "lock" | "transit" | "delivered" | "released" | "pending";
  step: number;
};

function getEscrowState(oracleCompleted: number, status: string): EscrowState {
  if (status === "matured" || oracleCompleted >= 6) {
    return { label: "Выпущено", labelEn: "Released", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", icon: "released", step: 4 };
  }
  if (oracleCompleted >= 4) {
    return { label: "Доставлено, ожидает оплаты", labelEn: "Delivered – Awaiting Payment", color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/30", icon: "delivered", step: 3 };
  }
  if (oracleCompleted >= 2) {
    return { label: "Товар в пути", labelEn: "Goods In Transit", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", icon: "transit", step: 2 };
  }
  if (oracleCompleted >= 1) {
    return { label: "Средства заблокированы", labelEn: "Funds Locked", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30", icon: "lock", step: 1 };
  }
  return { label: "Ожидает финансирования", labelEn: "Awaiting Funding", color: "text-muted-foreground", bg: "bg-muted/10", border: "border-border", icon: "pending", step: 0 };
}

const ESCROW_FLOW = [
  {
    step: 1,
    title: "Средства заблокированы",
    subtitle: "Funds Locked",
    desc: "Инвестор переводит USDC → Polygon смарт-контракт. Gnosis Safe 2-of-3 принимает средства. Токен-расписка NFT создаётся.",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/30",
    icon: LockKeyhole,
  },
  {
    step: 2,
    title: "Товар в пути",
    subtitle: "In Transit",
    desc: "Oracle подтверждает отгрузку (CMR/EUR.1). Средства удерживаются. Логистика верифицирована on-chain.",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/30",
    icon: Clock,
  },
  {
    step: 3,
    title: "Доставка подтверждена",
    subtitle: "Delivery Confirmed",
    desc: "Oracle получает складскую расписку покупателя. Условия контракта выполнены. Инициируется выпуск средств.",
    color: "text-violet-400",
    bg: "bg-violet-400/10 border-violet-400/30",
    icon: CheckCircle2,
  },
  {
    step: 4,
    title: "Средства выпущены",
    subtitle: "Funds Released",
    desc: "Оплата от OSKUTUOTE OY → SPV. Принципал + доходность распределяются по waterfall DROP→MEZZ→TIN. NFT сжигается.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/30",
    icon: CheckCircle2,
  },
];

export default function Escrow() {
  const active  = DEALS.filter(d => d.status === "active");
  const matured = DEALS.filter(d => d.status === "matured");

  const lockedAmount  = active.reduce((s, d) => s + d.loanAmount, 0);
  const releasedTotal = matured.reduce((s, d) => s + d.loanAmount, 0);

  const escrowByState = DEALS.reduce<Record<string, number>>((acc, d) => {
    const state = getEscrowState(d.oracleCompleted, d.status);
    acc[state.labelEn] = (acc[state.labelEn] ?? 0) + d.loanAmount;
    return acc;
  }, {});

  return (
    <div className="p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <LockKeyhole className="h-8 w-8 text-primary" />
          Escrow — Смарт-контракт эскроу
        </h1>
        <p className="text-muted-foreground mt-1">
          Средства инвесторов защищены on-chain: выпуск только после Oracle-подтверждения каждого этапа поставки.
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Заблокировано сейчас", value: formatCurrency(lockedAmount),  sub: `${active.length} активных контрактов`,   color: "text-blue-400" },
          { label: "Выпущено всего",        value: formatCurrency(releasedTotal), sub: `${matured.length} погашено`,              color: "text-emerald-400" },
          { label: "Общий объём",           value: formatCurrency(lockedAmount + releasedTotal), sub: "Все 10 контрактов",        color: "text-primary" },
          { label: "Защита",                value: "2-of-3",                     sub: "Gnosis Safe мультиподпись",              color: "text-violet-400" },
        ].map(kpi => (
          <Card key={kpi.label} className="hover:border-primary/40 transition-colors">
            <CardContent className="pt-5">
              <div className="text-xs text-muted-foreground mb-1">{kpi.label}</div>
              <div className={`text-2xl font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{kpi.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Escrow Flow Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Как работает эскроу — 4 этапа
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-stretch">
            {ESCROW_FLOW.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className={`flex-1 rounded-lg border p-4 ${step.bg}`}>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${step.color}`}>
                      Этап {step.step}
                    </div>
                    <Icon className={`h-5 w-5 mb-2 ${step.color}`} />
                    <div className="font-semibold text-sm mb-1">{step.title}</div>
                    <div className={`text-[10px] font-mono uppercase tracking-wider mb-2 ${step.color}`}>{step.subtitle}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{step.desc}</div>
                  </div>
                  {i < ESCROW_FLOW.length - 1 && (
                    <div className="hidden sm:flex items-center text-muted-foreground/40">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All Deals — Escrow Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Статус эскроу по каждому контракту
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DEALS.map((deal) => {
            const escrow = getEscrowState(deal.oracleCompleted, deal.status);
            return (
              <Link key={deal.id} href={`/deals/${deal.id}`}>
                <div className={`rounded-lg border p-4 cursor-pointer hover:opacity-90 transition-opacity ${escrow.bg} ${escrow.border}`}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        escrow.icon === "released" ? "bg-emerald-400" :
                        escrow.icon === "delivered" ? "bg-violet-400" :
                        escrow.icon === "transit" ? "bg-amber-400 animate-pulse" :
                        escrow.icon === "lock" ? "bg-blue-400" : "bg-muted-foreground/30"
                      }`} />
                      <div>
                        <div className="font-mono text-xs text-muted-foreground">{deal.contractRef}</div>
                        <div className="font-semibold text-sm">{deal.commodity} — {deal.volumeMT} MT</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Сумма</div>
                        <div className="font-mono font-bold text-sm">{formatCurrency(deal.loanAmount)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Oracle</div>
                        <div className="font-mono text-sm">{deal.oracleCompleted}/{deal.oracleTotal}</div>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${escrow.bg} ${escrow.border} ${escrow.color}`}>
                        {escrow.label}
                      </span>
                    </div>
                  </div>

                  {/* Checkpoint bars */}
                  <div className="flex gap-1 mt-3">
                    {deal.checkpoints.map(cp => (
                      <div
                        key={cp.id}
                        className={`flex-1 h-1.5 rounded-full ${
                          cp.status === "completed" ? (
                            deal.status === "matured" ? "bg-emerald-400" : "bg-primary"
                          ) : cp.status === "pending" ? "bg-amber-400/60" : "bg-muted/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Smart Contract Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode2 className="h-5 w-5 text-primary" />
              Смарт-контракт
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              { label: "Сеть",              value: "Polygon (MATIC)", mono: false },
              { label: "Протокол",          value: "Centrifuge v3",   mono: false },
              { label: "Deployer Wallet",   value: INFRASTRUCTURE.deployerWallet, mono: true },
              { label: "Safe Multisig",     value: INFRASTRUCTURE.safeAddress,    mono: true },
              { label: "Multisig порог",    value: "2-of-3 подписей", mono: false },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-muted-foreground">{r.label}</span>
                <span className={r.mono ? "font-mono text-xs text-primary" : "text-foreground text-sm"}>{r.value}</span>
              </div>
            ))}
            <a
              href="https://app.safe.global/new-safe"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              Создать Safe 2-of-3 <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Правила выпуска средств
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { rule: "Без Oracle — без выпуска",         detail: "Смарт-контракт не может выпустить средства без on-chain подтверждения оракула. Ни один сигнатор не может обойти это условие.", color: "text-rose-400" },
              { rule: "2-of-3 для любого перевода",       detail: "Gnosis Safe требует минимум двух подписей: Собственник 1 (Ledger) + Собственник 2 (MetaMask). Единоличный доступ исключён.", color: "text-amber-400" },
              { rule: "AML до блокировки",                detail: "Все входящие USDC проверяются AMLBot до попадания в эскроу. Высокорисковые адреса не могут участвовать в пуле.", color: "text-blue-400" },
              { rule: "Waterfall защищает DROP",          detail: "DROP-инвесторы получают средства первыми. TIN поглощает убытки первым. Порядок выплат жёстко прописан в контракте.", color: "text-emerald-400" },
            ].map(r => (
              <div key={r.rule} className="flex gap-3 p-3 rounded-lg border border-border bg-muted/10">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                  r.color === "text-rose-400" ? "bg-rose-400" :
                  r.color === "text-amber-400" ? "bg-amber-400" :
                  r.color === "text-blue-400" ? "bg-blue-400" : "bg-emerald-400"
                }`} />
                <div>
                  <div className={`font-semibold text-sm ${r.color}`}>{r.rule}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.detail}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
