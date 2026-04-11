import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { registerAmcSubmissionBridge } from "./amcSubmissionBridge";
import { resolveEmailHandoffPathFromSubmissionId, sendPreparedEmail } from "./emailSender";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "2mb" }));
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.AMC_CORS_ORIGIN || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");
  const repoRoot = path.resolve(__dirname, "..", "..");

  registerAmcSubmissionBridge(app, __dirname);

  app.post("/api/send-email", async (req, res) => {
    try {
      const body = (req.body || {}) as { submissionId?: string; emailHandoffPath?: string };
      const submissionId = String(body.submissionId || "").trim();
      const customPath = String(body.emailHandoffPath || "").trim();

      if (!submissionId && !customPath) {
        res.status(400).json({
          ok: false,
          error: "submissionId or emailHandoffPath is required.",
        });
        return;
      }

      const emailHandoffPath = customPath
        ? path.resolve(repoRoot, customPath)
        : resolveEmailHandoffPathFromSubmissionId(repoRoot, submissionId);
      const sent = await sendPreparedEmail({
        repoRoot,
        emailHandoffPath,
      });

      if (sent.result.status !== "sent") {
        res.status(500).json({
          ok: false,
          status: sent.result.status,
          submissionId: sent.result.submissionId,
          error: sent.result.error || "Email sending failed.",
          resultPath: path.relative(repoRoot, sent.resultPath),
        });
        return;
      }

      res.status(200).json({
        ok: true,
        status: sent.result.status,
        submissionId: sent.result.submissionId,
        messageId: sent.result.messageId,
        to: sent.result.to,
        language: sent.result.language,
        tier: sent.result.tier,
        resultPath: path.relative(repoRoot, sent.resultPath),
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
