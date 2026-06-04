import { Bot, InlineKeyboard, webhookCallback, type Context } from "grammy";
import OpenAI from "openai";
import {
  db,
  assetsTable,
  oracleEventsTable,
  investorInquiriesTable,
  conversations,
  messages,
} from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";
import { logger } from "../lib/logger";

// ─── OpenAI ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are SX Fund AI Assistant — an expert in RWA (Real World Assets) agricultural trade finance on Polygon.

You help the SX Fund team with detailed, substantive answers. Always give thorough, specific responses — never give vague or generic replies. If you don't know something specific, say so clearly and explain what you do know.

**Current State (as of June 2026):**
- Infrastructure COMPLETE: ERC-721 NFT Drop deployed, Safe 2-of-2 created, roles assigned
- NFT Contract: 0x5de1bdf2C1e00D74ACcf63d816768C9EB5718404 (Polygon Mainnet)
- Safe 2-of-2: 0x58D716D9FfaFEb1f918E96856b309C2f5c63e394 (DEFAULT_ADMIN_ROLE)
- Server Wallet: 0xBCABb197e9BCb7F23E7Ca2AFA1aC6EA7e1cd916C (MINTER_ROLE)
- CURRENT STAGE: Stage 1 — Minting 11 NFTs

**Pool structure:**
- Issuer: Cereal Crops Trading LLP (CCT LLP), registered in England & Wales
- Originator: FG GENIIVSKE — Ukrainian sunflower/corn farm
- Finnish buyers: OSKUTUOTE OY (10 deals), EURO TUKATTI OY (1 deal: RWA-SX-005)
- Total receivables: €127,648 across 11 trade finance deals
- 3 tranches: DROP (70%, 6-8% APR, senior/safest), MEZZ (10%, 10-12% APR), TIN (20%, 15-18% APR, junior/riskiest)
- Network: Polygon | Token standard: ERC-721

**All 11 deals:**
- RWA-SX-001: IT-211025, Striped Sunflower, €14,960, CMR 141125-2, buyer: OSKUTUOTE OY
- RWA-SX-002: IT-241025, Striped Sunflower, €14,960, CMR 201125-2, buyer: OSKUTUOTE OY
- RWA-SX-003: IT-271025, Sunflower Kernel 15%, €22,540, CMR 251125-1, buyer: OSKUTUOTE OY
- RWA-SX-004: IT-201125, Striped Sunflower, €13,640, CMR 081225-1, buyer: OSKUTUOTE OY
- RWA-SX-005: IT-221125, Sunflower Kernel 15%, €15,232, CMR 081225-2, buyer: EURO TUKATTI OY
- RWA-SX-006: IT-260126, Striped Sunflower, €12,540, CMR 0902265-1, buyer: OSKUTUOTE OY
- RWA-SX-007: IT-090226, Feed Corn, €3,376, CMR 120226-1, buyer: OSKUTUOTE OY
- RWA-SX-008: IT-230426, Feed Corn, €3,680, CMR 280426-1, buyer: OSKUTUOTE OY
- RWA-SX-009: IT-290426, Striped Sunflower, €8,080, CMR 070526-1, buyer: OSKUTUOTE OY
- RWA-SX-010: IT-110526, Feed Corn, €3,680, CMR 150526-1, buyer: OSKUTUOTE OY
- RWA-SX-011: IT-221025, Striped Sunflower, €14,960, CMR 141125-3, buyer: OSKUTUOTE OY

**Stage roadmap:**
- Stage 0 (✅ DONE): Infrastructure — contracts, Safe, roles
- Stage 1 (🔄 CURRENT): Mint 11 NFTs — Андрей via ThirdWeb dashboard
- Stage 2 (🔒 LOCKED): CIDs for RWA-SX-011 docs — Александра browses Pinata folder
- Stage 3 (🔒 LOCKED): Legal documents — Александра prepares AFTER mint completes
- Stage 4 (🔒 LOCKED): Fund disbursement — Safe 2-of-2 (Данил + Григорий) AFTER legal signed
- Stage 5 (🔒 LOCKED): Investor onboarding — Андрей
- Stage 6 (🔒 LOCKED): Repayment & closure

**Team:**
- Андрей (@alpariod): Owner, Tech lead — Stages 1, 5
- Григорий (@Grygorii_Damekin): Owner, Safe Signer (Ledger hardware wallet) — Stages 3, 4, 6
- Александра (@sasha_damekina): Legal & Documents specialist — Stages 2, 3, 6
- Данил (@danii191191): Tech, Safe Signer (MetaMask) — Stage 4 ONLY

