import { Queue, Worker, Job, QueueOptions, WorkerOptions, Processor } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('⚠️ REDIS_URL not found in environment variables. Background jobs will not work.');
}

export const connection = new IORedis(redisUrl || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Essential for BullMQ
  tls: redisUrl?.startsWith('rediss://') ? {} : undefined,
});

export const defaultQueueOptions: QueueOptions = {
  connection,
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
  return new Queue(name, {
    ...defaultQueueOptions,
    ...options,
  });
}

export function createWorker(name: string, processor: Processor, options?: WorkerOptions) {
  return new Worker(name, processor, {
    connection,
    ...options,
  });
}
