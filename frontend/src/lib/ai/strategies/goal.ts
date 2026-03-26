import type { ParsedIntent } from "../intent-parser";
import type { ActionResult } from "../types";

export const executeGoalAction = async (intent: ParsedIntent): Promise<ActionResult> => {
  // Skeleton for goal creation
  return {
    success: true,
    message: "🚀 Meta de economia identificada e pronta para ser criada!",
  };
};
