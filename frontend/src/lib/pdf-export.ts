import type { Transaction, UserProfile } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AutoTableCursorDoc extends jsPDF {
  lastAutoTable?: {
    cursor?: {
      y: number;
    };
  };
}

export const exportFinancialReport = (
  transactions: Transaction[],
  profile: UserProfile | null,
  period: string,
) => {
  const doc = new jsPDF() as AutoTableCursorDoc;
  const pageWidth = doc.internal.pageSize.width;

  // Header Colors & Style
  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo-600

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
    69,
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
    startY: (doc.lastAutoTable?.cursor?.y || 80) + 15,
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
  const pageCount = (
    doc.internal as unknown as { getNumberOfPages: () => number }
  ).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Meu Contador - Inteligência para suas finanças • Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" },
    );
  }

  doc.save(`relatorio-financeiro-${period.replace(/\s/g, "-")}.pdf`);
};

export const exportTransactionsPDF = (
  title: string,
  transactions: Transaction[],
) => {
  exportFinancialReport(transactions, null, title);
};

export const exportFullMonthlyReport = (
  month: string,
  transactions: Transaction[],
  _totals: unknown,
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
  }[],
) => {
  const doc = new jsPDF() as AutoTableCursorDoc;
  const pageWidth = doc.internal.pageSize.width;

  // Header Colors & Style
  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo-600

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
    55,
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
        const label = (data.row.raw as string[])[0] || "";
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
  const pageCount = (
    doc.internal as unknown as { getNumberOfPages: () => number }
  ).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Meu Contador - DRE Gerencial • Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" },
    );
  }

  doc.save(`DRE-${new Date().toISOString().split("T")[0]}.pdf`);
};

// ── CSV / Excel Export ─────────────────────────────────────────────────────

export const exportTransactionsCSV = (
  transactions: Transaction[],
  filename = "transacoes",
) => {
  const BOM = "\uFEFF"; // UTF-8 BOM so Excel opens correctly
  const header = [
    "Data",
    "Descrição",
    "Categoria",
    "Tipo",
    "Valor (R$)",
    "Escopo",
  ].join(";");
  const rows = transactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) =>
      [
        new Date(t.date).toLocaleDateString("pt-BR"),
        `"${(t.description || "").replace(/"/g, '""')}"`,
        t.category,
        t.type === "income" ? "Receita" : "Despesa",
        t.amount.toFixed(2).replace(".", ","),
        t.scope || "personal",
      ].join(";"),
    );

  const content = BOM + [header, ...rows].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Alias — Excel opens CSV natively
export const exportTransactionsExcel = exportTransactionsCSV;

// ── Wealth Snapshot — Premium PDF Report ──────────────────────────────────────
// A boardroom-quality summary of the user's entire financial picture.
// Data is passed from the already-loaded dashboard state — zero extra API calls.

interface WealthSnapshotData {
  userName: string;
  netWorth: number; // BRL
  totalInvested: number; // BRL
  totalDebt: number; // BRL
  monthlyIncome: number; // BRL
  monthlyExpenses: number; // BRL
  monthlySurplus: number; // BRL
  fireProgress: number; // 0-100
  yearsToFire: number;
  wealthSurvivalDays: number;
  topCategories: { category: string; amount: number }[]; // BRL
  goals: { name: string; currentAmount: number; targetAmount: number }[];
  optimizationTips: string[];
}

const BRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const pct = (value: number) => `${value.toFixed(1)}%`;

