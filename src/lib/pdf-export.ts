import type { Transaction, UserProfile } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportFinancialReport = (
  transactions: Transaction[],
  profile: UserProfile | null,
  period: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header Colors & Style
  const primaryColor = [79, 70, 229]; // Indigo-600

  // 1. Logo & Title
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("MEU CONTADOR", 20, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("RELATÓRIO FINANCEIRO INTELIGENTE", 20, 32);

  // 2. Report Info
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Proprietário: ${profile?.name || "Usuário Meu Contador"}`, 20, 55);
  doc.text(`Período: ${period}`, 20, 62);
  doc.text(
    `Data de Emissão: ${new Date().toLocaleDateString("pt-BR")}`,
    20,
    69
  );

  // 3. Summary Boxes
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  autoTable(doc, {
    startY: 80,
    head: [["RESUMO FINANCEIRO", "VALOR"]],
    body: [
      [
        "Receitas Totais",
        new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(income),
      ],
      [
        "Despesas Totais",
        new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(expense),
      ],
      [
        "Saldo do Período",
        new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(balance),
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
  });

  // 4. Detailed Transaction Table
  const tableData = transactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => [
      new Date(t.date).toLocaleDateString("pt-BR"),
      t.description,
      t.category,
      t.type === "income" ? "RECEITA" : "DESPESA",
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(t.amount),
    ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.cursor.y + 15,
    head: [["DATA", "DESCRIÇÃO", "CATEGORIA", "TIPO", "VALOR"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [40, 40, 40], textColor: 255 },
    columnStyles: { 4: { halign: "right" } },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        if (data.cell.text[0] === "RECEITA") {
          data.cell.styles.textColor = [16, 185, 129]; // emerald
        } else {
          data.cell.styles.textColor = [244, 63, 94]; // rose
        }
      }
    },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Meu Contador - Inteligência para suas finanças • Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  doc.save(`relatorio-financeiro-${period.replace(/\s/g, "-")}.pdf`);
};

export const exportTransactionsPDF = (
  title: string,
  transactions: Transaction[]
) => {
  exportFinancialReport(transactions, null, title);
};

export const exportFullMonthlyReport = (
  month: string,
  transactions: Transaction[],
  _totals: unknown
) => {
  exportFinancialReport(transactions, null, month);
};

export const exportDRE = (
  companyName: string,
  data: {
    label: string;
    monthly: number;
    accumulated: number;
    percent: number;
  }[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header Colors & Style
  const primaryColor = [79, 70, 229]; // Indigo-600

  // 1. Logo & Title
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, 20, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (DRE)", 20, 32);

  // 2. Report Info
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Data de Emissão: ${new Date().toLocaleDateString("pt-BR")}`,
    20,
    55
  );

  // 3. Table
  const tableData = data.map((row) => [
    row.label,
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(row.monthly),
    `${row.percent.toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: 65,
    head: [["DESCRIÇÃO", "VALOR", "%"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        const label = data.row.raw[0] as string;
        if (label === "Receita Bruta" || label === "Resultado Líquido") {
          data.cell.styles.fontStyle = "bold";
        }
        if (label === "Resultado Líquido") {
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Meu Contador - DRE Gerencial • Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  doc.save(`DRE-${new Date().toISOString().split("T")[0]}.pdf`);
};
