import React, { useState } from "react";
import { EDUCATION_MODULES, getLessonActivationContext, getLessonAssociatedFeature, getLessonBehaviorGoal, getLessonObjective, getLessonOutcomeType, getLessonReferences, type Lesson } from "@/data/educationData";
import { showSuccess } from "@/lib/toast";
import DOMPurify from "dompurify";

interface LessonDetailViewProps {
  lesson: Lesson;
  initialCompletedSteps?: number;
  checkpointLabel?: string;
  onBack: () => void;
  onProgress?: (completedSteps: number) => void;
  onComplete: (xpEarned: number) => void;
  onNavigate?: (targetTab: string) => void;
}

export const LessonDetailView: React.FC<LessonDetailViewProps> = ({ lesson, initialCompletedSteps = 0, checkpointLabel, onBack, onProgress, onComplete, onNavigate }) => {
  const [passoAtual, setPassoAtual] = useState(() => Math.min(initialCompletedSteps, Math.max(lesson.passos.length - 1, 0)));
  const [quizIdx, setQuizIdx] = useState<number | null>(null);
  const [quizOk, setQuizOk] = useState(false);
  const [quizAcertou, setQuizAcertou] = useState(false);

  const lessonIndex = EDUCATION_MODULES.findIndex((module) => module.id === lesson.id);
  const previousLesson = lessonIndex > 0 ? EDUCATION_MODULES[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 && lessonIndex < EDUCATION_MODULES.length - 1
    ? EDUCATION_MODULES[lessonIndex + 1]
    : null;

  const passo = lesson.passos[passoAtual];
  if (!passo) return null;
  const total = lesson.passos.length;
  const isLast = passoAtual === total - 1;
  const isQuiz = passo.tipo === 'quiz';

  const extractNavigationTarget = (ctaFn?: string) => {
    const match = ctaFn?.match(/go\('([^']+)'\)/);
    return match?.[1] || null;
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

  const dots = Array.from({ length: total }, (_, i) => (
    <div 
      key={i} 
      className="lstep-dot" 
      style={{
        background: i < passoAtual ? 'var(--green)' : i === passoAtual ? 'var(--blue)' : 'var(--glass3)',
        width: i === passoAtual ? '22px' : '8px',
        height: '4px',
        borderRadius: '2px',
        transition: 'all 0.3s ease'
      }} 
    />
  ));

  const renderCorpo = () => {
    if (passo.tipo === 'teoria') {
      return (
        <>
          <div style={{ textAlign: "center", fontSize: "52px", margin: "20px 0 14px", animation: "fsu 0.3s ease" }}>{passo.visual}</div>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--t1)", marginBottom: "10px", letterSpacing: "-0.3px" }}>{passo.titulo}</div>
          <div style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(passo.conteudo || '') }} />
        </>
      );
    }
    if (passo.tipo === 'regra') {
      return (
        <>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--t1)", marginBottom: "10px", letterSpacing: "-0.3px" }}>📌 {passo.titulo}</div>
          <div style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.7, marginBottom: "12px" }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(passo.conteudo || '') }} />
          <div style={{ background: "var(--blue3)", border: "1px solid rgba(74,139,255,0.2)", borderRadius: "12px", padding: "12px 14px", fontSize: "13px", color: "var(--blue)", fontWeight: 500, fontFamily: "var(--mono)" }}>💡 {passo.exemplo}</div>
        </>
      );
    }
    if (passo.tipo === 'exemplo') {
      return (
        <>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--t1)", marginBottom: "12px", letterSpacing: "-0.3px" }}>🔢 {passo.titulo}</div>
          <div style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.6, marginBottom: "14px" }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(passo.conteudo || '') }} />
          <div style={{ display: "grid", gap: "8px" }}>
            <div style={{ background: "var(--red-d)", border: "1px solid rgba(255,79,110,0.2)", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Resultado simples</div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--red)", fontFamily: "var(--mono)" }}>{passo.calculo?.simples}</div>
            </div>
            <div style={{ background: "var(--green-d)", border: "1px solid rgba(0,217,145,0.2)", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Resultado composto</div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--green)", fontFamily: "var(--mono)" }}>{passo.calculo?.composto}</div>
            </div>
            <div style={{ background: "var(--blue3)", border: "1px solid rgba(74,139,255,0.2)", borderRadius: "12px", padding: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--blue)", fontFamily: "var(--mono)" }}>{passo.calculo?.delta}</div>
            </div>
          </div>
        </>
      );
    }
    if (passo.tipo === 'quiz') {
      const letras = ['A','B','C','D'];
      return (
        <>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>🎯 Quiz</div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--t1)", lineHeight: 1.5, marginBottom: "16px" }}>{passo.pergunta}</div>
          <div id="quiz-opts">
            {passo.opcoes?.map((op, i) => {
              const isCorrectOpt = i === passo.correta;
              const isSelectedOpt = i === quizIdx;
              
              let className = "quiz-o";
              if (quizOk) {
                if (isCorrectOpt) className += " correct";
                else if (isSelectedOpt) className += " wrong";
                else className += " locked";
              }

              return (
                <div 
                  key={i} 
                  className={className} 
                  onClick={() => !quizOk && responderQuiz(i)}
                >
                  <div 
                    className="quiz-ltr" 
                    style={
                      quizOk && isCorrectOpt ? { background: "var(--green-d)", color: "var(--green)" } :
                      quizOk && isSelectedOpt && !isCorrectOpt ? { background: "var(--red-d)", color: "var(--red)" } :
                      {}
                    }
                  >
                    {letras[i]}
                  </div>
                  <span>{op}</span>
                  {quizOk && isCorrectOpt && <span style={{ marginLeft: "auto", fontSize: "16px" }}>✓</span>}
                  {quizOk && isSelectedOpt && !isCorrectOpt && <span style={{ marginLeft: "auto", fontSize: "16px" }}>✗</span>}
                </div>
              );
            })}
          </div>
          {quizOk && (
            <div style={{ 
              background: quizAcertou ? 'var(--green-d)' : 'var(--amber-d)', 
              border: `1px solid ${quizAcertou ? 'rgba(0,217,145,0.25)' : 'rgba(255,173,59,0.25)'}`, 
              borderRadius: "12px", padding: "12px 14px", marginTop: "10px" 
            }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: quizAcertou ? 'var(--green)' : 'var(--amber)', textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                {quizAcertou ? '🎉 Correto! +10 XP bônus' : '📚 Quase lá!'}
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--t2)", lineHeight: 1.5 }}>{passo.expl}</div>
            </div>
          )}
        </>
      );
    }
    if (passo.tipo === 'acao') {
      return (
        <>
          <div style={{ textAlign: "center", fontSize: "48px", margin: "16px 0 14px" }}>🚀</div>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--t1)", marginBottom: "10px", letterSpacing: "-0.3px" }}>{passo.titulo}</div>
          <div style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.7, marginBottom: "16px" }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(passo.conteudo || '') }} />
        </>
      );
    }
  };

  return (
    <div style={{ paddingTop: "10px", animation: "fsu 0.25s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <button className="back-btn" onClick={onBack}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--t2)" }}>{lesson.title}</div>
          <div style={{ display: "flex", gap: "4px", alignItems: "center", marginTop: "4px" }}>{dots}</div>
        </div>
        <div style={{ fontSize: "11px", color: "var(--t3)", fontFamily: "var(--mono)" }}>{passoAtual + 1}/{total}</div>
      </div>

      <div className="card" style={{ padding: "20px", minHeight: "260px" }}>
        <div style={{ marginBottom: "14px", padding: "12px", borderRadius: "12px", background: "rgba(255,173,59,0.08)", border: "1px solid rgba(255,173,59,0.18)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start", marginBottom: "6px" }}>
            <div style={{ fontSize: "10px", color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
              Objetivo prático da aula
            </div>
            <div style={{ fontSize: "10px", color: "var(--blue)", fontWeight: 700, textTransform: "uppercase" }}>
              {getLessonOutcomeType(lesson)}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "var(--t2)", lineHeight: 1.5 }}>
            {getLessonObjective(lesson)}
          </div>
        </div>
        <div style={{ marginBottom: "14px", padding: "12px", borderRadius: "12px", background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.18)" }}>
          <div style={{ fontSize: "10px", color: "#14B8A6", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "6px" }}>
            Onde isso aparece na vida real
          </div>
          <div style={{ fontSize: "11px", color: "var(--t2)", lineHeight: 1.5, marginBottom: "8px" }}>
            {getLessonActivationContext(lesson)}
          </div>
          <div style={{ fontSize: "10px", color: "var(--green)", fontWeight: 700 }}>
            Comportamento esperado: {getLessonBehaviorGoal(lesson)}
          </div>
        </div>
        <div style={{ marginBottom: "14px", padding: "12px", borderRadius: "12px", background: "rgba(74,139,255,0.08)", border: "1px solid rgba(74,139,255,0.18)" }}>
          <div style={{ fontSize: "10px", color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "6px" }}>
            Contexto da jornada
          </div>
          <div style={{ fontSize: "11px", color: "var(--t2)", lineHeight: 1.5 }}>
            {previousLesson
              ? <>Você chegou aqui depois de <strong style={{ color: "var(--t1)" }}>{previousLesson.title}</strong>.</>
              : <>Esta é a aula inicial recomendada da sua jornada.</>}
            {nextLesson && (
              <>
                {" "}Depois desta aula, o próximo passo ideal é <strong style={{ color: "var(--t1)" }}>{nextLesson.title}</strong>.
              </>
            )}
          </div>
        </div>
        <div style={{ marginBottom: "14px", padding: "12px", borderRadius: "12px", background: "rgba(0,217,145,0.08)", border: "1px solid rgba(0,217,145,0.18)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <div style={{ fontSize: "10px", color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
              Progresso do módulo
            </div>
            <div style={{ fontSize: "10px", color: "var(--t2)", fontFamily: "var(--mono)" }}>
              {Math.min(passoAtual + 1, total)}/{total}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "999px", height: "6px", overflow: "hidden", marginBottom: "6px" }}>
            <div style={{ width: `${Math.round((Math.min(passoAtual + 1, total) / total) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#00D991,#2F62D9)" }} />
          </div>
          <div style={{ fontSize: "11px", color: "var(--t2)", lineHeight: 1.5 }}>
            {checkpointLabel || `Checkpoint salvo automaticamente a cada avanço.`}
          </div>
        </div>
        <div style={{ marginBottom: "14px", padding: "12px", borderRadius: "12px", background: "rgba(155,127,255,0.08)", border: "1px solid rgba(155,127,255,0.18)" }}>
          <div style={{ fontSize: "10px", color: "var(--purple)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "6px" }}>
            Referências e lastro
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {getLessonReferences(lesson).map((reference) => (
              <span key={reference} style={{ fontSize: "9px", color: "var(--t2)", padding: "4px 8px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
                {reference}
              </span>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "14px", padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "6px" }}>
            Ação conectada ao produto
          </div>
          <div style={{ fontSize: "11px", color: "var(--t2)", lineHeight: 1.5 }}>
            Esta aula está ligada principalmente à área <strong style={{ color: "var(--t1)" }}>{getLessonAssociatedFeature(lesson)}</strong>, para transformar entendimento em execução prática.
          </div>
        </div>
        {renderCorpo()}
      </div>

      <div style={{ marginTop: "12px" }}>
        {isQuiz && !quizOk ? (
          <div style={{ textAlign: "center", fontSize: "12px", color: "var(--t3)", padding: "10px" }}>
            Selecione uma resposta para continuar
          </div>
        ) : (
          <button 
            onClick={isLast ? () => {
              const targetTab = extractNavigationTarget(passo.ctaFn);
              onProgress?.(total);
              onComplete(lesson.xp);
              if (targetTab) {
                onNavigate?.(targetTab);
              }
            } : avancarPasso} 
            style={{ 
              background: isLast ? 'linear-gradient(135deg,#00D991,#00B87A)' : 'linear-gradient(135deg,#2F62D9,#5048E8)', 
              border: "none", borderRadius: "14px", padding: "14px", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: "var(--font)", width: "100%", 
              boxShadow: `0 4px 16px ${isLast ? 'rgba(0,217,145,0.3)' : 'rgba(80,72,232,0.35)'}` 
            }}
          >
            {isLast ? (passo.tipo === 'acao' ? (passo.cta || 'Concluir aula') : '🏆 Concluir aula') : 'Continuar →'}
          </button>
        )}
        
        {passoAtual > 0 && !isLast && (
          <button 
            onClick={voltarPasso} 
            style={{ background: "none", border: "none", color: "var(--t3)", fontSize: "12px", cursor: "pointer", fontFamily: "var(--font)", width: "100%", marginTop: "6px", padding: "6px" }}
          >
            ← Passo anterior
          </button>
        )}
      </div>
    </div>
  );
};
