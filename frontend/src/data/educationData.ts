export type PassoTipo = 'teoria' | 'exemplo' | 'regra' | 'quiz' | 'acao';

// Removes EDUCATION_MODULES import
export interface Passo {
  tipo: PassoTipo;
  titulo?: string;
  conteudo?: string;
  visual?: string;
  exemplo?: string;
  calculo?: { simples: string; composto: string; delta: string };
  pergunta?: string; // para quiz
  opcoes?: string[]; // para quiz
  correta?: number; // para quiz
  expl?: string; // para quiz
  cta?: string; // para acao
  ctaFn?: string; // para acao
}

export interface Trilha {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bg: string;
}

export interface Conquista {
  emoji: string;
  nome: string;
  desc: string;
  ok: boolean;
}

export interface Lesson {
  id: string;
  trilha: string;
  title: string;
  sub: string;
  emoji: string;
  dur: string;
  xp: number;
  ok: boolean;
  grad: string;
  passos: Passo[];
  objective?: string;
  outcomeType?: 'caixa' | 'divida' | 'reserva' | 'investimento' | 'contabilidade' | 'tributario' | 'comportamento' | 'patrimonio';
  personaTags?: string[];
  triggerEvents?: string[];
  references?: string[];
  maturityStage?: 'sobreviver' | 'estabilizar' | 'proteger' | 'organizar' | 'crescer' | 'multiplicar' | 'blindar' | 'perpetuar';
  behaviorGoal?: string;
  associatedFeature?: string;
  activationContext?: string;
}

export interface AcademyMoment {
  id: string;
  title: string;
  description: string;
  trailIds: string[];
  lessonIds: string[];
  outcomeFocus: NonNullable<Lesson['outcomeType']>[];
}

export interface AcademyRitual {
  id: string;
  period: 'semana' | 'mes';
  title: string;
  description: string;
  checklist: string[];
  actionLabel: string;
  targetTab: string;
}

export interface AcademyMaturityStageInfo {
  id: NonNullable<Lesson['maturityStage']>;
  title: string;
  description: string;
}

export interface AcademyContextSignal {
  id: string;
  title: string;
  description: string;
  eventKeys: string[];
  primaryLessonId: string;
  targetTab: string;
}

export type StudentJourneyProfile =
  | 'estabilidade'
  | 'quitar_dividas'
  | 'construir_patrimonio'
  | 'acelerar_independencia';

export const TRAIL_ORDER = [
  'start',
  'base',
  'contabilidade',
  'renda_fixa',
  'renda_var',
  'dividendos',
  'fire',
  'sucessao',
  'renda_ativa',
  'mental',
  'cripto',
] as const;

export const PROFILE_PRIMARY_TRAIL: Record<StudentJourneyProfile, string> = {
  estabilidade: 'start',
  quitar_dividas: 'start',
  construir_patrimonio: 'renda_fixa',
  acelerar_independencia: 'fire',
};

export const PROFILE_JOURNEY_LABELS: Record<StudentJourneyProfile, { title: string; description: string }> = {
  estabilidade: {
    title: 'Perfil estabilidade financeira',
    description: 'Priorize sobrevivência, reserva e fundamentos antes de acelerar risco.',
  },
  quitar_dividas: {
    title: 'Perfil foco em quitar dívidas',
    description: 'A trilha principal prioriza caixa, juros destrutivos e reorganização da base.',
  },
  construir_patrimonio: {
    title: 'Perfil construção patrimonial',
    description: 'A trilha principal prioriza renda fixa, disciplina de capital e expansão gradual.',
  },
  acelerar_independencia: {
    title: 'Perfil independência e longo prazo',
    description: 'A trilha principal prioriza FIRE, patrimônio e proteção estratégica do futuro.',
  },
};

export interface LessonDependencyInfo {
  hardPrerequisites: string[];
  softPrerequisiteTrail?: string;
  competenceTags: string[];
}

const getTrailLessons = (modules: Lesson[], trailId: string) => modules.filter((lesson) => lesson.trilha === trailId);

