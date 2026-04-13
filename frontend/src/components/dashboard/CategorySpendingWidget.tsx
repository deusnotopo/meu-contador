import type { TabType } from "@/types/navigation";
import { useBudgets } from "@/hooks/useBudgets";
import { ChevronRight } from "lucide-react";

// ─── Emoji map ────────────────────────────────────────────────────────────────
const EMOJI_MAP: Record<string, string> = {
  moradia: "🏠", mercado: "🛒", delivery: "🍕", transporte: "🚗",
  "saúde": "💊", "salário": "💰", lazer: "🎮", "educação": "📚",
  vestuário: "👕", assinaturas: "📱",
};
function getEmoji(cat: string) {
  return EMOJI_MAP[cat.toLowerCase()] ?? "💸";
}

const fmt = (n: number) => "R$\u00a0" + Math.round(Math.abs(n)).toLocaleString("pt-BR");

// ─── Types ────────────────────────────────────────────────────────────────────
interface CategorySpendingWidgetProps {
  categories: { name: string; spent: number }[];
  hasError: boolean;
  onNavigate?: (tab: TabType) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const CategorySpendingWidget = ({
  categories,
  hasError,
  onNavigate,
}: CategorySpendingWidgetProps) => {
  // Use real budget data instead of the `spent * 1.2` hack
  const { budgets } = useBudgets();

  const enriched = categories.slice(0, 5).map((cat) => {
    const budgetMatch = budgets.find(
      (b) => b.category.toLowerCase() === cat.name.toLowerCase()
    );
    const budget = budgetMatch?.limit ?? cat.spent * 1.2; // fallback only if no budget set
    return { ...cat, budget };
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div
          className="text-[10px] uppercase tracking-widest font-bold"
          style={{ color: "var(--t3)" }}
        >
          Por categoria
        </div>
        {enriched.length > 0 && !hasError && (
          <button
            type="button"
            aria-label="Ver detalhes por categoria"
            className="flex items-center gap-1 text-[11px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
            onClick={() => onNavigate?.("personal")}
          >
            Detalhar <ChevronRight size={11} aria-hidden />
          </button>
        )}
      </div>

      {hasError ? (
        <div className="flex flex-col items-center py-6 gap-2">
          <span className="text-2xl" aria-hidden>📡</span>
          <div className="text-[13px] font-semibold text-white/60">Sem conexão</div>
          <div className="text-[11px] text-white/25 text-center">
            Categorias indisponíveis offline.
          </div>
        </div>
      ) : enriched.length > 0 ? (
        <div role="list" aria-label="Gastos por categoria">
          {enriched.map((cat) => {
            const safeSpent = isNaN(cat.spent) ? 0 : cat.spent;
            const pc = cat.budget > 0 ? Math.min((safeSpent / cat.budget) * 100, 100) : 0;
            const isOver = safeSpent > cat.budget;
            return (
              <button
                key={cat.name}
                role="listitem"
                type="button"
                aria-label={`${cat.name}: ${fmt(safeSpent)}${isOver ? " — acima do orçamento" : ""}`}
                onClick={() => onNavigate?.("personal")}
                className="w-full flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] -mx-2 px-2 rounded-xl transition-colors cursor-pointer active:scale-[0.99] text-left"
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-[17px] bg-[#101929] border border-white/[0.05] flex-shrink-0"
                  aria-hidden
                >
                  {getEmoji(cat.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <div className="text-[13px] font-semibold text-gray-100 truncate">
                      {cat.name}
                    </div>
                    <div
                      className="text-[12px] font-bold tabular-nums"
                      style={{
                        color: isOver ? "var(--red)" : "var(--t2)",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      {fmt(safeSpent)}
                    </div>
                  </div>
                  <div className="h-[3px] bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pc}%`,
                        background: isOver ? "var(--red)" : "var(--blue)",
                      }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 gap-2">
          <span className="text-2xl" aria-hidden>📊</span>
          <div className="text-[13px] font-semibold text-white/60">Nenhum gasto</div>
          <div className="text-[11px] text-white/25 text-center">
            Lançamentos categorizados figurarão aqui.
          </div>
        </div>
      )}
    </div>
  );
};
