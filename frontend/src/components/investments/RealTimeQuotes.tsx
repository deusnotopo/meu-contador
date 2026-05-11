import { useState, useEffect, useRef } from "react";
import { fetchMultipleQuotes } from "@/lib/market-data";
import { TrendingUp, TrendingDown, Wifi } from "lucide-react";
import { logger } from "@/lib/logger";

interface RealTimeQuotesProps {
  tickers?: string[];
}

const DEFAULT_TICKERS = ["BOVA11", "IVVB11", "HGLG11", "PETR4"];

export const RealTimeQuotes = ({ tickers = DEFAULT_TICKERS }: RealTimeQuotesProps) => {
  const [quotes, setQuotes] = useState<Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    logo?: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [isLive, setIsLive] = useState(false);
  const didFetch = useRef(false);

  const fmt = (n: number) => "R$\u00a0" + n.toFixed(2).replace(".", ",");
  const fmtPct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    const loadQuotes = async () => {
      setLoading(true);
      try {
        const map = await fetchMultipleQuotes(tickers);
        const results = tickers
          .map(ticker => {
            const q = map[ticker];
            return q
              ? { symbol: q.symbol, name: q.name || ticker, price: q.price || 0, change: q.change || 0, changePercent: q.changePercent || 0, logo: q.logo || null }
              : { symbol: ticker, name: ticker, price: 0, change: 0, changePercent: 0, logo: null };
          })
          .filter(q => q.price > 0);

        setQuotes(results);
        setIsLive(results.some(q => q.price > 0));
        setLastUpdate(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      } catch (err) {
        logger.error('[RealTimeQuotes] Failed to load quotes', err);
      } finally {
        setLoading(false);
      }
    };

    loadQuotes();
    const interval = setInterval(() => { didFetch.current = false; loadQuotes(); }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [tickers]);

  if (loading && quotes.length === 0) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[var(--amber)] animate-pulse" />
          <span className="text-[11px] text-[var(--t3)] uppercase tracking-widest font-semibold">
            Buscando cotações...
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[72px] bg-[var(--surface)] rounded-[10px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!quotes.length) return null;

  return (
    <div className="premium-card relative overflow-hidden p-5 rounded-3xl border border-white/5 bg-[#030712]/60 backdrop-blur-2xl">
      {/* Glow effect green */}
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-1.5">
          <div
            className="w-[7px] h-[7px] rounded-full"
            style={{ background: isLive ? "var(--green)" : "var(--t3)", animation: isLive ? "pulse 2s infinite" : "none" }}
          />
          <span className="text-[11px] text-[var(--t3)] uppercase tracking-widest font-bold">
            Cotações{isLive ? " ao vivo" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isLive && <Wifi size={10} className="text-[var(--green)]" />}
          <span className="text-[10px] text-[var(--t3)]">{lastUpdate}</span>
        </div>
      </div>

      {/* Quotes grid */}
      <div className="grid grid-cols-2 gap-2">
        {quotes.map(quote => {
          const isUp = quote.changePercent >= 0;
          return (
            <div
              key={quote.symbol}
              className={`bg-white/[0.02] hover:bg-white/[0.04] rounded-xl p-3 transition-all duration-300 transform hover:-translate-y-0.5 border ${isUp ? "border-emerald-500/20" : "border-rose-500/20"}`}
              style={{ boxShadow: isUp ? '0 4px 20px -10px rgba(16,185,129,0.1)' : '0 4px 20px -10px rgba(244,63,94,0.1)' }}
            >
              {/* Symbol row */}
              <div className="flex items-center gap-1.5 mb-1.5">
                {quote.logo ? (
                  <img src={quote.logo} alt={quote.symbol} className="w-[18px] h-[18px] rounded-full object-cover ring-1 ring-white/10" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full bg-white/5 flex items-center justify-center text-[9px] font-extrabold text-blue-400 border border-white/10">
                    {quote.symbol.substring(0, 2)}
                  </div>
                )}
                <span className="text-[11px] font-black text-white tracking-tight">{quote.symbol}</span>
              </div>

              {/* Price */}
              <div className="text-[15px] font-black text-white font-mono mb-1">
                {quote.price > 0 ? fmt(quote.price) : "—"}
              </div>

              {/* Change */}
              {quote.price > 0 && (
                <div className="flex items-center gap-1">
                  {isUp
                    ? <TrendingUp size={10} className="text-emerald-400 shrink-0" />
                    : <TrendingDown size={10} className="text-rose-400 shrink-0" />}
                  <span
                    className={`text-[10px] font-bold font-mono drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}
                  >
                    {fmtPct(quote.changePercent)}
                  </span>
                  <span className="text-[9px] text-[var(--t3)]">hoje</span>
                </div>
              )}

              {/* Name */}
              <div className="text-[9px] text-[var(--t3)] mt-0.5 truncate">{quote.name}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 py-1.5 px-2.5 bg-[var(--surface)] rounded-lg text-[9px] text-[var(--t3)] text-center">
        BRAPI · Via backend seguro · Cache 15 min
      </div>
    </div>
  );
};
