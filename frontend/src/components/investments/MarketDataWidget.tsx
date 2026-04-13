import { useEffect, useState } from "react";
import { fetchMarketData, type MarketData } from "@/lib/market-data";
import { TrendingUp, TrendingDown, DollarSign, Wifi, WifiOff } from "lucide-react";

export const MarketDataWidget = () => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchMarketData()
      .then((d) => { if (active) { setData(d); setLoading(false); } })
      .catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading || !data) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--blue)]" />
      </div>
    );
  }

  const formatBRL = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  const isLive = data.isLive !== false;

  const items = [
    {
      label: "Bitcoin (BTC)",
      value: formatBRL(data.btc),
      icon: <span style={{ fontSize: 14 }}>₿</span>,
      color: "#F7931A",
      change: data.btc_change,
    },
    {
      label: "Ethereum (ETH)",
      value: formatBRL(data.eth),
      icon: <span style={{ fontSize: 14 }}>Ξ</span>,
      color: "#627EEA",
      change: data.eth_change,
    },
    {
      label: "Dólar (USD)",
      value: `R$ ${data.usd.toFixed(2).replace(".", ",")}`,
      icon: <DollarSign size={12} />,
      color: "#22c55e",
      change: data.usd_change,
    },
    {
      label: "Taxa Selic",
      value: `${data.selic.toFixed(2)}% a.a.`,
      icon: <TrendingUp size={12} />,
      color: "var(--blue)",
    },
    {
      label: "CDI",
      value: `${data.cdi.toFixed(2)}% a.a.`,
      icon: <TrendingDown size={12} />,
      color: "var(--purple)",
    },
    {
      label: "IPCA (12m)",
      value: `${data.ipca.toFixed(2)}%`,
      icon: <span style={{ fontSize: 12 }}>📊</span>,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="card space-y-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] text-[var(--t3)] font-bold uppercase tracking-wider flex items-center gap-1">
          <TrendingUp size={12} className="text-[var(--blue)]" /> Radar do Mercado
        </span>
        <span className={`text-[9px] flex items-center gap-1 ${isLive ? "text-[var(--green)]" : "text-[var(--t3)]"}`}>
          {isLive
            ? <><span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" /><Wifi size={10} /> Ao vivo</>
            : <><WifiOff size={10} /> Referência</>
          }
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-[var(--glass2)] rounded-xl p-3 border border-[var(--border)] relative"
          >
            <div className="text-[10px] text-[var(--t3)] font-semibold mb-1 flex items-center gap-1">
              <span style={{ color: item.color }}>{item.icon}</span>
              {item.label}
            </div>
            <div className="text-sm font-bold text-[var(--t1)] font-[var(--mono)] flex items-center justify-between">
              {item.value}
              {item.change !== undefined && (
                 <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${item.change >= 0 ? "bg-[var(--green)]/10 text-[var(--green)]" : "bg-[var(--red)]/10 text-[var(--red)]"}`}>
                    {item.change >= 0 ? "▲" : "▼"} {Math.abs(item.change).toFixed(2)}%
                 </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.updatedAt && (
        <div style={{ fontSize: 9, color: "var(--t4)", textAlign: "center" }}>
          Atualizado: {new Date(data.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          {" · BCB SGS · CoinGecko · BRAPI"}
        </div>
      )}
    </div>
  );
};
