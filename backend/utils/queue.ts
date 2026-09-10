import { Queue } from 'bullmq';

const redisHost = process.env.REDIS_HOST ?? (process.env.NODE_ENV === "production" ? "redis" : "localhost");
const redisPort = parseInt(process.env.REDIS_PORT ?? "6379", 10);

export const deployQueue = new Queue('deploy-queue', {
  connection: {
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null,
  },
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5000
    }
  }
});

deployQueue.on("error", (err) => console.error("[queue] redis error:", err.message));
deployQueue.waitUntilReady().then(() => console.log(`[queue] ready — redis ${redisHost}:${redisPort}`)).catch((e) => console.error("[queue] waitUntilReady failed:", e.message));

