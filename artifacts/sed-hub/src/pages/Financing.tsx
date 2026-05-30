import { useState } from "react";
import { Link } from "wouter";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Circle, Clock, ExternalLink, FileText,
  Coins, ShieldCheck, Globe, ChevronRight, Copy, AlertTriangle,
  Landmark, Wallet, Layers, Wheat,
} from "lucide-react";
import { DEALS, INFRASTRUCTURE, ROOT_DOCS } from "@/lib/constants";

const IPFS_GW = "https://gateway.pinata.cloud/ipfs";

const PRIORITY_IDS = ["RWA-SX-009", "RWA-SX-010"];
const priorityDeals = DEALS.filter((d) => PRIORITY_IDS.includes(d.id));

const CENTRIFUGE_STEPS = [
  {
    id: 1,
    label: "Safe Multisig — 2-of-3",
    description: "Создать Safe кошелёк 2-of-3 на app.safe.global. Добавить 3 подписанта (Андрей, Григорий + третий).",
    action: { label: "Открыть Safe", url: "https://app.safe.global/new-safe" },
    status: "todo" as const,
    critical: true,
  },
  {
    id: 2,
    label: "Регистрация на Centrifuge",
    description: "Перейти на app.centrifuge.io, подключить кошелёк, пройти верификацию как Issuer. Нужен KYC документ + юридическое лицо.",
    action: { label: "app.centrifuge.io", url: "https://app.centrifuge.io" },
    status: "todo" as const,
    critical: true,
  },
  {
    id: 3,
    label: "Создать Pool на Centrifuge",
    description: "Pool Type: Trade Finance. Asset: Agricultural Trade Receivables. Currency: USDC. Originator: SX Capital / FG Geniivske.",
    action: { label: "New Pool", url: "https://app.centrifuge.io/pools" },
    status: "todo" as const,
    critical: false,
  },
  {
    id: 4,
    label: "Минт NFT — IT-290426 (Sunflower 🌻)",
    description: "Использовать ThirdWeb Dashboard → NFT Collection → Mint. Metadata CID уже на IPFS. Network: Polygon.",
    action: { label: "ThirdWeb Dashboard", url: "https://thirdweb.com/dashboard" },
    status: "ready" as const,
    critical: false,
  },
  {
    id: 5,
    label: "Минт NFT — IT-110526 (Feed Corn 🌽)",
    description: "Второй NFT. Metadata CID готов. После минта — Transfer оба NFT в Centrifuge Pool как collateral.",
    action: { label: "ThirdWeb Dashboard", url: "https://thirdweb.com/dashboard" },
    status: "ready" as const,
    critical: false,
  },
  {
    id: 6,
    label: "Lock NFT → Получить USDC займ",
    description: "В Centrifuge Pool: Lock Collateral → Borrow. Инвесторы предоставляют ликвидность → вы получаете USDC.",
    action: null,
    status: "blocked" as const,
    critical: false,
  },
];

