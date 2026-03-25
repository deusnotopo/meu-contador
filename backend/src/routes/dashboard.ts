import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/history", async (req, res) => {
  try {
    const userId = "dcc6d05f-fb94-469a-9e2d-3c22adfa874e"; // Hardcoded from system

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      select: { amount: true, type: true, date: true }
    });

    // Agrupamento manual de histórico dos últimos 6 meses
    // Um mapeamento simples agregando sum de Receitas - Despesas por mês
    const historyMap = new Map<string, number>();
    
    const now = new Date();
    // Initialize last 6 months 
    for(let i=5; i>=0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthYear = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        historyMap.set(monthYear, 0); // initial balance difference
    }

    // Apenas simular variação líquida para o gráfico de patrimônio ("equity")
    // Note: isso é a "variação", precisamos adicionar isso ao patrimônio base.
    let baseEquity = 15000; // Patrimonio fixo inicial para base do gráfico se for conta nova
    
    // Aggregating variations (Renda - Despesa)
    transactions.forEach(t => {
      const d = new Date(t.date);
      const monthYear = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      if (historyMap.has(monthYear)) {
         const diff = t.type === 'revenue' ? t.amount : -t.amount;
         historyMap.set(monthYear, historyMap.get(monthYear)! + diff);
      }
    });

    const equityHistory: { month: string, value: number }[] = [];
    
    // Soma cumulativa do baseEquity
    historyMap.forEach((variation, month) => {
        baseEquity += variation;
        equityHistory.push({
            month: month.charAt(0).toUpperCase() + month.slice(1),
            value: baseEquity
        });
    });

    return res.json({ equityHistory });

  } catch (error) {
    console.error("Error generating dashboard history:", error);
    return res.status(500).json({ error: "Failed to fetch dashboard history" });
  }
});

export default router;
