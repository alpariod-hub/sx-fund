import { Router } from "express";
import { createHash } from "crypto";

const router = Router();

function sessionToken(secret: string): string {
  return createHash("sha256").update(`sx-fund:${secret}`).digest("hex");
}

router.post("/auth/login", (req, res) => {
  const { password } = req.body as { password?: string };
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    res.status(503).json({ error: "Auth not configured" });
    return;
  }
  if (!password || password !== secret) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  res.json({ token: sessionToken(secret) });
});

router.get("/auth/verify", (req, res) => {
  const token = req.headers["x-admin-token"] as string | undefined;
  const secret = process.env.ADMIN_SECRET;

  if (!secret || !token || token !== sessionToken(secret)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json({ ok: true });
});

export default router;
