/**
 * BankingService
 * ──────────────
 * Logic for bank integrations and manual file imports (OFX/QFX).
 */

import { parseOfx } from "../utils/ofxParser.js";
import { PredictiveEngine } from "./ai.js";
import * as TransactionRepository from "../repositories/TransactionRepository.js";

export async function importOfx(userId: string, ofxContent: string) {
  const parsedTransactions = parseOfx(ofxContent);
  
  if (!parsedTransactions || parsedTransactions.length === 0) {
    throw new Error("No valid transactions found in the OFX file");
  }

  // Format and Predict categories for each transaction
  const insertData = parsedTransactions.map((t) => {
    const rawDesc = t.description || "OFX Import";
    const prediction = PredictiveEngine.predictTransaction(rawDesc, t.amount);

    return {
      userId,
      description: prediction.cleanedDescription,
      amount: Math.round(t.amount * 100), // Scale to cents
      type: (t.amount >= 0 ? "income" : "expense") as 'income' | 'expense',
      category: prediction.suggestedCategory,
      date: t.date ? new Date(t.date) : new Date(),
      paymentMethod: "OFX",
      scope: "personal" as const,
    };
  });

  const result = await TransactionRepository.createMany(insertData);
  
  return { 
    count: result.count,
    message: `Successfully imported ${result.count} transactions from OFX`
  };
}
