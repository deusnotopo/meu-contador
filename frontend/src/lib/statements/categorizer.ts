import type { CategoryRule, CategorizationResult } from '../../../../shared/types-statement';

const CATEGORY_RULES: CategoryRule[] = [
  // Alimentação
  { pattern: /mercado|supermercado|super\s?mkt|atacad|atacadao|assai|atacarejo/i, category: 'Alimentação', priority: 10 },
  { pattern: /restaurante|lanchonete|food|ifood|rappi|uber eats|99 food|pizza|pastel|lanche|comida/i, category: 'Alimentação', priority: 10 },
  { pattern: /padaria|panificadora|pão|açougue|hortifrut/i, category: 'Alimentação', priority: 10 },
  { pattern: /starbucks|mcdonald|bk|burguer king|subway|habib|spoleto/i, category: 'Alimentação', priority: 10 },
  // Transporte
  { pattern: /uber|99\s?passeio|taxi|cabify|indriver/i, category: 'Transporte', priority: 10 },
  { pattern: /posto|gasolina|combust|etanol|diesel|shell|ipiranga|petrobras|raizen/i, category: 'Transporte', priority: 10 },
  { pattern: /estacionamento|parking|pedágio|pedagio|sem parar|veloe/i, category: 'Transporte', priority: 10 },
  { pattern: /metro|metrô|cptm|onibus|ônibus|brt|trem|passagem/i, category: 'Transporte', priority: 10 },
  { pattern: /ipva|licenciamento|detran|cnh/i, category: 'Transporte', priority: 10 },
  // Moradia
  { pattern: /aluguel|locacao|locação/i, category: 'Moradia', priority: 10 },
  { pattern: /condominio|condomínio/i, category: 'Moradia', priority: 10 },
  { pattern: /iptu|taxa\s?lixo/i, category: 'Moradia', priority: 10 },
  { pattern: /energia|eletric|ceelpa|copel|cemig|light|enel|eletropaulo/i, category: 'Moradia', priority: 10 },
  { pattern: /água|sabesp|sanepar|copasa|caern/i, category: 'Moradia', priority: 10 },
  { pattern: /internet|net|vivo\s?fibra|claro\s?fibra|oi\s?fibra|tim\s?live/i, category: 'Moradia', priority: 10 },
  { pattern: /gás|ultragaz|liquigas|supergasbras/i, category: 'Moradia', priority: 10 },
  // Saúde
  { pattern: /farmácia|farmacia|drogaria|droga\s?raia|drogasil|pacheco|panvel|ultrafarma/i, category: 'Saúde', priority: 10 },
  { pattern: /médico|medico|hospital|clínica|clinica|laboratório|laboratorio|exame|consulta/i, category: 'Saúde', priority: 10 },
  { pattern: /unimed|amil|sulamerica|bradesco\s?saude|hapvida|notredame|golden\s?cross/i, category: 'Saúde', priority: 10 },
  { pattern: /dentista|odonto|ortodontia/i, category: 'Saúde', priority: 10 },
  { pattern: /academia|smart\s?fit|bio\s?ritmo|bluefit|selfit/i, category: 'Saúde', priority: 10 },
  // Educação
  { pattern: /escola|colégio|colegio|faculdade|universidade|curso|alura|udemy|coursera|edx/i, category: 'Educação', priority: 10 },
  { pattern: /livraria|livro|papelaria|material\s?escolar/i, category: 'Educação', priority: 10 },
  { pattern: /mensalidade|tuition|school/i, category: 'Educação', priority: 10 },
  // Lazer
  { pattern: /cinema|ingresso|ingresso\.com|sympla|eventim|ticket|show|teatro|espetáculo/i, category: 'Lazer', priority: 10 },
  { pattern: /netflix|spotify|disney|amazon\s?prime|hbo|max|globoplay|youtube\s?premium|apple\s?(tv|music|arcade)/i, category: 'Lazer', priority: 10 },
  { pattern: /viagem|hotel|airbnb|booking|decolar|passagem\s?aérea/i, category: 'Lazer', priority: 10 },
  { pattern: /steam|playstation|xbox|nintendo|epic\s?games|riot\s?games/i, category: 'Lazer', priority: 10 },
  // Vestuário
  { pattern: /roupa|vestido|camisa|calça|sapato|tênis|tenis|zara|hm|h&m|renner|riachuelo|cea|marisa/i, category: 'Roupas', priority: 10 },
  { pattern: /magazine\s?luiza|casas\s?bahia|americanas|kabum|pichau|terabyte|mercado\s?livre|shopee/i, category: 'Compras', priority: 9 },
  // Beleza
  { pattern: /cabelereiro|salão|salao|barbeiro|estética|estetica|spa|manicure|pedicure/i, category: 'Beleza', priority: 10 },
  { pattern: /avon|natura|boticário|boticario|sephora/i, category: 'Beleza', priority: 10 },
  // Assinaturas
  { pattern: /assinatura|subscription|mensalidade|plano|renovação|renovacao/i, category: 'Assinaturas', priority: 8 },
  // Investimentos
  { pattern: /aplicação|aplicacao|resgate|investimento|cdb|lci|lca|tesouro|renda\s?fixa|poupança|poupanca/i, category: 'Investimentos', priority: 10 },
  { pattern: /dividendo|provento|jscp|jcp|rendimento/i, category: 'Investimentos', priority: 10 },
  // Transferências
  { pattern: /pix\s?(enviado|recebido)|ted|doc|transferência|transferencia|depósito|deposito/i, category: 'Transferências', priority: 10 },
  // Cartão de Crédito
  { pattern: /fatura|cartão|cartao|credit|mastercard|visa|elo|amex/i, category: 'Cartão de Crédito', priority: 10 },
  // Pets
  { pattern: /pet\s?shop|veterinário|veterinario|petz|cobasi|petlove|animal/i, category: 'Pets', priority: 10 },
  // Serviços
  { pattern: /celular|claro|vivo|tim|oi/i, category: 'Serviços', priority: 8 },
  { pattern: /limpeza|faxina|diarista|zeladoria/i, category: 'Serviços', priority: 8 },
  // Impostos
  { pattern: /imposto|irpf|irpj|simples\s?nacional|darf|gps|fgts/i, category: 'Impostos', priority: 10 },
  // Empréstimos
  { pattern: /empréstimo|emprestimo|parcela|financiamento|leasing/i, category: 'Empréstimos', priority: 10 },
];

