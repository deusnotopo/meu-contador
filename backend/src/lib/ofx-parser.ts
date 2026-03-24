/**
 * OFX / QFX Parser
 * Suporta o formato SGML legado (bancos brasileiros como Itaú, Bradesco, BB)
 * e o formato XML moderno (Nubank, Inter, XP).
 *
 * O formato OFX SGML não é XML válido — cada campo é uma tag sem fechamento.
 * Por isso usamos regex targetados em vez de um parser XML genérico.
 */

export interface OFXTransaction {
  fitid: string;          // ID único do banco
  type: 'income' | 'expense';
  amount: number;         // Sempre positivo
  date: Date;
  description: string;    // MEMO ou NAME
  category: string;       // Inferida do tipo e descrição
  paymentMethod: string;
}

export interface OFXResult {
  bankId?: string;
  accountId?: string;
  currency: string;
  startDate?: Date;
  endDate?: Date;
  transactions: OFXTransaction[];
}

// ------------------------------------------------------------------
// Extratores de campo SGML
// ------------------------------------------------------------------
function extractField(content: string, tag: string): string | undefined {
  // Primeira tentativa: formato XML <TAG>value</TAG>
  const xmlMatch = content.match(new RegExp(`<${tag}>([^<]+)</${tag}>`, 'i'));
  if (xmlMatch) return xmlMatch[1].trim();

  // Segunda tentativa: formato SGML <TAG>value (sem fechamento)
  const sgmlMatch = content.match(new RegExp(`<${tag}>([^\\r\\n<]+)`, 'i'));
  if (sgmlMatch) return sgmlMatch[1].trim();

  return undefined;
}

// ------------------------------------------------------------------
// Parser de data OFX: 20240318 ou 20240318120000[-3:BRT]
// ------------------------------------------------------------------
function parseOFXDate(raw: string): Date {
  const clean = raw.replace(/\[.*\]/, '').trim(); // remove timezone bracket
  const year  = parseInt(clean.substring(0, 4), 10);
  const month = parseInt(clean.substring(4, 6), 10) - 1;
  const day   = parseInt(clean.substring(6, 8), 10);
  return new Date(year, month, day, 12, 0, 0); // meio-dia para evitar drift de fuso
}

// ------------------------------------------------------------------
// Categorizador automático por palavras-chave na descrição
// ------------------------------------------------------------------
function inferCategory(description: string, type: 'income' | 'expense'): string {
  if (type === 'income') {
    const inc = description.toLowerCase();
    if (inc.includes('salário') || inc.includes('salario') || inc.includes('pgto') || inc.includes('folha')) return 'Salário';
    if (inc.includes('pix') || inc.includes('transferência') || inc.includes('ted') || inc.includes('doc')) return 'Transferência';
    if (inc.includes('divid') || inc.includes('rendimento') || inc.includes('jcp')) return 'Investimentos';
    if (inc.includes('estorno') || inc.includes('devolução')) return 'Estorno';
    return 'Outros Ganhos';
  }

  const d = description.toLowerCase();
  if (/(supermercado|mercado|hortifruti|atacado|feira|carrefour|extra|pão de açúcar|raiar)/i.test(d)) return 'Alimentação';
  if (/(restau|lanchon|mcdonald|burger|pizza|ifood|rappi|sushi|bar )/i.test(d)) return 'Alimentação';
  if (/(uber|99|táxi|combustível|gasolina|posto|shell|ipiranga|br distribui)/i.test(d)) return 'Transporte';
  if (/(metrô|metro|ônibus|onibus|bilhete|linha |passagem)/i.test(d)) return 'Transporte';
  if (/(netflix|spotify|youtube|deezer|disney|prime|hbo|globoplay)/i.test(d)) return 'Lazer';
  if (/(cinema|teatro|show|ingresso|ticketmaster)/i.test(d)) return 'Lazer';
  if (/(farmácia|farmacia|drogaria|ultrafarma|pacheco|raia)/i.test(d)) return 'Saúde';
  if (/(hospital|clínica|clinica|médico|dentista|exame|laboratório)/i.test(d)) return 'Saúde';
  if (/(luz|energia|enel|cemig|copel|cpfl|coelba)/i.test(d)) return 'Moradia';
  if (/(água|sabesp|cedae|sanepar|sanasa)/i.test(d)) return 'Moradia';
  if (/(aluguel|condomín|condomin|iptu)/i.test(d)) return 'Moradia';
  if (/(amazon|shopee|mercado livre|americanas|submarino|magazine)/i.test(d)) return 'Compras';
  if (/(escola|faculdade|mensalidade|curso|udemy|alura)/i.test(d)) return 'Educação';
  if (/(cartão|credito|crédito|fatura|anuidade)/i.test(d)) return 'Cartão de Crédito';
  if (/(pix receb|pix enviado|transferência)/i.test(d)) return 'Transferência';
  if (/(iof|imposto|ir |irpf|tributo)/i.test(d)) return 'Impostos';
  return 'Outros';
}

