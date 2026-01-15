// import { createWorker } from "tesseract.js"; // Lazy loaded now

export interface ExtractedReceiptData {
  amount: number | null;
  merchant: string | null;
  date: string | null;
  category: string;
  confidence: number;
}

export const isValidImageFile = (file: File): boolean => {
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  return validTypes.includes(file.type);
};

export const processReceiptImage = async (
  imageFile: File
): Promise<ExtractedReceiptData> => {
  // Dynamic import for code splitting (reduces bundle size)
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por"); // Portuguese language

  const ret = await worker.recognize(imageFile);
  const text = ret.data.text;
  const confidence = ret.data.confidence;

  await worker.terminate();

  return parseReceiptText(text, confidence);
};

const parseReceiptText = (
  text: string,
  confidence: number
): ExtractedReceiptData => {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Extract Amount (Look for largest currency value)
  // Improved regex for R$ 1.234,56, 1234.56, and variations like $ 1,23
  const currencyRegex = /[RBPS8\$]*\s?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+\.\d{2})/gi;
  const amounts: number[] = [];
  let match;
  while ((match = currencyRegex.exec(text)) !== null) {
    let valStr = match[1];
    if (valStr.includes(",")) {
      valStr = valStr.replace(/\./g, "").replace(",", ".");
    }
    const val = parseFloat(valStr);
    if (!isNaN(val) && val < 1000000) amounts.push(val); // Filter out crazy high values from OCR errors
  }

  // Heuristic: Total is often preceded by "TOTAL", "VALOR", "PAGO"
  const totalKeywords = ["TOTAL", "VALOR", "PAGO", "IMPORTA", "PAGAR"];
  let heuristicAmount = null;

  for (const line of lines) {
    const lineUpper = line.toUpperCase();
    if (totalKeywords.some((k) => lineUpper.includes(k))) {
      const lineMatch = line.match(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+\.\d{2})/);
      if (lineMatch) {
        let valStr = lineMatch[1];
        if (valStr.includes(","))
          valStr = valStr.replace(/\./g, "").replace(",", ".");
        heuristicAmount = parseFloat(valStr);
        break;
      }
    }
  }

  const maxAmount =
    heuristicAmount || (amounts.length > 0 ? Math.max(...amounts) : null);

  // 2. Extract Date
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dateRegex = /(\d{2})[/.-](\d{2})[/.-](\d{2,4})/;
  const dateMatch = text.match(dateRegex);
  let formattedDate = new Date().toISOString().split("T")[0];
  if (dateMatch) {
    let year = dateMatch[3];
    if (year.length === 2) year = "20" + year;
    formattedDate = `${year}-${dateMatch[2]}-${dateMatch[1]}`;
  }

  // 3. Infer Merchant
  // Look for first lines that don't contain common receipt meta-terms
  const metaTerms = [
    "CNPJ",
    "IE:",
    "IM:",
    "EXTRATO",
    "CUPOM",
    "FISCAL",
    "TERMO",
    "DATA",
    "HORA",
  ];
  let merchant = "Comércio Desconhecido";
  for (const line of lines.slice(0, 5)) {
    if (
      line.length > 3 &&
      !metaTerms.some((t) => line.toUpperCase().includes(t))
    ) {
      merchant = line;
      break;
    }
  }

  // 4. Infer Category
  const lowerText = text.toLowerCase();
  let category = "Outros";

  const categories: Record<string, string[]> = {
    Alimentação: [
      "restaurante",
      "food",
      "lanche",
      "comida",
      "mercado",
      "super",
      "atacad",
      "pão",
      "padaria",
      "pizza",
      "churrascaria",
    ],
    Transporte: [
      "uber",
      "99",
      "taxi",
      "posto",
      "gasolina",
      "combust",
      "diesel",
      "etanol",
      "estacionamento",
      "pedágio",
    ],
    Lazer: ["cinema", "teatro", "show", "bar", "cerveja", "clube", "parque"],
    Saúde: [
      "farmácia",
      "drogaria",
      "médico",
      "hospital",
      "exame",
      "clínica",
      "unimed",
    ],
    Serviços: [
      "energia",
      "luz",
      "água",
      "internet",
      "claro",
      "vivo",
      "tim",
      "mensalidade",
    ],
    Moradia: ["aluguel", "condomínio", "iptu", "reforma", "material"],
    Educação: ["escola", "curso", "faculdade", "livraria", "papelaria"],
  };

  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some((k) => lowerText.includes(k))) {
      category = cat;
      break;
    }
  }

  return {
    amount: maxAmount,
    merchant,
    date: formattedDate,
    category,
    confidence, // Tesseract confidence (0-100)
  };
};