export const inferStudentJourneyProfile = (user?: {
  hasDebts?: boolean;
  hasEmergencyFund?: boolean;
  financialGoal?: string;
  riskProfile?: string;
}) : StudentJourneyProfile => {
  if (user?.hasDebts) return 'quitar_dividas';
  if (!user?.hasEmergencyFund) return 'estabilidade';
  if (user?.financialGoal === 'retire' || user?.financialGoal === 'invest') return 'acelerar_independencia';
  if (user?.riskProfile === 'moderate' || user?.riskProfile === 'aggressive') return 'construir_patrimonio';
  return 'estabilidade';
};

export const getPrimaryTrailForProfile = (user?: {
  hasDebts?: boolean;
  hasEmergencyFund?: boolean;
  financialGoal?: string;
  riskProfile?: string;
}) => PROFILE_PRIMARY_TRAIL[inferStudentJourneyProfile(user)];

export const getTrailLabel = (trailId?: string) => AULAS_TRILHAS.find((trail) => trail.id === trailId)?.label || 'Trilha recomendada';

export const getLessonDependencyInfo = (modules: Lesson[], lessonId: string): LessonDependencyInfo => {
  const lesson = modules.find((item) => item.id === lessonId);

  if (!lesson) {
    return { hardPrerequisites: [], competenceTags: [] };
  }

  const trailLessons = getTrailLessons(modules, lesson.trilha);
  const lessonIndexInTrail = trailLessons.findIndex((item) => item.id === lesson.id);
  const trailIndex = TRAIL_ORDER.indexOf(lesson.trilha as (typeof TRAIL_ORDER)[number]);
  const previousTrailId = trailIndex > 0 ? TRAIL_ORDER[trailIndex - 1] : undefined;
  const previousLessonInTrail = lessonIndexInTrail > 0 ? trailLessons[lessonIndexInTrail - 1] : undefined;

  return {
    hardPrerequisites: previousLessonInTrail ? [`lesson:${previousLessonInTrail.id}`] : [],
    softPrerequisiteTrail: !previousLessonInTrail && previousTrailId ? previousTrailId : undefined,
    competenceTags: [`lesson:${lesson.id}`, `trail:${lesson.trilha}`],
  };
};

const TRAIL_REFERENCE_MAP: Record<string, string[]> = {
  start: [
    'Richard Thaler — Nudge',
    'Morgan Housel — The Psychology of Money',
    'Princípios de orçamento base zero e cash allocation',
  ],
  base: [
    'George S. Clason — O Homem Mais Rico da Babilônia',
    'Franco Modigliani — Hipótese do Ciclo de Vida',
    'Milton Friedman — Hipótese da Renda Permanente',
  ],
  contabilidade: [
    'Princípios de contabilidade gerencial',
    'Fluxo de caixa, DRE e regime de competência',
    'Capital de giro e organização tributária brasileira',
  ],
  renda_fixa: [
    'John C. Bogle — Common Sense Investing',
    'William Bernstein — The Four Pillars of Investing',
    'Princípios de juros reais, duration e liquidez',
  ],
  renda_var: [
    'John C. Bogle — Common Sense Investing',
    'Burton Malkiel — A Random Walk Down Wall Street',
    'Benjamin Graham — margem de segurança',
  ],
  dividendos: [
    'Décio Bazin — Faça Fortuna com Ações',
    'Benjamin Graham — disciplina e valuation prudente',
    'Howard Marks — risco e ciclos',
  ],
  fire: [
    'Trinity Study',
    'William Bernstein — alocação e retirada sustentável',
    'Morgan Housel — comportamento no longo prazo',
  ],
  sucessao: [
    'Princípios de planejamento sucessório',
    'Proteção patrimonial e liquidez familiar',
    'Organização patrimonial de longo prazo',
  ],
  renda_ativa: [
    'Warren Buffett — capital humano',
    'James Clear — hábitos e consistência',
    'Economia do capital humano',
  ],
  mental: [
    'Daniel Kahneman — Thinking, Fast and Slow',
    'Morgan Housel — The Psychology of Money',
    'Richard Thaler — Nudge',
  ],
  cripto: [
    'Satoshi Nakamoto — Bitcoin White Paper',
    'Nassim Nicholas Taleb — antifragilidade e convexidade',
    'Princípios de risco assimétrico e custódia',
  ],
};