const STATUS_STYLE = {
  todo:    { dot: "bg-amber-400", badge: "bg-amber-400/15 text-amber-400", label: "Нужно сделать", icon: <Circle className="h-4 w-4 text-amber-400" /> },
  ready:   { dot: "bg-emerald-400", badge: "bg-emerald-400/15 text-emerald-400", label: "Готово к минту", icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" /> },
  done:    { dot: "bg-emerald-400", badge: "bg-emerald-400/15 text-emerald-400", label: "Выполнено", icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" /> },
  blocked: { dot: "bg-muted", badge: "bg-muted text-muted-foreground", label: "Ждёт шагов выше", icon: <Clock className="h-4 w-4 text-muted-foreground" /> },
};

const DOC_ICON: Record<string, string> = {
  "Contract": "📄",
  "Invoice": "🧾",
  "T-1 Transit Doc": "🚛",
  "Declaration / CMR / EUR.1 / Phyto": "📋",
  "Supplementary": "📎",
  "Kernel Addendum": "🌻",
  "Corn Framework": "🌽",
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="p-1 hover:bg-muted rounded transition-colors"
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      title="Copy"
    >
      <Copy className={`h-3 w-3 ${copied ? "text-emerald-400" : "text-muted-foreground"}`} />
    </button>
  );
}

export default function Financing() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const doneCount = CENTRIFUGE_STEPS.filter(s => s.status === "done").length;
  const pct = Math.round((doneCount / CENTRIFUGE_STEPS.length) * 100);

  return (
    <div className="p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Coins className="h-8 w-8 text-primary" />
            NFT RWA Financing
          </h1>
          <p className="text-muted-foreground mt-1">
            Centrifuge (Tinlake) + Polygon · 2 приоритетных сделки · Агро-торговое финансирование
          </p>
        </div>
        <a href="https://app.centrifuge.io" target="_blank" rel="noreferrer">
          <Button className="gap-2">
            <Landmark className="h-4 w-4" />
            Открыть Centrifuge
          </Button>
        </a>
      </div>

      {/* Progress bar */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Прогресс onboarding на Centrifuge</span>
            <span className="font-mono text-sm text-primary">{doneCount}/{CENTRIFUGE_STEPS.length} шагов</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Критический шаг 1: создать Safe 2-of-3 мультисиг перед регистрацией на Centrifuge</span>
          </div>
        </CardContent>
      </Card>

      {/* Priority Deals */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          2 Приоритетных NFT RWA
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {priorityDeals.map((deal) => (
            <Card
              key={deal.id}
              className="border-primary/20 hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => setExpanded(expanded === deal.id ? null : deal.id)}
            >
              <CardContent className="p-5 space-y-4">
                {/* Deal header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{deal.commodity.includes("Corn") ? "🌽" : "🌻"}</span>
                      <span className="font-mono text-xs text-muted-foreground">{deal.contractRef}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-400">Active</span>
                    </div>
                    <div className="font-semibold">{deal.commodity}</div>
                    <div className="text-xs text-muted-foreground">{deal.volumeMT} MT · FG Geniivske → OSKUTUOTE OY (FI)</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground mb-0.5">Loan Request</div>
                    <div className="font-mono text-lg font-bold text-primary">${deal.loanAmount.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">USDC · 75% LTV</div>
                  </div>
                </div>

                {/* NFT badge */}
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/40 border border-border">
                  <Coins className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-muted-foreground">NFT Metadata CID (IPFS)</div>
                    <div className="font-mono text-xs truncate">{deal.metadataCid}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <CopyButton value={deal.metadataCid} />
                    <a href={`${IPFS_GW}/${deal.metadataCid}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                    </a>
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[
                    { label: "Tenor",    value: deal.tenor },
                    { label: "APR",      value: `${deal.aprMin}–${deal.aprMax}%` },
                    { label: "Originated", value: deal.originationDate.slice(5) },
                    { label: "Maturity", value: deal.maturityDate.slice(5) },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <div className="text-muted-foreground mb-0.5">{m.label}</div>
                      <div className="font-mono font-bold">{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Documents — expand */}
                <div>
                  <button
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                    onClick={(e) => { e.stopPropagation(); setExpanded(expanded === deal.id ? null : deal.id); }}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>{deal.ipfsDocuments.length} документов на IPFS</span>
                    <ChevronRight className={`h-3.5 w-3.5 ml-auto transition-transform ${expanded === deal.id ? "rotate-90" : ""}`} />
                  </button>
                  {expanded === deal.id && (
                    <div className="mt-2 space-y-1.5">
                      {deal.ipfsDocuments.map((doc) => (
                        <a
                          key={doc.cid}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 p-2 rounded border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors group"
                        >
                          <span className="text-sm shrink-0">{DOC_ICON[doc.label] ?? "📄"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium group-hover:text-primary transition-colors">{doc.label}</div>
                            <div className="text-[10px] font-mono text-muted-foreground truncate">{doc.cid.slice(0, 24)}…</div>
                          </div>
                          <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-border">
                  <Link href={`/deals/${deal.id}`} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                      <Layers className="h-3 w-3" />
                      Deal Room
                    </Button>
                  </Link>
                  <a
                    href="https://thirdweb.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" className="text-xs h-7 gap-1">
                      <Coins className="h-3 w-3" />
                      Mint NFT →
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Centrifuge Onboarding Checklist */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Landmark className="h-4 w-4" />
          Centrifuge Onboarding — Пошаговый план
        </h2>
        <div className="space-y-3">
          {CENTRIFUGE_STEPS.map((step) => {
            const s = STATUS_STYLE[step.status];
            return (
              <Card
                key={step.id}
                className={`transition-colors ${step.critical ? "border-amber-400/30" : "border-border"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                      {s.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                          Шаг {step.id}: {step.label}
                        </span>
                        {step.critical && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400">СРОЧНО</span>
                        )}
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${s.badge}`}>{s.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                    </div>
                    {step.action && (
                      <a href={step.action.url} target="_blank" rel="noreferrer" className="shrink-0">
                        <Button variant="outline" size="sm" className="text-xs h-7 gap-1 whitespace-nowrap">
                          {step.action.label}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Infrastructure + Wallets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              On-chain Infrastructure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {[
              { label: "Network",      value: INFRASTRUCTURE.network,     copy: false },
              { label: "Server Wallet", value: INFRASTRUCTURE.serverWallet, copy: true },
              { label: "Smart Wallet", value: INFRASTRUCTURE.smartWallet, copy: true },
              { label: "Safe Multisig", value: INFRASTRUCTURE.safeAddress, copy: false, warn: true },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground">{r.label}</span>
                <div className="flex items-center gap-1">
                  <span className={`font-mono ${r.warn ? "text-amber-400" : ""}`}>
                    {r.value.length > 20 ? r.value.slice(0, 10) + "…" + r.value.slice(-8) : r.value}
                  </span>
                  {r.copy && <CopyButton value={r.value} />}
                  {r.warn && <AlertTriangle className="h-3 w-3 text-amber-400" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Root Documents (Pool Level)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Deal Summary (все 10 сделок)", doc: ROOT_DOCS.dealSummary },
              { label: "Календар заборгованості", doc: ROOT_DOCS.debtCalendar },
            ].map(({ label, doc }) => (
              <a
                key={doc.cid}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 p-2.5 rounded border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors group"
              >
                <span className="text-base">📊</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium group-hover:text-primary transition-colors">{label}</div>
                  <div className="text-[10px] font-mono text-muted-foreground truncate">{doc.cid.slice(0, 24)}…</div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
              </a>
            ))}

            <div className="pt-2 border-t border-border">
              <div className="text-[10px] text-muted-foreground mb-1">IPFS Manifest (все 10 сделок)</div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-muted-foreground">
                  QmeghB6yMHHznFp6tBW7cLTeLAsHrNLo6sFkPXnMKRMsvS
                </span>
                <CopyButton value="QmeghB6yMHHznFp6tBW7cLTeLAsHrNLo6sFkPXnMKRMsvS" />
                <a href="https://gateway.pinata.cloud/ipfs/QmeghB6yMHHznFp6tBW7cLTeLAsHrNLo6sFkPXnMKRMsvS" target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ThirdWeb Mint Guide */}
      <Card className="border-emerald-400/20 bg-emerald-400/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Coins className="h-4 w-4 text-emerald-400" />
            Инструкция: Минт NFT через ThirdWeb
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2.5">
              <div className="font-semibold text-emerald-400 mb-1">🌻 NFT #1 — IT-290426 (Sunflower Seeds)</div>
              {[
                ["Network", "Polygon"],
                ["Token Standard", "ERC-721"],
                ["Name", "SX-RWA-009 Sunflower Seeds 20.2MT"],
                ["Metadata URI", "ipfs://QmRRDiY4S3u6aoZ2tLZkcnrnFhNM3a8QBhe7Crwo7Yn2Xk"],
                ["Recipient Wallet", INFRASTRUCTURE.smartWallet.slice(0,10) + "…"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-start py-1 border-b border-emerald-400/10 last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono text-right">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2.5">
              <div className="font-semibold text-emerald-400 mb-1">🌽 NFT #2 — IT-110526 (Feed Corn)</div>
              {[
                ["Network", "Polygon"],
                ["Token Standard", "ERC-721"],
                ["Name", "SX-RWA-010 Feed Corn 23MT"],
                ["Metadata URI", "ipfs://QmVZoiCK6cNYxzsRcdUmkV1ASNyKw4hYZwnsy214cuDKZA"],
                ["Recipient Wallet", INFRASTRUCTURE.smartWallet.slice(0,10) + "…"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-start py-1 border-b border-emerald-400/10 last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <a href="https://thirdweb.com/dashboard" target="_blank" rel="noreferrer">
              <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
                <Coins className="h-4 w-4" />
                Mint на ThirdWeb
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
            <a href="https://polygonscan.com/address/0x83309B8c28B9DbC6386F0C68962D00B33A0bd80c" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                Smart Wallet на Polygonscan
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Centrifuge App",   url: "https://app.centrifuge.io",                     icon: "🏦" },
          { label: "Safe Multisig",    url: "https://app.safe.global",                       icon: "🔐" },
          { label: "ThirdWeb",         url: "https://thirdweb.com/dashboard",                icon: "🪙" },
          { label: "Polygonscan",      url: "https://polygonscan.com",                       icon: "🔷" },
        ].map(lnk => (
          <a key={lnk.label} href={lnk.url} target="_blank" rel="noreferrer">
            <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
              <CardContent className="p-3 flex items-center gap-2.5">
                <span className="text-xl">{lnk.icon}</span>
                <div>
                  <div className="text-xs font-medium">{lnk.label}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    Открыть <ExternalLink className="h-2.5 w-2.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
