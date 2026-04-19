import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDebts } from "@/hooks/useDebts";
import { useGoals } from "@/hooks/useGoals";
import { useInvestments } from "@/hooks/useInvestments";
import { useInvoices } from "@/hooks/useInvoices";
import { motion, AnimatePresence } from "framer-motion";

import {
  EDUCATION_MODULES,
  ACADEMY_RITUALS,
  AULAS_TRILHAS,
  getLessonDependencyInfo,
  getLessonObjective,
  getLessonOutcomeType,
  getPrimaryTrailForProfile,
} from "@/data/educationData";
import { useEducation } from "@/hooks/useEducation";
import { LessonDetailView } from "./LessonDetailView";
import { FinancialInsightsTutor } from "./FinancialInsightsTutor";
import { showSuccess, showError } from "@/lib/toast";
import type { Debt, SavingsGoal } from "@/types";
import { TAB_TO_PILLAR, type TabType } from "@/types/navigation";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import {
  Search, BookOpen, Zap, Flame, Target, Trophy, ChevronRight, Lock, CheckCircle2, Star, Map, Sparkles
} from "lucide-react";

const LESSON_VIEW_SETTINGS_KEY = "mc_education_lesson_view_settings";

type LessonViewSettings = {
  focusMode: boolean;
  expandGuideByDefault: boolean;
};

const DEFAULT_LESSON_VIEW_SETTINGS: LessonViewSettings = {
  focusMode: true,
  expandGuideByDefault: false,
};

