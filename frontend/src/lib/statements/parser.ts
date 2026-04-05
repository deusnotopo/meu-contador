import type { StatementTransaction, StatementFormat } from '../../../../shared/types-statement';
import type { StatementProvenance, StatementParsingIssue } from '../../../../shared/types-statement-provenance';

const MAX_STATEMENT_FILE_BYTES = 8 * 1024 * 1024;
const MAX_STATEMENT_ROWS = 5_000;
const MAX_TEXT_FIELD_LENGTH = 200;

function buildProvenance(file: File, provenance: Omit<StatementProvenance, 'sourceFileName'>): StatementProvenance {
  return {
    ...provenance,
    sourceFileName: file.name,
  };
}

function buildIssue(issue: StatementParsingIssue): StatementParsingIssue {
  return issue;
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
      return parsePDF(file);
    case 'image':
      return parseImage(file);
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
        type: amount >= 0 ? 'income' : 'expense',
        originalDescription: description,
        dataReliability: 'REAL',
        provenance: buildProvenance(file, {
          origin: 'BANK_FILE',
          reliability: 'REAL',
          parser: 'csv',
          extractionMethod: 'structured',
          confidence: 1,
        }),
        status: 'pending',
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
        type: amount >= 0 ? 'income' : 'expense',
        originalDescription: memo,
        dataReliability: 'REAL',
        provenance: buildProvenance(file, {
          origin: 'BANK_FILE',
          reliability: 'REAL',
          parser: 'ofx',
          extractionMethod: 'structured',
          confidence: 1,
        }),
        status: 'pending',
      });
      idx++;
    }
  }
  return transactions;
}

async function parsePDF(file: File): Promise<StatementTransaction[]> {
  const text = await file.text();
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length > MAX_STATEMENT_ROWS) throw new Error('PDF extraído excede o limite de linhas suportado.');
  const transactions: StatementTransaction[] = [];
  const dateRegex = /(\d{2})[/.-](\d{2})[/.-](\d{2,4})/;
  const amountRegex = /[-+]?\s*R?\$?\s?[\d.,]+/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const dateMatch = line.match(dateRegex);
    const amountMatch = line.match(amountRegex);
    if (dateMatch && amountMatch) {
      let year = dateMatch[3] || '2024';
      if (year.length === 2) year = '20' + year;
      const date = `${year}-${dateMatch[2]}-${dateMatch[1]}`;
      const amountStr = (amountMatch[0] || '').replace(/[^-\d.,]/g, '').replace(/\./g, '').replace(',', '.');
      const amount = parseFloat(amountStr);
      const description = sanitizeText(line.replace(dateRegex, '').replace(amountRegex, ''));
      if (!isNaN(amount)) {
        const issues: StatementParsingIssue[] = [];
        if (!description) {
          issues.push(buildIssue({
            code: 'PARTIAL_DESCRIPTION',
            severity: 'warning',
            message: 'Descrição parcial inferida a partir de linha PDF.',
          }));
        }

        transactions.push({
          id: `pdf-${i}`,
          importId: '',
          date,
          description: description || 'Transação PDF',
          amount: Math.abs(amount),
          type: amount >= 0 ? 'income' : 'expense',
          originalDescription: description,
          dataReliability: 'HEURISTIC',
          provenance: buildProvenance(file, {
            origin: 'PDF_TEXT_EXTRACTED',
            reliability: 'HEURISTIC',
            parser: 'pdf-text',
            extractionMethod: 'regex',
            confidence: description ? 0.78 : 0.62,
            issues,
          }),
          status: 'pending',
        });
      }
    }
  }
  return transactions;
}

async function parseImage(file: File): Promise<StatementTransaction[]> {
  const { processReceiptImage } = await import('../ocr/tesseract-service');
  const data = await processReceiptImage(file);
  if (data.amount) {
    const confidence = data.confidence / 100;
    const issues: StatementParsingIssue[] = confidence < 0.75
      ? [buildIssue({
          code: 'LOW_CONFIDENCE_OCR',
          severity: 'warning',
          message: 'OCR com baixa confiança; revise antes de confirmar.',
        })]
      : [];

    return [{
      id: 'img-1',
      importId: '',
      date: data.date || new Date().toISOString().split('T')[0] || '',
      description: data.merchant || 'Recibo',
      amount: data.amount,
      type: 'expense',
      category: data.category,
      categoryConfidence: confidence,
      originalDescription: sanitizeText(data.merchant || ''),
      dataReliability: confidence >= 0.85 ? 'ESTIMATED' : 'HEURISTIC',
      provenance: buildProvenance(file, {
        origin: 'OCR_EXTRACTED',
        reliability: confidence >= 0.85 ? 'ESTIMATED' : 'HEURISTIC',
        parser: 'image-ocr',
        extractionMethod: 'ocr',
        confidence,
        issues,
      }),
      status: 'pending',
    }];
  }
  return [];
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
  const withoutControlChars = Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join(' ');

  return value
    .replace(value, withoutControlChars)
    .replace(/\s+/g, ' ')
    .replace(/^[-+=@]+/, '')
    .trim()
    .slice(0, MAX_TEXT_FIELD_LENGTH);
}