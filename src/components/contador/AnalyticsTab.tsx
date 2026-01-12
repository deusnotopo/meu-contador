import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import type { CategoryChartData, ChartDataItem, MonthlyData } from "@/types";
import { BarChart3, PieChart } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsTabProps {
  monthlyTrend: MonthlyData[];
  categoryData: CategoryChartData[];
  incomeChartData: ChartDataItem[];
  expenseChartData: ChartDataItem[];
  totals: { income: number; expense: number; balance: number };
  incomeCount: number;
  expenseCount: number;
}

export const AnalyticsTab = ({
  monthlyTrend,
  categoryData,
  incomeChartData,
  expenseChartData,
  totals,
  incomeCount,
  expenseCount,
}: AnalyticsTabProps) => {
  return (
    <div className="space-y-6">
      {/* Monthly Trend */}
      <Card className="shadow-card border-0 animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="text-primary" size={20} />
            Evolução Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="receitas"
                  stroke="hsl(var(--success))"
                  strokeWidth={3}
                  name="Receitas"
                  dot={{ fill: "hsl(var(--success))" }}
                />
                <Line
                  type="monotone"
                  dataKey="despesas"
                  stroke="hsl(var(--danger))"
                  strokeWidth={3}
                  name="Despesas"
                  dot={{ fill: "hsl(var(--danger))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Sem dados para exibir
            </p>
          )}
        </CardContent>
      </Card>

      {/* Category Comparison */}
      <Card
        className="shadow-card border-0 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="text-primary" size={20} />
            Comparação por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="receitas"
                  fill="hsl(var(--success))"
                  name="Receitas"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="despesas"
                  fill="hsl(var(--danger))"
                  name="Despesas"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Sem dados para exibir
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          className="shadow-card border-0 animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="text-success" size={20} />
              Distribuição de Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={incomeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) =>
                      `${entry.name}: ${formatCurrency(entry.value)}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incomeChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-16">
                Sem receitas para exibir
              </p>
            )}
          </CardContent>
        </Card>

        <Card
          className="shadow-card border-0 animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="text-danger" size={20} />
              Distribuição de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={expenseChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) =>
                      `${entry.name}: ${formatCurrency(entry.value)}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-16">
                Sem despesas para exibir
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card
        className="shadow-card border-0 animate-slide-up"
        style={{ animationDelay: "0.4s" }}
      >
        <CardHeader>
          <CardTitle className="text-lg">Resumo Estatístico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-success/5 rounded-xl border border-success/20">
              <p className="text-sm text-muted-foreground mb-2">
                Média de Receitas
              </p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(
                  incomeCount > 0 ? totals.income / incomeCount : 0
                )}
              </p>
            </div>
            <div className="text-center p-6 bg-danger/5 rounded-xl border border-danger/20">
              <p className="text-sm text-muted-foreground mb-2">
                Média de Despesas
              </p>
              <p className="text-2xl font-bold text-danger">
                {formatCurrency(
                  expenseCount > 0 ? totals.expense / expenseCount : 0
                )}
              </p>
            </div>
            <div className="text-center p-6 bg-info/5 rounded-xl border border-info/20">
              <p className="text-sm text-muted-foreground mb-2">
                Taxa de Lucro
              </p>
              <p className="text-2xl font-bold text-info">
                {totals.income > 0
                  ? ((totals.balance / totals.income) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
