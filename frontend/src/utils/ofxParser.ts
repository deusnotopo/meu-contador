export interface OFXTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  description: string;
  category: string;
}

export function parseOFX(ofxString: string): OFXTransaction[] {
  const transactions: OFXTransaction[] = [];
  
  // Clean SGML headers to make it easier to regex
  const sgml = ofxString.replace(/>\s+</g, '><');
  
  // Match all STMTTRN generic blocks
  const stmtRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;

  while ((match = stmtRegex.exec(sgml)) !== null) {
    const block = match[1];

    if (!block) continue;
    // DTPOSTED value
    const dateMatch = block.match(/<DTPOSTED>([^<]+)/);
    // TRNAMT value
    const amtMatch = block.match(/<TRNAMT>([^<]+)/);
    // MEMO or NAME value
    const memoMatch = block.match(/<MEMO>([^<]+)/) || block.match(/<NAME>([^<]+)/);

    if (dateMatch?.[1] && amtMatch?.[1]) {
      // OFX Date is usually YYYYMMDDHHMMSS or YYYYMMDD
      const rawDate = dateMatch[1].trim().substring(0, 8); // get YYYYMMDD
      const date = `${rawDate.substring(0,4)}-${rawDate.substring(4,6)}-${rawDate.substring(6,8)}`;
      
      const rawAmt = parseFloat(amtMatch[1].trim());
      const type = rawAmt >= 0 ? "income" : "expense";
      const amount = Math.abs(rawAmt);

      let description = memoMatch?.[1] ? memoMatch[1].trim() : "Transação";

      // Simple heuristic clean
      description = description
        .replace(/(COMPRA CARTAO|PGTO PIX|TARIFA BANCARIA)/i, "")
        .replace(new RegExp("[\\d/-]+", "g"), "") // remove numbers and dates
        .trim();

      if (!description) description = "Diversos";

      // Basic categorization heuristic
      let category = "Outros";
      const d = description.toLowerCase();
      if (type === "expense") {
        if (d.includes("uber") || d.includes("99")) category = "Transporte";
        else if (d.includes("ifood") || d.includes("rappi")) category = "Delivery";
        else if (d.includes("mercado") || d.includes("pao de acucar") || d.includes("carrefour")) category = "Mercado";
        else if (d.includes("netflix") || d.includes("spotify") || d.includes("amazon")) category = "Assinaturas";
      }

      transactions.push({
        id: Math.random().toString(36).substring(7),
        type,
        amount,
        date,
        description,
        category
      });
    }
  }

  return transactions;
}
