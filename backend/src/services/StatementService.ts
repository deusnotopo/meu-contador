/**
 * StatementService
 * ────────────────
 * AI-powered document parsing for bank statements and invoices.
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { logger } from '../lib/logger.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
}

const PROMPT = `
  Você é um analista financeiro de classe mundial. Você está recebendo a imagem ou o conteúdo de um extrato bancário ou fatura PDF.
  Extraia todas as transações financeiras descritas e devolva estritamente o JSON com a lista.
  Regras:
  - date: 'YYYY-MM-DD'. Se o ano estiver ausente, deduza do contexo do arquivo ou assuma o ano atual.
  - description: limpe sufixos como (PGTO, TAR). Mantenha claro.
  - amount: Valor absoluto positivo (sem sinais).
  - type: 'income' quando for entrada de dinheiro na conta. 'expense' quando for saída/fatura/pagamento.
`;

export async function parseStatement(buffer: Buffer, mimeType: string, abortSignal?: AbortSignal): Promise<ExtractedTransaction[]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          transactions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                date: { type: SchemaType.STRING, description: "YYYY-MM-DD format" },
                description: { type: SchemaType.STRING },
                amount: { type: SchemaType.NUMBER },
                type: { type: SchemaType.STRING, description: "Must be 'income' or 'expense'" }
              },
              required: ["date", "description", "amount", "type"]
            }
          }
        },
        required: ["transactions"]
      }
    }
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const contentPayload = [
    `${PROMPT}\nO ano atual é ${currentYear}. Se o mês da transação for maior que ${currentMonth} e o extrato parecer recente, considere que pode ser do ano anterior (virada de ano).`,
    {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType
      }
    }
  ];

  try {
    const result = await model.generateContent(
      contentPayload, 
      // @ts-expect-error — requestOptions not fully typed in SDK
      { requestOptions: { signal: abortSignal, timeout: 45000 } }
    );

    const textResponse = result.response.text();
    const parsed = JSON.parse(textResponse);
    
    if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
      return [];
    }

    // Validação e Limpeza (Cinto de Segurança Akita)
    return parsed.transactions.map((tx: Record<string, unknown>) => {
      let date = String(tx.date);
      // Fallback para datas mal formadas (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        logger.warn(`[StatementService] Data inválida retornada pela IA: ${date}. Usando data atual.`);
        date = now.toISOString().split('T')[0]!;
      }

      return {
        date,
        description: String(tx.description || 'Transação sem descrição').substring(0, 255),
        amount: Math.abs(Number(tx.amount) || 0),
        type: tx.type === 'income' ? 'income' : 'expense'
      };
    });
  } catch (err) {
    logger.error('[StatementService] Erro crítico no processamento de extrato', err);
    throw new Error('Falha ao processar extrato bancário. Verifique se o arquivo é legível.');
  }
}
