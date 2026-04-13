import { useState, useEffect } from "react";
import { fetchTesouroDireto, type TesouroTitle } from "@/lib/market-data";

export const TesouroDiretoRates = () => {
  const [titles, setTitles] = useState<TesouroTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const fmt    = (n: number) => "R\u00a0" + n.toFixed(2).replace(".", ",");
  const fmtPct = (n: number) => n.toFixed(2) + "% a.a.";

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchTesouroDireto()
      .then((data) => { if (!active) return; setTitles(data); setIsLive(data.length > 0); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="card p-4">
        <div className="text-[11px] text-[var(--text3)] uppercase tracking-[0.1em] font-semibold mb-3">
          Tesouro Direto
        </div>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[60px] bg-[var(--surface)] rounded-[10px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!titles.length) return null;

  const liveBadgeClass = isLive
    ? "text-[var(--green)] bg-[rgba(0,217,145,0.08)] border-[rgba(0,217,145,0.2)]"
    : "text-[var(--text3)] bg-white/[0.04] border-white/[0.08]";

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-[11px] text-[var(--text3)] uppercase tracking-[0.1em] font-semibold">
          Tesouro Direto
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-[0.08em] px-2 py-[2px] rounded-[99px] border flex items-center gap-1 ${liveBadgeClass}`}>
          {isLive && <span className="w-[6px] h-[6px] rounded-full bg-[var(--green)] inline-block animate-pulse" />}
          {isLive ? "Ao vivo" : "Referência"}
        </span>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {titles.map((title, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center p-3 bg-[var(--surface)] rounded-[10px] border border-[var(--border)] cursor-pointer transition-all duration-200 hover:brightness-110"
          >
            <div>
              <div className="text-[13px] font-semibold text-[var(--text1)] mb-[2px]">
                {title.nome}
              </div>
              <div className="flex gap-2 items-center">
                <span className={`badge ${title.tipo === "IPCA+" ? "badge-green" : title.tipo === "Prefixado" ? "badge-blue" : "badge-amber"}`}>
                  {title.tipo}
                </span>
                <span className="text-[10px] text-[var(--text3)]">Venc: {title.vencimento}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[14px] font-bold text-[var(--green)] font-mono">{fmtPct(title.taxa)}</div>
              <div className="text-[11px] text-[var(--text3)] font-mono">{fmt(title.preco)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 p-2 bg-[var(--surface)] rounded-lg text-[10px] text-[var(--text3)] text-center">
        Fonte: Tesouro Direto · {isLive ? "Atualizado agora" : "Dados de referência"}
      </div>
    </div>
  );
};
