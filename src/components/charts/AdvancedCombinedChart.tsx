import type { MonthlyData } from "@/types";
import React, { useMemo } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: MonthlyData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    name: string;
    value: number;
    fill: string;
    dataKey: string;
    color: string;
  }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const isPrivacy =
      localStorage.getItem("meu_contador_privacy_mode") === "true";

    return (
      <div className="bg-[#020617] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
          {label}
        </p>
        {payload.map((entry, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 py-1"
          >
            <span
              className="text-xs font-medium"
              style={{ color: entry.color }}
            >
              {entry.name}:
            </span>
            <span className="text-sm font-black text-white">
              {isPrivacy
                ? "****"
                : new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(entry.value)}
            </span>
          </div>
        ))}
        {payload.length >= 2 && (
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-slate-400">Balanço:</span>
            <span
              className={`text-sm font-black ${
                payload[0].value - payload[1].value >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {isPrivacy
                ? "****"
                : new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(payload[0].value - payload[1].value)}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const AdvancedCombinedChart: React.FC<Props> = ({ data }) => {
  // Add balance to each entry for the Area chart
  const enrichedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      balanco: d.receitas - d.despesas,
    }));
  }, [data]);

  return (
    <div className="h-[400px] w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={enrichedData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#ffffff05"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
            tickFormatter={(value) => {
              const [year, month] = value.split("-");
              const months = [
                "Jan",
                "Fev",
                "Mar",
                "Abr",
                "Mai",
                "Jun",
                "Jul",
                "Ago",
                "Set",
                "Out",
                "Nov",
                "Dez",
              ];
              return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
            }}
          />
          <YAxis axisLine={false} tickLine={false} hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff05" }} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            formatter={(value) => (
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                {value}
              </span>
            )}
          />

          <Area
            type="monotone"
            dataKey="balanco"
            name="Balanço"
            stroke="#6366f1"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorBalance)"
          />

          <Bar
            dataKey="receitas"
            name="Receitas"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
            barSize={20}
          />

          <Bar
            dataKey="despesas"
            name="Despesas"
            fill="#f43f5e"
            radius={[6, 6, 0, 0]}
            barSize={20}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