const TRAIL_PERSONA_MAP: Record<string, string[]> = {
  start: ['iniciante', 'endividado', 'desorganizado'],
  base: ['iniciante', 'organização'],
  contabilidade: ['mei', 'autonomo', 'pj', 'profissional_liberal'],
  renda_fixa: ['construção_patrimonial', 'conservador', 'iniciante_investimentos'],
  renda_var: ['crescimento', 'longo_prazo'],
  dividendos: ['renda_passiva', 'longo_prazo'],
  fire: ['independencia_financeira', 'planejamento_longo_prazo'],
  sucessao: ['familia', 'patrimonio', 'negocio'],
  renda_ativa: ['carreira', 'empreendedor', 'profissional_liberal'],
  mental: ['comportamento', 'disciplina'],
  cripto: ['risco', 'assimetria', 'diversificacao'],
};

const TRAIL_TRIGGER_MAP: Record<string, string[]> = {
  start: ['fatura_alta', 'divida_cara', 'sem_reserva', 'mes_apertado'],
  base: ['novo_salario', 'organizar_rotina', 'iniciar_planejamento'],
  contabilidade: ['organizar_rotina', 'familia_dependente', 'aumento_de_renda', 'negocio_sem_separacao', 'imposto_sem_reserva'],
  renda_fixa: ['reserva_completa', 'primeiro_aporte', 'buscar_previsibilidade'],
  renda_var: ['carteira_em_expansao', 'diversificacao', 'longo_prazo'],
  dividendos: ['buscar_renda_passiva', 'planejamento_de_caixa'],
  fire: ['planejamento_aposentadoria', 'patrimonio_crescente'],
  sucessao: ['familia_dependente', 'patrimonio_relevante'],
  renda_ativa: ['aumento_de_renda', 'upskilling', 'meta_ambiciosa'],
  mental: ['queda_de_mercado', 'compra_impulsiva', 'ansiedade_financeira'],
  cripto: ['curiosidade_cripto', 'alocacao_de_risco'],
};

const TRAIL_OUTCOME_MAP: Record<string, NonNullable<Lesson['outcomeType']>> = {
  start: 'caixa',
  base: 'comportamento',
  contabilidade: 'contabilidade',
  renda_fixa: 'reserva',
  renda_var: 'investimento',
  dividendos: 'patrimonio',
  fire: 'patrimonio',
  sucessao: 'patrimonio',
  renda_ativa: 'caixa',
  mental: 'comportamento',
  cripto: 'investimento',
};

const TRAIL_MATURITY_MAP: Record<string, NonNullable<Lesson['maturityStage']>> = {
  start: 'sobreviver',
  base: 'organizar',
  contabilidade: 'organizar',
  renda_fixa: 'proteger',
  renda_var: 'crescer',
  dividendos: 'multiplicar',
  fire: 'blindar',
  sucessao: 'blindar',
  renda_ativa: 'crescer',
  mental: 'estabilizar',
  cripto: 'multiplicar',
};

export const getLessonReferences = (lesson: Lesson) => lesson.references?.length ? lesson.references : (TRAIL_REFERENCE_MAP[lesson.trilha] || []);
export const getLessonPersonaTags = (lesson: Lesson) => lesson.personaTags?.length ? lesson.personaTags : (TRAIL_PERSONA_MAP[lesson.trilha] || []);
export const getLessonTriggerEvents = (lesson: Lesson) => lesson.triggerEvents?.length ? lesson.triggerEvents : (TRAIL_TRIGGER_MAP[lesson.trilha] || []);
export const getLessonOutcomeType = (lesson: Lesson) => lesson.outcomeType || TRAIL_OUTCOME_MAP[lesson.trilha] || 'caixa';
export const getLessonObjective = (lesson: Lesson) => lesson.objective || `Transformar ${lesson.sub.toLowerCase()} em decisão prática e aplicável no app.`;
export const getLessonMaturityStage = (lesson: Lesson) => lesson.maturityStage || TRAIL_MATURITY_MAP[lesson.trilha] || 'organizar';
export const getLessonBehaviorGoal = (lesson: Lesson) => lesson.behaviorGoal || 'Converter conhecimento em ação financeira simples e repetível.';
export const getLessonAssociatedFeature = (lesson: Lesson) => lesson.associatedFeature || 'dashboard';
export const getLessonActivationContext = (lesson: Lesson) => lesson.activationContext || 'Quando este tema ficar relevante no seu momento financeiro.';

