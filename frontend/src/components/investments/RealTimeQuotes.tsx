import React, { useState, useEffect } from "react";
import { fetchStockQuote, fetchMarketData } from "@/lib/market-data";

interface StockQuote {
  symbol: string;
  price: number;
  name: string;
  logo?: string;
}

interface RealTimeQuotesProps {
  tickers?: string[];
}

export const RealTimeQuotes = ({ tickers = ["BOVA11", "IVVB11", "HGLG11", "PETR4", "VALE3"] }: RealTimeQuotesProps) => {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fmt = (n: number) => "R$\u00a0" + n.toFixed(2).replace(".", ",");
  const fmtPct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

  useEffect(() => {
    const loadQuotes = async () => {
      setLoading(true);
      try {
        // Buscar em lotes para evitar rate limiting
        const results: StockQuote[] = [];
        for (let i = 0; i < tickers.length; i += 2) {
          const batch = tickers.slice(i, i + 2);
          const batchResults = await Promise.all(
            batch.map(async (ticker) => {
              const quote = await fetchStockQuote(ticker);
              return quote || { symbol: ticker, price: 0, name: ticker };
            })
          );
          results.push(...batchResults.filter(Boolean) as StockQuote[]);
          
          // Aguardar entre lotes
          if (i + 2 < tickers.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        setQuotes(results);
        setLastUpdate(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      } catch (error) {
        console.error("Error loading quotes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuotes();
    const interval = setInterval(loadQuotes, 10 * 60 * 1000); // Atualiza a cada 10 minutos (aumentado de 5)
    return () => clearInterval(interval);
  }, [tickers]);

  if (loading && quotes.length === 0) {
    return (
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--amber)", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
            Carregando cotações...
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: "60px", background: "var(--surface)", borderRadius: "10px", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--green)", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
            Cotações ao vivo
          </span>
        </div>
        <span style={{ fontSize: "10px", color: "var(--text3)" }}>{lastUpdate}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
        {quotes.map((quote) => {
          const price = quote.price || 0;
          return (
            <div
              key={quote.symbol}
              style={{
                background: "var(--surface)",
                borderRadius: "10px",
                padding: "12px",
                cursor: "pointer",
                transition: "all 0.2s",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                {quote.logo ? (
                  <img src={quote.logo} alt={quote.symbol} style={{ width: "20px", height: "20px", borderRadius: "4px" }} />
                ) : (
                  <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: "var(--blue-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "var(--accent)" }}>
                    {quote.symbol.substring(0, 2)}
                  </div>
                )}
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text1)" }}>{quote.symbol}</span>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text1)", fontFamily: "var(--mono)" }}>
                {price > 0 ? fmt(price) : "—"}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text3)", marginTop: "2px" }}>
                {quote.name}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "12px", padding: "8px", background: "var(--surface)", borderRadius: "8px", fontSize: "10px", color: "var(--text3)", textAlign: "center" }}>
        Dados: brapi.dev · Atualização a cada 10 min
      </div>
    </div>
  );
};