import { Transaction } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "./formatters";

interface ExportData {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | { content: string; styles: object })[][];
  filename: string;
}

export interface DREItem {
  label: string;
  monthly: number;
  accumulated: number;
  percent: number;
}

export const exportToPDF = ({
  title,
  subtitle,
  headers,
  rows,
  filename,
}: ExportData) => {
  const doc = jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(33, 33, 33);
  doc.text(title, 14, 22);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 30);
  }

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 35, pageWidth - 14, 35);

  // Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 40,
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [79, 70, 229], // Primary color
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 255],
    },
    margin: { top: 40 },
  });

  // Footer
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const date = new Date().toLocaleString("pt-BR");
    doc.text(
      `Gerado por Meu Contador em ${date} - Página ${i} de ${pageCount}`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  doc.save(`${filename}.pdf`);
};

export const exportDRE = (title: string, data: DREItem[]) => {
  const headers = ["Categoria", "Mensal", "Acumulado", "Análise (%)"];
  const rows = data.map((item: DREItem) => [
    item.label,
    formatCurrency(item.monthly),
    formatCurrency(item.accumulated),
    `${item.percent.toFixed(1)}%`,
  ]);

  exportToPDF({
    title: `Demonstrativo de Resultados (DRE) - ${title}`,
    subtitle:
      "Relatório financeiro detalhado de receitas e despesas corporativas.",
    headers,
    rows,
    filename: `DRE_${title.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }`,
  });
};

export const exportTransactions = (
  title: string,
  transactions: Transaction[]
) => {
  const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor"];
  const rows = transactions.map((t: Transaction) => [
    new Date(t.date).toLocaleDateString("pt-BR"),
    t.description,
    t.category,
    t.type === "income" ? "Receita" : "Despesa",
    formatCurrency(t.amount),
  ]);

  exportToPDF({
    title: `Relatório de Transações - ${title}`,
    subtitle: `Total de ${transactions.length} transações registradas no período.`,
    headers,
    rows,
    filename: `Relatorio_Transacoes_${title.replace(/\s+/g, "_")}`,
  });
};

export const exportFullMonthlyReport = (
  month: string,
  transactions: Transaction[],
  totals: { income: number; expense: number; balance: number }
) => {
  const doc = jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [79, 70, 229]; // Indigo-600

  // 1. Cover / Header Section
  doc.setFillColor(31, 41, 55); // Dark Slate
  doc.rect(0, 0, pageWidth, 50, "F");

  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO FINANCEIRO MENSAL", 14, 25);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Período: ${month}`, 14, 35);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 42);

  // 2. Executive Summary Cards (Visual Layout)
  doc.setDrawColor(229, 231, 235);

  // Card 1: Receita
  doc.roundedRect(14, 60, 58, 25, 3, 3);
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text("TOTAL RECEITAS", 18, 68);
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129); // Success Green
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(totals.income), 18, 78);

  // Card 2: Despesa
  doc.roundedRect(76, 60, 58, 25, 3, 3);
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text("TOTAL DESPESAS", 80, 68);
  doc.setFontSize(14);
  doc.setTextColor(239, 68, 68); // Danger Red
  doc.text(formatCurrency(totals.expense), 80, 78);

  // Card 3: Saldo
  doc.roundedRect(138, 60, 58, 25, 3, 3);
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text("SALDO LÍQUIDO", 142, 68);
  doc.setFontSize(14);
  doc.setTextColor(
    totals.balance >= 0 ? 59 : 239,
    totals.balance >= 0 ? 130 : 68,
    totals.balance >= 0 ? 246 : 68
  );
  doc.text(formatCurrency(totals.balance), 142, 78);

  // 3. Methodology 50-30-20 Breakdown
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalExp = expenses.reduce((sum, t) => sum + t.amount, 0);
  const getP = (cls: string) => {
    const v = expenses
      .filter((t) => t.classification === cls)
      .reduce((s, t) => s + t.amount, 0);
    return totalExp > 0 ? (v / totalExp) * 100 : 0;
  };

  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text("ANÁLISE DE ESTRUTURA (50-30-20)", 14, 100);

  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(
    `Necessidades: ${getP("necessity").toFixed(1)}% (Alvo: 50%)`,
    14,
    110
  );
  doc.text(`Desejos: ${getP("want").toFixed(1)}% (Alvo: 30%)`, 14, 116);
  doc.text(
    `Investimentos: ${getP("investment").toFixed(1)}% (Alvo: 20%)`,
    14,
    122
  );

  // 4. Detailed Transaction Table
  const tableHeaders = ["Data", "Descrição", "Categoria", "Valor"];
  const tableRows = transactions.map((t) => [
    new Date(t.date).toLocaleDateString("pt-BR"),
    t.description,
    t.category,
    {
      content: formatCurrency(t.amount),
      styles: {
        halign: "right",
        textColor: t.type === "income" ? [16, 185, 129] : [239, 68, 68],
      },
    },
  ]);

  autoTable(doc, {
    startY: 130,
    head: [tableHeaders],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [31, 41, 55] },
    styles: { fontSize: 8 },
    margin: { horizontal: 14 },
  });

  // Footer / Signature
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  if (finalY < doc.internal.pageSize.getHeight() - 40) {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.line(14, finalY + 15, 80, finalY + 15);
    doc.text("Responsável Financeiro", 14, finalY + 22);

    doc.line(pageWidth - 80, finalY + 15, pageWidth - 14, finalY + 15);
    doc.text("Aprovação Diretoria", pageWidth - 80, finalY + 22);
  }

  doc.save(`Relatorio_Mensal_${month.replace(/\//g, "-")}.pdf`);
};