export const ACADEMY_MOMENTS: AcademyMoment[] = [
  {
    id: 'caixa_hoje',
    title: 'Quero sobreviver ao mês sem me enrolar',
    description: 'Priorize caixa, dívida cara, previsibilidade de parcelas e saldo seguro antes de qualquer sofisticação.',
    trailIds: ['start', 'base'],
    lessonIds: ['br_dividas', 'br_reserva', 'br_saldo_seguro', 'br_parcelamento_inteligente', 'br_mes_apertado'],
    outcomeFocus: ['caixa', 'divida', 'reserva'],
  },
  {
    id: 'organizar_rotina',
    title: 'Quero organizar rotina, provisões e calendário',
    description: 'Construa ritual semanal, leitura do mês e disciplina operacional para não viver apagando incêndio.',
    trailIds: ['base', 'contabilidade'],
    lessonIds: ['base_bab', 'base_zbb', 'base_envelopes', 'base_provisoes_anuais', 'ritual_semanal_caixa', 'ritual_mensal_fechamento', 'ritual_virada_salario', 'cont_contas_receber_giro', 'cont_dre_simplificada'],
    outcomeFocus: ['caixa', 'contabilidade', 'tributario'],
  },
  {
    id: 'negocio_clareza',
    title: 'Quero entender PF, MEI ou PJ com clareza',
    description: 'Separe dinheiro do dono, imposto, competência e giro para enxergar resultado real.',
    trailIds: ['contabilidade'],
    lessonIds: ['cont_caixa_competencia', 'cont_prolabore_imposto', 'cont_reserva_das', 'cont_pf_pj', 'cont_preco_margem', 'cont_renda_incerta'],
    outcomeFocus: ['contabilidade', 'tributario'],
  },
  {
    id: 'crescer_patrimonio',
    title: 'Quero crescer patrimônio com inteligência',
    description: 'Depois da base, avance para renda fixa, ETFs, diversificação e disciplina de longo prazo.',
    trailIds: ['renda_fixa', 'renda_var', 'dividendos'],
    lessonIds: ['rf_ipca', 'rf_fundos', 'base_isencao', 'rf_fgc', 'rv_etfs', 'rv_fiis', 'rv_dolar', 'div_bazin', 'div_reinvest'],
    outcomeFocus: ['investimento', 'patrimonio', 'reserva'],
  },
  {
    id: 'blindar_futuro',
    title: 'Quero blindar patrimônio e futuro da família',
    description: 'Planeje proteção, aposentadoria, sucessão e liquidez familiar antes que a urgência decida por você.',
    trailIds: ['fire', 'sucessao'],
    lessonIds: ['fire_math_br', 'fire_pgbl', 'suc_itcmd', 'suc_seguro'],
    outcomeFocus: ['patrimonio'],
  },
  {
    id: 'sobreviver_imediato',
    title: 'Preciso de ajuda agora — o mês já apertou',
    description: 'Plano de emergência para atravessar o mês sem dívida nova: priorize essencial, negocie o resto, pare o rotativo.',
    trailIds: ['start'],
    lessonIds: ['br_dividas', 'br_saldo_seguro', 'br_parcelamento_inteligente', 'br_mes_apertado', 'br_assinaturas'],
    outcomeFocus: ['caixa', 'divida'],
  },
];

export const ACADEMY_RITUALS: AcademyRitual[] = [
  {
    id: 'ritual_semanal_caixa',
    period: 'semana',
    title: 'Ritual semanal do caixa',
    description: 'Uma revisão curta para impedir que a semana financeira te surpreenda.',
    checklist: [
      'Revise contas que vencem antes da próxima renda.',
      'Cheque cartão, parcelas e risco de rotativo.',
      'Atualize orçamento, envelopes ou provisões.',
    ],
    actionLabel: 'Abrir orçamento',
    targetTab: 'budget',
  },
  {
    id: 'ritual_mensal_fechamento',
    period: 'mes',
    title: 'Missão do mês: fechamento financeiro',
    description: 'Feche o mês como gente grande: sobrou caixa, lucro ou só sensação de dinheiro entrando?',
    checklist: [
      'Compare receita, custo, despesa e sobra real.',
      'Separe reserva, imposto e próximo aporte.',
      'Escolha a aula que corrige o maior vazamento do mês.',
    ],
    actionLabel: 'Ver análises',
    targetTab: 'analytics',
  },
];

