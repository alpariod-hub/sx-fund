import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import OpenAI from "openai";

const router = Router();

let _openai: OpenAI | undefined;
function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY must be set");
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const SYSTEM_PROMPT = `You are SX Fund AI Assistant — an expert in RWA (Real World Assets) agricultural trade finance on Polygon/Centrifuge.

You help users of the SX Fund SED-Hub platform with:

**Pool Management:**
- Understanding the 3 tranches: DROP (70% allocation, 6-8% yield, senior), MEZZ (10% allocation, 10-12% yield), TIN (20% allocation, 15-18% yield, junior)
- Explaining pool metrics, TVL, NAV calculations
- Guiding through deal creation and asset origination workflow

**Deals & Assets:**
- FG Geniivske trade contracts (Oct 2025–May 2026) — 10 real contracts on IPFS
- NFT metadata on Polygon blockchain, Centrifuge integration
- Oracle event submission (contract_signed, prepayment_confirmed, goods_shipped, goods_received, payment_received, maturity)

**Investors:**
- Onboarding process: KYC/AML via AMLBot, investor types (institutional, crypto, family_office, individual)
- Tranche selection guidance based on risk/return profile
- Distribution schedules, yield calculations

**Security & Compliance:**
- Gnosis Safe 2-of-3 multisig setup
- AML payment flow: unique temporary wallets → AMLBot check → Safe multisig
- ChainGPT for smart contract auditing
- Key management best practices

**Technical:**
- Polygon network, IPFS/Pinata document storage
- Centrifuge protocol integration
- Drizzle ORM, Express API, React/Vite frontend

Always respond in the same language the user writes in (Ukrainian, Russian, or English).
Be concise, professional, and actionable. When describing processes, use numbered steps.
For on-chain actions, always remind about security best practices.`;

router.get("/openai/conversations", async (req, res) => {
  const convs = await db
    .select()
    .from(conversations)
    .orderBy(asc(conversations.createdAt));
  res.json(convs);
});

router.post("/openai/conversations", async (req, res) => {
  const { title } = req.body as { title: string };
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const [conv] = await db.insert(conversations).values({ title }).returning();
  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));
  res.json({ ...conv, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).end();
});

router.get("/openai/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { content } = req.body as { content: string };

  if (!content) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await db.insert(messages).values({
    conversationId: id,
    role: "user",
    content,
  });

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stream: any;
  try {
    stream = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 2048,
      messages: chatMessages,
      stream: true,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    if (e.status === 429) {
      res.status(429).json({ error: "OpenAI quota exceeded. Please add billing at platform.openai.com" });
    } else if (e.status === 401) {
      res.status(401).json({ error: "Invalid OpenAI API key" });
    } else {
      res.status(500).json({ error: e.message ?? "OpenAI error" });
    }
    return;
  }

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      fullResponse += delta;
      res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
    }
  }

  await db.insert(messages).values({
    conversationId: id,
    role: "assistant",
    content: fullResponse,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
