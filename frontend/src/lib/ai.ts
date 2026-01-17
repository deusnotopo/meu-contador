import type { Transaction, TransactionFormData } from "@/types";
import {
  calculateFinancialHealth,
  getClassification,
} from "./financial-health";

// HYBRID ARCHITECTURE: Calls our Vercel Serverless Function instead of the AI API directly
// This protects our API Key and ensures better performance across the Vercel ecosystem
const AI_PROXY_URL = "/api/ai-proxy";

export interface AIInsights {
  score: number;
  tips: string[];
  predictions: {
    category: string;
    predictedAmount: number;
    trend: "up" | "down" | "stable";
    reason: string;
  }[];
}

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export const getFinancialInsights = async (
  transactions: Transaction[]
): Promise<AIInsights> => {
  // Calculate totals for the health check
  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === "income") acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    },
    { income: 0, expense: 0, balance: 0 }
  );
  totals.balance = totals.income - totals.expense;

  const healthMetrics = calculateFinancialHealth(transactions, totals);

  const summary = transactions
    .map((t) => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date,
      desc: t.description,
      classification: getClassification(t),
    }))
    .slice(-50);

  const systemPrompt = `
    Você é um consultor financeiro especialista. Analise os dados fornecidos e retorne EXATAMENTE o JSON solicitado.
    
    DADOS PRE-CALCULADOS RIGOROSOS:
    - Score: ${Math.round(healthMetrics.score)} / 100
    - Meta Poupança: ${healthMetrics.savingsRate.toFixed(1)}%
    
    Responda APENAS em formato JSON puro.
  `;

  const userPrompt = `
    Analise as transações e o Score ${Math.round(healthMetrics.score)}.
    Dê 3 dicas práticas e previsões de gastos.
    
    Contexto: ${JSON.stringify(summary)}
    
    Output JSON Schema:
    {
      "score": number,
      "tips": string[],
      "predictions": [{ "category": string, "predictedAmount": number, "trend": "up"|"down"|"stable", "reason": string }]
    }
  `;

  try {
    const generateInsights = httpsCallable(functions, 'generateInsights');
    const result = await generateInsights({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3
    });

    const data = result.data as AIResponseData;
    
    // The Function returns the full OpenAI/Mistral response format
    const contentString = data.choices[0].message.content;

    let content;
    try {
      content = JSON.parse(contentString);
    } catch {
      const cleanContent = contentString.replace(/```json|```/g, "").trim();
      content = JSON.parse(cleanContent);
    }

    return content as AIInsights;
  } catch (error) {
    console.error("Cloud Function Error:", error);
    return {
      score: Math.round(healthMetrics.score),
      tips: ["Erro ao conectar com inteligência.", "Verifique sua conexão.", "Tente novamente."],
      predictions: [],
    };
  }
};

export interface AIResponseData {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface ParsedCommand {
  type: "transaction" | "investment" | "unknown";
  data?: TransactionFormData | InvestmentData | null;
  confidence: number;
  message?: string;
}

interface InvestmentData {
  ticker: string;
  amount: number;
  price?: number;
  type: "stock" | "fii" | "crypto";
}

export const parseVoiceCommand = async (
  text: string
): Promise<ParsedCommand> => {
  const systemPrompt = `
    You are a financial AI assistant. Parse the user's natural language command into structured JSON.
    Current Date: ${new Date().toISOString().split("T")[0]}

    OUTPUT FORMAT:
    {
      "type": "transaction" | "investment" | "unknown",
      "data": { ... } // schema below
    }

    IF TRANSACTION (expense/income):
    "data": {
      "type": "income" | "expense",
      "amount": number,
      "description": string (capitalize first letter),
      "category": string (Infer from context. Valid: Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Compras, Salário, Investimento, Freelance, Outros),
      "date": "YYYY-MM-DD" (Resolve relative dates like "hoje", "ontem"),
      "paymentMethod": "Pix" | "Cartão de Crédito" | "Dinheiro" (default "Pix")
    }

    IF INVESTMENT:
    "data": {
      "ticker": string (e.g., PETR4, AAPL),
      "amount": number (quantity),
      "price": number (if specified, otherwise null),
      "type": "stock" | "fii" | "crypto"
    }

    EXAMPLES:
    User: "Gastei 50 no mcdonalds"
    JSON: { "type": "transaction", "data": { "type": "expense", "amount": 50, "description": "Mcdonalds", "category": "Alimentação", "date": "2024-03-20", "paymentMethod": "Pix" } }

    User: "Recebi 5000 de salário"
    JSON: { "type": "transaction", "data": { "type": "income", "amount": 5000, "description": "Salário", "category": "Salário", "date": "2024-03-20", "paymentMethod": "Pix" } }
    
    User: "Comprei 10 ações da Petrobras"
    JSON: { "type": "investment", "data": { "ticker": "PETR4", "amount": 10, "type": "stock" } }

    User: "Olá tudo bem"
    JSON: { "type": "unknown", "message": "Comando não reconhecido como financeiro." }
  `;

  try {
    const response = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.1, // Low temp for deterministic JSON
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) throw new Error("AI Proxy failed");

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    return {
      type: content.type,
      data: content.data,
      confidence: 0.9,
      message: content.message,
    };
  } catch (error) {
    console.error("AI Parse Error:", error);
    return {
      type: "unknown",
      confidence: 0,
      message: "Erro ao processar comando. Tente novamente.",
    };
  }
};
