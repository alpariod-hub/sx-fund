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

const SYSTEM_PROMPT = `You are SX Fund AI Assistant — an expert in RWA (Real World Assets) agricultural trade finance on Polygon/Centrifuge.

You help users of the SX Fund SED-Hub platform with:

**Pool Management:**
- 3 tranches: DROP (70%, 6-8% APR, senior), MEZZ (10%, 10-12% APR), TIN (20%, 15-18% APR, junior)
- Pool TVL: $262,500 USDC | Underlying: €350,000 EUR | LTV: 75%
- Network: Polygon | Protocol: Centrifuge | Issuer: Cereal Crops Trading LLP

**Deals & Assets:**
- 10 FG Geniivske trade contracts (Oct 2025–May 2026) on IPFS
- NFT-backed assets on Polygon, Centrifuge integration
- Oracle events: contract_signed → prepayment_confirmed → goods_shipped → goods_received → payment_received → maturity

**Investors:**
- KYC/AML via AMLBot, types: institutional, crypto, family_office, individual
- DROP = conservative (6-8%), MEZZ = balanced (10-12%), TIN = aggressive (15-18%)

**Security:**
- Gnosis Safe 2-of-3 multisig (Андрей Ledger + Григорий MetaMask + TBD)
- AML flow: unique temp wallet → AMLBot check → sweep to Safe
- ChainGPT for smart contract auditing

Respond in the same language as the user (Ukrainian, Russian, or English).
Be concise and professional. Format with Telegram Markdown.`;

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
    .text("🔒 Безопасность",   "cmd:security")
    .text("❓ Помощь",         "cmd:help")
    .row()
    .url("🌐 SED-Hub Dashboard",  getDashboardUrl())
    .url("📋 Team Workspace",     getWorkspaceUrl())
    .row()
    .url("📓 Notion Dashboard",   NOTION_URL)
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
      `💰 *TVL:* $${totalTvl.toLocaleString("en")} USDC\n` +
      `🌐 *Сеть:* Polygon\n` +
      `📈 *Ср\\. доходность:* ${avgYield.toFixed(1)}% APR\n\n` +
      `📁 *Сделки:*\n` +
      `  🟢 Активных: ${active.length}\n` +
      `  🟡 Ожидают: ${pending.length}\n` +
      `  ✅ Погашено: ${matured.length}\n` +
      `  📦 Всего: ${assets.length}\n\n` +
      `*Транши:*\n` +
      `🟢 DROP  — 70% | 6–8% APR | Senior\n` +
      `🟡 MEZZ — 10% | 10–12% APR | Mezz\n` +
      `🔴 TIN    — 20% | 15–18% APR | Junior`,
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
    `_Blended yield: 9–12% APR | LTV: 75%_`,
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
    `/clear — очистить историю чата с AI\n` +
    `/help — эта справка\n\n` +
    `_Или просто напиши любой вопрос — AI ответит\\._`,
    { parse_mode: "MarkdownV2", reply_markup: mainMenu() }
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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

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

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_completion_tokens: 1024,
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
  await ctx.reply(
    `👋 *Привет, ${safe(name)}\\!*\n\n` +
    `Я — AI\\-ассистент *SX Fund* — платформы торгового финансирования агросектора на Polygon/Centrifuge\\.\n\n` +
    `Могу показать статус пула, сделки, Oracle события, помочь с траншами, AML и безопасностью\\.\n\n` +
    `Или просто напиши свой вопрос — отвечу с помощью AI 👇`,
    { parse_mode: "MarkdownV2", reply_markup: mainMenu() }
  );
});

bot.command("status",    handleStatus);
bot.command("deals",     handleDeals);
bot.command("escrow",    handleEscrow);
bot.command("oracle",    handleOracle);
bot.command("investors", handleInvestors);
bot.command("tranches",  handleTranches);
bot.command("security",  handleSecurity);
bot.command("help",      handleHelp);
bot.command("clear",     handleClear);
bot.command("menu",      handleMenu);

// ─── Callback query router ─────────────────────────────────────────────────────
// All inline buttons use "cmd:<name>" pattern

const CALLBACK_MAP: Record<string, (ctx: Context) => Promise<void>> = {
  "cmd:status":    handleStatus,
  "cmd:deals":     handleDeals,
  "cmd:escrow":    handleEscrow,
  "cmd:oracle":    handleOracle,
  "cmd:investors": handleInvestors,
  "cmd:tranches":  handleTranches,
  "cmd:security":  handleSecurity,
  "cmd:help":      handleHelp,
  "cmd:clear":     handleClear,
  "cmd:menu":      handleMenu,
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

// ─── Free-form text → AI ───────────────────────────────────────────────────────

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith("/")) return;

  await ctx.replyWithChatAction("typing");

  try {
    const chatId = ctx.chat.id;
    const userName = ctx.from?.first_name ?? "User";
    const reply = await getAIReply(chatId, text, userName);
    const formatted = fmtAI(reply);

    await ctx.reply(formatted, {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .text("📊 Статус", "cmd:status")
        .text("📋 Сделки", "cmd:deals")
        .row()
        .text("◀️ Меню", "cmd:menu"),
    });
  } catch (err) {
    logger.error({ err }, "AI reply error");
    await ctx.reply("Не удалось получить ответ AI. Попробуй ещё раз.");
  }
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
export function startBot(): void {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    logger.warn("TELEGRAM_BOT_TOKEN not set — Telegram bot disabled");
    return;
  }

  bot.start({
    drop_pending_updates: true,
    allowed_updates: ["message", "callback_query"],
    onStart: (info) => {
      logger.info({ username: info.username }, "Telegram bot started (polling)");
    },
  }).catch((err: unknown) => {
    const is409 = err instanceof Error && err.message.includes("409");
    if (is409) {
      logger.warn("Bot 409 conflict — retrying in 35s");
      setTimeout(() => {
        bot.start({
          drop_pending_updates: true,
          allowed_updates: ["message", "callback_query"],
          onStart: (info) => logger.info({ username: info.username }, "Telegram bot started (retry)"),
        }).catch((e: unknown) => logger.error({ err: e }, "Bot failed to start after retry"));
      }, 35_000);
    } else {
      logger.error({ err }, "Telegram bot start error");
    }
  });

  logger.info("Telegram bot polling started");
}
