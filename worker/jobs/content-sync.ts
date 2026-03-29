import type { Job } from "bullmq";
import { Queue } from "bullmq";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { walkDir } from "../../src/lib/content/utils";

const prisma = new PrismaClient();

interface ContentSyncData {
  fullSync: boolean;
}

const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:6379");
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || "6379", 10),
};

async function getFileHash(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, "utf-8");
  return crypto.createHash("sha256").update(content).digest("hex");
}

export async function processContentSync(job: Job<ContentSyncData>) {
  const contentDir = process.env.CONTENT_DIR || path.join(process.cwd(), "content");
  console.log(`Content sync: scanning ${contentDir}`);

  const files = await walkDir(contentDir);
  let changed = 0;

  for (const filePath of files) {
    const relative = path.relative(contentDir, filePath);
    const hash = await getFileHash(filePath);

    const existing = await prisma.contentRevision.findFirst({
      where: { filePath: relative },
      orderBy: { createdAt: "desc" },
    });

    if (!existing || existing.gitSha !== hash) {
      await prisma.contentRevision.create({
        data: {
          filePath: relative,
          gitSha: hash,
          author: "system",
          message: existing ? "Content updated" : "Initial sync",
        },
      });
      changed++;
    }
  }

  console.log(`Content sync complete: ${files.length} files, ${changed} changed`);

  // Invalidate the app's content cache so it picks up changes
  const appUrl = process.env.NEXTAUTH_URL || "http://app:3000";
  const webhookSecret = process.env.WEBHOOK_SECRET || "";
  try {
    await fetch(`${appUrl}/api/cache/invalidate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${webhookSecret}` },
    });
    console.log("App cache invalidated.");
  } catch (err) {
    console.warn("Failed to invalidate app cache:", err);
  }

  // Chain reindex if any files changed
  if (changed > 0) {
    console.log("Changes detected — enqueuing reindex...");
    const reindexQueue = new Queue("reindex", { connection });
    await reindexQueue.add("reindex", { slugs: undefined });
    await reindexQueue.close();
  }

  job.updateProgress(100);
  return { total: files.length, changed };
}
