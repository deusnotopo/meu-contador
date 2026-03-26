// Navigation Types — DNA Original (V2/V3 Prototype Fidelity)

/** 5 abas primárias do BottomNav — exatamente como no protótipo */
export type PrimaryTab =
  | "inicio"     // Início (Home)
  | "budget"     // Budget (Envelopes/Caixa)
  | "investir"   // Patrimônio (Investimentos)
  | "academia"   // Academia (Educação Financeira)
  | "launch"     // FAB Lançar (botão central)

/** Todas as rotas do app */
export type TabType =
  // Pilar 1: Início
  | "inicio"
  | "health"
  | "notifications"
  // Pilar 2: Budget / Caixa
  | "budget"
  | "caixa"
  | "personal"
  | "analytics"
  | "envelopes"
  | "envelope_detail"
  // Pilar 3: Planos / Futuro
  | "planos"
  | "planning"
  | "retirement"
  | "retire_fire"
  | "retire_proj"
  // Pilar 4: Patrimônio / Investimentos
  | "investir"
  | "investments"
  | "invest_compostos"
  | "invest_dividas"
  // Pilar 5: Academia
  | "academia"
  | "education"
  | "ai"         // IA vive dentro da Academia
  // Global
  | "settings"
  | "profile"
  | "launch";

/** Mapeamento de qualquer TabType para o ícone ativo no BottomNav */
export const TAB_TO_PILLAR: Record<TabType, PrimaryTab> = {
  // Início
  inicio: "inicio", health: "inicio", notifications: "inicio",
  // Budget
  budget: "budget", caixa: "budget", personal: "budget",
  analytics: "budget", envelopes: "budget", envelope_detail: "budget",
  planos: "budget", planning: "budget",
  retirement: "budget", retire_fire: "budget", retire_proj: "budget",
  // Patrimônio
  investir: "investir", investments: "investir",
  invest_compostos: "investir", invest_dividas: "investir",
  // Academia
  academia: "academia", education: "academia", ai: "academia",
  // Global — fallback
  settings: "inicio", profile: "inicio", launch: "launch",
};