export const generateWealthSnapshot = (data: WealthSnapshotData): void => {
  const doc = new jsPDF() as AutoTableCursorDoc;
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;

  // ── Color palette ──────────────────────────────────────────────────────────
  const navy: [number, number, number] = [10, 16, 36];
  const gold: [number, number, number] = [212, 175, 55];
  const indigo: [number, number, number] = [79, 70, 229];
  const emerald: [number, number, number] = [16, 185, 129];
  const rose: [number, number, number] = [244, 63, 94];
  const gray: [number, number, number] = [60, 60, 80];

  let cursorY = 0;

  // ── COVER — full dark header ───────────────────────────────────────────────
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageW, 70, "F");

  // Gold accent line
  doc.setFillColor(...gold);
  doc.rect(0, 70, pageW, 2, "F");

  // Brand
  doc.setTextColor(...gold);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("MEU CONTADOR", 20, 18);

  // Main title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("WEALTH SNAPSHOT", 20, 35);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 220);
  doc.text("Relatório de Saúde Financeira Pessoal", 20, 44);

  // Metadata — right side
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 180);
  const emissao = `Emitido em: ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`;
  doc.text(emissao, pageW - 20, 22, { align: "right" });
  doc.text(`Titular: ${data.userName}`, pageW - 20, 30, { align: "right" });

  cursorY = 85;

  // ── SECTION 1: Patrimônio Líquido ─────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...gold);
  doc.text("01  PATRIMÔNIO LÍQUIDO", 20, cursorY);
  cursorY += 5;

  autoTable(doc, {
    startY: cursorY,
    body: [
      ["Ativos Investidos", BRL(data.totalInvested), ""],
      ["Dívidas Totais", BRL(data.totalDebt), ""],
      [
        "Patrimônio Líquido",
        BRL(data.netWorth),
        data.netWorth >= 0 ? "▲ Positivo" : "▼ Negativo",
      ],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: gray },
      1: { halign: "right", fontStyle: "bold", textColor: [20, 20, 40] },
      2: {
        halign: "right",
        fontSize: 8,
        textColor: data.netWorth >= 0 ? emerald : rose,
      },
    },
    didParseCell: (hook) => {
      if (hook.section === "body" && hook.row.index === 2) {
        hook.cell.styles.fontStyle = "bold";
        hook.cell.styles.fontSize = 12;
      }
    },
  });

  cursorY = (doc.lastAutoTable?.cursor?.y ?? cursorY) + 8;

  // ── SECTION 2: Fluxo Mensal ───────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(...gold);
  doc.setFont("helvetica", "bold");
  doc.text("02  FLUXO DE CAIXA MENSAL (MÉDIA)", 20, cursorY);
  cursorY += 5;

  autoTable(doc, {
    startY: cursorY,
    body: [
      ["Receita Mensal Média", BRL(data.monthlyIncome)],
      ["Despesa Mensal Média", BRL(data.monthlyExpenses)],
      ["Saldo (Poupança Mensal)", BRL(data.monthlySurplus)],
    ],
    theme: "striped",
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: navy, textColor: 255 },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    didParseCell: (hook) => {
      if (hook.section === "body" && hook.column.index === 1) {
        const rowIdx = hook.row.index;
        hook.cell.styles.textColor =
          rowIdx === 0 ? emerald : rowIdx === 1 ? rose : indigo;
      }
    },
  });

  cursorY = (doc.lastAutoTable?.cursor?.y ?? cursorY) + 8;

  // ── SECTION 3: FIRE Progress ──────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(...gold);
  doc.setFont("helvetica", "bold");
  doc.text("03  PROGRESSO FIRE (REGRA DOS 4%)", 20, cursorY);
  cursorY += 5;

  autoTable(doc, {
    startY: cursorY,
    body: [
      ["Progresso FIRE", pct(data.fireProgress)],
      [
        "Anos Estimados para FIRE",
        data.yearsToFire >= 999 ? "∞" : `${data.yearsToFire} anos`,
      ],
      ["Fator de Sobrevivência", `${data.wealthSurvivalDays} dias`],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { textColor: gray, fontStyle: "bold" },
      1: { halign: "right", fontStyle: "bold" },
    },
  });

  cursorY = (doc.lastAutoTable?.cursor?.y ?? cursorY) + 8;

  // ── SECTION 4: Top Categorias de Gasto ───────────────────────────────────
  if (data.topCategories.length > 0) {
    doc.setFontSize(8);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("04  TOP CATEGORIAS DE GASTO (ÚLTIMOS 3 MESES)", 20, cursorY);
    cursorY += 5;

    autoTable(doc, {
      startY: cursorY,
      head: [["Categoria", "Total"]],
      body: data.topCategories.map((c, i) => [
        `${i + 1}. ${c.category}`,
        BRL(c.amount),
      ]),
      theme: "grid",
      headStyles: { fillColor: navy, textColor: 255, fontSize: 8 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 1: { halign: "right" } },
    });

    cursorY = (doc.lastAutoTable?.cursor?.y ?? cursorY) + 8;
  }

  // ── SECTION 5: Metas Financeiras ─────────────────────────────────────────
  if (data.goals.length > 0) {
    // Check if we need a new page
    if (cursorY > pageH - 80) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFontSize(8);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("05  METAS FINANCEIRAS", 20, cursorY);
    cursorY += 5;

    autoTable(doc, {
      startY: cursorY,
      head: [["Meta", "Progresso", "Atual", "Objetivo"]],
      body: data.goals.map((g) => {
        const p =
          g.targetAmount > 0
            ? Math.min(100, (g.currentAmount / g.targetAmount) * 100)
            : 0;
        return [g.name, pct(p), BRL(g.currentAmount), BRL(g.targetAmount)];
      }),
      theme: "striped",
      headStyles: { fillColor: indigo, textColor: 255, fontSize: 8 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        1: { halign: "center", fontStyle: "bold" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });

    cursorY = (doc.lastAutoTable?.cursor?.y ?? cursorY) + 8;
  }

  // ── SECTION 6: Dicas de Otimização ────────────────────────────────────────
  if (data.optimizationTips.length > 0) {
    if (cursorY > pageH - 60) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFontSize(8);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("06  RECOMENDAÇÕES DO SISTEMA", 20, cursorY);
    cursorY += 5;

    autoTable(doc, {
      startY: cursorY,
      body: data.optimizationTips.map((tip) => [tip]),
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 3, textColor: gray },
      columnStyles: { 0: { cellWidth: pageW - 40 } },
    });

    cursorY = (doc.lastAutoTable?.cursor?.y ?? cursorY) + 8;
  }

  // ── FOOTER — all pages ────────────────────────────────────────────────────
  const totalPages = (
    doc.internal as unknown as { getNumberOfPages: () => number }
  ).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom gold line
    doc.setFillColor(...gold);
    doc.rect(0, pageH - 14, pageW, 0.5, "F");

    doc.setFontSize(7);
    doc.setTextColor(150, 150, 160);
    doc.text(
      `Meu Contador · Wealth Snapshot · Documento gerado automaticamente — não substitui assessoria financeira profissional · Pág. ${i}/${totalPages}`,
      pageW / 2,
      pageH - 7,
      { align: "center" },
    );
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(
    `wealth-snapshot-${data.userName.replace(/\s+/g, "-").toLowerCase()}-${dateStr}.pdf`,
  );
};
