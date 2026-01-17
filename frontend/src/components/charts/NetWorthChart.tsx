import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: { month: string; value: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isPrivacy =
      localStorage.getItem("meu_contador_privacy_mode") === "true";

    return (
      <div className="bg-[#020617] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-sm font-black text-white">
          {isPrivacy
            ? "****"
            : new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export const NetWorthChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="h-[200px] w-full items-end flex">
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#ffffff05"
            vertical={false}
          />
          <XAxis dataKey="month" hide />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff05" }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#818cf8"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorNetWorth)"
            animationDuration={2000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
