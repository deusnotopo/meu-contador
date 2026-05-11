import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from './logger.js';

const SLOW_QUERY_THRESHOLD = 1000; // 1 second
const DATABASE_URL = process.env.DATABASE_URL ?? '';
const IS_POSTGRES = DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://');

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error'> | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
  ],
}) as PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error'>;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Log slow queries
db.$on('query', (e: Prisma.QueryEvent) => {
  if (e.duration > SLOW_QUERY_THRESHOLD) {
    logger.warn(`[SLOW QUERY] ${e.duration}ms`, {
      query: e.query,
      params: e.params,
      duration: e.duration,
    });
  }
});

// Connection Pool Monitoring
interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
}

export async function getPoolMetrics(): Promise<PoolMetrics> {
  if (!IS_POSTGRES) {
    return {
      totalConnections: 1,
      activeConnections: 1,
      idleConnections: 0,
      waitingClients: 0,
    };
  }

  try {
    const result = await db.$queryRaw`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle
      FROM pg_stat_activity 
      WHERE datname = current_database()
    ` as { total: string; active: string; idle: string }[];

    return {
      totalConnections: parseInt(result[0]?.total || '0'),
      activeConnections: parseInt(result[0]?.active || '0'),
      idleConnections: parseInt(result[0]?.idle || '0'),
      waitingClients: 0,
    };
  } catch (error) {
    logger.error('[DB] Error getting pool metrics', error);
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
    };
  }
}

// Health check
export async function checkDatabaseHealth(): Promise<{
  status: 'ok' | 'error';
  responseTimeMs: number;
  pool: PoolMetrics;
}> {
  const startTime = Date.now();
  
  try {
    await db.$queryRaw`SELECT 1`;
    const responseTimeMs = Date.now() - startTime;
    const pool = await getPoolMetrics();
    
    return {
      status: 'ok',
      responseTimeMs,
      pool,
    };
  } catch (error) {
    return {
      status: 'error',
      responseTimeMs: Date.now() - startTime,
      pool: {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
      },
    };
  }
}