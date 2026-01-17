import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { WorkspaceMetadata, WorkspaceRole } from "@/types";

/**
 * Creates a central workspace document in Firestore to manage membership and rules.
 */
export const createWorkspaceCloud = async (id: string, name: string, ownerId: string) => {
  const wsRef = doc(db, "workspaces", id);
  const metadata: WorkspaceMetadata = {
    id,
    name,
    ownerId,
    members: {
      [ownerId]: "owner"
    },
    createdAt: new Date().toISOString()
  };
  await setDoc(wsRef, metadata);
};

/**
 * Adds a user to a central workspace document.
 */
export const joinWorkspaceCloud = async (id: string, userId: string, role: WorkspaceRole = "viewer") => {
  const wsRef = doc(db, "workspaces", id);
  const snap = await getDoc(wsRef);
  
  if (!snap.exists()) {
    throw new Error("Espaço de trabalho não encontrado ou ID inválido.");
  }
  
  // Add member to the map
  await updateDoc(wsRef, {
    [`members.${userId}`]: role
  });
};

/**
 * Fetches workspace metadata.
 */
export const getWorkspaceMetadata = async (id: string): Promise<WorkspaceMetadata | null> => {
  const wsRef = doc(db, "workspaces", id);
  const snap = await getDoc(wsRef);
  return snap.exists() ? (snap.data() as WorkspaceMetadata) : null;
};
