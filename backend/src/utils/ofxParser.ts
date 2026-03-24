interface ParsedTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  description: string;
}

export const parseOfx = (ofxString: string): ParsedTransaction[] => {
  const transactions: ParsedTransaction[] = [];
  
  // Extract all <STMTTRN> blocks
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;
  
  while ((match = stmtTrnRegex.exec(ofxString)) !== null) {
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
      
      let dateIso = new Date().toISOString();
      if (dtPostedMatch && dtPostedMatch[1]) {
        // OFX dates are usually YYYYMMDDHHMMSS
        const dtStr = dtPostedMatch[1].trim();
        if (dtStr.length >= 8) {
          const year = dtStr.substring(0, 4);
          const month = dtStr.substring(4, 6);
          const day = dtStr.substring(6, 8);
          dateIso = new Date(`${year}-${month}-${day}T12:00:00Z`).toISOString();
        }
      }
      
      transactions.push({
        id: fitIdMatch ? fitIdMatch[1].trim() : Math.random().toString(36).substr(2, 9),
        type: amount >= 0 ? "income" : "expense",
        amount: amount,
        date: dateIso,
        description: memoMatch ? memoMatch[1].trim() : "Transação OFX",
      });
    }
  }
  
  return transactions;
};