**LEGAL DOCUMENTS — Stage 3 (Александра's responsibility):**

Все три документа готовятся Александрой ПОСЛЕ того как 11 NFT заминчены. Вот детали каждого:

1. **Loan Agreement (Договор займа)**
   - Стороны: CCT LLP (займодавец/кредитор) ↔ ФГ Геніївське (заёмщик)
   - Сумма: €127,648 (сумма всех 11 дебиторок)
   - Срок: 30 дней с даты подписания
   - Обеспечение: Уступка дебиторки + залог NFT
   - Содержание: Сумма, срок, процентная ставка, условия погашения, реквизиты сторон, подписи
   - Формат: PDF, подписывают Григорий (от CCT LLP) + представитель ФГ Геніївське
   - Пример структуры: Преамбула → Предмет займа → Порядок выдачи → Срок и возврат → Проценты → Обеспечение → Реквизиты → Подписи

2. **Assignment of Receivables (Уступка прав требования / Цессия)**
   - Стороны: ФГ Геніївське (цедент) → CCT LLP (цессионарий)
   - Предмет: Передача прав на получение оплаты по 11 инвойсам от OSKUTUOTE OY и EURO TUKATTI OY
   - Содержание: Список всех 11 дебиторок с суммами, номерами инвойсов, датами, покупателями
   - Цель: CCT LLP получает право напрямую взыскать деньги с финских покупателей
   - Подписи: Григорий (CCT LLP) + представитель ФГ Геніївське
   - Важно: К документу прикладываются копии всех 11 CMR-накладных как приложение

3. **Pledge Agreement / NFT Pledge (Договор залога NFT)**
   - Стороны: CCT LLP (залогодержатель) ↔ ФГ Геніївське (залогодатель)  
   - Предмет залога: 11 NFT токенов RWA-SX-001 через RWA-SX-011 на контракте 0x5de1bdf2C1e00D74ACcf63d816768C9EB5718404 (Polygon)
   - Смысл: NFT служат цифровым обеспечением займа; если ФГ не вернёт деньги — CCT LLP может реализовать NFT
   - Содержание: Описание NFT (tokenId, контракт, сеть), условия обращения взыскания, Safe адрес хранения
   - Подписи: Григорий (CCT LLP) + представитель ФГ Геніївське

**Где найти примеры документов:**
- Loan Agreement: поискать "trade finance loan agreement template" на LexisNexis, PracticalLaw, или BIMCO
- Assignment of Receivables: "assignment of receivables agreement UK template" — English law шаблоны
- Pledge Agreement: специфично для Web3/NFT — аналог стандартного pledge agreement но с описанием блокчейн-актива
- Рекомендация Александре: взять за основу английские (English law, поскольку CCT LLP зарегистрирована в England & Wales) шаблоны и адаптировать под наши реквизиты

**Реквизиты для документов:**
- CCT LLP: Cereal Crops Trading LLP, England & Wales
- ФГ Геніївське: украинское фермерское хозяйство, оригинатор поставок
- Safe (хранение NFT): 0x58D716D9FfaFEb1f918E96856b309C2f5c63e394 (Polygon)
- NFT контракт: 0x5de1bdf2C1e00D74ACcf63d816768C9EB5718404

**Critical rules:**
- NEVER reference old wallets 0x7feE... or 0x83309B... (COMPROMISED)
- Данил: NOT to use Safe Transaction Builder until Stage 4
- No transferOwnership function on this contract (uses AccessControl)
- Source of truth for deal data: Александра's spreadsheet

Respond in the same language as the user (Ukrainian, Russian, or English).
Give detailed, practical, actionable answers. Use bullet points and structure. Format with Telegram Markdown.`;

// ─── Relay state ───────────────────────────────────────────────────────────────
// userId → true means the user is in "waiting for relay message" mode

const relayPending = new Set<number>();

// ─── Helpers ───────────────────────────────────────────────────────────────────

function safe(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

function fmtAI(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "*$1*")
    .replace(/^#{1,3}\s+(.+)$/gm, "*$1*")
    .replace(/^[-•]\s/gm, "• ")
    .replace(/^(\d+)\.\s/gm, "$1\\. ");
}

/** Split text into ≤4000-char chunks at paragraph boundaries for Telegram */
function splitMessage(text: string, limit = 4000): string[] {
  if (text.length <= limit) return [text];
  const chunks: string[] = [];
  let current = "";
  for (const para of text.split("\n\n")) {
    const block = para + "\n\n";
    if (current.length + block.length > limit) {
      if (current) chunks.push(current.trimEnd());
      current = block;
    } else {
      current += block;
    }
  }
  if (current.trimEnd()) chunks.push(current.trimEnd());
  return chunks;
}

async function sendAIReply(ctx: Context, text: string) {
  const formatted = fmtAI(text);
  const parts = splitMessage(formatted);
  const menu = new InlineKeyboard()
    .text("📊 Статус", "cmd:status")
    .text("📋 Сделки", "cmd:deals")
    .row()
    .text("◀️ Меню", "cmd:menu");

  for (let i = 0; i < parts.length; i++) {
    await ctx.reply(parts[i], {
      parse_mode: "Markdown",
      reply_markup: i === parts.length - 1 ? menu : undefined,
    });
  }
}

// ─── URLs ──────────────────────────────────────────────────────────────────────

const NOTION_URL = "https://www.notion.so/SX-Fund-Project-Dashboard-36f80ec8ce2d81858a69c10e729664bc";

function getDashboardUrl(): string {
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domains) return `https://${domains}/sed-hub/`;
  return "https://sx-fund.replit.app/sed-hub/";
}

function getWorkspaceUrl(): string {
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domains) return `https://${domains}/sed-hub/workspace`;
  return "https://sx-fund.replit.app/sed-hub/workspace";
}

// ─── Main keyboard ─────────────────────────────────────────────────────────────

function mainMenu() {
  return new InlineKeyboard()
    .text("📊 Статус пула",    "cmd:status")
    .text("📋 Сделки",         "cmd:deals")
    .row()
    .text("🔐 Эскроу",         "cmd:escrow")
    .text("🔗 Oracle Feed",    "cmd:oracle")
    .row()
    .text("👥 Инвесторы",      "cmd:investors")
    .text("💰 Транши",         "cmd:tranches")
    .row()
    .text("🗳 Мой план",       "cmd:plan")
    .text("🔒 Безопасность",   "cmd:security")
    .row()
    .url("🌐 SED-Hub",            "https://sed-hub.trinityfund.io")
    .url("🗳 DAO Голосования",    "https://sed-hub.trinityfund.io/dao")
    .row()
    .url("📓 Notion",             NOTION_URL)
    .text("❓ Помощь",            "cmd:help")
    .row()
    .text("📩 Связь с агентом",   "cmd:agent_contact")
    .row()
    .text("🗑 Очистить чат",      "cmd:clear");
}

// ─── Handler functions (shared by commands & buttons) ─────────────────────────

async function handleStatus(ctx: Context) {
  await ctx.replyWithChatAction("typing");
  try {
    const assets = await db.select().from(assetsTable);
    const active = assets.filter((a) => a.status === "active");
    const pending = assets.filter((a) => a.status === "pending");
    const matured = assets.filter((a) => a.status === "matured");
    const totalTvl = active.reduce((s, a) => s + Number(a.loanAmount), 0);
    const avgYield =
      active.length
        ? active.reduce((s, a) => s + (Number(a.yieldMin) + Number(a.yieldMax)) / 2, 0) / active.length
        : 0;

    await ctx.reply(
      `📊 *Статус пула SX Fund*\n\n` +
      `💰 *TVL:* $${safe(totalTvl.toLocaleString("en"))} USDC\n` +
      `🌐 *Сеть:* Polygon\n` +
      `📈 *Ср\\. доходность:* ${safe(avgYield.toFixed(1))}% APR\n\n` +
      `📁 *Сделки:*\n` +
      `  🟢 Активных: ${active.length}\n` +
      `  🟡 Ожидают: ${pending.length}\n` +
      `  ✅ Погашено: ${matured.length}\n` +
      `  📦 Всего: ${assets.length}\n\n` +
      `*Транши:*\n` +
      `🟢 DROP  — 70% \\| 6–8% APR \\| Senior\n` +
      `🟡 MEZZ — 10% \\| 10–12% APR \\| Mezz\n` +
      `🔴 TIN    — 20% \\| 15–18% APR \\| Junior`,
      { parse_mode: "MarkdownV2", reply_markup: new InlineKeyboard().text("◀️ Меню", "cmd:menu") }
    );
  } catch (err) {
    logger.error({ err }, "handleStatus error");
    await ctx.reply("Ошибка получения данных.");
  }
}

