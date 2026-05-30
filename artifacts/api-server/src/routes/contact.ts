import { Router } from "express";
import { db, contactsTable } from "@workspace/db";
import { insertContactSchema } from "@workspace/db";
import { notifyAdmin } from "../bot/index";

const router = Router();

router.post("/contact", async (req, res) => {
  const parsed = insertContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contact] = await db
    .insert(contactsTable)
    .values(parsed.data)
    .returning();

  void notifyAdmin(
    `✉️ <b>Новое сообщение с сайта</b>\n\n` +
    `👤 <b>${contact.name}</b>\n` +
    `📧 ${contact.email}\n` +
    `📌 <b>${contact.subject}</b>\n\n` +
    `💬 ${contact.message}\n\n` +
    `🔗 <a href="https://sed-hub.trinityfund.io">Открыть SED-Hub</a>`
  );

  res.status(201).json({
    ...contact,
    createdAt: contact.createdAt.toISOString(),
  });
});

router.get("/contacts", async (_req, res) => {
  const contacts = await db
    .select()
    .from(contactsTable)
    .orderBy(contactsTable.createdAt);
  res.json(contacts.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })));
});

export default router;
