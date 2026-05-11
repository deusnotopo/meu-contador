import { db } from './db';
import { logger } from './logger.js';

// Feature flag types
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  userWhitelist: string[];
  userBlacklist: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagEvaluation {
  flagName: string;
  enabled: boolean;
  reason: 'default' | 'rollout' | 'whitelist' | 'blacklist' | 'disabled';
  metadata?: Record<string, unknown>;
}

// In-memory cache for feature flags
let featureFlagsCache: Map<string, FeatureFlag> = new Map();
let cacheLastUpdated: Date | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Initialize feature flags table
export async function initializeFeatureFlags() {
  try {
    await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        enabled BOOLEAN DEFAULT false,
        rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
        user_whitelist JSONB DEFAULT '[]',
        user_blacklist JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Create index for faster lookups
    await db.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
    `;

    // Insert default feature flags
    const defaultFlags = [
      {
        id: 'graphql-enabled',
        name: 'graphql_enabled',
        description: 'Enable GraphQL API endpoint',
        enabled: true,
        rolloutPercentage: 100,
      },
      {
        id: 'websocket-enabled',
        name: 'websocket_enabled',
        description: 'Enable WebSocket real-time notifications',
        enabled: true,
        rolloutPercentage: 100,
      },
      {
        id: 'ai-chat-enabled',
        name: 'ai_chat_enabled',
        description: 'Enable AI chat assistant',
        enabled: true,
        rolloutPercentage: 100,
      },
      {
        id: 'open-finance-enabled',
        name: 'open_finance_enabled',
        description: 'Enable Open Finance integration',
        enabled: true,
        rolloutPercentage: 100,
      },
      {
        id: 'push-notifications-enabled',
        name: 'push_notifications_enabled',
        description: 'Enable push notifications',
        enabled: true,
        rolloutPercentage: 100,
      },
      {
        id: 'dark-mode-enabled',
        name: 'dark_mode_enabled',
        description: 'Enable dark mode theme',
        enabled: true,
        rolloutPercentage: 100,
      },
      {
        id: 'experimental-charts',
        name: 'experimental_charts',
        description: 'Enable experimental chart features',
        enabled: false,
        rolloutPercentage: 10,
      },
      {
        id: 'beta-features',
        name: 'beta_features',
        description: 'Enable beta features for testing',
        enabled: false,
        rolloutPercentage: 5,
      },
    ];

    for (const flag of defaultFlags) {
      await db.$executeRaw`
        INSERT INTO feature_flags (id, name, description, enabled, rollout_percentage, user_whitelist, user_blacklist, metadata)
        VALUES (${flag.id}, ${flag.name}, ${flag.description}, ${flag.enabled}, ${flag.rolloutPercentage}, '[]', '[]', '{}')
        ON CONFLICT (name) DO NOTHING;
      `;
    }

    logger.info('[FeatureFlags] Feature flags initialized');
  } catch (error) {
    logger.error('[FeatureFlags] Failed to initialize feature flags', error);
  }
}

// Load feature flags from database
async function loadFeatureFlags(): Promise<Map<string, FeatureFlag>> {
  const now = new Date();
  
  // Check if cache is still valid
  if (cacheLastUpdated && (now.getTime() - cacheLastUpdated.getTime()) < CACHE_TTL_MS) {
    return featureFlagsCache;
  }

  try {
    const flags = await db.$queryRaw<FeatureFlag[]>`
      SELECT 
        id,
        name,
        description,
        enabled,
        rollout_percentage as "rolloutPercentage",
        user_whitelist as "userWhitelist",
        user_blacklist as "userBlacklist",
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM feature_flags
    `;

    featureFlagsCache.clear();
    for (const flag of flags) {
      featureFlagsCache.set(flag.name, flag);
    }
    cacheLastUpdated = now;

    return featureFlagsCache;
  } catch (error) {
    logger.error('[FeatureFlags] Failed to load feature flags', error);
    return featureFlagsCache;
  }
}

// Evaluate a feature flag for a user
export async function evaluateFeatureFlag(
  flagName: string,
  userId?: string,
  userAttributes?: Record<string, unknown>
): Promise<FeatureFlagEvaluation> {
  const flags = await loadFeatureFlags();
  const flag = flags.get(flagName);

  // Flag doesn't exist
  if (!flag) {
    return {
      flagName,
      enabled: false,
      reason: 'default',
      metadata: { error: 'Flag not found' },
    };
  }

  // Flag is disabled
  if (!flag.enabled) {
    return {
      flagName,
      enabled: false,
      reason: 'disabled',
    };
  }

  // Check blacklist first
  if (userId && flag.userBlacklist.includes(userId)) {
    return {
      flagName,
      enabled: false,
      reason: 'blacklist',
    };
  }

  // Check whitelist
  if (userId && flag.userWhitelist.includes(userId)) {
    return {
      flagName,
      enabled: true,
      reason: 'whitelist',
      metadata: flag.metadata,
    };
  }

  // Check rollout percentage
  if (flag.rolloutPercentage >= 100) {
    return {
      flagName,
      enabled: true,
      reason: 'rollout',
      metadata: flag.metadata,
    };
  }

  if (flag.rolloutPercentage <= 0) {
    return {
      flagName,
      enabled: false,
      reason: 'rollout',
    };
  }

  // Deterministic rollout based on user ID
  if (userId) {
    const hash = simpleHash(userId + flagName);
    const bucket = hash % 100;
    const enabled = bucket < flag.rolloutPercentage;
    
    return {
      flagName,
      enabled,
      reason: 'rollout',
      metadata: {
        ...flag.metadata,
        rolloutBucket: bucket,
        rolloutPercentage: flag.rolloutPercentage,
      },
    };
  }

  // Random rollout for anonymous users
  const random = Math.random() * 100;
  const enabled = random < flag.rolloutPercentage;

  return {
    flagName,
    enabled,
    reason: 'rollout',
    metadata: {
      ...flag.metadata,
      rolloutRandom: random,
      rolloutPercentage: flag.rolloutPercentage,
    },
  };
}

// Check if a feature is enabled
export async function isFeatureEnabled(
  flagName: string,
  userId?: string,
  userAttributes?: Record<string, unknown>
): Promise<boolean> {
  const evaluation = await evaluateFeatureFlag(flagName, userId, userAttributes);
  return evaluation.enabled;
}

// Get all feature flags
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  const flags = await loadFeatureFlags();
  return Array.from(flags.values());
}

// Create or update a feature flag
export async function upsertFeatureFlag(
  flagData: Partial<FeatureFlag> & { name: string }
): Promise<FeatureFlag> {
  const {
    name,
    description = '',
    enabled = false,
    rolloutPercentage = 0,
    userWhitelist = [],
    userBlacklist = [],
    metadata = {},
  } = flagData;

  const id = flagData.id || `flag-${name}-${Date.now()}`;

  await db.$executeRaw`
    INSERT INTO feature_flags (id, name, description, enabled, rollout_percentage, user_whitelist, user_blacklist, metadata)
    VALUES (${id}, ${name}, ${description}, ${enabled}, ${rolloutPercentage}, ${JSON.stringify(userWhitelist)}, ${JSON.stringify(userBlacklist)}, ${JSON.stringify(metadata)})
    ON CONFLICT (name) DO UPDATE SET
      description = EXCLUDED.description,
      enabled = EXCLUDED.enabled,
      rollout_percentage = EXCLUDED.rollout_percentage,
      user_whitelist = EXCLUDED.user_whitelist,
      user_blacklist = EXCLUDED.user_blacklist,
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
    RETURNING 
      id,
      name,
      description,
      enabled,
      rollout_percentage as "rolloutPercentage",
      user_whitelist as "userWhitelist",
      user_blacklist as "userBlacklist",
      metadata,
      created_at as "createdAt",
      updated_at as "updatedAt";
  `;

  // Invalidate cache
  cacheLastUpdated = null;

  const result = await db.$queryRaw<FeatureFlag[]>`
    SELECT * FROM feature_flags WHERE name = ${name}
  `;

  return result[0];
}

// Delete a feature flag
export async function deleteFeatureFlag(flagName: string): Promise<boolean> {
  try {
    await db.$executeRaw`
      DELETE FROM feature_flags WHERE name = ${flagName}
    `;
    
    // Invalidate cache
    cacheLastUpdated = null;
    featureFlagsCache.delete(flagName);
    
    return true;
  } catch (error) {
    logger.error('[FeatureFlags] Failed to delete feature flag', error);
    return false;
  }
}

// Add user to whitelist
export async function addToWhitelist(flagName: string, userId: string): Promise<boolean> {
  try {
    await db.$executeRaw`
      UPDATE feature_flags 
      SET user_whitelist = user_whitelist || ${JSON.stringify([userId])}::jsonb,
          updated_at = NOW()
      WHERE name = ${flagName}
    `;
    
    // Invalidate cache
    cacheLastUpdated = null;
    
    return true;
  } catch (error) {
    logger.error('[FeatureFlags] Failed to add to whitelist', error);
    return false;
  }
}

// Remove user from whitelist
export async function removeFromWhitelist(flagName: string, userId: string): Promise<boolean> {
  try {
    await db.$executeRaw`
      UPDATE feature_flags 
      SET user_whitelist = (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(user_whitelist) elem
        WHERE elem::text != ${JSON.stringify(userId)}
      ),
      updated_at = NOW()
      WHERE name = ${flagName}
    `;
    
    // Invalidate cache
    cacheLastUpdated = null;
    
    return true;
  } catch (error) {
    logger.error('[FeatureFlags] Failed to remove from whitelist', error);
    return false;
  }
}

// Add user to blacklist
export async function addToBlacklist(flagName: string, userId: string): Promise<boolean> {
  try {
    await db.$executeRaw`
      UPDATE feature_flags 
      SET user_blacklist = user_blacklist || ${JSON.stringify([userId])}::jsonb,
          updated_at = NOW()
      WHERE name = ${flagName}
    `;
    
    // Invalidate cache
    cacheLastUpdated = null;
    
    return true;
  } catch (error) {
    logger.error('[FeatureFlags] Failed to add to blacklist', error);
    return false;
  }
}

// Remove user from blacklist
export async function removeFromBlacklist(flagName: string, userId: string): Promise<boolean> {
  try {
    await db.$executeRaw`
      UPDATE feature_flags 
      SET user_blacklist = (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(user_blacklist) elem
        WHERE elem::text != ${JSON.stringify(userId)}
      ),
      updated_at = NOW()
      WHERE name = ${flagName}
    `;
    
    // Invalidate cache
    cacheLastUpdated = null;
    
    return true;
  } catch (error) {
    logger.error('[FeatureFlags] Failed to remove from blacklist', error);
    return false;
  }
}

// Simple hash function for deterministic rollout
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Clear cache (useful for testing)
export function clearCache(): void {
  featureFlagsCache.clear();
  cacheLastUpdated = null;
}