async function handleDeals(ctx: Context) {
  await ctx.replyWithChatAction("typing");
  try {
    const assets = await db
      .select()
      .from(assetsTable)
      .orderBy(desc(assetsTable.createdAt))
      .limit(10);

    if (assets.length === 0) {
      await ctx.reply("Сделок пока нет\\.", { parse_mode: "MarkdownV2" });
      return;
    }

    const emoji: Record<string, string> = {
      active: "🟢", matured: "✅", defaulted: "🔴", pending: "🟡",
    };

    const lines = assets.map((a) => {
      const e = emoji[a.status] ?? "⚪";
      const amt = Number(a.loanAmount).toLocaleString("en");
      return `${e} *${safe(a.tokenId)}*\n   ${safe(a.name)} — $${safe(amt)}`;
    });

    await ctx.reply(
      `📋 *Сделки SX Fund* \\(${assets.length}\\)\n\n` + lines.join("\n\n"),
      { parse_mode: "MarkdownV2", reply_markup: new InlineKeyboard().text("◀️ Меню", "cmd:menu") }
    );
  } catch (err) {
    logger.error({ err }, "handleDeals error");
    await ctx.reply("Ошибка получения сделок.");
  }
}

async function handleOracle(ctx: Context) {
  await ctx.replyWithChatAction("typing");
  try {
    const events = await db
      .select({
        event: oracleEventsTable,
        tokenId: assetsTable.tokenId,
        assetName: assetsTable.name,
      })
      .from(oracleEventsTable)
      .leftJoin(assetsTable, eq(oracleEventsTable.assetId, assetsTable.id))
      .orderBy(desc(oracleEventsTable.createdAt))
      .limit(8);

    if (events.length === 0) {
      await ctx.reply("Oracle событий пока нет\\.", { parse_mode: "MarkdownV2" });
      return;
    }

    const statusEmoji: Record<string, string> = {
      confirmed: "✅", pending: "⏳", failed: "❌",
    };
    const eventLabel: Record<string, string> = {
      contract_signed: "Контракт подписан",
      prepayment_confirmed: "Предоплата подтверждена",
      goods_shipped: "Товар отгружен",
      goods_received: "Товар получен",
      payment_received: "Оплата получена",
      maturity: "Погашение",
    };

    const lines = events.map((r) => {
      const e = statusEmoji[r.event.status] ?? "⚪";
      const label = eventLabel[r.event.eventType] ?? r.event.eventType;
      const date = new Date(r.event.createdAt).toLocaleDateString("ru-RU");
      return `${e} *${safe(r.tokenId ?? "?")}* — ${safe(label)}\n   _${safe(date)}_`;
    });

    await ctx.reply(
      `🔗 *Oracle Feed* \\(последние ${events.length}\\)\n\n` + lines.join("\n\n"),
      { parse_mode: "MarkdownV2", reply_markup: new InlineKeyboard().text("◀️ Меню", "cmd:menu") }
    );
  } catch (err) {
    logger.error({ err }, "handleOracle error");
    await ctx.reply("Ошибка получения Oracle событий.");
  }
}

async function handleInvestors(ctx: Context) {
  await ctx.replyWithChatAction("typing");
  try {
    const inquiries = await db.select().from(investorInquiriesTable);

    const byTranche = inquiries.reduce<Record<string, number>>((acc, i) => {
      acc[i.interestedTranche] = (acc[i.interestedTranche] ?? 0) + 1;
      return acc;
    }, {});
    const byType = inquiries.reduce<Record<string, number>>((acc, i) => {
      acc[i.investorType] = (acc[i.investorType] ?? 0) + 1;
      return acc;
    }, {});

    const trancheLines = Object.entries(byTranche)
      .map(([k, v]) => `  • *${safe(k)}*: ${v}`)
      .join("\n") || "  нет данных";
    const typeLines = Object.entries(byType)
      .map(([k, v]) => `  • ${safe(k)}: ${v}`)
      .join("\n") || "  нет данных";

    await ctx.reply(
      `👥 *Инвесторы SX Fund*\n\n` +
      `📨 *Всего заявок:* ${safe(String(inquiries.length))}\n\n` +
      `*По траншам:*\n${trancheLines}\n\n` +
      `*По типу:*\n${typeLines}`,
      { parse_mode: "MarkdownV2", reply_markup: new InlineKeyboard().text("◀️ Меню", "cmd:menu") }
    );
  } catch (err) {
    logger.error({ err }, "handleInvestors error");
    await ctx.reply("Ошибка получения данных инвесторов.");
  }
}

async function handleTranches(ctx: Context) {
  await ctx.reply(
    `💰 *Транши SX Fund*\n\n` +
    `🟢 *DROP* \\(Senior\\)\n` +
    `  • Аллокация: 70% пула\n` +
    `  • Доходность: 6–8% APR\n` +
    `  • Приоритет: первый в очереди выплат\n` +
    `  • Риск: минимальный\n` +
    `  • TVL: ~\\$183,750 USDC\n\n` +
    `🟡 *MEZZ* \\(Mezzanine\\)\n` +
    `  • Аллокация: 10% пула\n` +
    `  • Доходность: 10–12% APR\n` +
    `  • Буфер между DROP и TIN\n` +
    `  • Риск: средний\n` +
    `  • TVL: ~\\$26,250 USDC\n\n` +
    `🔴 *TIN* \\(Junior / First Loss\\)\n` +
    `  • Аллокация: 20% пула\n` +
    `  • Доходность: 15–18% APR\n` +
    `  • Первый несёт убытки\n` +
    `  • Риск: максимальный\n` +
    `  • TVL: ~\\$52,500 USDC\n\n` +
    `_Blended yield: 9–12% APR \\| LTV: 75%_`,
    { parse_mode: "MarkdownV2", reply_markup: new InlineKeyboard().text("◀️ Меню", "cmd:menu") }
  );
}

