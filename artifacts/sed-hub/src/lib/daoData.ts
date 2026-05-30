export type VoteChoice = "for" | "against" | "abstain";
export type ProposalStatus = "open" | "pending" | "passed" | "rejected";
export type ProposalCategory = "infra" | "legal" | "finance" | "governance";

export interface Proposal {
  id: string;
  title: string;
  description: string;
  category: ProposalCategory;
  status: ProposalStatus;
  quorum: number;
  deadline: string;
  blockedBy?: string[];
  defaultVotes?: Record<string, VoteChoice>;
}

export const DAO_PROPOSALS: Proposal[] = [
  {
    id: "dao-001",
    title: "Создать Safe 2-of-3 мультисиг",
    description: "Создать Gnosis Safe (2-of-3) на Polygon. Подписанты: Григорий (Ledger), Данил (MetaMask), третий — на усмотрение Григория. Адрес Safe станет получателем всех RWA NFT и средств пула.",
    category: "infra",
    status: "open",
    quorum: 3,
    deadline: "2026-06-15",
    defaultVotes: { alpariod: "for" },
  },
  {
    id: "dao-002",
    title: "Минт NFT RWA-SX-009 (Sunflower 20.2MT)",
    description: "Создать ERC-721 токен для IT-290426. Метаданные: ipfs://QmRRDiY4S3u6aoZ2tLZkcnrnFhNM3a8QBhe7Crwo7Yn2Xk. Получатель — Safe (требует dao-001). Стоимость финансирования $15,150.",
    category: "finance",
    status: "pending",
    quorum: 2,
    deadline: "2026-06-30",
    blockedBy: ["dao-001"],
  },
  {
    id: "dao-003",
    title: "Минт NFT RWA-SX-010 (Feed Corn 23MT)",
    description: "ERC-721 для IT-110526. Метаданные: ipfs://QmVZoiCK6cNYxzsRcdUmkV1ASNyKw4hYZwnsy214cuDKZA. Параллельно с dao-002. Стоимость $3,450.",
    category: "finance",
    status: "pending",
    quorum: 2,
    deadline: "2026-06-30",
    blockedBy: ["dao-001"],
  },
  {
    id: "dao-004",
    title: "Запуск пула на Centrifuge v3",
    description: "Инициировать onboarding SX Fund Pool на Centrifuge. Требует: Safe (dao-001), оба NFT (dao-002 + dao-003), завершённый KYC всех участников.",
    category: "governance",
    status: "pending",
    quorum: 3,
    deadline: "2026-07-15",
    blockedBy: ["dao-001", "dao-002", "dao-003"],
  },
  {
    id: "dao-005",
    title: "Утвердить Loan Agreement IT-290426",
    description: "Одобрить подписание Loan Agreement для сделки IT-290426 (Sunflower Seeds, $15,150). Шаблон подготовлен, заполняет @sasha_damekina.",
    category: "legal",
    status: "open",
    quorum: 3,
    deadline: "2026-06-10",
  },
  {
    id: "dao-006",
    title: "Утвердить Assignment & Pledge IT-290426",
    description: "Одобрить Assignment of Receivables + Pledge Agreement для IT-290426. Параллельно с dao-005.",
    category: "legal",
    status: "open",
    quorum: 3,
    deadline: "2026-06-10",
  },
];

export const CATEGORY_META: Record<ProposalCategory, { label: string; color: string; bg: string }> = {
  infra:      { label: "Инфраструктура", color: "text-violet-400",  bg: "bg-violet-400/10"  },
  legal:      { label: "Юридические",   color: "text-sky-400",     bg: "bg-sky-400/10"     },
  finance:    { label: "Финансы",        color: "text-emerald-400", bg: "bg-emerald-400/10" },
  governance: { label: "Governance",     color: "text-amber-400",   bg: "bg-amber-400/10"   },
};

export const STATUS_META: Record<ProposalStatus, { label: string; color: string; bg: string }> = {
  open:     { label: "Открыто",  color: "text-emerald-400", bg: "bg-emerald-400/10" },
  pending:  { label: "Ожидает",  color: "text-amber-400",   bg: "bg-amber-400/10"   },
  passed:   { label: "Принято",  color: "text-sky-400",     bg: "bg-sky-400/10"     },
  rejected: { label: "Отклонено",color: "text-red-400",     bg: "bg-red-400/10"     },
};
