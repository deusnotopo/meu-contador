// Navigation Types — DNA Original (V2/V3 Prototype Fidelity)

/** 5 abas primárias do BottomNav — exatamente como no protótipo V3 */
export type PrimaryTab =
  | "inicio"     // Início (Home)
  | "budget"     // Budget (Envelopes/Caixa)
  | "investir"   // Patrimônio (Investimentos)
  | "futuro"     // Futuro (Aposentadoria/FIRE) — da V3
  | "academia"   // Academia (Educação Financeira)
  | "launch"     // FAB Lançar (botão central)

/** Todas as rotas do app */
export type TabType =
  // Pilar 1: Início
  | "inicio"
  | "health"
  | "personal_inflation"
  | "financial_checkin"
  | "insurance_planner"
  | "notifications"
  // Pilar 2: Budget / Caixa
  | "budget"
  | "caixa"
  | "personal"
  | "analytics"
  | "envelopes"
  | "envelope_detail"
  | "cash_flow"
  // Pilar 3: Futuro
  | "futuro"
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
  | "launch"
  // Ferramentas Financeiras Brasileiras
  | "provisoes"
  | "debt_payoff";


/** Mapeamento de qualquer TabType para o ícone ativo no BottomNav */
export const TAB_TO_PILLAR: Record<TabType, PrimaryTab> = {
  // Início
  inicio: "inicio", health: "inicio", personal_inflation: "inicio", financial_checkin: "inicio", insurance_planner: "inicio", notifications: "inicio",
  // Budget
  budget: "budget", caixa: "budget", personal: "budget",
  analytics: "budget", envelopes: "budget", envelope_detail: "budget",
  cash_flow: "budget",
  planos: "futuro", planning: "futuro",
  retirement: "futuro", retire_fire: "futuro", retire_proj: "futuro",
  // Patrimônio
  investir: "investir", investments: "investir",
  invest_compostos: "investir", invest_dividas: "investir",
  // Academia
  academia: "academia", education: "academia", ai: "academia",
  // Global — fallback
  settings: "inicio", profile: "inicio", launch: "launch",
  // Futuro tab explicit mapping (guaranteed)
  futuro: "futuro",
  // Ferramentas BR
  provisoes: "budget", debt_payoff: "budget",
};
