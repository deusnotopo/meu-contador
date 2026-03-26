import React, { useState } from "react";
import type { Lesson, Passo } from "@/data/educationData";
import { showToast } from "@/lib/toast";

interface LessonDetailViewProps {
  lesson: Lesson;
  onBack: () => void;
  onComplete: (xpEarned: number) => void;
}

export const LessonDetailView: React.FC<LessonDetailViewProps> = ({ lesson, onBack, onComplete }) => {
  const [passoAtual, setPassoAtual] = useState(0);
  const [quizIdx, setQuizIdx] = useState<number | null>(null);
  const [quizOk, setQuizOk] = useState(false);
  const [quizAcertou, setQuizAcertou] = useState(false);

  const passo = lesson.passos[passoAtual];
  const total = lesson.passos.length;
  const isLast = passoAtual === total - 1;
  const isQuiz = passo.tipo === 'quiz';

  const avancarPasso = () => {
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
      showToast('🎯 Correto! +10 XP bônus');
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
          <div style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: passo.conteudo || '' }} />
        </>
      );
    }
    if (passo.tipo === 'regra') {
      return (
        <>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--t1)", marginBottom: "10px", letterSpacing: "-0.3px" }}>📌 {passo.titulo}</div>
          <div style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.7, marginBottom: "12px" }} dangerouslySetInnerHTML={{ __html: passo.conteudo || '' }} />
          <div style={{ background: "var(--blue3)", border: "1px solid rgba(74,139,255,0.2)", borderRadius: "12px", padding: "12px 14px", fontSize: "13px", color: "var(--blue)", fontWeight: 500, fontFamily: "var(--mono)" }}>💡 {passo.exemplo}</div>
        </>
      );
    }
    if (passo.tipo === 'exemplo') {
      return (
        <>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--t1)", marginBottom: "12px", letterSpacing: "-0.3px" }}>🔢 {passo.titulo}</div>
          <div style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.6, marginBottom: "14px" }} dangerouslySetInnerHTML={{ __html: passo.conteudo || '' }} />
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
          <div style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.7, marginBottom: "16px" }} dangerouslySetInnerHTML={{ __html: passo.conteudo || '' }} />
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
        {renderCorpo()}
      </div>

      <div style={{ marginTop: "12px" }}>
        {isQuiz && !quizOk ? (
          <div style={{ textAlign: "center", fontSize: "12px", color: "var(--t3)", padding: "10px" }}>
            Selecione uma resposta para continuar
          </div>
        ) : (
          <button 
            onClick={isLast ? () => onComplete(lesson.xp) : avancarPasso} 
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