async function handleSecurity(ctx: Context) {
  await ctx.reply(
    `🔒 *Безопасность SX Fund*\n\n` +
    `*AML процесс:*\n` +
    `1\\. Инвестор инициирует платёж\n` +
    `2\\. Уникальный временный кошелёк\n` +
    `3\\. USDT поступает, замораживается\n` +
    `4\\. AMLBot проверяет адрес \\(\\<$1/чек\\)\n` +
    `5\\. Чистые средства → Gnosis Safe 2\\-of\\-3\n` +
    `6\\. Риск\\-адреса → заморожены, ручная проверка\n\n` +
    `*Gnosis Safe 2\\-of\\-3:*\n` +
    `• Андрей — Ledger \\(аппаратный\\)\n` +
    `• Григорий — MetaMask/Rabby\n` +
    `• Подписант 3 — TBD\n\n` +
    `*Инструменты:*\n` +
    `🔍 [AMLBot](https://amlbot.com)\n` +
    `🤖 [@ChainGPTAI\\_Bot](https://t.me/ChainGPTAI_Bot)\n` +
    `🛡 [Gnosis Safe](https://app.safe.global)`,
    {
      parse_mode: "MarkdownV2",
      link_preview_options: { is_disabled: true },
      reply_markup: new InlineKeyboard().text("◀️ Меню", "cmd:menu"),
    }
  );
}

async function handleEscrow(ctx: Context) {
  await ctx.replyWithChatAction("typing");
  try {
    const assets = await db.select().from(assetsTable).orderBy(desc(assetsTable.createdAt));

    const getState = (oracleCompleted: number, status: string) => {
      if (status === "matured") return { label: "Выпущено ✅",        emoji: "✅" };
      if (oracleCompleted >= 4)  return { label: "Доставлено 📦",     emoji: "📦" };
      if (oracleCompleted >= 2)  return { label: "В пути 🚛",         emoji: "🚛" };
      if (oracleCompleted >= 1)  return { label: "Заблокировано 🔐",  emoji: "🔐" };
      return                            { label: "Ожидает финансирования ⏳", emoji: "⏳" };
    };

    const active  = assets.filter(a => a.status === "active");
    const matured = assets.filter(a => a.status === "matured");
    const locked  = active.reduce((s, a) => s + Number(a.loanAmount), 0);
    const released = matured.reduce((s, a) => s + Number(a.loanAmount), 0);

    const lines = assets.slice(0, 10).map(a => {
      const state = getState(
        a.status === "matured" ? 6 : 2,
        a.status,
      );
      return `${state.emoji} *${safe(a.tokenId)}* — \\$${safe(Number(a.loanAmount).toLocaleString("en"))}\n   _${safe(state.label)}_`;
    });

    await ctx.reply(
      `🔐 *Escrow SX Fund*\n\n` +
      `🔒 Заблокировано: \\$${safe(locked.toLocaleString("en"))} USDC\n` +
      `✅ Выпущено: \\$${safe(released.toLocaleString("en"))} USDC\n` +
      `📦 Всего контрактов: ${assets.length}\n\n` +
      `*Как работает:*\n` +
      `1\\. Инвестор → USDC заблокирован в Polygon смарт\\-контракте\n` +
      `2\\. Oracle подтверждает CMR \\(отгрузка\\)\n` +
      `3\\. Oracle подтверждает доставку \\(склад\\)\n` +
      `4\\. Средства автоматически выпускаются по waterfall\n\n` +
      `*Статус по контрактам:*\n\n` +
      lines.join("\n\n"),
      {
        parse_mode: "MarkdownV2",
        reply_markup: new InlineKeyboard()
          .url("🌐 Подробнее в Dashboard", getDashboardUrl() + "escrow")
          .row()
          .text("◀️ Меню", "cmd:menu"),
      },
    );
  } catch (err) {
    logger.error({ err }, "handleEscrow error");
    await ctx.reply("Ошибка получения данных эскроу.");
  }
}

async function handleHelp(ctx: Context) {
  await ctx.reply(
    `*Команды SX Fund Bot:*\n\n` +
    `/start — главное меню с кнопками\n` +
    `/status — статус пула \\(TVL, транши, доходность\\)\n` +
    `/deals — активные сделки\n` +
    `/escrow — статус эскроу и заблокированных средств\n` +
    `/oracle — последние Oracle события\n` +
    `/investors — статистика инвесторов\n` +
    `/tranches — описание траншей DROP/MEZZ/TIN\n` +
    `/security — AML и Safe мультиподпись\n` +
    `/plan — 🗳 твой персональный план по шагам\n` +
    `/remind — 📤 отправить напоминания всей команде \\(admin\\)\n` +
    `/clear — очистить историю чата с AI\n` +
    `/help — эта справка\n\n` +
    `_Или просто напиши любой вопрос — AI ответит\\._`,
    { parse_mode: "MarkdownV2", reply_markup: mainMenu() }
  );
}

// ─── Team chat IDs (from PM2 config) ──────────────────────────────────────────

