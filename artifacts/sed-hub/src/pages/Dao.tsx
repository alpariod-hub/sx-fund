import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vote, CheckCircle2, XCircle, MinusCircle, Lock, AlertTriangle, ExternalLink } from "lucide-react";
import { DAO_PROPOSALS, CATEGORY_META, STATUS_META, type VoteChoice, type Proposal } from "@/lib/daoData";
import { TEAM_MEMBERS } from "@/lib/roleContext";

type VoteStore = Record<string, Record<string, VoteChoice>>;

function loadVotes(): VoteStore {
  try {
    return JSON.parse(localStorage.getItem("sx_dao_votes") || "{}");
  } catch {
    return {};
  }
}

function saveVotes(v: VoteStore) {
  try { localStorage.setItem("sx_dao_votes", JSON.stringify(v)); } catch {}
}

function VoteButton({
  choice, current, disabled, onClick,
}: {
  choice: VoteChoice; current?: VoteChoice; disabled?: boolean; onClick: () => void;
}) {
  const styles: Record<VoteChoice, { active: string; idle: string; Icon: React.ElementType; label: string }> = {
    for:     { active: "bg-emerald-400/20 text-emerald-300 border-emerald-400/50", idle: "hover:bg-emerald-400/10 hover:text-emerald-400 hover:border-emerald-400/30", Icon: CheckCircle2, label: "За" },
    against: { active: "bg-red-400/20 text-red-300 border-red-400/50",           idle: "hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/30",             Icon: XCircle,      label: "Против" },
    abstain: { active: "bg-muted/40 text-muted-foreground border-border",         idle: "hover:bg-muted/30 hover:text-foreground hover:border-border",                Icon: MinusCircle,  label: "Воздержался" },
  };
  const s = styles[choice];
  const isActive = current === choice;
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all
        ${isActive ? s.active : `text-muted-foreground border-border/40 ${s.idle}`}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <s.Icon size={13} />
      {s.label}
      {isActive && <span className="text-[9px] ml-0.5">✓</span>}
    </button>
  );
}

