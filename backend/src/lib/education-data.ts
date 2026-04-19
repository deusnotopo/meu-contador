/**
 * Education Data & Logic (Backend Port)
 * ──────────────────────────────────────
 * Metadata for lessons, trails, and scoring logic.
 */

export type MaturityStage = 'sobreviver' | 'estabilizar' | 'proteger' | 'organizar' | 'crescer' | 'multiplicar' | 'blindar' | 'perpetuar';
export type OutcomeType = 'caixa' | 'divida' | 'reserva' | 'investimento' | 'contabilidade' | 'tributario' | 'comportamento' | 'patrimonio';

export interface LessonMetadata {
  id: string;
  trilha: string;
  title: string;
  xp: number;
  outcomeType: OutcomeType;
  maturityStage: MaturityStage;
  triggerEvents: string[];
}

export const EDUCATION_MODULES: LessonMetadata[] = [
  {
    id: 'br_parcelamento_inteligente',
    trilha: 'start',
    title: 'Parcelamento Inteligente',
    xp: 70,
    outcomeType: 'divida',
    maturityStage: 'sobreviver',
    triggerEvents: ['fatura_alta', 'divida_cara', 'mes_apertado']
  },
  {
    id: 'br_dividas',
    trilha: 'start',
    title: 'A Armadilha do Rotativo',
    xp: 50,
    outcomeType: 'divida',
    maturityStage: 'sobreviver',
    triggerEvents: ['fatura_alta', 'divida_cara', 'mes_apertado']
  },
  {
    id: 'br_reserva',
    trilha: 'start',
    title: 'Reserva de Emergência',
    xp: 60,
    outcomeType: 'reserva',
    maturityStage: 'proteger',
    triggerEvents: ['sem_reserva', 'mes_apertado']
  },
  {
    id: 'br_saldo_seguro',
    trilha: 'start',
    title: 'Saldo Seguro',
    xp: 65,
    outcomeType: 'caixa',
    maturityStage: 'sobreviver',
    triggerEvents: ['mes_apertado', 'fatura_alta', 'organizar_rotina']
  },
  {
    id: 'br_mes_apertado',
    trilha: 'start',
    title: 'Sair do Mês Apertado',
    xp: 75,
    outcomeType: 'caixa',
    maturityStage: 'sobreviver',
    triggerEvents: ['mes_apertado', 'fatura_alta', 'divida_cara']
  },
  {
    id: 'br_assinaturas',
    trilha: 'start',
    title: 'Assinaturas e Custo Invisível',
    xp: 60,
    outcomeType: 'caixa',
    maturityStage: 'sobreviver',
    triggerEvents: ['mes_apertado', 'organizar_rotina', 'fatura_alta']
  },
  {
    id: 'base_zbb',
    trilha: 'base',
    title: 'Orçamento Base Zero Prático',
    xp: 80,
    outcomeType: 'caixa',
    maturityStage: 'organizar',
    triggerEvents: ['organizar_rotina', 'iniciar_planejamento', 'mes_apertado']
  },
  {
    id: 'base_envelopes',
    trilha: 'base',
    title: 'Envelopes e Categorias',
    xp: 70,
    outcomeType: 'comportamento',
    maturityStage: 'organizar',
    triggerEvents: ['organizar_rotina', 'iniciar_planejamento']
  },
  {
    id: 'cont_dre_simplificada',
    trilha: 'contabilidade',
    title: 'DRE em português claro',
    xp: 85,
    outcomeType: 'contabilidade',
    maturityStage: 'organizar',
    triggerEvents: ['organizar_rotina', 'negocio_sem_separacao', 'recebimento']
  },
  {
    id: 'cont_pf_pj',
    trilha: 'contabilidade',
    title: 'Separar PF e negócio',
    xp: 80,
    outcomeType: 'contabilidade',
    maturityStage: 'organizar',
    triggerEvents: ['negocio_sem_separacao', 'organizar_rotina', 'imposto_sem_reserva']
  }
];

export function getRecommendedLesson(
  completedLessonIds: string[],
  userProfile: {
    hasDebts?: boolean;
    hasEmergencyFund?: boolean;
    employmentType?: string;
    debtBalance?: number;
    pendingInvoices?: number;
  }
) {
  const activeTriggers: string[] = [];

  if (userProfile.hasDebts) activeTriggers.push('fatura_alta', 'divida_cara');
  if (userProfile.debtBalance && userProfile.debtBalance > 0) activeTriggers.push('divida_cara');
  if (userProfile.pendingInvoices && userProfile.pendingInvoices > 0) activeTriggers.push('recebimento');
  if (!userProfile.hasEmergencyFund) activeTriggers.push('sem_reserva', 'mes_apertado');
  if (userProfile.employmentType && ['autonomo', 'freelancer', 'pj', 'mei'].includes(userProfile.employmentType)) {
    activeTriggers.push('aumento_de_renda', 'organizar_rotina', 'negocio_sem_separacao');
  }

  const incompleteLessons = EDUCATION_MODULES.filter(m => !completedLessonIds.includes(m.id));

  const scored = incompleteLessons.map(lesson => {
    const triggerScore = lesson.triggerEvents.filter(t => activeTriggers.includes(t)).length;
    const maturityScore = ['sobreviver', 'estabilizar', 'proteger', 'organizar'].includes(lesson.maturityStage) ? 3 : 1;
    
    return {
      lesson,
      score: (triggerScore * 5) + maturityScore
    };
  }).sort((a, b) => b.score - a.score);

  return scored[0]?.lesson || incompleteLessons[0] || null;
}