const TEAM: Record<string, { name: string; chatId: number; role: string; emoji: string; steps: string[]; rules: string[] }> = {
  alpariod: {
    name: "Андрей",
    chatId: 8532055371,
    role: "Owner · Tech Lead · Deployer",
    emoji: "🔧",
    steps: [
      "⚡ *ЭТАП 1 — Минт 11 NFT \\(СЕЙЧАС\\)*\n\nКонтракт уже задеплоен и настроен:\n• NFT: `0x5de1bdf2C1e00D74ACcf63d816768C9EB5718404`\n• Server Wallet: `0xBCABb197e9BCb7F23E7Ca2AFA1aC6EA7e1cd916C`\n• MINTER\\_ROLE уже выдан ✅\n\n1\\. Запусти минт\\-скрипт через ThirdWeb SDK\n2\\. 11 NFT: RWA\\-SX\\-001 → RWA\\-SX\\-011 \\(все deals в SED\\-Hub\\)\n3\\. Для каждого tokenURI \\= IPFS CID metadata JSON\n4\\. После каждого минта: проверь txHash на polygonscan\n5\\. Скинь все 11 txHash в командный чат",
      "📁 *ЭТАП 2 — CID документов RWA\\-SX\\-011 \\(после минта\\)*\nАлександра даст CID папки IT\\-221025 на Pinata \\— добавь в SED\\-Hub",
    ],
    rules: [
      "🚫 НЕ использовать старые кошельки \\(0x7feE\\.\\.\\., 0x83309B8c\\.\\.\\.\\)",
      "✅ Safe 2\\-of\\-2 уже создан — ничего дополнительно не деплоить",
      "🔑 Контракт использует AccessControl, не Ownable — transferOwnership НЕ существует",
      "📦 Все 11 метадат должны быть загружены на IPFS перед минтом",
    ],
  },
  grygorii_damekin: {
    name: "Григорий",
    chatId: 5083559046,
    role: "Owner · Safe Signer (Ledger)",
    emoji: "👑",
    steps: [
      "⏳ *СЕЙЧАС — Ожидание \\(Этап 1 ещё не завершён\\)*\nАндрей минтит NFT\\. Твои действия начнутся на Этапе 3\\.",
      "📋 *ЭТАП 3 — Подписание документов \\(после минта\\)*\n1\\. Получи от Александры: Loan Agreement, Assignment, Pledge\n2\\. Проверь суммы: €127,648 итого, 11 дебиторок CCT LLP ↔ ФГ Геніївське\n3\\. Подпиши все 3 документа от имени CCT LLP\n4\\. Верни подписанные PDF Александре для загрузки на Pinata",
      "💰 *ЭТАП 4 — Выдача займа через Safe*\n1\\. Открой [app\\.safe\\.global](https://app.safe.global) → Safe `0x58D7…e394`\n2\\. Инициируй транзакцию: перевод USDT на кошелёк ФГ Геніївське\n3\\. Подпиши Ledger \\(Signer 2 из 2\\)\n4\\. Дождись подписи Данила → Execute",
    ],
    rules: [
      "👑 Ты Owner — финальное слово по условиям займа",
      "🔐 Ты Safe Signer \\(Ledger\\) — подписываешь казну на Этапе 4",
      "📝 Подписываешь Loan Agreement только ПОСЛЕ завершения минта",
      "✋ Transaction Builder в Safe открывать только на Этапе 4",
    ],
  },
  sasha_damekina: {
    name: "Александра",
    chatId: 521990485,
    role: "Legal · Docs",
    emoji: "📋",
    steps: [
      "📁 *СЕЙЧАС — Этап 1\\.5 — CID документов для SX\\-011*\nПока Андрей готовится к минту:\n1\\. Открой [pinata\\.cloud](https://pinata.cloud) → папка IT\\-221025\n   `bafybeibj4klqevvuro3bu3rcmlbaxgqzawmphmy5elqidejezcfu6gwlji`\n2\\. Скопируй CID каждого PDF отдельно \\(Contract, CMR, Invoice, T\\-1\\)\n3\\. Передай CID Андрею \\(@alpariod\\) в личку",
      "📝 *ЭТАП 3 — Юридические документы \\(ПОСЛЕ минта\\)*\n4\\. Заполни *Loan Agreement*: CCT LLP ↔ ФГ Геніївське, €127,648, 30 дней\n5\\. Заполни *Assignment of Receivables* \\(11 дебиторок\\)\n6\\. Заполни *Pledge Agreement* \\(NFT как залог\\)\n7\\. Подписи: Григорий \\+ Данил от CCT LLP\n8\\. Загрузи подписанные PDF на Pinata → передай CID @alpariod",
      "✅ *ЭТАП 6 — Закрытие \\(позже\\)*\n9\\. Заёмщик погашает займ \\+ проценты\n10\\. Сформируй *Investor Proof* \\(закрывающий документ\\)\n11\\. Загрузи на Pinata → CID в SED\\-Hub",
    ],
    rules: [
      "📄 Твой output сейчас: CID документов из папки IT\\-221025 на Pinata",
      "🚫 НЕ подписывать Loan Agreement до завершения минта NFT",
      "✋ Ты НЕ деплоишь контракты и НЕ управляешь Safe",
      "⚠️ Данные в таблице Александры — единственный источник правды \\(не AI\\-саммари\\)",
    ],
  },
  danii191191: {
    name: "Данил",
    chatId: 152360788,
    role: "Security · Safe Signer (MetaMask)",
    emoji: "🔐",
    steps: [
      "⏳ *СЕЙЧАС — Ожидание \\(Этапы 1\\-3 ещё не завершены\\)*\n\n✅ Safe уже создан и настроен:\n• Safe: `0x58D716D9FfaFEb1f918E96856b309C2f5c63e394`\n• Ты Signer 1 \\(MetaMask\\)\n• Григорий Signer 2 \\(Ledger\\)\n\n⚠️ НИЧЕГО делать в Safe сейчас НЕ нужно\\.\nСледующее твоё действие — на Этапе 4\\.",
      "💰 *ЭТАП 4 — Подпись займа \\(после Loan Agreement\\)*\n1\\. Получи уведомление от Григория о транзакции в Safe\n2\\. Открой [app\\.safe\\.global](https://app.safe.global) → Safe `0x58D7…e394`\n3\\. Проверь: сумма, адрес получателя \\(ФГ Геніївське\\), сеть Polygon\n4\\. Подпиши MetaMask \\(Signer 1 из 2\\)\n5\\. После подписи Григория — нажми Execute\n6\\. Скинь txHash в командный чат",
    ],
    rules: [
      "🚫 НЕ открывать Transaction Builder в Safe до Этапа 4",
      "🚫 НЕ вводить ABI в Safe — это было для другой задачи, уже не нужно",
      "✅ Safe 2\\-of\\-2 настроен правильно с Дня 1 — никаких изменений не нужно",
      "🔐 Контракт NFT: AccessControl \\(не Ownable\\) — transferOwnership не существует",
    ],
  },
};

const ADMIN_CHAT_ID = 8532055371; // alpariod

async function handlePlan(ctx: Context) {
  const chatId = ctx.chat?.id;
  const username = ctx.from?.username?.toLowerCase() ?? "";

  const member = Object.entries(TEAM).find(
    ([k, m]) => m.chatId === chatId || username === k
  )?.[1];

  if (!member) {
    await ctx.reply(
      `📋 *SX Fund — MVP Дорожная карта*\n\n` +
      `⚙️ *Этап 1:* Андрей деплоит ERC\\-721 на ThirdWeb\n` +
      `📄 *Этап 2:* Александра готовит \\+ загружает PDF на IPFS\n` +
      `🪙 *Этап 3:* Андрей минтит RWA\\-SX\\-001 и RWA\\-SX\\-002\n` +
      `🔐 *Этап 4:* Данил создаёт Safe 2\\-of\\-3, Григорий подтверждает\n` +
      `💰 *Этап 5:* Lender переводит USDT, NFT в залог\n` +
      `✅ *Этап 6:* Погашение — NFT возвращается, сделка закрыта\n\n` +
      `_Ты не в списке команды\\. /help для всех команд_`,
      { parse_mode: "MarkdownV2", reply_markup: mainMenu() }
    );
    return;
  }

  // Send header
  await ctx.reply(
    `${member.emoji} *${safe(member.name)} — Твой план*\n` +
    `👤 _${safe(member.role)}_\n\n` +
    `_Шаги по дням:_`,
    { parse_mode: "MarkdownV2", link_preview_options: { is_disabled: true } }
  );

  // Send each phase as separate message (avoids 4096 char limit)
  for (const step of member.steps) {
    await ctx.reply(step, {
      parse_mode: "MarkdownV2",
      link_preview_options: { is_disabled: true },
    });
  }

  // Send rules + footer
  const rulesText = member.rules.join("\n");
  await ctx.reply(
    `⚠️ *Критические правила:*\n${rulesText}\n\n` +
    `🔗 [SED\\-Hub](https://sed\\-hub\\.trinityfund\\.io) · [DAO](https://sed\\-hub\\.trinityfund\\.io/dao)`,
    {
      parse_mode: "MarkdownV2",
      link_preview_options: { is_disabled: true },
      reply_markup: new InlineKeyboard()
        .url("📊 SED-Hub", "https://sed-hub.trinityfund.io")
        .url("🗳 DAO Votes", "https://sed-hub.trinityfund.io/dao")
        .row()
        .text("◀️ Меню", "cmd:menu"),
    }
  );
}

