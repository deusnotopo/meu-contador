import type { Transaction } from "@/types";
import { calculateFinancialHealth, getClassification } from "./financial-health";

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

  // Calculate strict financial health metrics
  const healthMetrics = calculateFinancialHealth(transactions, totals);

  // Resumo das transações para economizar tokens
  const summary = transactions
    .map((t) => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date,
      desc: t.description,
      classification: getClassification(t),
    }))
    .slice(-50); // Últimas 50 transações

  const systemPrompt = `
    Você é um consultor financeiro especialista. Analise os dados fornecidos e retorne EXATAMENTE o JSON solicitado.
    
    DADOS PRE-CALCULADOS RIGOROSOS (Use estes números como base factual):
    - Score de Saúde: ${Math.round(healthMetrics.score)} / 100
    - Taxa de Poupança: ${healthMetrics.savingsRate.toFixed(1)}% (Meta: >20%)
    - Cobertura de Liquidez: ${healthMetrics.expenseCoverage.toFixed(1)} meses
    - Regra 50-30-20:
      - Necessidades: ${healthMetrics.rule503020.necessity.percentage.toFixed(1)}% (Meta: 50%)
      - Desejos: ${healthMetrics.rule503020.want.percentage.toFixed(1)}% (Meta: 30%)
      - Investimentos/Dívidas: ${(healthMetrics.rule503020.investment.percentage + healthMetrics.rule503020.debt.percentage).toFixed(1)}% (Meta: 20%)

    Sua tarefa é explicar o PORQUÊ desse score e dar dicas baseadas nele.
    Não re-calcule o score. Confie nos dados acima.
    Não inclua markdown, explicações ou texto extra. Apenas o JSON cru.
  `;

  const userPrompt = `
    Analise as transações e os métricas acima.
    1. O Score já é ${Math.round(healthMetrics.score)}. Use esse valor.
    2. Dê 3 dicas práticas para melhorar, focando onde o usuário está desviando da regra 50-30-20 (ex: se Desejos > 30%, mande cortar gastos supérfluos).
    3. Previsões de gastos para as principais categorias no próximo mês.

    Transações Recentes (para contexto):
    ${JSON.stringify(summary)}

    Responda APENAS em formato JSON puro, seguindo exatamente esta estrutura:
    {
      "score": number, // Deve ser igual ou muito próximo de ${Math.round(healthMetrics.score)}
      "tips": ["string", "string", "string"],
      "predictions": [
        {
          "category": "string",
          "predictedAmount": number,
          "trend": "up" | "down" | "stable",
          "reason": "string"
        }
      ]
    }
  `;

  try {
    const response = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Proxy Error:", errorText);
        throw new Error(`Falha no Proxy: ${response.status}`);
    }

    const data = await response.json();
    const contentString = data.choices[0].message.content;
    
    // Safely parse JSON
    let content;
    try {
        content = JSON.parse(contentString);
    } catch (parseError) {
        const cleanContent = contentString.replace(/```json|```/g, "").trim();
        content = JSON.parse(cleanContent);
    }

    return content as AIInsights;
  } catch (error) {
    console.error("Erro ao buscar insights da IA via Proxy:", error);
    return {
        score: 75,
        tips: ["Verifique sua conexão com a Internet.", "Tente novamente mais tarde.", "Controle seus gastos fixos."],
        predictions: []
    };
  }
};
