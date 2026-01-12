import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "./formatters";

interface ExportData {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: any[][];
  filename: string;
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

export const exportDRE = (title: string, data: any) => {
  const headers = ["Categoria", "Mensal", "Acumulado", "Análise (%)"];
  const rows = data.map((item: any) => [
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

export const exportTransactions = (title: string, transactions: any[]) => {
  const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor"];
  const rows = transactions.map((t: any) => [
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
    filename: `Transacoes_${title.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }`,
  });
};