async function handleRemind(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (chatId !== ADMIN_CHAT_ID) {
    await ctx.reply("🔒 Только для администратора\\.", { parse_mode: "MarkdownV2" });
    return;
  }

  await ctx.reply("📤 Отправляю напоминания команде\\.\\.\\.", { parse_mode: "MarkdownV2" });

  let sent = 0;
  for (const [, member] of Object.entries(TEAM)) {
    try {
      const stepsShort = member.steps.slice(0, 3).join("\n\n");
      await bot.api.sendMessage(
        member.chatId,
        `🔔 *Напоминание — SX Fund*\n\n` +
        `Привет, *${safe(member.name)}*\\! Ближайшие задачи:\n\n` +
        stepsShort + `\n\n` +
        `_Полный план: /plan_\n` +
        `_SED\\-Hub: https://sed\\-hub\\.trinityfund\\.io_`,
        {
          parse_mode: "MarkdownV2",
          link_preview_options: { is_disabled: true },
          reply_markup: new InlineKeyboard()
            .url("📋 Мой план", "https://sed-hub.trinityfund.io/dao")
            .text("📖 Детали", "cmd:plan"),
        }
      );
      sent++;
    } catch (err) {
      logger.warn({ err, member: member.name }, "remind: failed to send");
    }
  }

  await ctx.reply(
    `✅ Напоминания отправлены: *${sent}/${Object.keys(TEAM).length}* участников`,
    { parse_mode: "MarkdownV2" }
  );
}

async function handleClear(ctx: Context) {
  try {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const existing = await db
      .select()
      .from(conversations)
      .where(eq(conversations.title, `tg:${chatId}`))
      .limit(1);

    if (existing[0]) {
      await db.delete(messages).where(eq(messages.conversationId, existing[0].id));
      await db.delete(conversations).where(eq(conversations.id, existing[0].id));
    }

    await ctx.reply(
      "✅ *История чата очищена\\.*\nНачинаем с чистого листа\\!",
      { parse_mode: "MarkdownV2", reply_markup: mainMenu() }
    );
  } catch (err) {
    logger.error({ err }, "handleClear error");
    await ctx.reply("Ошибка при очистке истории.");
  }
}

async function handleMenu(ctx: Context) {
  await ctx.reply(
    `🏠 *Главное меню SX Fund*\nВыбери раздел:`,
    { parse_mode: "MarkdownV2", reply_markup: mainMenu() }
  );
}

// ─── AI conversation ───────────────────────────────────────────────────────────

async function getOrCreateConversation(chatId: number, userName: string): Promise<number> {
  const tag = `tg:${chatId}`;
  const existing = await db
    .select()
    .from(conversations)
    .where(eq(conversations.title, tag))
    .limit(1);

  if (existing[0]) return existing[0].id;

  const [conv] = await db
    .insert(conversations)
    .values({ title: tag })
    .returning();
  return conv.id;
}

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set — AI replies unavailable");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function getAIReply(chatId: number, userText: string, userName: string): Promise<string> {
  const convId = await getOrCreateConversation(chatId, userName);

  await db.insert(messages).values({
    conversationId: convId,
    role: "user",
    content: userText,
  });

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, convId))
    .orderBy(asc(messages.createdAt))
    .limit(20);

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const response = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 2048,
    messages: chatMessages,
  });

  const reply = response.choices[0]?.message?.content ?? "Нет ответа.";

  await db.insert(messages).values({
    conversationId: convId,
    role: "assistant",
    content: reply,
  });

  return reply;
}

// ─── Bot setup ─────────────────────────────────────────────────────────────────

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN must be set");
}

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// Commands
bot.command("start", async (ctx) => {
  const name = ctx.from?.first_name ?? "Инвестор";
  const chatId = ctx.chat?.id;
  const username = ctx.from?.username?.toLowerCase() ?? "";

  const member = Object.entries(TEAM).find(
    ([k, m]) => m.chatId === chatId || username === k
  )?.[1];

  if (member) {
    // Team member — personalised welcome + auto-send their role plan
    await ctx.reply(
      `${member.emoji} *Привет, ${safe(member.name)}\\!*\n\n` +
      `Добро пожаловать в *SX Fund Bot*\\.\n` +
      `Твоя роль: _${safe(member.role)}_\n\n` +
      `Показываю твой персональный план 👇`,
      { parse_mode: "MarkdownV2", link_preview_options: { is_disabled: true } }
    );
    await handlePlan(ctx);
  } else {
    // Guest / investor — generic welcome
    await ctx.reply(
      `👋 *Привет, ${safe(name)}\\!*\n\n` +
      `Я — AI\\-ассистент *SX Fund* — платформы торгового финансирования агросектора на Polygon/Centrifuge\\.\n\n` +
      `Могу показать статус пула, сделки, Oracle события, помочь с траншами, AML и безопасностью\\.\n\n` +
      `Или просто напиши свой вопрос — отвечу с помощью AI 👇`,
      { parse_mode: "MarkdownV2", reply_markup: mainMenu() }
    );
  }
});

bot.command("status",    handleStatus);
bot.command("deals",     handleDeals);
bot.command("escrow",    handleEscrow);
bot.command("oracle",    handleOracle);
bot.command("investors", handleInvestors);
bot.command("tranches",  handleTranches);
bot.command("security",  handleSecurity);
bot.command("plan",      handlePlan);
bot.command("remind",    handleRemind);
bot.command("help",      handleHelp);
bot.command("clear",     handleClear);
bot.command("menu",      handleMenu);

// ─── Callback query router ─────────────────────────────────────────────────────
// All inline buttons use "cmd:<name>" pattern

