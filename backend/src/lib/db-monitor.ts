import { db } from './db';
import { logger } from './logger.js';

interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
}

interface SlowQuery {
  query: string;
  duration: number;
  timestamp: Date;
}

export async function getPoolMetrics(): Promise<PoolMetrics> {
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
    logger.error('[DB Monitor] Failed to get pool metrics', error);
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
    };
  }
}

const slowQueries: SlowQuery[] = [];
const SLOW_QUERY_THRESHOLD = 1000; // 1 second

export function logSlowQuery(query: string, duration: number) {
  if (duration > SLOW_QUERY_THRESHOLD) {
    slowQueries.push({
      query: query.substring(0, 200), // Truncate long queries
      duration,
      timestamp: new Date(),
    });

    // Keep only last 100 slow queries
    if (slowQueries.length > 100) {
      slowQueries.shift();
    }
  }
}

export function getSlowQueries(): SlowQuery[] {
  return [...slowQueries];
}

export function clearSlowQueries() {
  slowQueries.length = 0;
}