import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
    });

    const debts = await prisma.debt.findMany({
      orderBy: { balance: "desc" },
    });

    // Create CSV content manually
    let csv = "Tipo,Data,Descrição,Categoria,Valor\n";
    
    csv += "--- TRANSAÇÕES ---\n";
    transactions.forEach(t => {
      const typeStr = t.type === 'revenue' ? 'Renda' : 'Despesa';
      csv += `${typeStr},${new Date(t.date).toLocaleDateString("pt-BR")},"${t.description}",${t.category},${t.amount}\n`;
    });

    csv += "\n--- DÍVIDAS ---\n";
    csv += "Nome,Categoria,Saldo,Juros(%am)\n";
    debts.forEach(d => {
      csv += `"${d.name}",${d.category},${d.balance},${d.interestRate}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("meu_contador_export.csv");
    return res.send(csv);

  } catch (error) {
    console.error("Error generating export:", error);
    return res.status(500).json({ error: "Failed to generate export" });
  }
});

export default router;