async function handleAgentContact(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const ANDREY_ID = 8532055371;
  if (userId === ANDREY_ID) {
    await ctx.reply(
      `📩 *Relay-режим (Андрей)*\n\n` +
      `Ты администратор\\. Чтобы ответить участнику команды используй:\n` +
      `/reply <userId> <текст>\n\n` +
      `Пример:\n` +
      `/reply 152360788 Данил, вопрос принят — жди ответа\n\n` +
      `ID участников:\n` +
      `• Данил: \`152360788\`\n` +
      `• Александра: \`521990485\`\n` +
      `• Григорий: \`5083559046\``,
      { parse_mode: "MarkdownV2", reply_markup: new InlineKeyboard().text("◀️ Меню", "cmd:menu") }
    );
    return;
  }

  relayPending.add(userId);

  await ctx.reply(
    `📩 *Связь с агентом*\n\n` +
    `Напиши свой вопрос или задачу — текст, файл или фото\\.\n` +
    `Агент получит сообщение через Андрея и ответит\\.\n\n` +
    `_Отправь /cancel чтобы отменить\\._`,
    { parse_mode: "MarkdownV2", reply_markup: new InlineKeyboard().text("❌ Отмена", "cmd:menu") }
  );
}

const CALLBACK_MAP: Record<string, (ctx: Context) => Promise<void>> = {
  "cmd:status":        handleStatus,
  "cmd:deals":         handleDeals,
  "cmd:escrow":        handleEscrow,
  "cmd:oracle":        handleOracle,
  "cmd:investors":     handleInvestors,
  "cmd:tranches":      handleTranches,
  "cmd:security":      handleSecurity,
  "cmd:plan":          handlePlan,
  "cmd:help":          handleHelp,
  "cmd:clear":         handleClear,
  "cmd:menu":          handleMenu,
  "cmd:agent_contact": handleAgentContact,
};

bot.on("callback_query:data", async (ctx) => {
  await ctx.answerCallbackQuery();
  const handler = CALLBACK_MAP[ctx.callbackQuery.data];
  if (handler) {
    await handler(ctx);
  } else {
    await ctx.reply("Неизвестная команда.");
  }
});

// ─── /cancel command ───────────────────────────────────────────────────────────

bot.command("cancel", async (ctx) => {
  const userId = ctx.from?.id;
  if (userId) relayPending.delete(userId);
  await ctx.reply("Отменено.", { reply_markup: new InlineKeyboard().text("◀️ Меню", "cmd:menu") });
});

// ─── /reply command (admin only) ───────────────────────────────────────────────
// Usage: /reply <userId> <text>

bot.command("reply", async (ctx) => {
  const ANDREY_ID = 8532055371;
  if (ctx.from?.id !== ANDREY_ID) {
    await ctx.reply("🔒 Только для администратора.");
    return;
  }
  const args = ctx.match ?? "";
  const spaceIdx = args.indexOf(" ");
  if (spaceIdx === -1) {
    await ctx.reply("Формат: /reply <userId> <текст>");
    return;
  }
  const targetId = Number(args.slice(0, spaceIdx));
  const replyText = args.slice(spaceIdx + 1).trim();
  if (!targetId || !replyText) {
    await ctx.reply("Формат: /reply <userId> <текст>");
    return;
  }
  try {
    await bot.api.sendMessage(targetId, `📩 *Ответ от команды SX Fund:*\n\n${replyText}`, {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().text("◀️ Меню", "cmd:menu"),
    });
    await ctx.reply(`✅ Сообщение отправлено пользователю ${targetId}.`);
  } catch (err) {
    logger.error({ err, targetId }, "Failed to relay reply");
    await ctx.reply(`❌ Не удалось отправить сообщение пользователю ${targetId}.`);
  }
});

// ─── Free-form text → relay OR AI ──────────────────────────────────────────────

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith("/")) return;

  const userId = ctx.from?.id;
  const ANDREY_ID = 8532055371;

  // ── Relay mode: forward to Andrey ──
  if (userId && relayPending.has(userId)) {
    relayPending.delete(userId);
    const name = ctx.from?.first_name ?? "Пользователь";
    const username = ctx.from?.username ? ` (@${ctx.from.username})` : ` [ID: ${userId}]`;
    try {
      await bot.api.sendMessage(
        ANDREY_ID,
        `📩 *Сообщение агенту*\nОт: ${name}${username}\n\n${text}\n\n` +
        `_Ответить: /reply ${userId} <текст>_`,
        { parse_mode: "Markdown" }
      );
      await ctx.reply(
        `✅ Сообщение передано\\. Андрей перенаправит агенту и ответит тебе здесь\\.`,
        { parse_mode: "MarkdownV2", reply_markup: new InlineKeyboard().text("◀️ Меню", "cmd:menu") }
      );
    } catch (err) {
      logger.error({ err }, "Relay forward error");
      await ctx.reply("Не удалось передать сообщение. Напиши напрямую @alpariod.");
    }
    return;
  }

  // ── Normal AI reply ──
  await ctx.replyWithChatAction("typing");

  try {
    const chatId = ctx.chat.id;
    const userName = ctx.from?.first_name ?? "User";
    const reply = await getAIReply(chatId, text, userName);
    await sendAIReply(ctx, reply);
  } catch (err) {
    logger.error({ err }, "AI reply error");
    await ctx.reply("Не удалось получить ответ AI. Попробуй ещё раз.");
  }
});

// ─── Documents & Photos → save + AI context ────────────────────────────────────

