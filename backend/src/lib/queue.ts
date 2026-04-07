import { Queue, Worker, Job, QueueOptions, WorkerOptions, Processor } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

// Only connect to Redis if URL is provided — no fallback to localhost
let connection: IORedis | null = null;

if (redisUrl) {
  try {
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null, // Essential for BullMQ
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      lazyConnect: true,
    });
    console.log('✅ Redis connection configured for BullMQ jobs');
  } catch (err) {
    console.warn('⚠️ Failed to create Redis connection:', err);
    connection = null;
  }
} else {
  console.warn('⚠️ REDIS_URL not set — background jobs (BullMQ) are DISABLED. App runs fine without them.');
}

export { connection };

export const defaultQueueOptions: QueueOptions = {
  connection: connection as IORedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: {
      age: 24 * 3600, // keep fail for 24 hours
    },
  },
};

export function createQueue(name: string, options?: QueueOptions) {
  if (!connection) {
    console.warn(`⚠️ Skipping queue "${name}" — no Redis connection`);
    return null;
  }
  return new Queue(name, {
    ...defaultQueueOptions,
    ...options,
  });
}

export function createWorker(name: string, processor: Processor, options?: WorkerOptions) {
  if (!connection) {
    console.warn(`⚠️ Skipping worker "${name}" — no Redis connection`);
    return null;
  }
  return new Worker(name, processor, {
    connection,
    ...options,
  });
}

export function isQueueAvailable(): boolean {
  return connection !== null;
}
