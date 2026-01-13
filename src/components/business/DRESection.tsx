import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          "fornecedor",
          "mercadoria",
          "estoque",
          "compra",
          "produção",
          "matéria",
          "salário",
          "folha",
          "sócio",
          "prolabore",
          "fgts",
          "inss",
          "benefício",
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
    <Card className="shadow-card border-0 overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-primary" size={20} />
            DRE - Período Atual
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-bold">
              Contabilidade Real
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-xs"
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
              <Download size={14} />
              Exportar PDF
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-4">
          {/* Receita */}
          <div className="flex justify-between items-center py-2 border-b border-dashed">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-success" size={16} />
              <span className="font-semibold text-foreground">
                Receita Bruta Total
              </span>
            </div>
            <span className="text-success font-black text-lg">
              {formatCurrency(grossIncome)}
            </span>
          </div>

          {/* Despesas Detalhadas */}
          <div className="space-y-3 pl-4 border-l-2 border-muted">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                (-) Impostos e Taxas
              </span>
              <span className="font-medium text-danger">
                ({formatCurrency(taxes)})
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                (-) Custo de Mercadoria/Fornecedores
              </span>
              <span className="font-medium text-danger">
                ({formatCurrency(cogs)})
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                (-) Folha de Pagamento & Encargos
              </span>
              <span className="font-medium text-danger">
                ({formatCurrency(personnel)})
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                (-) Despesas Operacionais / Outros
              </span>
              <span className="font-medium text-danger">
                ({formatCurrency(operational)})
              </span>
            </div>
          </div>

          <div className="flex justify-between py-2 border-t border-dashed mt-2">
            <span className="font-semibold">Total de Despesas</span>
            <span className="text-danger font-bold">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>

        {/* Resumo Final */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div
            className={`p-4 rounded-2xl ${
              netResult >= 0
                ? "bg-success/10 border-success/20"
                : "bg-danger/10 border-danger/20"
            } border`}
          >
            <p className="text-xs uppercase font-bold tracking-wider opacity-70 mb-1">
              Resultado Líquido
            </p>
            <div className="flex items-center justify-between">
              <span
                className={`text-2xl font-black ${
                  netResult >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {formatCurrency(netResult)}
              </span>
              {netResult >= 0 ? (
                <TrendingUp size={24} className="text-success" />
              ) : (
                <TrendingDown size={24} className="text-danger" />
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <p className="text-xs uppercase font-bold tracking-wider opacity-70 mb-1">
              Margem de Lucro
            </p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-primary">
                {margin.toFixed(1)}%
              </span>
              <Percent size={24} className="text-primary" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
