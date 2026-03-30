import { useEffect, useState } from "react";
import { fetchMarketData, MarketData } from "@/lib/market-data";
import { TrendingUp, DollarSign } from "lucide-react";

export const MarketDataWidget = () => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketData().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--blue)]"></div>
      </div>
    );
  }

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="card space-y-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] text-[var(--t3)] font-bold uppercase tracking-wider flex items-center gap-1">
          <TrendingUp size={12} className="text-[var(--blue)]" /> Radar do Mercado
        </span>
        <span className="text-[9px] text-[var(--green)] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse"></span> Ao vivo
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Crypto */}
        <div className="bg-[var(--glass2)] rounded-xl p-3 border border-[var(--border)]">
          <div className="text-[10px] text-[var(--t3)] font-semibold mb-1">Bitcoin (BTC)</div>
          <div className="text-sm font-bold text-[var(--t1)] font-[var(--mono)]">{formatBRL(data.btc)}</div>
        </div>
        
        <div className="bg-[var(--glass2)] rounded-xl p-3 border border-[var(--border)]">
          <div className="text-[10px] text-[var(--t3)] font-semibold mb-1">Ethereum (ETH)</div>
          <div className="text-sm font-bold text-[var(--t1)] font-[var(--mono)]">{formatBRL(data.eth)}</div>
        </div>
        
        {/* Fiduciary / Taxes */}
        <div className="bg-[var(--glass2)] rounded-xl p-3 border border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--t3)] font-semibold mb-1 flex items-center gap-1">
               <DollarSign size={10} /> Dólar Atual
            </div>
            <div className="text-sm font-bold text-[var(--t1)] font-[var(--mono)]">R$ {data.usd.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-[var(--glass2)] rounded-xl p-3 border border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--t3)] font-semibold mb-1">Taxa Selic</div>
            <div className="text-sm font-bold text-[var(--blue)] font-[var(--mono)]">{data.selic.toFixed(2)}% <span className="text-[10px] text-[var(--t3)] font-normal">a.a.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