export const ACADEMY_MATURITY_STAGES: AcademyMaturityStageInfo[] = [
  {
    id: 'sobreviver',
    title: '1. Sobreviver ao mês',
    description: 'Cortar juros destrutivos, enxergar saldo seguro e impedir o caos previsível.',
  },
  {
    id: 'estabilizar',
    title: '2. Estabilizar comportamento',
    description: 'Reduzir impulsos, vieses e decisões emocionais que sabotam o caixa.',
  },
  {
    id: 'proteger',
    title: '3. Construir proteção',
    description: 'Formar reserva, colchão tributário e margem de segurança operacional.',
  },
  {
    id: 'organizar',
    title: '4. Organizar rotina e contabilidade leve',
    description: 'Criar rituais, provisões, calendário e leitura real do dinheiro.',
  },
  {
    id: 'crescer',
    title: '5. Crescer com inteligência',
    description: 'Aumentar renda, melhorar margem e investir com mais critério.',
  },
  {
    id: 'multiplicar',
    title: '6. Multiplicar patrimônio',
    description: 'Diversificar, reinvestir e buscar crescimento sem perder a base.',
  },
  {
    id: 'blindar',
    title: '7. Blindar patrimônio e futuro',
    description: 'Planejar independência, sucessão, liquidez familiar e proteção do legado.',
  },
  {
    id: 'perpetuar',
    title: '8. Ensinar e perpetuar',
    description: 'Transformar conhecimento em sistema duradouro de decisão e continuidade.',
  },
];

export const ACADEMY_CONTEXT_SIGNALS: AcademyContextSignal[] = [
  {
    id: 'divida_urgente',
    title: 'Risco de juros destrutivos',
    description: 'Quando fatura, parcela ou dívida cara ameaçam o mês atual, a prioridade é parar o vazamento antes de pensar em sofisticação.',
    eventKeys: ['fatura_alta', 'divida_cara', 'mes_apertado'],
    primaryLessonId: 'br_dividas',
    targetTab: 'budget',
  },
  {
    id: 'sem_reserva',
    title: 'Base ainda exposta',
    description: 'Sem liquidez mínima, qualquer imprevisto vira dívida. A prioridade é reserva, saldo seguro e rotina de caixa.',
    eventKeys: ['sem_reserva', 'mes_apertado'],
    primaryLessonId: 'br_reserva',
    targetTab: 'planos',
  },
  {
    id: 'rotina_contabil',
    title: 'Negócio sem clareza operacional',
    description: 'Quando existe operação própria, a prioridade é separar caixa, competência, imposto e retirada do dono.',
    eventKeys: ['negocio_sem_separacao', 'imposto_sem_reserva', 'organizar_rotina'],
    primaryLessonId: 'cont_caixa_competencia',
    targetTab: 'analytics',
  },
  {
    id: 'patrimonio_base',
    title: 'Hora de crescer com base forte',
    description: 'Com proteção construída, o próximo passo é avançar para renda fixa, ETFs e diversificação com rigor.',
    eventKeys: ['reserva_completa', 'primeiro_aporte', 'diversificacao'],
    primaryLessonId: 'rf_ipca',
    targetTab: 'investir',
  },
  {
    id: 'parcelamento_acumulado',
    title: 'Comprometimento futuro pressionando o caixa',
    description: 'Quando muitas parcelas futuras reduzem a liberdade de decisão, a prioridade é entender o peso real do comprometimento acumulado.',
    eventKeys: ['fatura_alta', 'mes_apertado', 'divida_cara'],
    primaryLessonId: 'br_parcelamento_inteligente',
    targetTab: 'cash_flow',
  },
  {
    id: 'provisoes_negligenciadas',
    title: 'Despesas previsíveis sem preparo',
    description: 'Quando IPVA, matrícula, seguro e outras despesas anuais chegam como surpresa, a provisão mensal é a solução.',
    eventKeys: ['mes_apertado', 'organizar_rotina'],
    primaryLessonId: 'base_provisoes_anuais',
    targetTab: 'provisoes',
  },
  {
    id: 'mei_sem_estrutura',
    title: 'MEI ou autônomo sem disciplina fiscal',
    description: 'Quando quem trabalha por conta própria ainda não separou imposto, giro e retirada, a clareza operacional é urgente.',
    eventKeys: ['negocio_sem_separacao', 'imposto_sem_reserva', 'recebimento'],
    primaryLessonId: 'cont_reserva_das',
    targetTab: 'provisoes',
  },
  {
    id: 'ritual_necessario',
    title: 'Sem rotina financeira definida',
    description: 'Quando o usuário vive no improviso sem revisão semanal ou fechamento mensal, rituais simples mudam o jogo.',
    eventKeys: ['organizar_rotina', 'mes_apertado', 'iniciar_planejamento'],
    primaryLessonId: 'ritual_semanal_caixa',
    targetTab: 'cash_flow',
  },
];

