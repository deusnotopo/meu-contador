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

  const fmt = (val: number | null, unit: string) =>
    val !== null && val > 0 ? `${val.toFixed(2)}${unit}` : '—';

  const fmtBRL = (val: number) =>
    val > 0
      ? val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
      : '—';

  const isLive = data.isLive !== false;

  const items = [
    {
      label: 'Bitcoin (BTC)',
      value: fmtBRL(data.btc),
      icon: <span style={{ fontSize: 14 }}>₿</span>,
      color: '#F7931A',
      change: data.btc_change,
    },
    {
      label: 'Ethereum (ETH)',
      value: fmtBRL(data.eth),
      icon: <span style={{ fontSize: 14 }}>Ξ</span>,
      color: '#627EEA',
      change: data.eth_change,
    },
    {
      label: 'Dólar (USD)',
      value: data.usd > 0 ? `R$ ${data.usd.toFixed(2).replace('.', ',')}` : '—',
      icon: <DollarSign size={12} />,
      color: '#22c55e',
      change: data.usd_change,
    },
    {
      label: 'Taxa Selic',
      value: fmt((data.selic as number | null), '% a.a.'),
      icon: <TrendingUp size={12} />,
      color: 'var(--blue)',
    },
    {
      label: 'CDI',
      value: fmt((data.cdi as number | null), '% a.a.'),
      icon: <TrendingDown size={12} />,
      color: 'var(--purple)',
    },
    {
      label: 'IPCA (12m)',
      value: fmt((data.ipca as number | null), '%'),
      icon: <span style={{ fontSize: 12 }}>📊</span>,
      color: '#f59e0b',
    },
  ];


  return (
    <div className="premium-card relative overflow-hidden p-5 space-y-4 rounded-3xl border border-white/5 bg-[#030712]/60 backdrop-blur-2xl">
      {/* Glow effect */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/20 rounded-full blur-[40px] pointer-events-none" />
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
            className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-xl p-3 border border-white/5 relative overflow-hidden group"
          >
            <div className="text-[10px] text-[var(--t3)] font-semibold mb-1 flex items-center gap-1">
              <span style={{ color: item.color }}>{item.icon}</span>
              {item.label}
            </div>
            <div className="text-sm font-bold text-[var(--t1)] font-[var(--mono)] flex items-center justify-between">
              {item.value}
              {item.change !== undefined && (
                 <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm transition-all ${item.change >= 0 ? "bg-emerald-500/10 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-rose-500/10 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"}`}>
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
