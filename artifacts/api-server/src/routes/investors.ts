import { Router } from "express";
import { db, investorInquiriesTable } from "@workspace/db";
import { SubmitInvestorInquiryBody } from "@workspace/api-zod";
import { notifyAdmin } from "../bot/index";

const router = Router();

router.post("/investors/inquire", async (req, res) => {
  const parsed = SubmitInvestorInquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [inquiry] = await db
    .insert(investorInquiriesTable)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company ?? null,
      investorType: parsed.data.investorType,
      interestedTranche: parsed.data.interestedTranche,
      message: parsed.data.message ?? null,
    })
    .returning();

  const trancheEmoji: Record<string, string> = { DROP: "🟢", MEZZ: "🟡", TIN: "🔴", both: "⚪" };
  const typeLabel: Record<string, string> = { institutional: "Институциональный", family_office: "Family Office", crypto: "Крипто-фонд", individual: "Частный" };
  void notifyAdmin(
    `📩 <b>Новая заявка инвестора</b>\n\n` +
    `👤 <b>${inquiry.name}</b>${inquiry.company ? ` — ${inquiry.company}` : ""}\n` +
    `📧 ${inquiry.email}\n` +
    `🏦 ${typeLabel[inquiry.investorType] ?? inquiry.investorType}\n` +
    `${trancheEmoji[inquiry.interestedTranche] ?? "⚪"} Транш: <b>${inquiry.interestedTranche}</b>` +
    (inquiry.message ? `\n💬 ${inquiry.message}` : "") +
    `\n\n🔗 <a href="https://sed-hub.trinityfund.io">Открыть SED-Hub → Investors</a>`
  );

  res.status(201).json({
    ...inquiry,
    company: inquiry.company ?? null,
    message: inquiry.message ?? null,
    createdAt: inquiry.createdAt.toISOString(),
  });
});

router.get("/investors/inquiries", async (_req, res) => {
  const inquiries = await db
    .select()
    .from(investorInquiriesTable)
    .orderBy(investorInquiriesTable.createdAt);

  res.json(
    inquiries.map((i) => ({
      ...i,
      company: i.company ?? null,
      message: i.message ?? null,
      createdAt: i.createdAt.toISOString(),
    }))
  );
});

export default router;
