import { formatCurrency } from "../formatters.js";

interface WeeklyReportData {
  userName: string;
  period: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  topExpenses: { category: string; amount: number }[];
  savingsRate: number;
  healthScore: number;
  insight: string;
}

export const generateWeeklyEmailHtml = (data: WeeklyReportData): string => {
  const isPositive = data.balance >= 0;
  const healthColor =
    data.healthScore >= 70
      ? "#22c55e"
      : data.healthScore >= 40
      ? "#eab308"
      : "#ef4444";

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 32px; text-align: center; color: white; }
        .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; margin-bottom: 8px; }
        .period { font-size: 14px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 32px; }
        .score-card { text-align: center; margin-bottom: 32px; }
        .score-val { font-size: 48px; font-weight: 900; color: ${healthColor}; margin: 0; line-height: 1; }
        .score-lbl { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
        .stat-box { background-color: #f1f5f9; padding: 16px; border-radius: 12px; text-align: center; }
        .stat-lbl { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
        .stat-val { font-size: 18px; font-weight: 700; color: #0f172a; }
        .income { color: #22c55e; }
        .expense { color: #ef4444; }
        .list { margin-bottom: 32px; }
        .list-header { font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        .list-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .footer { background-color: #0f172a; padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; }
        .btn { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Meu Contador</div>
          <div class="period">Relatório Semanal • ${data.period}</div>
        </div>
        
        <div class="content">
          <div class="score-card">
            <p class="score-val">${Math.round(data.healthScore)}</p>
            <p class="score-lbl">Saúde Financeira</p>
          </div>

          <div class="grid">
            <div class="stat-box">
              <div class="stat-lbl">Entradas</div>
              <div class="stat-val income">${formatCurrency(
                data.totalIncome
              )}</div>
            </div>
            <div class="stat-box">
              <div class="stat-lbl">Saídas</div>
              <div class="stat-val expense">${formatCurrency(
                data.totalExpense
              )}</div>
            </div>
            <div class="stat-box">
              <div class="stat-lbl">Saldo</div>
              <div class="stat-val" style="color: ${
                isPositive ? "#22c55e" : "#ef4444"
              }">
                ${formatCurrency(data.balance)}
              </div>
            </div>
            <div class="stat-box">
              <div class="stat-lbl">Poupança</div>
              <div class="stat-val">${data.savingsRate.toFixed(0)}%</div>
            </div>
          </div>

          <div class="list">
            <div class="list-header">MAIORES GASTOS</div>
            ${data.topExpenses
              .map(
                (item) => `
              <div class="list-item">
                <span>${item.category}</span>
                <span class="expense">${formatCurrency(item.amount)}</span>
              </div>
            `
              )
              .join("")}
          </div>

          <div style="background: #eff6ff; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 4px;">
            <strong style="color: #312e81; font-size: 14px;">💡 Insight da Semana:</strong>
            <p style="margin: 8px 0 0 0; color: #4338ca; font-size: 14px; line-height: 1.5;">${
              data.insight
            }</p>
          </div>

          <div style="text-align: center;">
            <a href="https://meu-contador-one.vercel.app/" class="btn">Abrir Painel Completo</a>
          </div>
        </div>

        <div class="footer">
          <p>© 2026 Meu Contador Online. Inteligência Financeira.</p>
          <p>Você está recebendo este email porque assinou o plano Pro.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
