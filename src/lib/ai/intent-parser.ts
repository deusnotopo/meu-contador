export interface ParsedIntent {
  type: "transaction" | "reminder" | "budget" | "query" | "unknown";
  action?: "create" | "list" | "delete" | "update";
  data?: {
    amount?: number;
    category?: string;
    description?: string;
    date?: string;
    type?: "income" | "expense";
    name?: string;
    dueDate?: string;
    limit?: number;
  };
  confidence: number;
  originalText: string;
}

export const parseIntent = (text: string): ParsedIntent => {
  const lowerText = text.toLowerCase().trim();

  // Transaction patterns
  const expensePatterns = [
    /(?:gastei|paguei|comprei|despesa)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais?)?\s+(?:em|no|na|de|com|para)?\s*(.+)/i,
    /(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais?)?\s+(?:em|no|na|de|com|para)\s+(.+)/i,
  ];

  const incomePatterns = [
    /(?:recebi|ganhei|entrada|receita)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais?)?\s+(?:de|em|por)?\s*(.+)/i,
  ];

  // Reminder patterns
  const reminderPatterns = [
    /(?:lembrar|lembre|criar lembrete)\s+(?:de|para)?\s*pagar\s+(.+?)\s+(?:dia|no dia|em)\s+(\d{1,2})/i,
    /(?:pagar|vence)\s+(.+?)\s+(?:dia|no dia|em)\s+(\d{1,2})/i,
  ];

  // Budget patterns
  const budgetPatterns = [
    /(?:criar|definir|estabelecer)\s+(?:um\s+)?orçamento\s+(?:de\s+)?(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais?)?\s+(?:para|em)\s+(.+)/i,
  ];

  // Check expense patterns
  for (const pattern of expensePatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(",", "."));
      const description = match[2].trim();

      return {
        type: "transaction",
        action: "create",
        data: {
          amount,
          description,
          type: "expense",
          category: inferCategory(description),
          date: new Date().toISOString().split("T")[0],
        },
        confidence: 0.9,
        originalText: text,
      };
    }
  }

  // Check income patterns
  for (const pattern of incomePatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(",", "."));
      const description = match[2].trim();

      return {
        type: "transaction",
        action: "create",
        data: {
          amount,
          description,
          type: "income",
          category: "Salário",
          date: new Date().toISOString().split("T")[0],
        },
        confidence: 0.9,
        originalText: text,
      };
    }
  }

  // Check reminder patterns
  for (const pattern of reminderPatterns) {
    const match = text.match(pattern);
    if (match) {
      const name = match[1].trim();
      const day = parseInt(match[2]);
      const currentDate = new Date();
      const dueDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );

      // If day has passed this month, set for next month
      if (dueDate < currentDate) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      return {
        type: "reminder",
        action: "create",
        data: {
          name,
          dueDate: dueDate.toISOString().split("T")[0],
          amount: 0, // Will need to be set manually or extracted if mentioned
        },
        confidence: 0.85,
        originalText: text,
      };
    }
  }

  // Check budget patterns
  for (const pattern of budgetPatterns) {
    const match = text.match(pattern);
    if (match) {
      const limit = parseFloat(match[1].replace(",", "."));
      const category = match[2].trim();

      return {
        type: "budget",
        action: "create",
        data: {
          limit,
          category: capitalizeCategory(category),
        },
        confidence: 0.85,
        originalText: text,
      };
    }
  }

  // Fallback for transactions if regex fails but we have amount + keywords
  const hasAmount =
    /r\$\s*(\d+(?:[.,]\d{1,2})?)/i.exec(text) ||
    /(\d+(?:[.,]\d{1,2})?)\s*reais/i.exec(text);
  if (
    hasAmount &&
    (lowerText.includes("gastei") ||
      lowerText.includes("paguei") ||
      lowerText.includes("recebi"))
  ) {
    const amount = parseFloat(hasAmount[1].replace(",", "."));
    const isExpense = !lowerText.includes("recebi");

    // Simplistic extraction of description: everything that isn't the amount or common keywords
    let description = text
      .replace(hasAmount[0], "")
      .replace(/(gastei|paguei|recebi|reais|r\$)/gi, "")
      .trim();
    if (description.startsWith("em ")) description = description.slice(3);

    return {
      type: "transaction",
      action: "create",
      data: {
        amount,
        description:
          description || (isExpense ? "Despesa Manual" : "Receita Manual"),
        type: isExpense ? "expense" : "income",
        category: isExpense ? inferCategory(description) : "Salário",
        date: new Date().toISOString().split("T")[0],
      },
      confidence: 0.75, // Lower confidence for fallback
      originalText: text,
    };
  }

  // Query patterns (for analytics questions)
  if (
    lowerText.includes("quanto") ||
    lowerText.includes("qual") ||
    lowerText.includes("como está") ||
    lowerText.includes("me mostre") ||
    lowerText.includes("analise") ||
    lowerText.includes("auditoria")
  ) {
    return {
      type: "query",
      confidence: 0.7,
      originalText: text,
    };
  }

  return {
    type: "unknown",
    confidence: 0,
    originalText: text,
  };
};

// Helper: Infer category from description
const inferCategory = (description: string): string => {
  const lower = description.toLowerCase();

  const categoryMap: Record<string, string[]> = {
    Alimentação: [
      "almoço",
      "jantar",
      "café",
      "lanche",
      "restaurante",
      "comida",
      "ifood",
      "uber eats",
    ],
    Transporte: ["uber", "taxi", "ônibus", "metrô", "gasolina", "combustível"],
    Lazer: ["cinema", "show", "festa", "bar", "balada", "netflix", "spotify"],
    Saúde: ["farmácia", "médico", "consulta", "remédio", "academia"],
    Moradia: ["aluguel", "condomínio", "luz", "água", "internet"],
    Educação: ["curso", "livro", "faculdade", "escola"],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category;
    }
  }

  return "Outros";
};

// Helper: Capitalize category
const capitalizeCategory = (text: string): string => {
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
