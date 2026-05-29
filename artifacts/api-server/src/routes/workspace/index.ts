import { Router } from "express";
import { db, workspaceEntriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { patchWorkspaceEntrySchema } from "@workspace/db";

const router = Router();

// GET /api/workspace/entries — all checklist entries
router.get("/workspace/entries", async (req, res) => {
  const entries = await db
    .select()
    .from(workspaceEntriesTable)
    .orderBy(workspaceEntriesTable.id);
  res.json(entries);
});

// PATCH /api/workspace/entries/:key — update a single entry
router.patch("/workspace/entries/:key", async (req, res) => {
  const key = req.params.key;
  const parsed = patchWorkspaceEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const updates: Partial<typeof workspaceEntriesTable.$inferInsert> = {
    ...parsed.data,
    updatedAt: new Date(),
  };

  // Auto-set status
  if (parsed.data.value !== undefined && !parsed.data.status) {
    updates.status = parsed.data.value.trim() ? "done" : "empty";
  }

  const [updated] = await db
    .update(workspaceEntriesTable)
    .set(updates)
    .where(eq(workspaceEntriesTable.fieldKey, key))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json(updated);
});

// POST /api/workspace/seed — seed default checklist (idempotent)
router.post("/workspace/seed", async (_req, res) => {
  const DEFAULTS: Array<{
    fieldKey: string;
    category: string;
    role: "owner" | "legal" | "finance" | "tech" | "all";
    label: string;
    hint?: string;
  }> = [
    // ── OWNERS ──────────────────────────────────────────────────────────────
    { fieldKey: "llp_name_1",       category: "Юридическая структура", role: "owner",   label: "Полное название LLP — Собственник 1",            hint: "Например: SX Capital Partners LLP" },
    { fieldKey: "llp_name_2",       category: "Юридическая структура", role: "owner",   label: "Полное название LLP — Собственник 2",            hint: "Если отдельный LLP" },
    { fieldKey: "jurisdiction",     category: "Юридическая структура", role: "owner",   label: "Юрисдикция регистрации",                        hint: "UK, UAE, Malta, Cayman..." },
    { fieldKey: "reg_number",       category: "Юридическая структура", role: "owner",   label: "Регистрационный номер компании",                 hint: "Companies House number или аналог" },
    { fieldKey: "director_name",    category: "Юридическая структура", role: "owner",   label: "Имя директора/управляющего партнёра (публичное)",hint: "Будет показано инвесторам" },
    { fieldKey: "safe_address",     category: "Безопасность on-chain", role: "owner",   label: "Gnosis Safe адрес (2-of-3)",                     hint: "0x... — создать на app.safe.global" },
    { fieldKey: "pool_address",     category: "Безопасность on-chain", role: "owner",   label: "Centrifuge Pool адрес на Polygon",               hint: "0x... после деплоя пула" },
    { fieldKey: "centrifuge_pool",  category: "Безопасность on-chain", role: "owner",   label: "Centrifuge Pool ID",                             hint: "Например: 0x1234abcd..." },
    { fieldKey: "signatory_3",      category: "Безопасность on-chain", role: "owner",   label: "Третий подписант Safe (кошелёк + имя)",         hint: "Аппаратный кошелёк обязательно" },
    { fieldKey: "email_domain",     category: "Контакты",              role: "owner",   label: "Корпоративный email домен",                     hint: "Например: @sx-fund.com" },
    { fieldKey: "contact_email",    category: "Контакты",              role: "owner",   label: "Email для заявок инвесторов",                   hint: "invest@sx-fund.com" },
    { fieldKey: "telegram_channel", category: "Контакты",              role: "owner",   label: "Telegram канал / группа для инвесторов",        hint: "@sxfund или ссылка" },
    { fieldKey: "website_domain",   category: "Контакты",              role: "owner",   label: "Кастомный домен платформы",                     hint: "app.sx-fund.com" },
    { fieldKey: "owner1_name_pub",  category: "Команда",               role: "owner",   label: "Публичное имя / инициалы Собственника 1",       hint: "Может быть краткое (A.K.)" },
    { fieldKey: "owner2_name_pub",  category: "Команда",               role: "owner",   label: "Публичное имя / инициалы Собственника 2",       hint: "Будет на странице Team" },

    // ── LEGAL ───────────────────────────────────────────────────────────────
    { fieldKey: "spv_structure",    category: "Юридическая структура", role: "legal",   label: "Описание SPV-структуры (если есть)",            hint: "Изолированное юрлицо для пула" },
    { fieldKey: "regulator",        category: "Юридическая структура", role: "legal",   label: "Применимый регулятор",                          hint: "FCA, SEC, нет регулятора — указать" },
    { fieldKey: "mica_status",      category: "Юридическая структура", role: "legal",   label: "Статус MiCA / VASP регистрации",                hint: "EU, exemption, не применимо" },
    { fieldKey: "legal_advisor",    category: "Юридическая структура", role: "legal",   label: "Юридический советник (название фирмы)",         hint: "Например: Linklaters, локальная фирма" },
    { fieldKey: "investment_memo",  category: "Документы",             role: "legal",   label: "Investment Memorandum (ссылка или загрузить)", hint: "PDF документ для due diligence" },
    { fieldKey: "subscription_agr", category: "Документы",             role: "legal",   label: "Subscription Agreement шаблон",                hint: "Подписывается инвестором" },
    { fieldKey: "framework_agr",    category: "Документы",             role: "legal",   label: "Framework Agreement с FG GENIIVSKE",           hint: "Подписан? Ссылка или статус" },
    { fieldKey: "war_risk_disc",    category: "Документы",             role: "legal",   label: "Ukraine War Risk Disclosure",                  hint: "Обязательный для международных инвесторов" },
    { fieldKey: "kyc_provider",     category: "Комплаенс",             role: "legal",   label: "KYC/AML провайдер",                            hint: "Sumsub, Synaps, Fractal, AMLBot API" },
    { fieldKey: "aml_api_key",      category: "Комплаенс",             role: "legal",   label: "AMLBot API подключён? (статус)",               hint: "Да / Нет / В процессе" },

    // ── FINANCE ─────────────────────────────────────────────────────────────
    { fieldKey: "real_tvl",         category: "Финансовые параметры",  role: "finance", label: "Реальный TVL (фактически задеплоено, USDC)",    hint: "Не целевой, а текущий" },
    { fieldKey: "real_yield_paid",  category: "Финансовые параметры",  role: "finance", label: "Реальная доходность выплачена по 7 сделкам",   hint: "% или сумма в USDC" },
    { fieldKey: "real_ltv",         category: "Финансовые параметры",  role: "finance", label: "Реальный LTV (подтверждён оценщиком)",         hint: "Текущий факт vs 75% план" },
    { fieldKey: "mgmt_fee",         category: "Финансовые параметры",  role: "finance", label: "Management Fee %",                             hint: "Реальная комиссия управляющего" },
    { fieldKey: "perf_fee",         category: "Финансовые параметры",  role: "finance", label: "Performance Fee %",                            hint: "% от прибыли сверх hurdle rate" },
    { fieldKey: "min_ticket",       category: "Финансовые параметры",  role: "finance", label: "Минимальный тикет инвестора (USDC)",           hint: "DROP: $10K? $50K?" },
    { fieldKey: "lock_up_drop",     category: "Финансовые параметры",  role: "finance", label: "Lock-up период DROP (дней)",                  hint: "Например: 30, 90, 180" },
    { fieldKey: "bank_statements",  category: "Документы",             role: "finance", label: "Банковские выписки по погашённым сделкам",     hint: "Ссылка на IPFS или Google Drive" },
    { fieldKey: "insurance",        category: "Финансовые параметры",  role: "finance", label: "Страховщик груза (название)",                  hint: "Marsh, Allianz, локальный" },
    { fieldKey: "auditor",          category: "Финансовые параметры",  role: "finance", label: "Внешний аудитор (если есть)",                  hint: "BDO, Grant Thornton, другой" },

    // ── TECH ────────────────────────────────────────────────────────────────
    { fieldKey: "server_wallet_ok", category: "On-chain адреса",       role: "tech",    label: "Server Wallet — реальный или тестовый?",       hint: "0x7feEa... — подтвердить" },
    { fieldKey: "smart_wallet_ok",  category: "On-chain адреса",       role: "tech",    label: "Smart Wallet — реальный или тестовый?",        hint: "0x83309... — подтвердить" },
    { fieldKey: "tx_hashes",        category: "On-chain адреса",       role: "tech",    label: "Реальные txHash для checkpoints (10 сделок)",  hint: "Заменить 0xabc001... на реальные" },
    { fieldKey: "oracle_provider",  category: "Интеграции",            role: "tech",    label: "Oracle провайдер (Chainlink / кастомный)",     hint: "Как будет подтверждать CMR, склад?" },
    { fieldKey: "server_ip_hidden",  category: "Безопасность",          role: "tech",    label: "IP сервера скрыт за Cloudflare proxy?",        hint: "api.trinityfund.io → Cloudflare ON ☁️" },
    { fieldKey: "centrifuge_deploy", category: "Интеграции",           role: "tech",    label: "Centrifuge пул задеплоен?",                    hint: "app.centrifuge.io — статус" },
    { fieldKey: "nft_contract",     category: "Интеграции",            role: "tech",    label: "NFT контракт для расписок инвесторов",         hint: "ERC-1155 на Polygon" },
    { fieldKey: "auth_system",      category: "Безопасность",          role: "tech",    label: "Аутентификация инвестор-портала (выбрана?)",   hint: "Clerk, Supabase Auth, custom JWT" },
  ];

  let inserted = 0;
  for (const item of DEFAULTS) {
    try {
      await db.insert(workspaceEntriesTable).values({
        ...item,
        value: "",
        notes: "",
        status: "empty",
        updatedBy: "",
      }).onConflictDoNothing();
      inserted++;
    } catch (_) {
      // skip if already exists
    }
  }

  res.json({ seeded: inserted, total: DEFAULTS.length });
});

export default router;