// ------------------------------------------------------------------
// Infere o método de pagamento pelo tipo OFX
// ------------------------------------------------------------------
function inferPaymentMethod(trnType: string, description: string): string {
  const upper = trnType.toUpperCase();
  if (upper === 'CREDIT') return 'Crédito';
  if (upper === 'DEBIT')  return 'Débito';
  if (upper === 'INT' || upper === 'DIV') return 'Investimento';

  const d = description.toLowerCase();
  if (d.includes('pix'))  return 'Pix';
  if (d.includes('ted'))  return 'TED';
  if (d.includes('doc'))  return 'DOC';
  if (d.includes('cheque') || d.includes('check')) return 'Cheque';
  if (d.includes('boleto')) return 'Boleto';
  return 'Débito';
}

// ------------------------------------------------------------------
// Extrai todos os blocos <STMTTRN>...</STMTTRN> (SGML e XML)
// ------------------------------------------------------------------
function extractTransactionBlocks(content: string): string[] {
  const blocks: string[] = [];

  // Tenta XML primeiro
  const xmlRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  while ((match = xmlRegex.exec(content)) !== null) {
    blocks.push(match[1]);
  }
  if (blocks.length > 0) return blocks;

  // SGML: delimitado por <STMTTRN> até o próximo <STMTTRN> ou <BANKTRANLIST>
  const lines = content.split(/\r?\n/);
  let current: string[] = [];
  let inside = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toUpperCase() === '<STMTTRN>') {
      inside = true;
      current = [];
    } else if (inside && (trimmed.toUpperCase() === '</STMTTRN>' || trimmed.toUpperCase() === '<STMTTRN>')) {
      if (current.length > 0) blocks.push(current.join('\n'));
      current = trimmed.toUpperCase() === '<STMTTRN>' ? [] : [];
      inside = trimmed.toUpperCase() === '<STMTTRN>';
    } else if (inside) {
      current.push(line);
    }
  }
  if (inside && current.length > 0) blocks.push(current.join('\n'));

  return blocks;
}

// ------------------------------------------------------------------
// Parser principal
// ------------------------------------------------------------------
export function parseOFX(raw: string): OFXResult {
  const content = raw.replace(/\r\n/g, '\n');

  const currency = extractField(content, 'CURDEF') || 'BRL';
  const bankId   = extractField(content, 'BANKID');
  const accountId = extractField(content, 'ACCTID');

  const dtStartRaw = extractField(content, 'DTSTART');
  const dtEndRaw   = extractField(content, 'DTEND');

  const startDate = dtStartRaw ? parseOFXDate(dtStartRaw) : undefined;
  const endDate   = dtEndRaw   ? parseOFXDate(dtEndRaw)   : undefined;

  const blocks = extractTransactionBlocks(content);

  const transactions: OFXTransaction[] = blocks
    .map((block): OFXTransaction | null => {
      try {
        const trnType   = extractField(block, 'TRNTYPE') || 'DEBIT';
        const dtPosted  = extractField(block, 'DTPOSTED');
        const amtRaw    = extractField(block, 'TRNAMT');
        const fitid     = extractField(block, 'FITID') || `ofx-${Date.now()}-${Math.random()}`;
        const memo      = extractField(block, 'MEMO');
        const name      = extractField(block, 'NAME');

        if (!dtPosted || !amtRaw) return null;

        const rawAmt = parseFloat(amtRaw.replace(',', '.'));
        if (isNaN(rawAmt)) return null;

        const isIncome = rawAmt > 0;
        const amount   = Math.abs(rawAmt);
        const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';

        // Prefere MEMO, cai para NAME
        const description = (memo || name || 'Sem descrição')
          .replace(/[<>]/g, '')   // sanitize
          .substring(0, 200)      // limita tamanho
          .trim();

        const date          = parseOFXDate(dtPosted);
        const category      = inferCategory(description, type);
        const paymentMethod = inferPaymentMethod(trnType, description);

        return { fitid, type, amount, date, description, category, paymentMethod };
      } catch {
        return null;
      }
    })
    .filter((t): t is OFXTransaction => t !== null);

  return { bankId, accountId, currency, startDate, endDate, transactions };
}