// ----------------------------------------------------------------------
// DEFINIÇÃO DAS TRILHAS (REALIDADE BRASILEIRA)
// ----------------------------------------------------------------------
export const AULAS_TRILHAS: Trilha[] = [
  { id: 'start',       label: 'Sobrevivência',   emoji: '🇧🇷', color: '#E94560', bg: 'rgba(233,69,96,0.12)' },
  { id: 'base',        label: 'Fundamentos',     emoji: '🏗️', color: '#4A8BFF', bg: 'rgba(74,139,255,0.12)' },
  { id: 'contabilidade', label: 'Contabilidade Leve', emoji: '🧾', color: '#14B8A6', bg: 'rgba(20,184,166,0.12)' },
  { id: 'renda_fixa',  label: 'Renda Fixa BR',   emoji: '🏛️', color: '#00D991', bg: 'rgba(0,217,145,0.12)' },
  { id: 'renda_var',   label: 'Bolsa e ETFs',    emoji: '📈', color: '#FFAD3B', bg: 'rgba(255,173,59,0.12)' },
  { id: 'fire',        label: 'Independência',   emoji: '🔥', color: '#9B7FFF', bg: 'rgba(155,127,255,0.12)' },
  { id: 'dividendos',  label: 'Dividendos BR',   emoji: '💰', color: '#00D991', bg: 'rgba(0,217,145,0.12)' },
  { id: 'cripto',      label: 'Cripto/Bitcoin',  emoji: '₿',  color: '#F7931A', bg: 'rgba(247,147,26,0.12)' },
  { id: 'sucessao',    label: 'Blindagem',       emoji: '🛡️', color: '#E94560', bg: 'rgba(233,69,96,0.12)' },
  { id: 'renda_ativa', label: 'Renda Ativa',     emoji: '🚀', color: '#4A8BFF', bg: 'rgba(74,139,255,0.12)' },
  { id: 'mental',      label: 'Psicologia',      emoji: '🧠', color: '#9B7FFF', bg: 'rgba(155,127,255,0.12)' },
];

export const AULAS_CONQUISTAS: Conquista[] = [
  { emoji: '🇧🇷', nome: 'Sobrevivente do Serasa',  desc: 'Completou a Trilha Sobrevivência',   ok: true  },
  { emoji: '🛡️', nome: 'Reserva Blindada',         desc: 'Respondeu certo sobre Selic',         ok: false },
  { emoji: '📈', nome: 'Sócio de Empresas',         desc: 'Completou Renda Variável',            ok: false },
  { emoji: '🔥', nome: 'Matemática do FIRE BR',     desc: 'Dominou a SWR de 3,2%',              ok: false },
  { emoji: '💰', nome: 'Discípulo de Barsi',        desc: 'Completou Dividendos BR',             ok: false },
  { emoji: '₿',  nome: 'Hodler Consciente',         desc: 'Completou a Trilha Cripto',            ok: false },
  { emoji: '📜', nome: 'Patrimônio Blindado',        desc: 'Completou Blindagem Sucessória',       ok: false },
  { emoji: '✈️', nome: 'Viajante de Graça',          desc: 'Concluiu Milhas e Renda Ativa',        ok: false },
];

// ----------------------------------------------------------------------
// CONTEÚDO MASSIVO DA ACADEMIA FOI MOVIDO PARA educationContent.ts
// ----------------------------------------------------------------------
