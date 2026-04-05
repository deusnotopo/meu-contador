import crypto from 'crypto';

interface ParsedTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  description: string;
}

const MAX_OFX_BYTES = 2_000_000;
const MAX_OFX_TRANSACTIONS = 2_000;

function sanitizeDescription(value: string | undefined): string {
  return (value || 'Transação OFX')
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

function parseOfxDate(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  if (normalized.length < 8) return null;
  const year = normalized.substring(0, 4);
  const month = normalized.substring(4, 6);
  const day = normalized.substring(6, 8);
  const date = new Date(`${year}-${month}-${day}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export const parseOfx = (ofxString: string): ParsedTransaction[] => {
  if (Buffer.byteLength(ofxString, 'utf8') > MAX_OFX_BYTES) {
    throw new Error('Arquivo OFX excede o limite suportado.');
  }

  const transactions: ParsedTransaction[] = [];
  
  // Extract all <STMTTRN> blocks
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;
  
  while ((match = stmtTrnRegex.exec(ofxString)) !== null) {
    if (transactions.length >= MAX_OFX_TRANSACTIONS) break;
    const block = match[1];
    
    // Extract fields
    const trnTypeMatch = block.match(/<TRNTYPE>(.*?)(?:\r?\n|<)/);
    const dtPostedMatch = block.match(/<DTPOSTED>(.*?)(?:\r?\n|<)/);
    const trnAmtMatch = block.match(/<TRNAMT>(.*?)(?:\r?\n|<)/);
    const fitIdMatch = block.match(/<FITID>(.*?)(?:\r?\n|<)/);
    const memoMatch = block.match(/<MEMO>(.*?)(?:\r?\n|<)/);
    
    // If we have an amount, parse it
    if (trnAmtMatch && trnAmtMatch[1]) {
      const amountRaw = trnAmtMatch[1].trim();
      const amount = parseFloat(amountRaw.replace(/,/g, ''));
      if (!Number.isFinite(amount)) continue;
      
      const dateIso = parseOfxDate(dtPostedMatch?.[1]) || new Date().toISOString();
      
      transactions.push({
        id: fitIdMatch?.[1]?.trim()?.slice(0, 80) || crypto.randomUUID(),
        type: amount >= 0 ? "income" : "expense",
        amount: amount,
        date: dateIso,
        description: sanitizeDescription(memoMatch?.[1]),
      });
    }
  }
  
  return transactions;
};