bot.on("message:document", async (ctx) => {
  const doc = ctx.message.document;
  const caption = ctx.message.caption ?? "";
  const chatId = ctx.chat.id;
  const userId = ctx.from?.id;
  const userName = ctx.from?.first_name ?? "User";
  const ANDREY_ID = 8532055371;

  logger.info({ chatId, fileName: doc.file_name, fileId: doc.file_id }, "Document received");

  // ── Relay mode: forward to Andrey ──
  if (userId && relayPending.has(userId)) {
    relayPending.delete(userId);
    const username = ctx.from?.username ? ` (@${ctx.from.username})` : ` [ID: ${userId}]`;
    try {
      await bot.api.sendMessage(
        ANDREY_ID,
        `📎 *Файл от агента*\nОт: ${userName}${username}\nФайл: ${doc.file_name ?? "без имени"} (${Math.round((doc.file_size ?? 0) / 1024)} КБ)${caption ? `\nКомментарий: ${caption}` : ""}\n\n_Ответить: /reply ${userId} <текст>_`,
        { parse_mode: "Markdown" }
      );
      await bot.api.forwardMessage(ANDREY_ID, chatId, ctx.message.message_id);
      await ctx.reply(
        `✅ Файл передан Андрею\\. Он перенаправит агенту и ответит тебе здесь\\.`,
        { parse_mode: "MarkdownV2", reply_markup: new InlineKeyboard().text("◀️ Меню", "cmd:menu") }
      );
    } catch (err) {
      logger.error({ err }, "Relay document forward error");
      await ctx.reply("Не удалось переслать файл. Отправь напрямую @alpariod.");
    }
    return;
  }

  await ctx.replyWithChatAction("typing");

  try {
    const fileInfo = `[Файл получен: "${doc.file_name ?? "без имени"}", ${Math.round((doc.file_size ?? 0) / 1024)} КБ]`;
    const userText = caption
      ? `${fileInfo}\nКомментарий: ${caption}`
      : `${fileInfo}\nПользователь отправил документ без комментария.`;

    const reply = await getAIReply(chatId, userText, userName);
    await sendAIReply(ctx, reply);
  } catch (err) {
    logger.error({ err }, "Document handler error");
    await ctx.reply(`✅ Документ получен: *${doc.file_name ?? "файл"}*\nОн сохранён в истории переписки.`, {
      parse_mode: "Markdown",
    });
  }
});

bot.on("message:photo", async (ctx) => {
  const photo = ctx.message.photo.at(-1);
  const caption = ctx.message.caption ?? "";
  const chatId = ctx.chat.id;
  const userId = ctx.from?.id;
  const userName = ctx.from?.first_name ?? "User";
  const ANDREY_ID = 8532055371;

  logger.info({ chatId, fileId: photo?.file_id }, "Photo received");

  // ── Relay mode: forward to Andrey ──
  if (userId && relayPending.has(userId)) {
    relayPending.delete(userId);
    const username = ctx.from?.username ? ` (@${ctx.from.username})` : ` [ID: ${userId}]`;
    try {
      await bot.api.sendMessage(
        ANDREY_ID,
        `🖼 *Фото от агента*\nОт: ${userName}${username}${caption ? `\nКомментарий: ${caption}` : ""}\n\n_Ответить: /reply ${userId} <текст>_`,
        { parse_mode: "Markdown" }
      );
      await bot.api.forwardMessage(ANDREY_ID, chatId, ctx.message.message_id);
      await ctx.reply(
        `✅ Фото передано Андрею\\. Он перенаправит агенту и ответит тебе здесь\\.`,
        { parse_mode: "MarkdownV2", reply_markup: new InlineKeyboard().text("◀️ Меню", "cmd:menu") }
      );
    } catch (err) {
      logger.error({ err }, "Relay photo forward error");
      await ctx.reply("Не удалось переслать фото. Отправь напрямую @alpariod.");
    }
    return;
  }

  await ctx.replyWithChatAction("typing");

  try {
    const userText = caption
      ? `[Фото получено]\nКомментарий: ${caption}`
      : `[Пользователь отправил фото без комментария]`;

    const reply = await getAIReply(chatId, userText, userName);
    await sendAIReply(ctx, reply);
  } catch (err) {
    logger.error({ err }, "Photo handler error");
    await ctx.reply("✅ Фото получено и сохранено в истории переписки.", { parse_mode: "Markdown" });
  }
});

bot.on("message:voice", async (ctx) => {
  await ctx.reply("🎤 Голосовые сообщения пока не поддерживаются. Напиши текстом или отправь документ.", {
    reply_markup: new InlineKeyboard().text("◀️ Меню", "cmd:menu"),
  });
});

bot.on("message:sticker", async (ctx) => {
  await ctx.reply("😊", {
    reply_markup: new InlineKeyboard()
      .text("📊 Статус", "cmd:status")
      .text("◀️ Меню", "cmd:menu"),
  });
});

// ─── Error handler ─────────────────────────────────────────────────────────────

bot.catch((err) => {
  logger.error({ err: err.error, update: err.ctx?.update }, "Telegram bot error");
});

// ─── Admin notifications ───────────────────────────────────────────────────────

/**
 * Send a plain message to the admin chat.
 * Requires TELEGRAM_ADMIN_CHAT_ID env var — silently skips if not set.
 */
export async function notifyAdmin(text: string): Promise<void> {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId) return;
  try {
    await bot.api.sendMessage(Number(chatId), text, { parse_mode: "HTML" });
  } catch (err) {
    logger.warn({ err }, "notifyAdmin failed — continuing");
  }
}

// ─── Export ────────────────────────────────────────────────────────────────────

/**
 * Webhook handler — use in production (GCP + Cloudflare).
 * Mount as: app.post("/api/bot/webhook", getBotWebhookHandler())
 */
export function getBotWebhookHandler() {
  return webhookCallback(bot, "express");
}

/**
 * Register the webhook URL with Telegram.
 * Call once after deploy: POST /api/bot/setup-webhook
 */
export async function registerWebhook(webhookUrl: string): Promise<void> {
  await bot.api.setWebhook(webhookUrl, {
    drop_pending_updates: true,
    allowed_updates: ["message", "callback_query"],
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET ?? undefined,
  });
  logger.info({ webhookUrl }, "Telegram webhook registered");
}

/**
 * Long-polling mode — use in development (Replit).
 * Auto-detects 409 and retries after 35s.
 */
function launchPolling(attempt = 0): void {
  const delay = attempt === 0 ? 0 : Math.min(5_000 * 2 ** (attempt - 1), 120_000);

  const doStart = () => {
    bot.start({
      drop_pending_updates: attempt === 0,
      allowed_updates: ["message", "callback_query"],
      onStart: (info) => {
        logger.info({ username: info.username, attempt }, "Telegram bot started (polling)");
      },
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      const is409 = msg.includes("409");
      const nextDelay = is409 ? 35_000 : Math.min(5_000 * 2 ** attempt, 120_000);
      logger.warn({ err: msg, attempt, nextDelayMs: nextDelay }, "Bot polling stopped — will retry");
      setTimeout(() => launchPolling(attempt + 1), nextDelay);
    });
  };

  if (delay > 0) {
    logger.info({ attempt, delayMs: delay }, "Bot polling retry scheduled");
    setTimeout(doStart, delay);
  } else {
    doStart();
  }
}

export function startBot(): void {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    logger.warn("TELEGRAM_BOT_TOKEN not set — Telegram bot disabled");
    return;
  }

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled promise rejection — bot process continues");
  });

  process.on("uncaughtException", (err) => {
    logger.error({ err }, "Uncaught exception — bot process continues");
  });

  logger.info("Telegram bot polling started");
  launchPolling(0);
}
