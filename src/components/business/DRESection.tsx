import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { exportDRE } from "@/lib/pdf-export";
import type { Transaction } from "@/types";
import {
  Download,
  FileText,
  Percent,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface Props {
  transactions: Transaction[];
}

export const DRESection = ({ transactions }: Props) => {
  // Receita
  const grossIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  // Despesas por Categorias do DRE - Lógica Flexível (Keywords)
  const filterByKeywords = (keywords: string[]) =>
    transactions
      .filter((t) => {
        if (t.type !== "expense") return false;
        const cat = t.category.toLowerCase();
        return keywords.some((k) => cat.includes(k.toLowerCase()));
      })
      .reduce((s, t) => s + t.amount, 0);

  // Categorias baseadas em palavras-chave comuns
  const taxes = filterByKeywords([
    "imposto",
    "taxa",
    "tributo",
    "das",
    "simples",
    "darf",
  ]);
  const cogs = filterByKeywords([
    "fornecedor",
    "mercadoria",
    "estoque",
    "compra",
    "produção",
    "matéria",
  ]);
  const personnel = filterByKeywords([
    "salário",
    "folha",
    "sócio",
    "prolabore",
    "fgts",
    "inss",
    "benefício",
  ]);

  // Operacional = Tudo que não foi capturado acima
  // Para evitar contagem dupla, filtramos explicitamente o que JÁ foi somado
  const calculatedExpenseIds = new Set(
    transactions
      .filter((t) => t.type === "expense")
      .filter((t) => {
        const cat = t.category.toLowerCase();
        const allKeywords = [
          "imposto",
          "taxa",
          "tributo",
          "das",
          "simples",
          "darf",
          "iss",
          "icms",
          "irpj",
          "pis",
          "cofins",
          "fgts",
          "inss",
          "prolabore",
          "pro-labore",
          "salário",
          "folha",
          "sócio",
          "benefício",
          "vale",
          "fornecedor",
          "mercadoria",
          "estoque",
          "compra",
          "matéria",
          "logística",
          "frete",
        ];

        return allKeywords.some((k) => cat.includes(k));
      })
      .map((t) => t.id)
  );

  const operational = transactions
    .filter((t) => t.type === "expense" && !calculatedExpenseIds.has(t.id))
    .reduce((s, t) => s + t.amount, 0);

  const totalExpenses = taxes + cogs + personnel + operational;
  const netResult = grossIncome - totalExpenses;
  const margin = grossIncome > 0 ? (netResult / grossIncome) * 100 : 0;

  return (
    <div className="premium-card overflow-hidden">
      <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="text-amber-400" size={18} />
            <h3 className="text-lg font-black uppercase tracking-widest text-white">
              DRE <span className="text-amber-400">Master</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Demonstrativo de Resultado do Exercício
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            className="h-10 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
            onClick={() => {
              const dreData = [
                {
                  label: "Receita Bruta",
                  monthly: grossIncome,
                  accumulated: grossIncome,
                  percent: 100,
                },
                {
                  label: "Impostos",
                  monthly: taxes,
                  accumulated: taxes,
                  percent: (taxes / grossIncome) * 100 || 0,
                },
                {
                  label: "Custo Mercadoria",
                  monthly: cogs,
                  accumulated: cogs,
                  percent: (cogs / grossIncome) * 100 || 0,
                },
                {
                  label: "Pessoal",
                  monthly: personnel,
                  accumulated: personnel,
                  percent: (personnel / grossIncome) * 100 || 0,
                },
                {
                  label: "Operacional",
                  monthly: operational,
                  accumulated: operational,
                  percent: (operational / grossIncome) * 100 || 0,
                },
                {
                  label: "Resultado Líquido",
                  monthly: netResult,
                  accumulated: netResult,
                  percent: margin,
                },
              ];
              exportDRE("Meu Negócio", dreData);
            }}
          >
            <Download size={14} className="mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        <div className="space-y-4">
          {/* Receita */}
          <div className="flex justify-between items-center py-4 px-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <TrendingUp size={20} />
              </div>
              <span className="font-bold text-white tracking-tight">
                Receita Bruta Total
              </span>
            </div>
            <span className="text-emerald-400 font-black text-xl">
              {formatCurrency(grossIncome)}
            </span>
          </div>

          {/* Despesas Detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Impostos & Taxas
              </span>
              <span className="font-black text-rose-400">
                ({formatCurrency(taxes)})
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Custos Operacionais
              </span>
              <span className="font-black text-rose-400">
                ({formatCurrency(cogs)})
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Folha & Encargos
              </span>
              <span className="font-black text-rose-400">
                ({formatCurrency(personnel)})
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Outras Despesas
              </span>
              <span className="font-black text-rose-400">
                ({formatCurrency(operational)})
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center py-4 px-6 rounded-2xl bg-rose-500/5 border border-rose-500/10">
            <span className="font-bold text-white uppercase text-xs tracking-widest">
              Total Despesas
            </span>
            <span className="text-rose-400 font-black text-lg">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>

        {/* Resumo Final */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className={`p-6 rounded-3xl relative overflow-hidden bg-white/5 border border-white/10`}
          >
            <div
              className={`absolute right-0 top-0 w-32 h-32 blur-[60px] rounded-full opacity-20 ${
                netResult >= 0 ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />

            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 mb-4 relative z-10">
              Lucro Líquido
            </p>
            <div className="flex items-end justify-between relative z-10">
              <span
                className={`text-3xl font-black tracking-tighter ${
                  netResult >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatCurrency(netResult)}
              </span>
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  netResult >= 0
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {netResult >= 0 ? (
                  <TrendingUp size={24} />
                ) : (
                  <TrendingDown size={24} />
                )}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl relative overflow-hidden bg-white/5 border border-white/10">
            <div className="absolute right-0 top-0 w-32 h-32 blur-[60px] rounded-full opacity-20 bg-indigo-500" />

            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 mb-4 relative z-10">
              Margem OP
            </p>
            <div className="flex items-end justify-between relative z-10">
              <span className="text-3xl font-black tracking-tighter text-indigo-400">
                {margin.toFixed(1)}%
              </span>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Percent size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal Badge helper since it might not be exported from types
const Badge = ({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) => (
  <span
    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
      variant === "outline"
        ? "border-border"
        : "bg-primary text-primary-foreground"
    } ${className}`}
  >
    {children}
  </span>
);
