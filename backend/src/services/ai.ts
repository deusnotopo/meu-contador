// src/services/ai.ts

export class PredictiveEngine {
  // Dictionary mapped to standard categories
  private static readonly CATEGORY_DICTIONARY: Record<string, string> = {
    'uber': 'Transporte',
    '99app': 'Transporte',
    'ifood': 'Delivery',
    'rappi': 'Delivery',
    'ze delivery': 'Delivery',
    'netflix': 'Lazer',
    'spotify': 'Lazer',
    'amazon prime': 'Lazer',
    'hbo': 'Lazer',
    'pgto pix': 'Outros',
    'pagto': 'Outros',
    'compra cartao': 'Outros',
    'supermercado': 'Mercado',
    'assai': 'Mercado',
    'carrefour': 'Mercado',
    'pao de acucar': 'Mercado',
    'farmacia': 'Saúde',
    'drogasil': 'Saúde',
    'droga raia': 'Saúde',
    'pague menos': 'Saúde',
    'smart fit': 'Saúde',
    'salario': 'Salário',
    'rendimento': 'Investimentos',
    'cdb': 'Investimentos',
    'tesouro': 'Investimentos'
  };

  /**
   * Cleans a raw banking transaction description
   * Example: "COMPRA CARTAO IFOOD*     12/03" -> "IFOOD"
   */
  public static cleanDescription(raw: string): string {
    if (!raw) return 'Transação Genérica';

    let cleaned = raw.toLowerCase();

    // Remove dates like 12/03 or 12/03/2024
    cleaned = cleaned.replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, '');
    
    // Remove typical OFX transactional garbage prefixes
    cleaned = cleaned.replace(/compra cartao/g, '');
    cleaned = cleaned.replace(/pgto pix/g, 'pix');
    cleaned = cleaned.replace(/tarifa bancaria/g, 'tarifa');
    
    // Remove isolated numbers/asterisks/hashes
    cleaned = cleaned.replace(/[\*#]/g, ' ');
    cleaned = cleaned.replace(/\b\d+\b/g, ' ');

    // Condense multiple spaces into one and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return this.capitalize(cleaned) || raw;
  }

  /**
   * Predicts the most likely category and a friendly description for a transaction
   */
  public static predictTransaction(rawDescription: string, amount: number): {
    suggestedCategory: string;
    cleanedDescription: string;
    confidence: number;
    isRecurringSuspect: boolean;
  } {
    const cleaned = this.cleanDescription(rawDescription);
    const searchString = cleaned.toLowerCase();
    
    let matchedCategory = 'Outros'; // Default
    let confidence = 0.4;
    let isRecurringSuspect = false;

    // Check if income to route to income categories
    if (amount >= 0) {
      matchedCategory = 'Receita';
      confidence = 0.5;
    }

    // Keyword matching
    for (const [token, cat] of Object.entries(this.CATEGORY_DICTIONARY)) {
      if (searchString.includes(token)) {
        matchedCategory = cat;
        confidence = 0.9;
        break; // Match found
      }
    }

    // Heuristics for recurrent bills (e.g. Netflix, Spotify, or exactly same whole amounts)
    const recurrentBrands = ['netflix', 'spotify', 'amazon', 'gympass', 'smart fit'];
    if (recurrentBrands.some(b => searchString.includes(b))) {
      isRecurringSuspect = true;
      confidence = 0.95;
    }

    return {
      suggestedCategory: matchedCategory,
      cleanedDescription: cleaned,
      confidence,
      isRecurringSuspect
    };
  }

  private static capitalize(str: string): string {
    if (!str) return str;
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }
}
