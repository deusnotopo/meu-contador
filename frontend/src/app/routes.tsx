import { lazy } from 'react';

// ── All views are lazy-loaded — zero heavy components in initial bundle ───────
export const HealthSection       = lazy(() => import('@/components/health/HealthSection').then(m => ({ default: m.HealthSection })));
export const PersonalInflation   = lazy(() => import('@/components/health/PersonalInflation').then(m => ({ default: m.PersonalInflation })));
export const FinancialCheckin    = lazy(() => import('@/components/health/FinancialCheckin').then(m => ({ default: m.FinancialCheckin })));
export const InsurancePlanner    = lazy(() => import('@/components/planning/InsurancePlanner').then(m => ({ default: m.InsurancePlanner })));
export const NotificationsView   = lazy(() => import('@/components/notifications/NotificationsView').then(m => ({ default: m.NotificationsView })));
export const TransactionsView    = lazy(() => import('@/components/transactions/TransactionsView').then(m => ({ default: m.TransactionsView })));
export const LaunchScreen        = lazy(() => import('@/components/transactions/LaunchScreen').then(m => ({ default: m.LaunchScreen })));
import type { TabType } from '@/types/navigation';

export const MasterySection = lazy(() => import('@/components/mastery/MasterySection').then((m) => ({ default: m.MasterySection })));
export const GlobalDashboard = lazy(() => import('@/components/GlobalDashboard').then((m) => ({ default: m.GlobalDashboard })));
export const PlanningView = lazy(() => import('@/components/planning/PlanningView').then((m) => ({ default: m.PlanningView })));
export const EnvelopesView = lazy(() => import('@/components/planning/EnvelopesView').then((m) => ({ default: m.EnvelopesView })));
export const InvestCompostosView = lazy(() => import('@/components/investments/InvestCompostosView').then((m) => ({ default: m.InvestCompostosView })));
export const InvestDividasView = lazy(() => import('@/components/investments/InvestDividasView').then((m) => ({ default: m.InvestDividasView })));
export const RetireFireView = lazy(() => import('@/components/planning/RetireFireView').then((m) => ({ default: m.RetireFireView })));
export const RetireProjView = lazy(() => import('@/components/planning/RetireProjView').then((m) => ({ default: m.RetireProjView })));
export const InvestmentsSection = lazy(() => import('@/components/investments/InvestmentsDashboard').then((m) => ({ default: m.InvestmentsDashboard })));
export const EducationSection = lazy(() => import('@/components/education/EducationSection').then((m) => ({ default: m.EducationSection })));
export const AIAssistantView = lazy(() => import('@/components/ai/AIAssistantView').then((m) => ({ default: m.AIAssistantView })));
export const SettingsSection = lazy(() => import('@/components/settings/SettingsSection').then((m) => ({ default: m.SettingsSection })));
export const RetirementView = lazy(() => import('@/components/planning/RetirementView').then((m) => ({ default: m.RetirementView })));
export const AnalyticsDashboard = lazy(() => import('@/components/analytics/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard })));
export const BudgetDashboard = lazy(() => import('@/components/financial/BudgetDashboard').then((m) => ({ default: m.BudgetDashboard })));
export const FunctionsHub = lazy(() => import('@/components/FunctionsHub').then((m) => ({ default: m.FunctionsHub })));
export const OnboardingWizard = lazy(() => import('@/components/onboarding/OnboardingWizard').then((m) => ({ default: m.OnboardingWizard })));
export const ProvisaoView = lazy(() => import('@/components/financial/ProvisaoView').then((m) => ({ default: m.ProvisaoView })));
export const DebtPayoffPlanner = lazy(() => import('@/components/financial/DebtPayoffPlanner').then((m) => ({ default: m.DebtPayoffPlanner })));
export const CashFlowCalendar = lazy(() => import('@/components/financial/CashFlowCalendar').then((m) => ({ default: m.CashFlowCalendar })));

export const TAB_PATHS: Record<TabType, string> = {
  inicio: '/',
  health: '/health',
  personal_inflation: '/health/personal-inflation',
  financial_checkin: '/health/checkin',
  insurance_planner: '/health/insurance',
  notifications: '/notifications',
  budget: '/budget',
  caixa: '/budget/transactions',
  personal: '/budget/personal',
  analytics: '/budget/analytics',
  envelopes: '/budget/envelopes',
  envelope_detail: '/budget/envelopes/detail',
  cash_flow: '/budget/cash-flow',
  futuro: '/future',
  planos: '/future/plans',
  planning: '/future/planning',
  retirement: '/future/retirement',
  retire_fire: '/future/fire',
  retire_proj: '/future/projection',
  investir: '/invest',
  investments: '/invest/portfolio',
  invest_compostos: '/invest/compound-interest',
  invest_dividas: '/invest/debt-vs-invest',
  academia: '/academy',
  education: '/academy/content',
  ai: '/academy/ai',
  settings: '/settings',
  profile: '/profile',
  launch: '/launch',
  mastery: '/mastery',
  provisoes: '/budget/provisions',
  debt_payoff: '/budget/debt-payoff',
  business: '/business',
  invoices: '/business/invoices',
};

export const PATH_TO_TAB = Object.entries(TAB_PATHS).reduce<Record<string, TabType>>((acc, [tab, path]) => {
  acc[path] = tab as TabType;
  return acc;
}, {});