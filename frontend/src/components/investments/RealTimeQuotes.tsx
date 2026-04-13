import { useState, useEffect, useRef } from "react";
import { fetchMultipleQuotes } from "@/lib/market-data";
import { TrendingUp, TrendingDown, Wifi } from "lucide-react";

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
        console.error("Error loading quotes:", err);
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
    <div className="card p-4">
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
              className="bg-[var(--surface)] rounded-[10px] p-3 transition-all duration-200"
              style={{ border: `1px solid ${isUp ? "rgba(0,217,145,0.10)" : "rgba(255,79,110,0.10)"}` }}
            >
              {/* Symbol row */}
              <div className="flex items-center gap-1.5 mb-1.5">
                {quote.logo ? (
                  <img src={quote.logo} alt={quote.symbol} className="w-[18px] h-[18px] rounded-[4px] object-cover" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-[4px] bg-[var(--glass2)] flex items-center justify-center text-[9px] font-extrabold text-[var(--blue)]">
                    {quote.symbol.substring(0, 2)}
                  </div>
                )}
                <span className="text-[11px] font-bold text-[var(--t1)]">{quote.symbol}</span>
              </div>

              {/* Price */}
              <div className="text-[14px] font-bold text-[var(--t1)] font-mono mb-1">
                {quote.price > 0 ? fmt(quote.price) : "—"}
              </div>

              {/* Change */}
              {quote.price > 0 && (
                <div className="flex items-center gap-1">
                  {isUp
                    ? <TrendingUp size={10} className="text-[var(--green)] shrink-0" />
                    : <TrendingDown size={10} className="text-[var(--red)] shrink-0" />}
                  <span
                    className="text-[10px] font-bold font-mono"
                    style={{ color: isUp ? "var(--green)" : "var(--red)" }}
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
