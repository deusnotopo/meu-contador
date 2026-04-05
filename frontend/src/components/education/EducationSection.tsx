import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDebts } from "@/hooks/useDebts";
import { useGoals } from "@/hooks/useGoals";
import { useInvestments } from "@/hooks/useInvestments";

import { EDUCATION_MODULES, ACADEMY_RITUALS, AULAS_TRILHAS, getLessonDependencyInfo, getLessonObjective, getLessonOutcomeType, getPrimaryTrailForProfile } from "@/data/educationData";
import { useEducation } from "@/hooks/useEducation";
import { LessonDetailView } from "./LessonDetailView";
import { showSuccess } from "@/lib/toast";
import type { Debt, SavingsGoal } from "@/types";
import type { TabType } from "@/types/navigation";

export const EducationSection = ({ onBack: _onBack, onNavigate }: { onBack?: () => void; onNavigate?: (tab: TabType) => void } = {}) => {
  const { user } = useAuth();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeTrilha, setActiveTrilha] = useState<string>('todas');
  const [showPanorama, setShowPanorama] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [showMissions, setShowMissions] = useState(false);

  const primaryTrailId = getPrimaryTrailForProfile(user || undefined);
  const { debts } = useDebts();
  const { goals } = useGoals();
  const { assets } = useInvestments();

  // Estado para rituais interativos
  const [ritualChecked, setRitualChecked] = useState<Record<string, Record<number, boolean>>>({});

  const educationProfile = useMemo(() => ({
    ...(user || {}),
    debtBalance: debts.reduce((sum: number, debt: Debt) => sum + Number(debt.balance || 0), 0),
    goalsCount: goals.filter((goal: SavingsGoal & { completed?: boolean }) => !goal.completed).length,
    hasInvestments: assets.length > 0,
  }), [assets.length, debts, goals, user]);

  const { state, completeModule, saveLessonProgress, isModuleCompleted, getModuleProgress, getNextRecommendedLesson, getContextualRecommendation, getJourneyStage, getProgressPct, getReviewRecommendation, getMaturityRoadmap } = useEducation(educationProfile);

  // ✅ Todos os hooks declarados ANTES de qualquer return condicional
  const filteredLessons = activeTrilha === 'todas'
    ? EDUCATION_MODULES
    : EDUCATION_MODULES.filter(l => l.trilha === activeTrilha);

  const nextLesson = getNextRecommendedLesson(primaryTrailId);
  const contextualRecommendation = getContextualRecommendation();
  const reviewRecommendation = getReviewRecommendation();
  const journeyStage = getJourneyStage();
  const progressPct = getProgressPct();
  const maturityRoadmap = getMaturityRoadmap();

  const doneCount = EDUCATION_MODULES.filter(l => isModuleCompleted(l.id)).length;
  const totalCount = EDUCATION_MODULES.length;

  const dynamicAchievements = useMemo(() => {
    const completedIds = new Set(state.completedModules);
    const completedTrails = new Set(EDUCATION_MODULES.filter(l => completedIds.has(l.id)).map(l => l.trilha));

    return [
      {
        emoji: '🇧🇷', nome: 'Sobrevivente do Serasa', desc: 'Completou a Trilha Sobrevivência',
        ok: completedTrails.has('start') && EDUCATION_MODULES.filter(l => l.trilha === 'start').every(l => completedIds.has(l.id)),
      },
      {
        emoji: '🏗️', nome: 'Fundador de Base', desc: 'Completou a Trilha Fundamentos',
        ok: completedTrails.has('base') && EDUCATION_MODULES.filter(l => l.trilha === 'base').every(l => completedIds.has(l.id)),
      },
      {
        emoji: '🧾', nome: 'Contador Prático', desc: 'Completou Contabilidade Leve',
        ok: completedTrails.has('contabilidade') && EDUCATION_MODULES.filter(l => l.trilha === 'contabilidade').every(l => completedIds.has(l.id)),
      },
      {
        emoji: '🛡️', nome: 'Reserva Blindada', desc: 'Concluiu aulas de proteção e reserva',
        ok: completedIds.has('br_reserva') && completedIds.has('rf_fgc'),
      },
      {
        emoji: '📈', nome: 'Sócio de Empresas', desc: 'Completou Renda Variável',
        ok: completedTrails.has('renda_var') && EDUCATION_MODULES.filter(l => l.trilha === 'renda_var').every(l => completedIds.has(l.id)),
      },
      {
        emoji: '🔥', nome: 'Matemática do FIRE BR', desc: 'Dominou a SWR de 3,2%',
        ok: completedIds.has('fire_math_br'),
      },
      {
        emoji: '💰', nome: 'Discípulo de Bazin', desc: 'Completou Dividendos BR',
        ok: completedTrails.has('dividendos') && EDUCATION_MODULES.filter(l => l.trilha === 'dividendos').every(l => completedIds.has(l.id)),
      },
      {
        emoji: '₿', nome: 'Hodler Consciente', desc: 'Completou a Trilha Cripto',
        ok: completedTrails.has('cripto') && EDUCATION_MODULES.filter(l => l.trilha === 'cripto').every(l => completedIds.has(l.id)),
      },
      {
        emoji: '📜', nome: 'Patrimônio Blindado', desc: 'Completou Blindagem Sucessória',
        ok: completedTrails.has('sucessao') && EDUCATION_MODULES.filter(l => l.trilha === 'sucessao').every(l => completedIds.has(l.id)),
      },
      {
        emoji: '🚀', nome: 'Renda Ativa Dominada', desc: 'Completou Milhas e Renda Ativa',
        ok: completedTrails.has('renda_ativa') && EDUCATION_MODULES.filter(l => l.trilha === 'renda_ativa').every(l => completedIds.has(l.id)),
      },
      {
        emoji: '🧠', nome: 'Mente Blindada', desc: 'Completou Psicologia Financeira',
        ok: completedTrails.has('mental') && EDUCATION_MODULES.filter(l => l.trilha === 'mental').every(l => completedIds.has(l.id)),
      },
      {
        emoji: '🎓', nome: 'Mestre da Academia', desc: `Completou ${doneCount}/${totalCount} aulas`,
        ok: doneCount === totalCount,
      },
      {
        emoji: '⚡', nome: 'XP Grandmaster', desc: 'Acumulou 1000+ XP',
        ok: (state.xp || 0) >= 1000,
      },
      {
        emoji: '🔥', nome: 'Streak de Ouro', desc: 'Manteve sequência de 30+ dias',
        ok: (state.streak || 0) >= 30,
      },
    ];
  }, [doneCount, state.completedModules, state.streak, state.xp, totalCount]);

  const streak = state.streak || 7;
  const xp = state.xp || 350;

  const weeklyMission = useMemo(() => {
    if (user?.hasDebts) {
      return {
        title: 'Missão da semana: estancar juros destrutivos',
        desc: 'Revise dívidas caras, registre parcelas e priorize a aula que reduz dano imediato no caixa.',
        cta: 'Abrir aula crítica',
        lessonId: contextualRecommendation.lesson?.id || nextLesson?.id,
      };
    }

    if (!user?.hasEmergencyFund) {
      return {
        title: 'Missão da semana: construir proteção mínima',
        desc: 'Aprenda liquidez certa, abra a meta da reserva e defina o primeiro aporte automático.',
        cta: 'Começar proteção',
        lessonId: contextualRecommendation.lesson?.id || nextLesson?.id,
      };
    }

    return {
      title: 'Missão da semana: conectar teoria e execução',
      desc: 'Conclua uma aula, aplique uma ação no app e transforme conhecimento em resultado real.',
      cta: 'Seguir missão',
      lessonId: contextualRecommendation.lesson?.id || nextLesson?.id,
    };
  }, [contextualRecommendation.lesson?.id, nextLesson?.id, user?.hasDebts, user?.hasEmergencyFund]);



  const handleComplete = (lessonId: string, xpEarned: number) => {
    completeModule(lessonId);
    showSuccess(`Lição concluída! +${xpEarned} XP 🎉`);
    setActiveLessonId(null);
  };

  const activeLesson = EDUCATION_MODULES.find(m => m.id === activeLessonId);

  // ✅ APÓS TODOS OS HOOKS, PODE TER RETURN CONDICIONAL
  if (activeLesson) {
    return (
      <LessonDetailView
        lesson={activeLesson}
        initialCompletedSteps={getModuleProgress(activeLesson.id).completedSteps}
        checkpointLabel={getModuleProgress(activeLesson.id).checkpointLabel}
        onBack={() => setActiveLessonId(null)}
        onNavigate={(tab) => onNavigate?.(tab as TabType)}
        onProgress={(completedSteps) => saveLessonProgress(activeLesson.id, completedSteps)}
        onComplete={(xp) => handleComplete(activeLesson.id, xp)}
      />
    );
  }

  const topRecommendation = contextualRecommendation.lesson || nextLesson || null;

  return (
    <div style={{ paddingTop: "10px", animation: "fsu 0.25s ease" }}>

      {/* ── Header ─────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div className="eyebrow">Aprendizado</div>
          <div className="page-title" style={{ fontSize: "22px", margin: 0 }}>Academia 🎓</div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ background: "var(--amber-d)", border: "1px solid rgba(255,173,59,0.25)", borderRadius: "12px", padding: "6px 10px", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "16px", animation: "stk 1.5s ease infinite" }}>🔥</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--amber)", fontFamily: "var(--mono)" }}>{streak}</span>
          </div>
          <div style={{ background: "var(--blue3)", border: "1px solid rgba(74,139,255,0.25)", borderRadius: "12px", padding: "6px 10px", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "12px" }}>⚡</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--blue)", fontFamily: "var(--mono)" }}>{xp} XP</span>
          </div>
        </div>
      </div>

      {/* ── PRIORIDADE ÚNICA: O QUE FAZER AGORA ─────────────────────────────── */}
      {topRecommendation && (
        <div className="card" style={{ padding: "20px", marginBottom: "14px", border: "1px solid rgba(255,173,59,0.22)", background: "linear-gradient(135deg, rgba(255,173,59,0.10), rgba(74,139,255,0.08))" }}>
          <div style={{ fontSize: "10px", color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, marginBottom: "6px" }}>
            Seu próximo melhor passo
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t1)", marginBottom: "6px" }}>
            {topRecommendation.title}
          </div>
          <div style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.5, marginBottom: "14px" }}>
            {contextualRecommendation.reason || getLessonObjective(topRecommendation)}
          </div>
          <button className="btn-p" style={{ marginTop: 0 }} onClick={() => setActiveLessonId(topRecommendation.id || null)}>
            Abrir aula
          </button>
        </div>
      )}

      {/* ── BARRA DE JORNADA ─────────────────────────────── */}
      <div className="card" style={{ padding: "16px", marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
            Sua jornada
          </div>
          <div style={{ fontSize: "11px", color: "var(--blue)" }} onClick={() => setShowJourney(!showJourney)}>
            {showJourney ? "fechar" : "ver tudo ▼"}
          </div>
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--t1)", marginBottom: "6px" }}>
          {journeyStage.title}
        </div>
        <div style={{ background: "var(--glass2)", borderRadius: "999px", height: "8px", overflow: "hidden", marginBottom: "6px" }}>
          <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg,#2F62D9,#5048E8)" }} />
        </div>
      </div>

      {/* ── MISSÃO DA SEMANA ─────────────────────────────── */}
      <div className="card" style={{ padding: "16px", marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
            Missão e ritual
          </div>
          <div style={{ fontSize: "11px", color: "var(--purple)" }} onClick={() => setShowMissions(!showMissions)}>
            {showMissions ? "fechar" : "ver tudo ▼"}
          </div>
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--t1)", marginBottom: "6px" }}>
          {weeklyMission.title}
        </div>
        <div style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, marginBottom: "12px" }}>
          {weeklyMission.desc}
        </div>
        <button className="btn-p" style={{ marginTop: 0 }} onClick={() => weeklyMission.lessonId && setActiveLessonId(weeklyMission.lessonId)}>
          {weeklyMission.cta}
        </button>

        {/* Rituais interativos */}
        {showMissions && (
          <div style={{ marginTop: "16px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
            {ACADEMY_RITUALS.map((ritual) => {
              const ritualKey = ritual.id;
              const checkedItems = ritualChecked[ritualKey] || {};
              const allChecked = ritual.checklist.every((_, idx) => checkedItems[idx]);
              return (
                <div key={ritual.id} style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px" }}>{ritual.period === 'semana' ? '📅' : '📆'}</span>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--t1)" }}>{ritual.title}</div>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--t2)", marginBottom: "8px" }}>{ritual.description}</div>
                  {ritual.checklist.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setRitualChecked(prev => ({
                          ...prev,
                          [ritualKey]: { ...prev[ritualKey], [idx]: !prev[ritualKey]?.[idx] }
                        }));
                      }}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: "8px", padding: "6px 0",
                        cursor: "pointer", opacity: checkedItems[idx] ? 0.5 : 1,
                      }}
                    >
                      <div style={{
                        width: "16px", height: "16px", borderRadius: "4px", flexShrink: 0, marginTop: "1px",
                        border: checkedItems[idx] ? "none" : "1.5px solid var(--t3)",
                        background: checkedItems[idx] ? "var(--green)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: "10px", fontWeight: 900,
                      }}>
                        {checkedItems[idx] && "✓"}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--t2)", textDecoration: checkedItems[idx] ? "line-through" : "none" }}>
                        {item}
                      </div>
                    </div>
                  ))}
                  {allChecked && (
                    <div style={{ fontSize: "10px", color: "var(--green)", fontWeight: 600, marginTop: "4px" }}>
                      ✅ Ritual completo — boa disciplina!
                    </div>
                  )}
                  <button
                    className="btn-p"
                    style={{ marginTop: "8px", fontSize: "11px", padding: "6px 12px" }}
                    onClick={() => {
                      if (onNavigate) onNavigate(ritual.targetTab as TabType);
                    }}
                  >
                    {ritual.actionLabel}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Panorama de Maturidade ─────────────────────────── */}
      <div className="card" style={{ padding: "16px", marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
            Panorama de maturidade
          </div>
          <div style={{ fontSize: "11px", color: "var(--blue)" }} onClick={() => setShowPanorama(!showPanorama)}>
            {showPanorama ? "fechar" : "ver mapa ▼"}
          </div>
        </div>
        {showPanorama && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {maturityRoadmap.map((stage) => (
              <div key={stage.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 800,
                  background: stage.progressPct === 100 ? "linear-gradient(135deg, #00D991, #00B87A)" : stage.progressPct > 0 ? "linear-gradient(135deg, #2F62D9, #5048E8)" : "var(--glass2)",
                  color: stage.progressPct > 0 ? "#fff" : "var(--t3)",
                }}>
                  {stage.progressPct === 100 ? "✓" : `${stage.progressPct}%`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--t1)" }}>{stage.title}</div>
                  <div style={{ fontSize: "10px", color: "var(--t3)" }}>{stage.description}</div>
                  <div style={{ background: "var(--glass2)", borderRadius: "999px", height: "4px", overflow: "hidden", marginTop: "4px" }}>
                    <div style={{
                      width: `${stage.progressPct}%`, height: "100%",
                      background: stage.progressPct === 100 ? "linear-gradient(90deg,#00D991,#00B87A)" : "linear-gradient(90deg,#2F62D9,#5048E8)",
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BIBLIOTECA ─────────────────────────────── */}
      <div className="card" style={{ padding: "16px", marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
            Biblioteca completa
          </div>
          <div style={{ fontSize: "11px", color: "var(--green)" }} onClick={() => setShowLibrary(!showLibrary)}>
            {showLibrary ? "fechar" : "abrir ▼"}
          </div>
        </div>

        {showLibrary && (
          <div style={{ marginTop: "8px" }}>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none", margin: "0 -16px", padding: "0 16px 12px" }}>
              <div
                className={`tpill ${activeTrilha === 'todas' ? 'active' : ''}`}
                style={activeTrilha === 'todas' ? { background: "linear-gradient(135deg, #2F62D9, #5048E8)", borderColor: "transparent" } : {}}
                onClick={() => setActiveTrilha('todas')}
              >
                🗂️ Todas
              </div>
              {(AULAS_TRILHAS as { id: string; label: string; emoji: string; color: string }[]).map(t => (
                <div
                  key={t.id}
                  className={`tpill ${activeTrilha === t.id ? 'active' : ''}`}
                  style={activeTrilha === t.id ? { background: t.color, borderColor: "transparent" } : { color: t.color, borderColor: `${t.color}44` }}
                  onClick={() => setActiveTrilha(t.id)}
                >
                  {t.emoji} {t.label}
                </div>
              ))}
            </div>

            {/* ── Lições ─────────────────────────────── */}
            {filteredLessons.map((l) => {
              const moduleProgress = getModuleProgress(l.id);
              const isCompleted = isModuleCompleted(l.id);
              const globalIdx: number = EDUCATION_MODULES.findIndex(m => m.id === l.id);
              const dependencyInfo = getLessonDependencyInfo(l.id);
              const hardDependencyIds: string[] = dependencyInfo.hardPrerequisites
                .filter((item: string) => item.startsWith('lesson:'))
                .map((item: string) => item.replace('lesson:', ''));
              const missingHardDependencies: string[] = hardDependencyIds.filter((id: string) => !isModuleCompleted(id));
              const isLocked = !isCompleted && missingHardDependencies.length > 0;
              const previousLesson = globalIdx > 0 ? EDUCATION_MODULES[globalIdx - 1] : null;
              const isPrimaryTrail = l.trilha === primaryTrailId;

              const tr = AULAS_TRILHAS.find(t => t.id === l.trilha);
              const conceptsCount = l.passos.filter(p => p.tipo !== 'quiz').length;

              return (
                <div
                  key={l.id}
                  className="lcard"
                  onClick={() => {
                    if (isLocked) {
                      showSuccess('🔒 Complete as lições anteriores primeiro');
                    } else {
                      setActiveLessonId(l.id);
                    }
                  }}
                  style={{ opacity: isLocked ? 0.5 : 1 }}
                >
                  <div className="lbanner" style={{ background: l.grad }}>
                    <span style={{ fontSize: "36px", filter: isLocked ? "grayscale(1)" : "none" }}>{l.emoji}</span>
                    {isCompleted ? (
                      <span className="lbadge" style={{ background: "var(--green-d)", color: "var(--green)", border: "1px solid rgba(0,217,145,0.3)" }}>✓ Concluída</span>
                    ) : isLocked ? (
                      <span className="lbadge" style={{ background: "rgba(0,0,0,0.4)", color: "var(--t3)", border: "1px solid var(--border)" }}>🔒 Bloqueada</span>
                    ) : isPrimaryTrail ? (
                      <span className="lbadge" style={{ background: "rgba(0,217,145,0.16)", color: "var(--green)", border: "1px solid rgba(0,217,145,0.3)" }}>Trilha principal</span>
                    ) : (
                      <span className="lbadge" style={{ background: "rgba(74,139,255,0.2)", color: "var(--blue)", border: "1px solid rgba(74,139,255,0.3)" }}>Nova</span>
                    )}
                    {isCompleted && (
                      <div style={{ position: "absolute", bottom: "8px", left: "14px", display: "flex", gap: "3px" }}>⭐⭐⭐</div>
                    )}
                  </div>
                  <div className="lbody">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--t1)", marginBottom: "2px" }}>{l.title}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--t2)" }}>{l.sub}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "11px", color: "var(--blue)", fontWeight: 700, fontFamily: "var(--mono)" }}>+{l.xp} XP</div>
                        <div style={{ fontSize: "10px", color: "var(--t3)", marginTop: "1px" }}>⏱ {l.dur}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px", alignItems: "center" }}>
                      <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", background: tr?.bg || 'var(--glass2)', color: tr?.color || 'var(--t2)' }}>
                        {tr?.emoji} {tr?.label}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", color: "var(--amber)" }}>
                        foco: {getLessonOutcomeType(l)}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--t3)" }}>
                        {conceptsCount} conceitos · {moduleProgress.totalSteps} passos
                      </span>
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ background: "var(--glass2)", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
                        <div style={{ width: `${moduleProgress.progressPct}%`, height: "100%", background: isCompleted ? "linear-gradient(90deg,#00D991,#00B87A)" : "linear-gradient(90deg,#2F62D9,#5048E8)" }} />
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "10px", color: moduleProgress.hasStarted ? "var(--blue)" : "var(--t3)", fontWeight: moduleProgress.hasStarted ? 600 : 400 }}>
                        {isCompleted
                          ? `Checkpoint finalizado · ${moduleProgress.totalSteps}/${moduleProgress.totalSteps} passos`
                          : moduleProgress.hasStarted
                            ? `${moduleProgress.checkpointLabel}`
                            : `Progresso do módulo · 0/${moduleProgress.totalSteps} passos`}
                      </div>
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "10px", color: isLocked ? "var(--amber)" : "var(--t3)" }}>
                      {globalIdx === 0
                        ? "Ponto de partida recomendado da jornada"
                        : isLocked && missingHardDependencies.length > 0
                          ? `Pré-requisito por competência: conclua "${EDUCATION_MODULES.find((lesson) => lesson.id === missingHardDependencies[0])?.title || previousLesson?.title}"`
                          : previousLesson
                            ? `Continuação de: ${previousLesson.title}`
                            : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Revisão Pendente ─────────────────────────── */}
      {reviewRecommendation.lesson && (
        <div className="card" style={{ padding: "16px", marginBottom: "14px", border: "1px solid rgba(155,127,255,0.22)", background: "linear-gradient(135deg, rgba(155,127,255,0.08), rgba(74,139,255,0.06))" }}>
          <div style={{ fontSize: "10px", color: "var(--purple)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, marginBottom: "6px" }}>
            Revisão espaçada pendente
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--t1)", marginBottom: "4px" }}>
            {reviewRecommendation.lesson.emoji} {reviewRecommendation.lesson.title}
          </div>
          <div style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5, marginBottom: "10px" }}>
            {reviewRecommendation.reason}
          </div>
          <button className="btn-p" style={{ marginTop: 0, background: "linear-gradient(135deg, #9B7FFF, #5048E8)" }} onClick={() => setActiveLessonId(reviewRecommendation.lesson!.id)}>
            Revisar agora
          </button>
        </div>
      )}

      {/* ── Conquistas ─────────────────────────── */}
      <div className="sec-hd"><span className="sec-title">Conquistas</span></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", marginBottom: "16px" }}>
        {dynamicAchievements.map((c, idx) => (
          <div key={idx} className="card" style={{ opacity: c.ok ? 1 : 0.45, display: "flex", alignItems: "center", gap: "10px", padding: "12px" }}>
            <div className="ach" style={{ background: c.ok ? "rgba(255,173,59,0.12)" : "var(--glass2)" }}>{c.emoji}</div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--t1)" }}>{c.nome}</div>
              <div style={{ fontSize: "10.5px", color: "var(--t3)", marginTop: "1px" }}>{c.desc}</div>
              {c.ok ? (
                <div style={{ fontSize: "10px", color: "var(--amber)", fontWeight: 600, marginTop: "2px" }}>✓ Desbloqueada</div>
              ) : (
                <div style={{ fontSize: "10px", color: "var(--t3)", marginTop: "2px" }}>🔒 Bloqueada</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