// ── helpers ────────────────────────────────────────────────────────────────
const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// ── main ───────────────────────────────────────────────────────────────────
export const EducationSection = ({
  onBack: _onBack,
  onNavigate,
}: { onBack?: () => void; onNavigate?: (tab: TabType) => void } = {}) => {
  const { user } = useAuth();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeTrilha, setActiveTrilha] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<"home" | "library" | "achievements" | "rituals">("home");
  const [lessonViewSettings, setLessonViewSettings] = useState<LessonViewSettings>(() => {
    try {
      const raw = localStorage.getItem(LESSON_VIEW_SETTINGS_KEY);
      return raw ? { ...DEFAULT_LESSON_VIEW_SETTINGS, ...JSON.parse(raw) } : DEFAULT_LESSON_VIEW_SETTINGS;
    } catch {
      return DEFAULT_LESSON_VIEW_SETTINGS;
    }
  });

  const primaryTrailId = getPrimaryTrailForProfile(user || undefined);
  const { debts } = useDebts();
  const { goals } = useGoals();
  const { assets } = useInvestments();
  const { invoices } = useInvoices();

  const [ritualChecked, setRitualChecked] = useState<Record<string, Record<number, boolean>>>({});

  const educationProfile = useMemo(
    () => ({
      ...(user || {}),
      userId: user?.id,
      debtBalance: debts.reduce((sum: number, debt: Debt) => sum + Number(debt.balance || 0), 0),
      goalsCount: goals.filter((g: SavingsGoal & { completed?: boolean }) => !g.completed).length,
      hasInvestments: assets.length > 0,
      pendingInvoicesAmount: invoices.filter((i) => i.status === "pending").reduce((s, i) => s + Number(i.amount || 0), 0),
      overdueInvoicesCount: invoices.filter((i) => i.status === "overdue").length,
    }),
    [assets.length, debts, goals, invoices, user]
  );

  const {
    state, error, isLoading, completeModule, saveLessonProgress,
    isModuleCompleted, getModuleProgress, getNextRecommendedLesson,
    getContextualRecommendation, getJourneyStage, getProgressPct,
    getReviewRecommendation, getMaturityRoadmap, isSyncing, forceSync,
  } = useEducation();

  const filteredLessons = (
    activeTrilha === "todas"
      ? EDUCATION_MODULES
      : EDUCATION_MODULES.filter((l) => l.trilha === activeTrilha)
  ).filter(
    (l) =>
      !searchQuery ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.sub || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const nextLesson = getNextRecommendedLesson(primaryTrailId);
  const contextualRecommendation = getContextualRecommendation();
  const reviewRecommendation = getReviewRecommendation();
  const journeyStage = getJourneyStage();
  const progressPct = getProgressPct();
  const maturityRoadmap = getMaturityRoadmap();

  const doneCount = EDUCATION_MODULES.filter((l) => isModuleCompleted(l.id)).length;
  const totalCount = EDUCATION_MODULES.length;
  const streak = state.streak || 0;
  const xp = state.xp || 0;
  const primaryTrail = AULAS_TRILHAS.find((t) => t.id === primaryTrailId);
  const topRecommendation = contextualRecommendation.lesson || nextLesson || null;

  const dynamicAchievements = useMemo(() => {
    const completedIds = new Set(state.completedModules);
    const completedTrails = new Set(EDUCATION_MODULES.filter((l) => completedIds.has(l.id)).map((l) => l.trilha));
    const allOf = (trail: string) => EDUCATION_MODULES.filter((l) => l.trilha === trail).every((l) => completedIds.has(l.id));
    return [
      { emoji: "🇧🇷", nome: "Sobrevivente do Serasa", desc: "Trilha Sobrevivência", ok: completedTrails.has("start") && allOf("start") },
      { emoji: "🏗️", nome: "Fundador de Base", desc: "Trilha Fundamentos", ok: completedTrails.has("base") && allOf("base") },
      { emoji: "🧾", nome: "Contador Prático", desc: "Contabilidade Leve", ok: completedTrails.has("contabilidade") && allOf("contabilidade") },
      { emoji: "🛡️", nome: "Reserva Blindada", desc: "Reserva + FGC", ok: completedIds.has("br_reserva") && completedIds.has("rf_fgc") },
      { emoji: "📈", nome: "Sócio de Empresas", desc: "Renda Variável", ok: completedTrails.has("renda_var") && allOf("renda_var") },
      { emoji: "🔥", nome: "Matemática do FIRE", desc: "Dominou SWR 3,2%", ok: completedIds.has("fire_math_br") },
      { emoji: "💰", nome: "Discípulo de Bazin", desc: "Dividendos BR", ok: completedTrails.has("dividendos") && allOf("dividendos") },
      { emoji: "₿", nome: "Hodler Consciente", desc: "Trilha Cripto", ok: completedTrails.has("cripto") && allOf("cripto") },
      { emoji: "📜", nome: "Patrimônio Blindado", desc: "Blindagem Sucessória", ok: completedTrails.has("sucessao") && allOf("sucessao") },
      { emoji: "🚀", nome: "Renda Ativa", desc: "Milhas e Renda Ativa", ok: completedTrails.has("renda_ativa") && allOf("renda_ativa") },
      { emoji: "🧠", nome: "Mente Blindada", desc: "Psicologia Financeira", ok: completedTrails.has("mental") && allOf("mental") },
      { emoji: "🎓", nome: "Mestre do Aprender", desc: `${doneCount}/${totalCount} aulas`, ok: doneCount === totalCount },
      // xp e streak derivados de state — referenciar state.xp e state.streak diretamente evita deps duplas
      { emoji: "⚡", nome: "XP Grandmaster", desc: "1000+ XP acumulados", ok: (state.xp || 0) >= 1000 },
      { emoji: "🔥", nome: "Streak de Ouro", desc: "30+ dias consecutivos", ok: (state.streak || 0) >= 30 },
    ];
  // Deps: apenas as fontes primárias — state.xp / state.streak não duplicadas com variáveis locais
  }, [doneCount, state.completedModules, state.xp, state.streak, totalCount]);

  const weeklyMission = useMemo(() => {
    // ── Nível 1: CRISE (Saldo ou Fluxo Negativo) ──
    if (educationProfile.overdueInvoicesCount > 0 || (user?.monthlyIncome && educationProfile.pendingInvoicesAmount > user.monthlyIncome)) {
      return { 
        title: "Operação Resgate: Fluxo de Caixa", 
        desc: "Você tem contas atrasadas ou um peso de boleto maior que sua renda média. Priorize a aula de 'Estancando o Sangramento'.", 
        cta: "Ir para Emergência", 
        lessonId: "br_crise",
        type: "crisis",
        icon: <Flame size={20} />
      };
    }

    // ── Nível 2: DÍVIDA (Juros Compostos contra você) ──
    if (educationProfile.debtBalance > 0) {
      return { 
        title: "Derrubar o Monstro dos Juros", 
        desc: "Dívidas identificadas. O objetivo desta semana é entender qual contrato quitar primeiro para economizar no longo prazo.", 
        cta: "Matar Dívidas", 
        lessonId: "br_dividas_prioridade",
        type: "debt",
        icon: <Zap size={20} />
      };
    }

    // ── Nível 3: BUDGET (Desorganização de Gastos) ──
    if (educationProfile.pendingInvoicesAmount > 0 && !user?.hasEmergencyFund) {
      return { 
        title: "Blindagem de Reserva", 
        desc: "Você está gastando mas ainda não tem seu 'Seguro de Vida Financeiro'. Vamos focar em criar sua Reserva de Emergência.", 
        cta: "Criar Reserva", 
        lessonId: "br_reserva",
        type: "budget",
        icon: <Target size={20} />
      };
    }

    // ── Nível 4: EXPANSÃO (Patrimônio e Multiplicação) ──
    return { 
      title: "Expansão de Patrimônio", 
      desc: "Base sólida detectada! Agora o foco é otimizar sua Renda Variável e entender como o mercado paga dividendos.", 
      cta: "Aprender a Investir", 
      lessonId: "invest_intro",
      type: "expansion",
      icon: <Sparkles size={20} />
    };
  // AKITA FIX: contextualRecommendation.lesson?.id e nextLesson?.id eram deps fantasma —
  // não usados dentro do memo. A missão semanal deriva apenas do perfil financeiro do usuário.
  }, [educationProfile, user]);

  const handleComplete = (lessonId: string, xpEarned: number) => {
    completeModule(lessonId);
    showSuccess(`Lição concluída! +${xpEarned} XP 🎉`);
    setActiveLessonId(null);
  };

  useEffect(() => {
    trackEvent(analyticsEvents.EDUCATION_OPEN, { trail_focus: primaryTrailId, progress_pct: progressPct, completed_lessons: doneCount });
  }, [doneCount, primaryTrailId, progressPct]);

  const safeNavigate = (tab?: string) => {
    if (!tab || !Object.prototype.hasOwnProperty.call(TAB_TO_PILLAR, tab)) {
      showError("Destino ainda não disponível.");
      return;
    }
    onNavigate?.(tab as TabType);
  };

  const activeLesson = EDUCATION_MODULES.find((m) => m.id === activeLessonId);

  const updateLessonViewSettings = (partial: Partial<LessonViewSettings>) => {
    setLessonViewSettings((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(LESSON_VIEW_SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  };

  // ── LESSON VIEW ────────────────────────────────────────────────────────
  if (activeLesson) {
    return (
      <LessonDetailView
        lesson={activeLesson}
        initialCompletedSteps={getModuleProgress(activeLesson.id).completedSteps}
        checkpointLabel={getModuleProgress(activeLesson.id).checkpointLabel}
        focusMode={lessonViewSettings.focusMode}
        expandGuideByDefault={lessonViewSettings.expandGuideByDefault}
        onSettingsChange={updateLessonViewSettings}
        onBack={() => {
          forceSync();
          setActiveLessonId(null);
        }}
        onNavigate={(tab) => {
          forceSync();
          safeNavigate(tab);
        }}
        onProgress={(completedSteps) => saveLessonProgress(activeLesson.id, completedSteps)}
        onComplete={(xp) => handleComplete(activeLesson.id, xp)}
      />
    );
  }

  // ── LOADING / ERROR ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4 p-4 animate-pulse">
        <div className="h-40 rounded-3xl bg-white/5" />
        <div className="h-28 rounded-3xl bg-white/5" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-white/5" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
        <div className="font-bold mb-1">Não foi possível carregar sua jornada.</div>
        <div className="text-xs opacity-70">{error}</div>
      </div>
    );
  }

  // ── MAIN RENDER ────────────────────────────────────────────────────────
  const navItems = [
    { id: "home", label: "Início", icon: <Sparkles size={14} /> },
    { id: "library", label: "Biblioteca", icon: <BookOpen size={14} /> },
    { id: "achievements", label: "Conquistas", icon: <Trophy size={14} /> },
    { id: "rituals", label: "Rituais", icon: <Target size={14} /> },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-12">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <motion.div variants={item}>
        <div className="card-obsidian relative overflow-hidden p-8">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-3">
                <BookOpen size={12} className="text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Academia Financeira</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Central de <span className="text-indigo-400">Aprendizado</span>
              </h1>
              <p className="text-sm text-[var(--t2)] mt-2 max-w-md leading-relaxed">
                Conteúdo guiado pelo seu momento financeiro real — com teoria, exemplo brasileiro e ação dentro do app.
              </p>
              
              <AnimatePresence>
                {isSyncing && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-2 mt-4 text-[10px] font-medium text-indigo-400 bg-indigo-500/5 py-1 px-3 rounded-full w-fit border border-indigo-500/10"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    Sincronizando progresso...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* XP + Streak badges */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-center p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 min-w-[64px]">
                <Flame size={18} className="text-amber-400 mb-1" />
                <span className="text-xl font-black text-amber-300 font-mono leading-none">{streak}</span>
                <span className="text-[9px] text-amber-400/70 uppercase tracking-widest mt-0.5">dias</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 min-w-[64px]">
                <Zap size={18} className="text-blue-400 mb-1" />
                <span className="text-xl font-black text-blue-300 font-mono leading-none">{xp}</span>
                <span className="text-[9px] text-blue-400/70 uppercase tracking-widest mt-0.5">XP</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 min-w-[64px]">
                <Star size={18} className="text-emerald-400 mb-1" />
                <span className="text-xl font-black text-emerald-300 font-mono leading-none">{progressPct}%</span>
                <span className="text-[9px] text-emerald-400/70 uppercase tracking-widest mt-0.5">progresso</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative z-10 mt-6 bg-white/5 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full"
            />
          </div>
          <div className="relative z-10 flex justify-between mt-1.5 text-[10px] text-white/30 font-mono">
            <span>{doneCount}/{totalCount} aulas concluídas</span>
            <span>{journeyStage.title}</span>
          </div>
        </div>
      </motion.div>

      {/* ── NAVIGATION DOCK ─────────────────────────────────────────────── */}
      <motion.div variants={item}>
        <div className="flex bg-white/[0.03] p-1.5 rounded-full border border-white/10 overflow-x-auto gap-2">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveSection(n.id as typeof activeSection)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                activeSection === n.id
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  : "text-[var(--t3)] hover:text-white hover:bg-white/5"
              }`}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="flex flex-wrap gap-2 items-center rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Configurações da aula</span>
          <button
            onClick={() => updateLessonViewSettings({ focusMode: !lessonViewSettings.focusMode })}
            className={`px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${lessonViewSettings.focusMode ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-white/[0.03] text-white/55 border-white/10"}`}
          >
            {lessonViewSettings.focusMode ? "Modo foco ligado" : "Modo foco desligado"}
          </button>
          <button
            onClick={() => updateLessonViewSettings({ expandGuideByDefault: !lessonViewSettings.expandGuideByDefault })}
            className={`px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${lessonViewSettings.expandGuideByDefault ? "bg-blue-500/15 text-blue-300 border-blue-500/30" : "bg-white/[0.03] text-white/55 border-white/10"}`}
          >
            {lessonViewSettings.expandGuideByDefault ? "Guia aberto por padrão" : "Guia fechado por padrão"}
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ══ HOME (Bento Grid) ═══════════════════════════════════════════ */}
        {activeSection === "home" && (
          <motion.div key="home" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} 
            className="grid grid-cols-6 gap-4">

            {/* MAIN RECOMMENDATION (Primary Bento) */}
            {topRecommendation && (
              <div className="card-obsidian col-span-6 md:col-span-4 relative overflow-hidden rounded-[2.5rem] p-8 border border-indigo-500/20 group shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-1000" />
                <div className="absolute bottom-[-100px] left-[-100px] w-60 h-60 bg-blue-600/5 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                    <Zap size={10} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Próximo Grande Passo</span>
                  </div>
                  <div className="text-3xl font-black text-white mb-4 tracking-tight leading-tight max-w-xl">{topRecommendation.title}</div>
                  <p className="text-sm text-[var(--t2)] leading-relaxed max-w-sm mb-8 opacity-90">
                    {contextualRecommendation.reason || getLessonObjective(topRecommendation)}
                  </p>
                  <button
                    onClick={() => setActiveLessonId(topRecommendation.id ?? null)}
                    className="flex items-center gap-3 bg-white text-black text-[11px] font-black uppercase tracking-widest px-10 py-4.5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    {contextualRecommendation.reason ? 'Continuar Jornada' : "Iniciar Jornada"}
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* WEEKLY MISSION (Contextual Bento) */}
            <div className={`col-span-6 md:col-span-2 relative overflow-hidden rounded-[2.5rem] p-8 border group transition-all duration-500 flex flex-col justify-center ${
              weeklyMission.type === "crisis" ? "border-red-500/40 bg-red-500/[0.04] shadow-[0_0_40px_rgba(239,68,68,0.05)]" :
              weeklyMission.type === "debt" ? "border-amber-500/40 bg-amber-500/[0.04] shadow-[0_0_40px_rgba(245,158,11,0.05)]" :
              "border-indigo-500/40 bg-indigo-500/[0.04] shadow-[0_0_40px_rgba(99,102,241,0.05)]"
            }`}>
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 rounded-2xl ${
                    weeklyMission.type === "crisis" ? "bg-red-500/20 text-red-400" :
                    weeklyMission.type === "debt" ? "bg-amber-500/20 text-amber-400" :
                    "bg-indigo-500/20 text-indigo-400"
                  }`}>
                    {weeklyMission.icon}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Missão</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">07 Dias</span>
                  </div>
                </div>
                <div className="text-xl font-black text-white mb-3 leading-tight">{weeklyMission.title}</div>
                <p className="text-xs text-[var(--t3)] leading-relaxed mb-8 flex-1 opacity-80">
                  {weeklyMission.desc}
                </p>
                <button
                  onClick={() => weeklyMission.lessonId && setActiveLessonId(weeklyMission.lessonId)}
                  className="w-full py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white transition-all backdrop-blur-sm"
                >
                  {weeklyMission.cta}
                </button>
              </div>
            </div>

            {/* STATS TILES (Refined for density) */}
            <div className="col-span-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Trilha Foco", value: primaryTrail?.label || "Geral", icon: primaryTrail?.emoji || "🧭", color: "indigo" },
                { label: "Energia XP", value: xp, icon: "⚡", color: "blue" },
                { label: "Concluídas", value: `${doneCount}/${totalCount}`, icon: "🎓", color: "emerald" },
                { label: "Fogo Ativo", value: `${streak} Dias`, icon: "🔥", color: "amber" },
              ].map((s, idx) => (
                <div key={idx} className="p-5 rounded-[1.8rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all hover:border-white/10 group">
                  <div className="text-[22px] mb-3 group-hover:scale-110 transition-transform">{s.icon}</div>
                  <div className="text-[9px] uppercase text-white/30 tracking-widest font-black mb-1.5">{s.label}</div>
                  <div className="text-xl font-black text-white leading-tight font-mono">{s.value}</div>
                </div>
              ))}
            </div>

            {/* PHASE 30: AI Financial Tutor — Contextual Insights */}
            <FinancialInsightsTutor onOpenLesson={(id) => setActiveLessonId(id)} />

            {/* REVIEW CARD & ROADMAP (Combined row) */}
            {reviewRecommendation.lesson ? (
              <>
                <div className="col-span-6 md:col-span-3 rounded-[2.2rem] p-7 border border-purple-500/20 bg-purple-500/[0.04] flex flex-col justify-between group relative overflow-hidden">
                  <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-purple-500/10 blur-[40px] rounded-full" />
                  <div>
                    <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-purple-400 mb-4 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                      <span className="animate-spin-slow">🔁</span> Revisão Necessária
                    </div>
                    <div className="text-xl font-black text-white mb-2 leading-tight">{reviewRecommendation.lesson.title}</div>
                    <p className="text-[11px] text-[var(--t3)] leading-relaxed max-w-xs">{reviewRecommendation.reason}</p>
                  </div>
                  <button
                    onClick={() => setActiveLessonId(reviewRecommendation.lesson!.id)}
                    className="mt-6 w-full py-4 rounded-xl bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-lg"
                  >
                    Atendimento de Dúvidas
                  </button>
                </div>

                <div className="col-span-6 md:col-span-3 rounded-[2.2rem] p-7 border border-white/8 bg-white/[0.02] flex flex-col group">
                   <div className="flex items-center gap-2 mb-6">
                    <Map size={16} className="text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Roadmap de Maturidade</span>
                  </div>
                  <div className="space-y-4 flex-1">
                    {maturityRoadmap.slice(0, 4).map((stage) => (
                      <div key={stage.id} className="relative">
                        <div className="flex justify-between items-end mb-1.5 px-1">
                          <div className="text-[10px] font-black text-white/70 uppercase tracking-tight">{stage.title}</div>
                          <div className="text-[9px] font-mono text-white/30">{stage.progressPct}%</div>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.04] p-[1px]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.progressPct}%` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className={`h-full rounded-full ${stage.progressPct === 100 ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]" : "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]"}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
                <div className="col-span-6 rounded-[2.2rem] p-8 border border-white/8 bg-white/[0.02] relative overflow-hidden">
                  <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full" />
                   <div className="flex items-center gap-3 mb-8">
                    <Map size={18} className="text-emerald-400" />
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-emerald-400">Radar de Conhecimento</span>
                      <span className="block text-2xl font-black text-white">Roadmap de Maturidade</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {maturityRoadmap.map((stage) => (
                      <div key={stage.id} className="relative">
                        <div className="flex justify-between items-end mb-2 px-1">
                          <div className="text-[11px] font-black text-white/50 uppercase tracking-tight">{stage.title}</div>
                          <div className="text-[10px] font-mono text-white/40">{stage.progressPct}%</div>
                        </div>
                        <div className="h-3 rounded-full bg-white/[0.05] p-[1.5px] border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.progressPct}%` }}
                            transition={{ duration: 1.8, ease: "circOut" }}
                            className={`h-full rounded-full ${stage.progressPct === 100 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]"}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            )}

          </motion.div>
        )}


        {/* ══ LIBRARY ═══════════════════════════════════════════════════ */}
        {activeSection === "library" && (
          <motion.div key="library" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Search + Filter */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 focus-within:border-indigo-500/50 transition-all">
                <Search size={14} className="text-white/30" />
                <input
                  className="flex-1 bg-transparent text-[var(--t1)] text-sm outline-none placeholder:text-[var(--t4)]"
                  placeholder="Buscar aula..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setActiveTrilha("todas")}
                  className={`shrink-0 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
                    activeTrilha === "todas" ? "bg-white text-black" : "bg-white/5 text-white/50 hover:text-white border border-white/10"
                  }`}
                >
                  🗂️ Todas
                </button>
                {(AULAS_TRILHAS as { id: string; label: string; emoji: string; color: string }[]).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTrilha(t.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all border ${
                      activeTrilha === t.id ? "text-white" : "bg-white/[0.03] text-white/50 hover:text-white"
                    }`}
                    style={
                      activeTrilha === t.id
                        ? { background: t.color, borderColor: "transparent" }
                        : { borderColor: `${t.color}30`, color: t.color }
                    }
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lesson cards */}
            <div className="space-y-3">
              {filteredLessons.map((l) => {
                const mp = getModuleProgress(l.id);
                const isCompleted = isModuleCompleted(l.id);
                const depInfo = getLessonDependencyInfo(l.id);
                const hardDepIds = depInfo.hardPrerequisites.filter((x: string) => x.startsWith("lesson:")).map((x: string) => x.replace("lesson:", ""));
                const missingDeps = hardDepIds.filter((id: string) => !isModuleCompleted(id));
                const isLocked = !isCompleted && missingDeps.length > 0;
                const tr = AULAS_TRILHAS.find((t) => t.id === l.trilha);
                const isPrimary = l.trilha === primaryTrailId;

                return (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      if (isLocked) { showError("🔒 Complete as lições anteriores primeiro"); return; }
                      setActiveLessonId(l.id);
                    }}
                    className={`rounded-2xl border overflow-hidden cursor-pointer transition-all group ${
                      isCompleted ? "border-emerald-500/20 bg-emerald-500/[0.03]" : isLocked ? "border-white/5 bg-white/[0.02] opacity-60" : "border-white/8 bg-white/[0.02] hover:border-indigo-500/30 hover:bg-indigo-500/[0.03]"
                    }`}
                  >
                    {/* Banner */}
                    <div className="relative h-14 overflow-hidden flex items-center px-4" style={{ background: l.grad }}>
                      <span className="text-3xl">{l.emoji}</span>
                      <div className="ml-auto flex gap-2">
                        {isCompleted && (
                          <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ✓ Concluída
                          </span>
                        )}
                        {isLocked && (
                          <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-black/40 text-white/40 border border-white/10">
                            🔒 Bloqueada
                          </span>
                        )}
                        {!isCompleted && !isLocked && isPrimary && (
                          <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Trilha Principal
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-sm font-bold text-white">{l.title}</div>
                          <div className="text-[11px] text-[var(--t3)]">{l.sub}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-blue-400 font-mono">+{l.xp} XP</div>
                          <div className="text-[10px] text-white/30 mt-0.5">⏱ {l.dur}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {tr && (
                          <span className="text-[9px] font-bold px-2 py-1 rounded-full" style={{ background: `${tr.color}18`, color: tr.color }}>
                            {tr.emoji} {tr.label}
                          </span>
                        )}
                        <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-amber-500/10 text-amber-400">
                          {getLessonOutcomeType(l)}
                        </span>
                      </div>

                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isCompleted ? "bg-emerald-500" : "bg-indigo-500"}`}
                          style={{ width: `${mp.progressPct}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[9px] text-white/30 font-mono">
                        {isCompleted ? `${mp.totalSteps}/${mp.totalSteps} passos` : mp.hasStarted ? mp.checkpointLabel : `0/${mp.totalSteps} passos`}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {filteredLessons.length === 0 && (
                <div className="p-12 text-center text-white/30">
                  <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                  <div className="text-sm">Nenhuma aula encontrada</div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ ACHIEVEMENTS ══════════════════════════════════════════════ */}
        {activeSection === "achievements" && (
          <motion.div key="achievements" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dynamicAchievements.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    a.ok ? "border-amber-500/25 bg-amber-500/[0.06]" : "border-white/5 bg-white/[0.02] opacity-50"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${a.ok ? "bg-amber-500/20" : "bg-white/5"}`}>
                    {a.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">{a.nome}</div>
                    <div className="text-[11px] text-white/40">{a.desc}</div>
                  </div>
                  {a.ok ? (
                    <CheckCircle2 size={18} className="text-amber-400 shrink-0" />
                  ) : (
                    <Lock size={14} className="text-white/20 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ══ RITUALS ═══════════════════════════════════════════════════ */}
        {activeSection === "rituals" && (
          <motion.div key="rituals" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {ACADEMY_RITUALS.map((ritual) => {
              const checkedItems = ritualChecked[ritual.id] || {};
              const allChecked = ritual.checklist.every((_, idx) => checkedItems[idx]);
              const checkedCount = ritual.checklist.filter((_, idx) => checkedItems[idx]).length;
              return (
                <div key={ritual.id} className={`rounded-3xl p-5 border ${allChecked ? "border-emerald-500/25 bg-emerald-500/[0.04]" : "border-white/5 bg-white/[0.02]"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                      {ritual.period === "semana" ? "📅" : "📆"}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{ritual.title}</div>
                      <div className="text-[11px] text-white/40">{ritual.description}</div>
                    </div>
                    <div className="ml-auto text-[10px] font-mono text-white/30">{checkedCount}/{ritual.checklist.length}</div>
                  </div>

                  <div className="h-1 rounded-full bg-white/5 mb-3">
                    <div
                      className={`h-full rounded-full transition-all ${allChecked ? "bg-emerald-500" : "bg-indigo-500"}`}
                      style={{ width: `${(checkedCount / ritual.checklist.length) * 100}%` }}
                    />
                  </div>

                  <div className="space-y-2">
                    {ritual.checklist.map((item2, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          const next = !checkedItems[idx];
                          trackEvent(analyticsEvents.EDUCATION_RITUAL_CHECK, { ritual_id: ritual.id, checklist_index: idx, checked: next });
                          setRitualChecked((prev) => ({ ...prev, [ritual.id]: { ...prev[ritual.id], [idx]: next } }));
                        }}
                        className="flex items-start gap-3 cursor-pointer group"
                      >
                        <div className={`w-5 h-5 rounded-md shrink-0 mt-0.5 flex items-center justify-center border transition-all ${
                          checkedItems[idx] ? "bg-emerald-500 border-emerald-500" : "border-white/20 group-hover:border-indigo-400"
                        }`}>
                          {checkedItems[idx] && <span className="text-white text-[10px] font-black">✓</span>}
                        </div>
                        <span className={`text-xs transition-all ${checkedItems[idx] ? "text-white/30 line-through" : "text-white/70 group-hover:text-white"}`}>
                          {item2}
                        </span>
                      </div>
                    ))}
                  </div>

                  {allChecked && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold text-center">
                      ✅ Ritual completo — Boa disciplina!
                    </div>
                  )}

                  <button
                    onClick={() => safeNavigate(ritual.targetTab)}
                    className="mt-4 w-full py-2.5 rounded-xl bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 text-xs font-bold text-white/60 hover:text-indigo-300 transition-all"
                  >
                    {ritual.actionLabel}
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
};
