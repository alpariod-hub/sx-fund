import { useParams, Link } from "wouter";
import { ArrowLeft, CheckCircle2, Circle, Clock, FileText, ExternalLink, Database, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { DEALS, ORACLE_CHECKPOINTS, INFRASTRUCTURE } from "@/lib/constants";

const IPFS_GW = "https://gateway.pinata.cloud/ipfs";

const STATUS_ICON = {
  completed: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
  pending:   <Clock className="h-5 w-5 text-amber-400 shrink-0 animate-pulse" />,
  upcoming:  <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />,
};

const DOC_ICON: Record<string, string> = {
  "Contract": "📄",
  "Invoice": "🧾",
  "T-1 Transit Doc": "🚛",
  "Declaration / CMR / EUR.1 / Phyto": "📋",
  "Kernel Addendum": "🌻",
  "Framework Contract": "📝",
  "Corn Framework": "🌽",
  "Supplementary": "📎",
};

export default function DealDetail() {
  const params = useParams();
  const deal = DEALS.find((d) => d.id === params.id) ?? DEALS[0];

  const statusBadge = {
    active:   "bg-emerald-400/15 text-emerald-400",
    matured:  "bg-muted text-muted-foreground",
    upcoming: "bg-amber-400/15 text-amber-400",
  }[deal.status] ?? "bg-muted text-muted-foreground";

  const statusLabel = { active: "Active", matured: "Repaid", upcoming: "Upcoming" }[deal.status] ?? deal.status;

  return (
    <div className="p-8 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/deals">
            <Button variant="outline" size="icon" data-testid="button-back-deals">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight font-mono">{deal.contractRef}</h1>
              <span className="text-xs font-mono text-muted-foreground">{deal.id}</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusBadge}`}>{statusLabel}</span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">{deal.commodity} · {deal.volumeMT} MT · {deal.counterparty}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {deal.buyer} ({deal.buyerCountry}) via {deal.intermediary}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" data-testid="button-reject-deal">Reject</Button>
          <Button size="sm" data-testid="button-advance-deal">Advance Stage</Button>
        </div>
      </div>

      {/* Deal Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Deal Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Contract Value</div>
              <div className="font-mono text-lg font-bold">{formatCurrency(deal.contractValue)}</div>
              <div className="text-[10px] text-muted-foreground">EUR</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Loan Amount</div>
              <div className="font-mono text-lg font-bold text-primary">{formatCurrency(deal.loanAmount)}</div>
              <div className="text-[10px] text-muted-foreground">{deal.currency}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Tenor</div>
              <div className="font-mono text-lg font-bold">{deal.tenor}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">LTV</div>
              <div className="font-mono text-lg font-bold">{deal.ltv}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">APR</div>
              <div className="font-mono text-lg font-bold text-emerald-400">{deal.aprMin}–{deal.aprMax}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Tranche</div>
              <div className="font-mono text-lg font-bold">{deal.tranche}</div>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-muted-foreground">
            <div><span className="block font-medium text-foreground">Originator</span>{deal.originator}</div>
            <div><span className="block font-medium text-foreground">Originated</span>{deal.originationDate}</div>
            <div><span className="block font-medium text-foreground">Maturity</span>{deal.maturityDate}</div>
            <div><span className="block font-medium text-foreground">Asset Token</span><span className="font-mono">{deal.id}</span></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Oracle Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Oracle Timeline — {deal.oracleCompleted}/{deal.oracleTotal} Checkpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-0">
                  {ORACLE_CHECKPOINTS.map((cp, idx) => {
                    const dealCp = deal.checkpoints[idx];
                    const status = dealCp?.status ?? "upcoming";
                    return (
                      <div key={cp.id} className="relative flex gap-4 pb-6 last:pb-0" data-testid={`checkpoint-${cp.id}`}>
                        <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shrink-0">
                          {STATUS_ICON[status]}
                        </div>
                        <div className={`flex-1 pt-2 pb-4 rounded-lg px-4 border transition-colors ${
                          status === "completed" ? "border-emerald-400/20 bg-emerald-400/5"
                          : status === "pending"  ? "border-amber-400/20 bg-amber-400/5"
                          : "border-border bg-muted/10"
                        }`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className={`font-semibold text-sm ${
                                status === "completed" ? "text-emerald-400"
                                : status === "pending"  ? "text-amber-400"
                                : "text-muted-foreground"
                              }`}>{cp.label}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{cp.description}</div>
                            </div>
                            {dealCp?.date && (
                              <div className="text-[10px] text-muted-foreground shrink-0">{dealCp.date}</div>
                            )}
                          </div>
                          {dealCp?.txHash && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                              <span>Tx:</span>
                              <a href={`https://polygonscan.com/tx/${dealCp.txHash}`} target="_blank" rel="noreferrer"
                                 className="text-primary hover:underline flex items-center gap-0.5">
                                {dealCp.txHash}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NFT Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                NFT Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/10">
                <div>
                  <div className="font-medium text-sm mb-0.5">Metadata CID</div>
                  <div className="font-mono text-muted-foreground break-all">{deal.metadataCid}</div>
                </div>
                <a href={`${IPFS_GW}/${deal.metadataCid}`} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: "Network",       value: INFRASTRUCTURE.network },
                  { label: "Oracle",        value: "Chainlink PoR" },
                  { label: "Safe Wallet",   value: INFRASTRUCTURE.safeAddress.slice(0, 20) + "…" },
                  { label: "Token ID",      value: deal.id },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-mono">{r.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* IPFS Document Data Room */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Data Room
                <span className="ml-auto text-[10px] font-normal text-muted-foreground">
                  {deal.ipfsDocuments.length} docs on IPFS
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {deal.ipfsDocuments.map((doc) => (
                <a
                  key={doc.cid}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-md border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors group cursor-pointer"
                  data-testid={`doc-${doc.label.toLowerCase().replace(/[\s/]+/g, "-")}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{DOC_ICON[doc.label] ?? "📄"}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium group-hover:text-primary transition-colors">{doc.label}</div>
                      <div className="text-[10px] font-mono text-muted-foreground truncate">{doc.cid.slice(0, 20)}…</div>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
                </a>
              ))}
            </CardContent>
          </Card>

          {/* Risk Parameters */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: "Asset Type",   value: deal.type },
                { label: "Commodity",    value: deal.commodity },
                { label: "Volume",       value: `${deal.volumeMT} MT` },
                { label: "LTV",          value: `${deal.ltv}%` },
                { label: "Tenor",        value: deal.tenor },
                { label: "APR Range",    value: `${deal.aprMin}–${deal.aprMax}%` },
                { label: "Network",      value: "Polygon" },
                { label: "Oracle",       value: "Chainlink PoR" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground text-xs">{row.label}</span>
                  <span className="font-mono text-xs">{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
