import { Router } from "express";
import { createHash, randomInt } from "crypto";
import { db, adminOtpTable, adminAccessLogTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { notifyAdmin } from "../bot/index";
import { Bot } from "grammy";

const router = Router();

// ── Approved admins ──────────────────────────────────────────────────────────
// Format: APPROVED_ADMINS=alpariod,Grygorii_Damekin,sasha_damekina,danil_tg
function approvedAdmins(): string[] {
  const raw = process.env.APPROVED_ADMINS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isApproved(username: string): boolean {
  return approvedAdmins().includes(username.toLowerCase().replace(/^@/, ""));
}

// ── Session token ────────────────────────────────────────────────────────────
function sessionToken(username: string, secret: string): string {
  return createHash("sha256")
    .update(`sx-fund:${username}:${secret}`)
    .digest("hex");
}

// ── Log helper ───────────────────────────────────────────────────────────────
async function log(
  telegramUsername: string,
  action: string,
  req: { ip?: string; headers: Record<string, string | string[] | undefined> }
) {
  await db.insert(adminAccessLogTable).values({
    telegramUsername,
    action,
    ip: req.ip ?? null,
    userAgent: (req.headers["user-agent"] as string) ?? null,
  });
}

// ── POST /auth/request-otp ───────────────────────────────────────────────────
router.post("/auth/request-otp", async (req, res) => {
  const { username } = req.body as { username?: string };

  if (!username) {
    res.status(400).json({ error: "username required" });
    return;
  }

  const clean = username.trim().replace(/^@/, "");

  if (!isApproved(clean)) {
    // Don't reveal who is approved — generic message
    res.status(403).json({ error: "Access denied" });
    return;
  }

  // Generate 6-digit OTP
  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  // Invalidate any previous unused OTPs for this user
  await db
    .update(adminOtpTable)
    .set({ used: true })
    .where(
      and(
        eq(adminOtpTable.telegramUsername, clean),
        eq(adminOtpTable.used, false)
      )
    );

  await db.insert(adminOtpTable).values({
    telegramUsername: clean,
    code,
    expiresAt,
  });

  // Send OTP via bot using TELEGRAM_ADMIN_CHAT_ID mapping
  // Since we only have one bot, we send to admin chat and note the username
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  let sent = false;

  // Try to send to per-user chat if configured
  const userChatIdEnv = `TELEGRAM_CHAT_${clean.toUpperCase()}`;
  const userChatId = process.env[userChatIdEnv];

  if (botToken && userChatId) {
    try {
      const bot = new Bot(botToken);
      await bot.api.sendMessage(
        Number(userChatId),
        `🔐 <b>SX Fund — Код входа</b>\n\n` +
          `Код: <code>${code}</code>\n\n` +
          `⏱ Действует 5 минут\n` +
          `❌ Если вы не запрашивали код — игнорируйте это сообщение`,
        { parse_mode: "HTML" }
      );
      sent = true;
    } catch {
      // fall through to admin notification
    }
  }

  // Fallback: notify admin channel with username
  if (!sent && adminChatId && botToken) {
    try {
      const bot = new Bot(botToken);
      await bot.api.sendMessage(
        Number(adminChatId),
        `🔐 <b>OTP для @${clean}</b>\n\n` +
          `Код: <code>${code}</code>\n\n` +
          `⏱ Действует 5 минут`,
        { parse_mode: "HTML" }
      );
      sent = true;
    } catch {
      // ignore
    }
  }

  await log(clean, "otp_requested", req as Parameters<typeof log>[2]);

  res.json({
    ok: true,
    hint: sent
      ? "Code sent to Telegram"
      : "Code generated (Telegram not configured)",
    // In dev mode expose the code; in production NEVER expose it
    ...(process.env.NODE_ENV !== "production" ? { _devCode: code } : {}),
  });
});

// ── POST /auth/verify-otp ────────────────────────────────────────────────────
router.post("/auth/verify-otp", async (req, res) => {
  const { username, code } = req.body as {
    username?: string;
    code?: string;
  };

  if (!username || !code) {
    res.status(400).json({ error: "username and code required" });
    return;
  }

  const clean = username.trim().replace(/^@/, "");

  const [otp] = await db
    .select()
    .from(adminOtpTable)
    .where(
      and(
        eq(adminOtpTable.telegramUsername, clean),
        eq(adminOtpTable.code, code.trim()),
        eq(adminOtpTable.used, false),
        gt(adminOtpTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!otp) {
    await log(clean, "otp_failed", req as Parameters<typeof log>[2]);
    res.status(401).json({ error: "Invalid or expired code" });
    return;
  }

  // Mark as used
  await db
    .update(adminOtpTable)
    .set({ used: true })
    .where(eq(adminOtpTable.id, otp.id));

  const secret = process.env.ADMIN_SECRET ?? "fallback";
  const token = sessionToken(clean, secret);

  await log(clean, "login_success", req as Parameters<typeof log>[2]);

  // Notify admin about login
  void notifyAdmin(
    `🔑 <b>Вход в систему</b>\n\n` +
      `👤 @${clean}\n` +
      `📍 IP: ${req.ip ?? "unknown"}\n` +
      `🕐 ${new Date().toUTCString()}`
  );

  res.json({ token, username: clean });
});

// ── GET /auth/verify ─────────────────────────────────────────────────────────
router.get("/auth/verify", (req, res) => {
  const token = req.headers["x-admin-token"] as string | undefined;
  const username = req.headers["x-admin-user"] as string | undefined;
  const secret = process.env.ADMIN_SECRET ?? "fallback";

  if (!token || !username) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const expected = sessionToken(username, secret);
  if (token !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json({ ok: true, username });
});

// ── GET /auth/log ────────────────────────────────────────────────────────────
router.get("/auth/log", async (req, res) => {
  const token = req.headers["x-admin-token"] as string | undefined;
  const username = req.headers["x-admin-user"] as string | undefined;
  const secret = process.env.ADMIN_SECRET ?? "fallback";

  if (!token || !username || token !== sessionToken(username, secret)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const logs = await db
    .select()
    .from(adminAccessLogTable)
    .orderBy(adminAccessLogTable.createdAt);

  res.json(
    logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))
  );
});

// ── GET /auth/admins ─────────────────────────────────────────────────────────
// Returns only the list of approved usernames (not secrets)
router.get("/auth/admins", (req, res) => {
  const token = req.headers["x-admin-token"] as string | undefined;
  const username = req.headers["x-admin-user"] as string | undefined;
  const secret = process.env.ADMIN_SECRET ?? "fallback";

  if (!token || !username || token !== sessionToken(username, secret)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json({ admins: approvedAdmins() });
});

export default router;
