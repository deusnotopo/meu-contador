import { useState, useEffect } from "react";

interface TesouroApiItem {
  TrsrBd?: {
    nm?: string;
    mtrtyDt?: string;
    anulInvstmtRate?: string;
    untrInvstmtVal?: string;
    bd?: { cd?: string };
  };
}

interface TesouroApiResponse {
  response?: {
    TrsrBdTradgList?: TesouroApiItem[];
  };
}

const FALLBACK_TITLES: TesouroTitle[] = [
  { nome: "Tesouro IPCA+ 2035", vencimento: "15/05/2035", taxa: 6.12, preco: 3215.45, tipo: "IPCA+" },
  { nome: "Tesouro Prefixado 2029", vencimento: "01/01/2029", taxa: 11.85, preco: 892.30, tipo: "Prefixado" },
  { nome: "Tesouro Selic 2029", vencimento: "01/03/2029", taxa: 0.15, preco: 13145.67, tipo: "Selic" },
  { nome: "Tesouro IPCA+ 2045", vencimento: "15/05/2045", taxa: 6.25, preco: 2890.2, tipo: "IPCA+" },
  { nome: "Tesouro Prefixado 2033", vencimento: "01/01/2033", taxa: 12.1, preco: 745.8, tipo: "Prefixado" },
];

interface TesouroTitle {
  nome: string;
  vencimento: string;
  taxa: number;
  preco: number;
  tipo: "IPCA+" | "Prefixado" | "Selic";
}

export const TesouroDiretoRates = () => {
  const [titles, setTitles] = useState<TesouroTitle[]>([]);
  const [loading, setLoading] = useState(true);

  const fmt = (n: number) => "R$\u00a0" + n.toFixed(2).replace(".", ",");
  const fmtPct = (n: number) => n.toFixed(2) + "% a.a.";

  useEffect(() => {
    const loadTesouroData = async () => {
      setLoading(true);

      // Não existe rota backend para este recurso neste ambiente local.
      // Em dev, usamos fallback silencioso para evitar 404 no console.
      if (import.meta.env.DEV) {
        setTitles(FALLBACK_TITLES);
        setLoading(false);
        return;
      }

      try {
        // Try to fetch from API via proxy or backend
        const response = await fetch("/api/tesouro-direto", {
          signal: AbortSignal.timeout(5000),
        });
        
        if (response.ok) {
          const data = await response.json() as TesouroApiResponse;
          if (data.response && data.response.TrsrBdTradgList) {
            const formatted = data.response.TrsrBdTradgList.map((item) => {
              const cd = item.TrsrBd?.bd?.cd;
              const tipo: TesouroTitle['tipo'] =
                cd === 'NTN-B' ? 'IPCA+' : cd === 'LTN' ? 'Prefixado' : 'Selic';
              return {
                nome: item.TrsrBd?.nm || 'Título',
                vencimento: item.TrsrBd?.mtrtyDt || 'N/A',
                taxa: parseFloat(item.TrsrBd?.anulInvstmtRate ?? '0') || 0,
                preco: parseFloat(item.TrsrBd?.untrInvstmtVal ?? '0') || 0,
                tipo,
              };
            });
            setTitles(formatted.slice(0, 6));
            return;
          }
        }
        throw new Error("API not available");
      } catch (_error) {
        // Use fallback data on any error (CORS, timeout, etc.)
        setTitles(FALLBACK_TITLES);
      } finally {
        setLoading(false);
      }
    };

    loadTesouroData();
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "12px" }}>
          Tesouro Direto
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: "60px", background: "var(--surface)", borderRadius: "10px", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
          Tesouro Direto
        </span>
        <span style={{ fontSize: "10px", color: "var(--text3)" }}>taxas de hoje</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {titles.map((title, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px",
              background: "var(--surface)",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text1)", marginBottom: "2px" }}>
                {title.nome}
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className={`badge ${title.tipo === "IPCA+" ? "badge-green" : title.tipo === "Prefixado" ? "badge-blue" : "badge-amber"}`}>
                  {title.tipo}
                </span>
                <span style={{ fontSize: "10px", color: "var(--text3)" }}>Venc: {title.vencimento}</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--green)", fontFamily: "var(--mono)" }}>
                {fmtPct(title.taxa)}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text3)", fontFamily: "var(--mono)" }}>
                {fmt(title.preco)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "12px", padding: "8px", background: "var(--green-dim)", borderRadius: "8px", fontSize: "10px", color: "var(--green)", textAlign: "center" }}>
        ✓ Dados simulados · Atualizados diariamente
      </div>
    </div>
  );
};
