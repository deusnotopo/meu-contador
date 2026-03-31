import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { storage, auth } from "./firebase";
import { logger } from "./logger";

/**
 * Uploads a document/receipt associated with a transaction.
 * @param transactionId - The ID of the transaction
 * @param file - The file to upload (e.g., JPEG, PDF)
 * @returns The download URL of the uploaded file
 */
export const uploadReceipt = async (transactionId: string, file: File): Promise<string> => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User must be authenticated to upload files.");

  const fileExtension = file.name.split('.').pop();
  const filePath = `users/${userId}/receipts/${transactionId}-${Date.now()}.${fileExtension}`;
  const storageRef = ref(storage, filePath);

  try {
    logger.info(`[Storage] Uploading receipt for transaction ${transactionId}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    logger.error("Failed to upload receipt", error);
    throw error;
  }
};

/**
 * Deletes a receipt given its storage path/URL.
 * @param receiptUrl - The full URL of the receipt to delete
 */
export const deleteReceipt = async (receiptUrl: string) => {
  try {
    const storageRef = ref(storage, receiptUrl);
    await deleteObject(storageRef);
    logger.info(`[Storage] Receipt deleted successfully`);
  } catch (error) {
    logger.warn("Failed to delete receipt (it might already be gone)", error);
  }
};
