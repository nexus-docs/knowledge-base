import { Queue } from "bullmq";

function getConnection() {
  const url = new URL(process.env.REDIS_URL || "redis://localhost:6379");
  return {
    host: url.hostname,
    port: parseInt(url.port || "6379", 10),
  };
}

let _contentSyncQueue: Queue | null = null;
let _reindexQueue: Queue | null = null;
let _emailQueue: Queue | null = null;
let _webhookQueue: Queue | null = null;

export function getContentSyncQueue(): Queue {
  if (!_contentSyncQueue) {
    _contentSyncQueue = new Queue("content-sync", {
      connection: getConnection(),
      defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
    });
  }
  return _contentSyncQueue;
}

export function getReindexQueue(): Queue {
  if (!_reindexQueue) {
    _reindexQueue = new Queue("reindex", {
      connection: getConnection(),
      defaultJobOptions: { attempts: 2, backoff: { type: "exponential", delay: 3000 } },
    });
  }
  return _reindexQueue;
}

export function getEmailQueue(): Queue {
  if (!_emailQueue) {
    _emailQueue = new Queue("email", {
      connection: getConnection(),
      defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 10000 } },
    });
  }
  return _emailQueue;
}

export function getWebhookQueue(): Queue {
  if (!_webhookQueue) {
    _webhookQueue = new Queue("webhook", {
      connection: getConnection(),
      defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
    });
  }
  return _webhookQueue;
}
