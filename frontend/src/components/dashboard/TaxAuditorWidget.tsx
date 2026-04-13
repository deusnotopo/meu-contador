// ─── TaxAuditorWidget ─────────────────────────────────────────────────────────
// Shows estimated monthly tax (IRPF or Simples Nacional) based on user profile.

interface TaxAuditorWidgetProps {
  estimatedTax: number;
  monthlyRevenue: number;
  employmentType?: string;
  dependents?: number;
  fmt: (n: number) => string;
}

export const TaxAuditorWidget = ({
  estimatedTax,
  monthlyRevenue,
  employmentType,
  dependents,
  fmt,
}: TaxAuditorWidgetProps) => (
  <div className="bento-card bg-amber-400/[0.06] border-amber-400/[0.18]">
    <div className="flex gap-3 items-center">
      <span className="text-2xl" aria-hidden>🧾</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wider mb-0.5 text-amber-400/90">
          Auditor de Impostos ·{" "}
          {employmentType === "pj" ? "DAS / Simples Nacional" : "IRPF Estimado"}
        </div>
        <div className="text-[13px] font-semibold text-[var(--t1)]">
          Separe{" "}
          <span className="tabular-nums text-amber-400 font-bold">
            {fmt(estimatedTax)}/mês
          </span>{" "}
          para o governo
        </div>
        <div className="text-[11px] mt-0.5 text-[var(--t3)]">
          {employmentType === "pj"
            ? `~6% Simples Nacional sobre R$ ${(monthlyRevenue / 1000).toFixed(0)}k de faturamento`
            : `Alíquota progressiva IRPF sobre renda acima de R$ 4.664`}
          {(dependents ?? 0) > 0 &&
            ` · ${dependents} dependente${(dependents ?? 0) > 1 ? "s" : ""} podem reduzir sua base`}
        </div>
      </div>
      {employmentType === "pj" && (
        <div className="text-center rounded-xl px-3 py-2 flex-shrink-0 bg-amber-400/10 border border-amber-400/20">
          <div className="text-[10px] font-bold tracking-wider text-amber-400/70">
            CNPJ
          </div>
          <div className="text-[11px] font-semibold mt-0.5 text-[var(--t2)]">
            Ativo
          </div>
        </div>
      )}
    </div>
  </div>
);
