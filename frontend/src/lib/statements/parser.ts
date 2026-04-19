import type { StatementTransaction, StatementFormat } from '../../../../shared/types-statement';
import type { StatementProvenance } from '../../../../shared/types-statement-provenance';
import type { DataReliability } from '../../../../shared/contracts';
import { api } from '../api';

const MAX_STATEMENT_FILE_BYTES = 8 * 1024 * 1024;
const MAX_STATEMENT_ROWS = 5_000;
const MAX_TEXT_FIELD_LENGTH = 200;

function buildProvenance(file: File, provenance: Omit<StatementProvenance, 'sourceFileName'>): StatementProvenance {
  return {
    ...provenance,
    sourceFileName: file.name,
  };
}



export async function parseStatementFile(file: File, format: StatementFormat): Promise<StatementTransaction[]> {
  if (file.size > MAX_STATEMENT_FILE_BYTES) {
    throw new Error('Arquivo excede o limite suportado para importação.');
  }

  switch (format) {
    case 'csv':
      return parseCSV(file);
    case 'ofx':
      return parseOFX(file);
    case 'pdf':
    case 'image':
      return parseWithGeminiAPI(file);
    default:
      throw new Error(`Formato não suportado: ${format}`);
  }
}

export function detectFormat(file: File): StatementFormat {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'ofx') return 'ofx';
  if (ext === 'csv' || ext === 'tsv') return 'csv';
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return 'image';
  return 'csv';
}

async function parseCSV(file: File): Promise<StatementTransaction[]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length > MAX_STATEMENT_ROWS) throw new Error('CSV excede o limite de linhas suportado.');
  const transactions: StatementTransaction[] = [];
  const startRow = lines[0]?.match(/date|data|description|descrição/i) ? 1 : 0;
  for (let i = startRow; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = splitDelimitedLine(line);
    if (cols.length < 3) continue;
    const date = parseDate(cols[0] || '');
    const description = sanitizeText(cols[1] || '');
    const amount = parseAmount(cols[2] || '');
    if (date && description && !isNaN(amount)) {
      transactions.push({
        id: `csv-${i}`,
        importId: '',
        date,
        description,
        amount: Math.abs(amount),
        type: amount >= 0 ? 'income' as const : 'expense' as const,
        originalDescription: description,
        dataReliability: 'REAL' as DataReliability,
        provenance: buildProvenance(file, {
          origin: 'BANK_FILE',
          reliability: 'REAL',
          parser: 'csv',
          extractionMethod: 'structured',
          confidence: 1,
        }),
        status: 'pending' as const,
      });
    }
  }
  return transactions;
}

async function parseOFX(file: File): Promise<StatementTransaction[]> {
  const text = await file.text();
  const transactions: StatementTransaction[] = [];
  const txnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  let idx = 0;
  while ((match = txnRegex.exec(text)) !== null) {
    if (transactions.length >= MAX_STATEMENT_ROWS) break;
    const block = match[1];
    if (!block) continue;
    // const type = block.match(/<TRNTYPE>(\w+)/)?.[1]; // Unused
    const dateStr = block.match(/<DTPOSTED>(\d{8})/)?.[1];
    const amountStr = block.match(/<TRNAMT>([-\d.]+)/)?.[1];
    const memo = sanitizeText(block.match(/<MEMO>(.*?)$/m)?.[1] || 'Transação OFX');
    const fitid = block.match(/<FITID>(.*?)$/m)?.[1];
    if (dateStr && amountStr) {
      const date = `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
      const amount = parseFloat(amountStr);
      transactions.push({
        id: fitid || `ofx-${idx}`,
        importId: '',
        date,
        description: memo,
        amount: Math.abs(amount),
        type: amount >= 0 ? 'income' as const : 'expense' as const,
        originalDescription: memo,
        dataReliability: 'REAL' as DataReliability,
        provenance: buildProvenance(file, {
          origin: 'BANK_FILE',
          reliability: 'REAL',
          parser: 'ofx',
          extractionMethod: 'structured',
          confidence: 1,
        }),
        status: 'pending' as const,
      });
      idx++;
    }
  }
  return transactions;
}

async function parseWithGeminiAPI(file: File): Promise<StatementTransaction[]> {
  const formData = new FormData();
  formData.append('file', file);

  interface GeminiTransaction {
    date?: string;
    description?: string;
    amount?: number;
    type?: string;
  }

  try {
    const data = await api.post<{ transactions?: GeminiTransaction[] }>('/statements/upload', formData);
    const rawTransactions = data.transactions || [];

    return rawTransactions.map((tx, i: number): StatementTransaction => ({
      id: `gemini-${i}`,
      importId: '',
      date: tx.date || new Date().toISOString().split('T')[0] || '',
      description: tx.description || 'Transação IA',
      amount: Math.abs(tx.amount || 0),
      type: tx.type === 'income' ? 'income' : 'expense',
      originalDescription: tx.description,
      dataReliability: 'REAL' as DataReliability,
      provenance: buildProvenance(file, {
        origin: 'OCR_EXTRACTED',
        reliability: 'REAL',
        parser: 'image-ocr',
        extractionMethod: 'structured',
        confidence: 0.99,
      }),
      status: 'pending',
    }));
  } catch (err: unknown) {
    console.error('[parser] Gemini API failed:', err);
    throw new Error('Falha ao processar extrato com IA. Tente novamente.');
  }
}

function parseDate(str: string): string {
  const cleaned = str.replace(/[^0-9/\-.]/g, '');
  const parts = cleaned.split(/[/.-]/);
  if (parts.length === 3) {
    const day = parts[0]?.padStart(2, '0');
    const month = parts[1]?.padStart(2, '0');
    let year = parts[2];
    if (year?.length === 2) year = '20' + year;
    if (day && month && year) return `${year}-${month}-${day}`;
  }
  return '';
}

function parseAmount(str: string): number {
  const cleaned = str.replace(/[^-\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned);
}

function splitDelimitedLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === ';' || char === ',' || char === '\t')) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function sanitizeText(value: string): string {
  return Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .replace(/^[-+=@]+/, '')
    .trim()
    .slice(0, MAX_TEXT_FIELD_LENGTH);
}