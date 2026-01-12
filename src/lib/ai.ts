import type { Transaction } from "@/types";

// MISTRAL API CONFIGURATION
const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

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
  if (!MISTRAL_API_KEY) {
    throw new Error("Chave de API do Mistral não configurada");
  }

  // Resumo das transações para economizar tokens
  const summary = transactions
    .map((t) => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date,
      desc: t.description,
    }))
    .slice(-50); // Últimas 50 transações

  const systemPrompt = `
    Você é um consultor financeiro especialista. Analise os dados fornecidos e retorne EXATAMENTE o JSON solicitado.
    Não inclua markdown, explicações ou texto extra. Apenas o JSON cru.
  `;

  const userPrompt = `
    Analise as seguintes transações recentes de um usuário e forneça:
    1. Um score de saúde financeira de 0 a 100.
    2. 3 dicas personalizadas e pragmáticas.
    3. Previsões de gastos para as principais categorias no próximo mês.

    Transações:
    ${JSON.stringify(summary)}

    Responda APENAS em formato JSON puro, seguindo exatamente esta estrutura:
    {
      "score": number,
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
    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-tiny", // or mistral-small, mistral-medium depending on tier
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" } // Garante JSON válido
      }),
    });

    if (!response.ok) {
        // Fallback or detailed error logging
        const errorText = await response.text();
        console.error("Mistral API Error:", errorText);
        throw new Error(`Falha na API: ${response.status}`);
    }

    const data = await response.json();
    const contentString = data.choices[0].message.content;
    
    // Safely parse JSON
    let content;
    try {
        content = JSON.parse(contentString);
    } catch (parseError) {
        // Try to clean markdown code blocks if present despite instructions
        const cleanContent = contentString.replace(/```json|```/g, "").trim();
        content = JSON.parse(cleanContent);
    }

    return content as AIInsights;
  } catch (error) {
    console.error("Erro ao buscar insights da IA:", error);
    // Return safe fallback data instead of crashing
    return {
        score: 75,
        tips: ["Verifique sua conexão com a Internet.", "Tente novamente mais tarde.", "Controle seus gastos fixos."],
        predictions: []
    };
  }
};
