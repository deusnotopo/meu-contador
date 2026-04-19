/**
 * 🚀 AKITA-STYLE SERVICE: FinancialFormatter
 * Centraliza toda a lógica de exibição de dados financeiros.
 * Evita duplicação de lógicas 'fmt' e 'fmtM' nos componentes.
 */
export class FinancialFormatter {
  /**
   * Formata moeda (BRL)
   * Ex: 1200.5 -> "R$ 1.200,50"
   */
  static formatCurrency(value: number, showCents: boolean = true): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: showCents ? 2 : 0,
    }).format(value);
  }

  /**
   * Formata moeda de forma compacta (M para Milhões, K para Milhares)
   * Ex: 1200000 -> "R$ 1,2 M"
   */
  static formatCompact(value: number): string {
    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (absValue >= 1e6) {
      return `${sign}R$ ${(absValue / 1e6).toFixed(2).replace(".", ",")} M`;
    }
    if (absValue >= 1e3) {
      return `${sign}R$ ${(absValue / 1e3).toFixed(1).replace(".", ",")} K`;
    }

    return this.formatCurrency(value, false);
  }

  /**
   * Formata data para exibição curta no dashboard
   * Ex: "2024-04-17" -> "17 Abr"
   */
  static formatShortDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date
        .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
        .replace(".", "");
    } catch {
      return dateStr;
    }
  }

  /**
   * Formata percentuais
   * Ex: 0.125 -> "12,5%"
   */
  static formatPercent(value: number, decimals: number = 1): string {
    return `${(value * 100).toFixed(decimals).replace(".", ",")}%`;
  }
}