function ProposalCard({ proposal, votes, onVote }: {
  proposal: Proposal;
  votes: Record<string, VoteChoice>;
  onVote: (proposalId: string, memberId: string, choice: VoteChoice) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_META[proposal.category];
  const st  = STATUS_META[proposal.status];

  const forCount     = Object.values(votes).filter(v => v === "for").length;
  const againstCount = Object.values(votes).filter(v => v === "against").length;
  const abstainCount = Object.values(votes).filter(v => v === "abstain").length;
  const totalVoted   = forCount + againstCount + abstainCount;
  const quorumMet    = forCount >= proposal.quorum;

  const isPending = proposal.status === "pending";
  const isLocked  = proposal.status === "passed" || proposal.status === "rejected";

  return (
    <Card className={`border transition-colors ${isPending ? "border-border/40 opacity-70" : "hover:border-primary/20"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${cat.bg} ${cat.color}`}>
                {cat.label}
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${st.bg} ${st.color}`}>
                {st.label}
              </span>
              {isPending && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Lock size={9} /> Блокирован: {proposal.blockedBy?.join(", ")}
                </span>
              )}
            </div>
            <CardTitle className="text-sm font-semibold leading-snug">{proposal.title}</CardTitle>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
              <span>#{proposal.id}</span>
              <span>Кворум: {proposal.quorum} голосов</span>
              <span>До {new Date(proposal.deadline).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </div>
          {/* Quorum badge */}
          <div className={`text-center px-3 py-1.5 rounded-md border shrink-0 ${quorumMet ? "border-emerald-400/30 bg-emerald-400/10" : "border-border/40 bg-muted/20"}`}>
            <div className={`text-lg font-bold font-mono ${quorumMet ? "text-emerald-400" : "text-foreground"}`}>{forCount}/{proposal.quorum}</div>
            <div className="text-[9px] text-muted-foreground uppercase">кворум</div>
          </div>
        </div>

        {/* Description toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-muted-foreground hover:text-foreground text-left mt-1 transition-colors"
        >
          {expanded ? "Скрыть описание ▲" : "Показать описание ▼"}
        </button>
        {expanded && (
          <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 p-2.5 bg-muted/20 rounded-md border border-border/30">
            {proposal.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Vote counts bar */}
        {totalVoted > 0 && (
          <div className="space-y-1.5">
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted/30">
              {forCount > 0     && <div className="bg-emerald-400 transition-all" style={{ width: `${(forCount / 4) * 100}%` }} />}
              {againstCount > 0 && <div className="bg-red-400 transition-all"     style={{ width: `${(againstCount / 4) * 100}%` }} />}
              {abstainCount > 0 && <div className="bg-muted-foreground/40 transition-all" style={{ width: `${(abstainCount / 4) * 100}%` }} />}
            </div>
            <div className="flex gap-4 text-[10px] text-muted-foreground">
              <span className="text-emerald-400">✓ За: {forCount}</span>
              <span className="text-red-400">✗ Против: {againstCount}</span>
              <span>— Воздерж.: {abstainCount}</span>
            </div>
          </div>
        )}

        {/* Per-member votes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TEAM_MEMBERS.map((member) => {
            const memberVote = votes[member.id];
            const defaultVote = proposal.defaultVotes?.[member.id];
            const effectiveVote = memberVote ?? defaultVote;
            return (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/20 border border-border/30">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{member.name}</div>
                  <div className="text-[10px] text-muted-foreground">@{member.tg}</div>
                </div>
                <div className="flex gap-1">
                  {(["for", "against", "abstain"] as VoteChoice[]).map(choice => (
                    <VoteButton
                      key={choice}
                      choice={choice}
                      current={effectiveVote}
                      disabled={isPending || isLocked}
                      onClick={() => onVote(proposal.id, member.id, choice)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {isPending && (
          <div className="flex items-center gap-2 p-2.5 rounded-md bg-amber-400/5 border border-amber-400/20 text-xs text-amber-400">
            <AlertTriangle size={13} />
            Голосование заблокировано — сначала примите: {proposal.blockedBy?.join(", ")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dao() {
  const [votes, setVotes] = useState<VoteStore>(() => {
    const stored = loadVotes();
    const defaults: VoteStore = {};
    DAO_PROPOSALS.forEach(p => {
      if (p.defaultVotes) defaults[p.id] = { ...p.defaultVotes };
    });
    // merge: stored takes priority over defaults
    const merged: VoteStore = { ...defaults };
    Object.entries(stored).forEach(([pid, pv]) => {
      merged[pid] = { ...(merged[pid] || {}), ...pv };
    });
    return merged;
  });

  function handleVote(proposalId: string, memberId: string, choice: VoteChoice) {
    setVotes(prev => {
      const next = {
        ...prev,
        [proposalId]: {
          ...(prev[proposalId] || {}),
          [memberId]: prev[proposalId]?.[memberId] === choice ? undefined as unknown as VoteChoice : choice,
        },
      };
      // remove undefined
      Object.keys(next[proposalId]).forEach(k => {
        if (!next[proposalId][k]) delete next[proposalId][k];
      });
      saveVotes(next);
      return next;
    });
  }

  const openCount    = DAO_PROPOSALS.filter(p => p.status === "open").length;
  const pendingCount = DAO_PROPOSALS.filter(p => p.status === "pending").length;
  const passedCount  = DAO_PROPOSALS.filter(p => p.status === "passed").length;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Vote className="h-6 w-6 text-amber-400" />
            DAO Голосования
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Командные решения по инфраструктуре, финансированию и юридическим вопросам
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Открыто", count: openCount,    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
            { label: "Ожидает", count: pendingCount,  color: "text-amber-400  bg-amber-400/10  border-amber-400/20"  },
            { label: "Принято", count: passedCount,   color: "text-sky-400    bg-sky-400/10    border-sky-400/20"    },
          ].map(s => (
            <div key={s.label} className={`flex flex-col items-center px-3 py-2 rounded-lg border text-center ${s.color}`}>
              <span className="text-lg font-bold font-mono">{s.count}</span>
              <span className="text-[10px] uppercase">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-400/20 bg-amber-400/5 text-xs text-amber-300">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <span>
          Голосования хранятся локально. После создания Safe и настройки on-chain governance — результаты
          будут фиксироваться в мультисиг-транзакциях. Пока — командный консенсус через SED-Hub.
        </span>
      </div>

      {/* Quick action: create Safe */}
      <Card className="border-violet-400/30 bg-violet-400/5">
        <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-violet-300">🔐 Следующий критический шаг</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Создать Safe 2-of-3 → все остальные DAO-голосования разблокируются
            </p>
          </div>
          <a href="https://app.safe.global/new-safe" target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline" className="border-violet-400/40 text-violet-300 hover:bg-violet-400/10 gap-2 shrink-0">
              Создать Safe <ExternalLink size={13} />
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Proposals list */}
      <div className="space-y-4">
        {DAO_PROPOSALS.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            votes={votes[proposal.id] || {}}
            onVote={handleVote}
          />
        ))}
      </div>
    </div>
  );
}
