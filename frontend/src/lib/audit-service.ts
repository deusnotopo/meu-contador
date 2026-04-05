import { api } from "./api";

export type AuditAction = 
  | "CREATE_TRANSACTION" 
  | "DELETE_TRANSACTION" 
  | "UPDATE_TRANSACTION"
  | "CREATE_INVESTMENT"
  | "SALE_INVESTMENT"
  | "CREATE_BUDGET"
  | "JOIN_WORKSPACE";

export interface AuditLogEntry {
  action: AuditAction;
  details: string;
  workspaceId: string;
  userName: string;
  timestamp?: { toDate: () => Date };
}

/**
 * Logs an action to the workspace's audit trail.
 */
export const logAction = async (
  workspaceId: string, 
  action: AuditAction, 
  details: string
) => {
  if (!workspaceId) return;

  try {
    await api.post("/audit", {
      action,
      resource: "app", // Generic resource for app actions
      resourceId: workspaceId,
      metadata: { details },
    });
  } catch (error) {
    console.error("Failed to log action:", error);
  }
};