// Pré-ordenado por prioridade decrescente — feito UMA vez na inicialização do módulo.
// Não re-sort a cada chamada de categorizeTransaction() — o array nunca muda.
const SORTED_RULES = [...CATEGORY_RULES].sort((a, b) => b.priority - a.priority);

export function categorizeTransaction(description: string): CategorizationResult {
  const normalizedDesc = description.trim().toLowerCase();
  for (const rule of SORTED_RULES) {
    const pattern = rule.pattern;
    let matches = false;
    if (pattern instanceof RegExp) {
      matches = pattern.test(normalizedDesc);
    } else {
      matches = normalizedDesc.includes(pattern.toLowerCase());
    }
    if (matches) {
      const confidence = calculateConfidence(normalizedDesc, rule);
      return {
        category: rule.category,
        subcategory: rule.subcategory,
        confidence,
        rule,
      };
    }
  }
  return {
    category: 'Outros',
    confidence: 0.1,
  };
}

function calculateConfidence(description: string, rule: CategoryRule): number {
  let confidence = 0.7;
  confidence += (rule.priority / 100) * 0.2;
  if (rule.pattern instanceof RegExp) {
    const match = description.match(rule.pattern);
    if (match && match[0].length > 5) {
      confidence += 0.1;
    }
  }
  return Math.min(confidence, 1.0);
}

export function categorizeTransactionsBatch(
  _transactions: Array<{ description: string; amount: number; type: string }>
): Array<{ category: string; confidence: number }> {
  return _transactions.map((transaction) => {
    const result = categorizeTransaction(transaction.description);
    return {
      category: result.category,
      confidence: result.confidence,
    };
  });
}

export function getCategorySuggestions(
  _description: string,
  _limit = 3
): Array<{ category: string; confidence: number }> {
  const normalizedDesc = _description.trim().toLowerCase();
  const suggestions: Array<{ category: string; confidence: number }> = [];

  for (const rule of SORTED_RULES) {
    if (suggestions.length >= _limit) break;

    const pattern = rule.pattern;
    let matches = false;

    if (pattern instanceof RegExp) {
      matches = pattern.test(normalizedDesc);
    } else {
      matches = normalizedDesc.includes(pattern.toLowerCase());
    }

    if (!matches) continue;

    const confidence = calculateConfidence(normalizedDesc, rule);
    const exists = suggestions.some((item) => item.category === rule.category);

    if (!exists) {
      suggestions.push({
        category: rule.category,
        confidence,
      });
    }
  }

  if (suggestions.length === 0) {
    suggestions.push({ category: 'Outros', confidence: 0.1 });
  }

  return suggestions;
}

export function detectDuplicates(
  _newTransactions: Array<{ date: string; description: string; amount: number }>,
  _existingTransactions: Array<{ date: string; description: string; amount: number }>
): Set<number> {
  const duplicates = new Set<number>();
  
  // Mapeamento O(1) com hashes para buscas instantâneas
  const existingKeys = new Set(
    _existingTransactions.map(e => `${e.date}|${Math.abs(e.amount).toFixed(2)}|${normalizeForComparison(e.description)}`)
  );

  for (let index = 0; index < _newTransactions.length; index++) {
    const transaction = _newTransactions[index];
    if (!transaction) continue;

    const key = `${transaction.date}|${Math.abs(transaction.amount).toFixed(2)}|${normalizeForComparison(transaction.description)}`;
    if (existingKeys.has(key)) {
      duplicates.add(index);
    }
  }

  return duplicates;
}

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 80);
}