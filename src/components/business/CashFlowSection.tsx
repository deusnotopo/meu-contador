import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { exportTransactions } from "@/lib/pdf-export";
import type { Transaction } from "@/types";
import { Download, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  transactions: Transaction[];
}

export const CashFlowSection = ({ transactions }: Props) => {
  const monthlyData: Record<
    string,
    { month: string; entrada: number; saida: number }
  > = {};

  transactions.forEach((t) => {
    const month = t.date.slice(0, 7);
    if (!monthlyData[month])
      monthlyData[month] = { month, entrada: 0, saida: 0 };
    if (t.type === "income") monthlyData[month].entrada += t.amount;
    else monthlyData[month].saida += t.amount;
  });

  const data = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-primary" size={20} />
            Fluxo de Caixa
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-xs"
            onClick={() => exportTransactions("Fluxo de Caixa", transactions)}
          >
            <Download size={14} />
            Exportar Transações
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar
                dataKey="entrada"
                fill="hsl(var(--success))"
                name="Entradas"
              />
              <Bar dataKey="saida" fill="hsl(var(--danger))" name="Saídas" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-8">Sem dados</p>
        )}
      </CardContent>
    </Card>
  );
};
