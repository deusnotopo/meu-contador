import React, { useState } from "react";
import { EDUCATION_MODULES, getLessonActivationContext, getLessonAssociatedFeature, getLessonBehaviorGoal, getLessonObjective, getLessonOutcomeType, getLessonReferences, type Lesson } from "@/data/educationData";
import { showSuccess } from "@/lib/toast";
import DOMPurify from "dompurify";
import { TAB_TO_PILLAR, type TabType } from "@/types/navigation";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, X, Target, Info, MapPin, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonDetailViewProps {
  lesson: Lesson;
  initialCompletedSteps?: number;
  checkpointLabel?: string;
  focusMode?: boolean;
  expandGuideByDefault?: boolean;
  onSettingsChange?: (settings: { focusMode?: boolean; expandGuideByDefault?: boolean }) => void;
  onBack: () => void;
  onProgress?: (completedSteps: number) => void;
  onComplete: (xpEarned: number) => void;
  onNavigate?: (targetTab: TabType) => void;
}

export const LessonDetailView: React.FC<LessonDetailViewProps> = ({ lesson, initialCompletedSteps = 0, checkpointLabel, focusMode = true, expandGuideByDefault = false, onSettingsChange, onBack, onProgress, onComplete, onNavigate }) => {
  const [passoAtual, setPassoAtual] = useState(() => Math.min(initialCompletedSteps, Math.max(lesson.passos.length - 1, 0)));
  const [quizIdx, setQuizIdx] = useState<number | null>(null);
  const [quizOk, setQuizOk] = useState(false);
  const [quizAcertou, setQuizAcertou] = useState(false);
  const [showLessonGuide, setShowLessonGuide] = useState(expandGuideByDefault);

  const lessonIndex = EDUCATION_MODULES.findIndex((module) => module.id === lesson.id);
  const previousLesson = lessonIndex > 0 ? EDUCATION_MODULES[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 && lessonIndex < EDUCATION_MODULES.length - 1
    ? EDUCATION_MODULES[lessonIndex + 1]
    : null;

  React.useEffect(() => {
    trackEvent(analyticsEvents.EDUCATION_LESSON_START, {
      lesson_id: lesson.id,
      trail: lesson.trilha,
      step: passoAtual + 1,
    });
  }, [lesson.id, lesson.trilha, passoAtual]);

  const passo = lesson.passos[passoAtual];
  if (!passo) return null;
  const total = lesson.passos.length;
  const isLast = passoAtual === total - 1;
  const isQuiz = passo.tipo === 'quiz';

  const extractNavigationTarget = (ctaFn?: string): TabType | null => {
    const match = ctaFn?.match(/go\('([^']+)'\)/);
    const target = match?.[1];

    if (!target || !Object.prototype.hasOwnProperty.call(TAB_TO_PILLAR, target)) {
      return null;
    }

    return target as TabType;
  };

  const avancarPasso = () => {
    const nextCompletedSteps = Math.min(passoAtual + 1, total);
    onProgress?.(nextCompletedSteps);
    setPassoAtual(prev => prev + 1);
    setQuizOk(false);
    setQuizAcertou(false);
    setQuizIdx(null);
  };

  const voltarPasso = () => {
    if (passoAtual > 0) {
      setPassoAtual(prev => prev - 1);
      setQuizOk(false);
      setQuizAcertou(false);
      setQuizIdx(null);
    }
  };

  const responderQuiz = (idx: number) => {
    setQuizOk(true);
    setQuizIdx(idx);
    const acertou = idx === passo.correta;
    setQuizAcertou(acertou);
    if (acertou) {
      showSuccess('🎯 Correto! +10 XP bônus');
    }
  };

  const renderCorpo = () => {
    if (passo.tipo === 'teoria') {
      return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center text-6xl mt-4 mb-6">{passo.visual}</div>
          <h2 className="text-xl font-black text-white tracking-tight">{passo.titulo}</h2>
          <div className="text-sm text-[var(--t2)] leading-relaxed max-w-none prose prose-p:text-[var(--t2)] prose-strong:text-white" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(passo.conteudo || '') }} />
        </div>
      );
    }
    if (passo.tipo === 'regra') {
      return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span className="text-amber-400">📌</span> {passo.titulo}
          </h2>
          <div className="text-sm text-[var(--t2)] leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(passo.conteudo || '') }} />
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <div className="flex gap-2 text-indigo-300 text-sm font-medium">
              <span className="mt-0.5">💡</span>
              <span className="leading-relaxed">{passo.exemplo}</span>
            </div>
          </div>
        </div>
      );
    }
    if (passo.tipo === 'exemplo') {
      return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span className="text-blue-400">🔢</span> {passo.titulo}
          </h2>
          <div className="text-sm text-[var(--t2)] leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(passo.conteudo || '') }} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center flex flex-col items-center justify-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--t3)] mb-2">Resultado simples</span>
              <span className="text-2xl font-black text-rose-400 tracking-tight">{passo.calculo?.simples}</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center flex flex-col items-center justify-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--t3)] mb-2">Resultado composto</span>
              <span className="text-2xl font-black text-emerald-400 tracking-tight">{passo.calculo?.composto}</span>
            </div>
            <div className="md:col-span-2 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
              <span className="text-sm font-black text-indigo-400">{passo.calculo?.delta}</span>
            </div>
          </div>
        </div>
      );
    }
    if (passo.tipo === 'quiz') {
      const letras = ['A', 'B', 'C', 'D'];
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Target size={12} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Desafio Rápido</span>
          </div>
          <h2 className="text-lg font-bold text-white leading-snug">{passo.pergunta}</h2>
          
          <div className="space-y-3">
            {passo.opcoes?.map((op, i) => {
              const isCorrectOpt = i === passo.correta;
              const isSelectedOpt = i === quizIdx;
              
              let bgClass = "bg-white/5 border-white/5 hover:bg-white/10 hover:border-indigo-500/30 text-[var(--t2)]";
              let letterBgClas = "bg-white/10 text-[var(--t3)]";
              
              if (quizOk) {
                if (isCorrectOpt) {
                  bgClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
                  letterBgClas = "bg-emerald-500/20 text-emerald-400";
                } else if (isSelectedOpt) {
                  bgClass = "bg-rose-500/10 border-rose-500/30 text-rose-100 opacity-80";
                  letterBgClas = "bg-rose-500/20 text-rose-400";
                } else {
                  bgClass = "bg-white/5 border-white/5 text-[var(--t4)] opacity-40 cursor-not-allowed";
                  letterBgClas = "bg-white/5 text-[var(--t4)]";
                }
              }

              return (
                <div 
                  key={i} 
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${bgClass}`}
                  onClick={() => !quizOk && responderQuiz(i)}
                >
                  <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-black transition-colors ${letterBgClas}`}>
                    {letras[i]}
                  </div>
                  <span className="text-sm font-medium leading-normal flex-1">{op}</span>
                  {quizOk && isCorrectOpt && <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />}
                  {quizOk && isSelectedOpt && !isCorrectOpt && <X size={20} className="text-rose-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          <AnimatePresence>
            {quizOk && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: 10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                className={`p-5 rounded-2xl border ${quizAcertou ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}
              >
                <div className={`text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${quizAcertou ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {quizAcertou ? <><Check size={14}/> Bônus Desbloqueado</> : <><Info size={14}/> Tente Novamente</>}
                </div>
                <div className="text-sm text-[var(--t2)] leading-relaxed">{passo.expl}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }
    if (passo.tipo === 'acao') {
      return (
        <div className="space-y-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-2xl font-black text-white px-4">{passo.titulo}</h2>
          <div className="text-sm text-[var(--t2)] leading-relaxed max-w-sm mx-auto" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(passo.conteudo || '') }} />
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 pb-24">
      {/* HEADER TABS & PATHS */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--t2)] shrink-0">
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-white truncate">{lesson.title}</div>
          <div className="flex items-center gap-1.5 mt-1">
            {Array.from({ length: total }, (_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i < passoAtual ? 'bg-emerald-500 w-3' : i === passoAtual ? 'bg-indigo-500 w-6' : 'bg-white/10 w-2'}`}
              />
            ))}
          </div>
        </div>
        <div className="text-[10px] font-black font-mono text-[var(--t4)] shrink-0 bg-white/5 px-2 py-1 rounded-md">{passoAtual + 1}/{total}</div>
      </div>

      {/* MAIN CARD EXPERIENCIA DE FOCO */}
      <div className="premium-card p-6 md:p-8 min-h-[460px] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Settings Toggle Area */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => onSettingsChange?.({ focusMode: !focusMode })}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${focusMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-[var(--t3)] border-white/5'}`}
          >
            {focusMode ? 'Modo foco ON' : 'Modo detalhado'}
          </button>
          <button
            onClick={() => {
              const next = !expandGuideByDefault;
              onSettingsChange?.({ expandGuideByDefault: next });
              setShowLessonGuide(next);
            }}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${expandGuideByDefault ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-[var(--t3)] border-white/5'}`}
          >
            {expandGuideByDefault ? 'Auto-expandir metas ON' : 'Auto-expandir metas OFF'}
          </button>
        </div>

        {/* Info Strip */}
        <div className={`flex flex-wrap gap-2 transition-all ${focusMode ? 'mb-8' : 'mb-6'}`}>
          <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {getLessonOutcomeType(lesson)}
          </span>
          <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {lesson.xp} XP
          </span>
          <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {lesson.dur}
          </span>
        </div>

        <div className={`p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/10 mb-8 transition-all ${focusMode ? 'opacity-50' : 'opacity-100'}`}>
          <div className="flex justify-between items-center gap-2 mb-3">
            <div className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Progresso deste Módulo</div>
            <div className="text-[10px] font-mono text-[var(--t3)]">{Math.min(passoAtual + 1, total)}/{total}</div>
          </div>
          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mb-3">
             <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-in-out" style={{ width: `${Math.round((Math.min(passoAtual + 1, total) / total) * 100)}%` }} />
          </div>
          <div className="text-xs text-[var(--t3)] font-medium">
            {checkpointLabel || `Seu progresso é gravado. Pode fechar o app se precisar.`}
          </div>
        </div>

        {/* Dynamic content rendering relative to active step */}
        <div className="flex-1">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={passoAtual}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
              transition={{ duration: 0.3 }}
            >
              {renderCorpo()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* EXPANDABLE CONTEXT GUIDE */}
        <div className="mt-12 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <button
            onClick={() => setShowLessonGuide((prev) => !prev)}
            className="w-full bg-transparent flex items-center justify-between p-4 cursor-pointer group"
          >
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
              {focusMode ? "Abrir Detalhes Formativos" : "Detalhes da Aula"}
            </span>
            <span className={`transition-transform text-white/40 ${showLessonGuide ? 'rotate-180 text-indigo-400' : ''}`}>▼</span>
          </button>

          <AnimatePresence>
            {showLessonGuide && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: "auto", opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 grid gap-3">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <div className="text-[9px] text-amber-500 uppercase tracking-widest font-black mb-2 flex items-center gap-2"><Target size={12}/> Objetivo prático</div>
                    <div className="text-xs text-[var(--t2)] leading-relaxed max-w-sm">{getLessonObjective(lesson)}</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-[9px] text-emerald-500 uppercase tracking-widest font-black mb-2 flex items-center gap-2"><MapPin size={12}/> Vida real</div>
                    <div className="text-xs text-[var(--t2)] leading-relaxed mb-3 max-w-sm">{getLessonActivationContext(lesson)}</div>
                    <div className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 inline-block px-2 py-1 rounded">
                      Meta: {getLessonBehaviorGoal(lesson)}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                    <div className="text-[9px] text-indigo-400 uppercase tracking-widest font-black mb-2">Rotas</div>
                    <div className="text-xs text-[var(--t2)] leading-relaxed">
                      {previousLesson ? <>Após <strong className="text-white">{previousLesson.title}</strong>, você chegou aqui.</> : <>Aula primária do seu perfil.</>}
                      {nextLesson && <>{" "}Avançando, seu próximo passo na trilha será <strong className="text-white">{nextLesson.title}</strong>.</>}
                    </div>
                  </div>
                  
                  <div className="px-2 py-1 flex items-center gap-2 flex-wrap">
                    {getLessonReferences(lesson).map((c) => (
                      <span key={c} className="text-[8px] font-black text-[var(--t4)] uppercase px-2 py-1 rounded bg-white/5 border border-white/5">{c}</span>
                    ))}
                    <div className="w-full mt-1 text-[10px] text-[var(--t4)]">
                      Módulo oficial da Feature <strong className="text-[var(--t3)]">{getLessonAssociatedFeature(lesson)}</strong>.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="mt-6 flex flex-col gap-3">
        {isQuiz && !quizOk ? (
          <div className="text-center text-xs font-bold text-[var(--t4)] py-4 bg-white/5 rounded-2xl animate-pulse">
            Selecione uma opção para avaliar o conhecimento...
          </div>
        ) : (
          <Button 
            className={`h-14 w-full rounded-2xl text-sm font-black tracking-wide uppercase shadow-xl transition-all ${
              isLast 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white shadow-emerald-500/20 hover:scale-[1.02]' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
            }`}
            onClick={isLast ? () => {
              const targetTab = extractNavigationTarget(passo.ctaFn);
              onProgress?.(total);
              trackEvent(analyticsEvents.EDUCATION_LESSON_COMPLETE, {
                lesson_id: lesson.id,
                trail: lesson.trilha,
                xp: lesson.xp,
              });
              onComplete(lesson.xp);
              if (targetTab) {
                onNavigate?.(targetTab);
              }
            } : avancarPasso}
          >
            {isLast ? (passo.tipo === 'acao' ? (passo.cta || 'Encerrar Capítulo') : '🏆 Finalizar Lição') : 'Seguir em Frente'}
            {isLast ? null : <ChevronRight size={18} className="ml-1" />}
          </Button>
        )}
        
        <AnimatePresence>
          {passoAtual > 0 && !isLast && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
               <Button 
                 variant="ghost" 
                 onClick={voltarPasso} 
                 className="w-full text-[var(--t4)] hover:text-[var(--t2)] hover:bg-white/5 h-12 rounded-xl text-xs font-bold uppercase tracking-widest"
               >
                 <ChevronLeft size={16} className="mr-1" /> Revistar Passo Anterior
               </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
