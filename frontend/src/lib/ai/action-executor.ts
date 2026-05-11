import type { ParsedIntent } from "./intent-parser";
import type { ActionResult } from "./types";
import { logger } from "@/lib/logger";

// Import all strategies natively 
import { executeTransactionAction } from "./strategies/transaction";
import { executeReminderAction } from "./strategies/reminder";
import { executeBudgetAction } from "./strategies/budget";
import { executeGoalAction } from "./strategies/goal";
import { executeAssetAction } from "./strategies/asset";

// The strategy map routes parsed intents to their corresponding handlers
const strategyMap: Record<string, (intent: ParsedIntent) => Promise<ActionResult>> = {
  transaction: executeTransactionAction,
  reminder: executeReminderAction,
  budget: executeBudgetAction,
  goal: executeGoalAction,
  asset: executeAssetAction,
};

export const executeAction = async (
  intent: ParsedIntent
): Promise<ActionResult> => {
  try {
    const strategy = strategyMap[intent.type];
    
    if (strategy) {
      return await strategy(intent);
    }
    
    return {
      success: false,
      message: "Não consegui entender o comando. Tente reformular.",
    };
  } catch (error) {
    logger.error('[ActionExecutor] Strategy execution failed', { type: intent.type, error });
    return {
      success: false,
      message: "Ocorreu um erro ao executar a ação.",
    };
  }
};

// Also export the type for backward compatibility where consumers use `import { ActionResult } from './action-executor'`
export type { ActionResult };
