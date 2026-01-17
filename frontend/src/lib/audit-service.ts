import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./firebase";

export type AuditAction = 
  | "CREATE_TRANSACTION" 
  | "DELETE_TRANSACTION" 
  | "UPDATE_TRANSACTION"
  | "CREATE_INVESTMENT"
  | "SALE_INVESTMENT"
  | "CREATE_BUDGET"
  | "JOIN_WORKSPACE";

export interface AuditLogEntry {
  userId: string;
  userName: string;
  action: AuditAction;
  details: string;
  timestamp: any;
  workspaceId: string;
}

/**
 * Logs an action to the workspace's audit trail.
 */
export const logAction = async (
  workspaceId: string, 
  action: AuditAction, 
  details: string
) => {
  const user = auth.currentUser;
  if (!user || !workspaceId) return;

  try {
    const logRef = collection(db, "workspaces", workspaceId, "audit_logs");
    const entry: AuditLogEntry = {
      userId: user.uid,
      userName: user.displayName || user.email || "Usuário",
      action,
      details,
      timestamp: serverTimestamp(),
      workspaceId,
    };
    await addDoc(logRef, entry);
  } catch (error) {
    console.error("Failed to log action:", error);
  }
};
