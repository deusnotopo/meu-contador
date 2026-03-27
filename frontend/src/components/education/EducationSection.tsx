import React, { useState } from "react";
import { EDUCATION_MODULES, AULAS_TRILHAS, AULAS_CONQUISTAS } from "@/data/educationData";
import { useEducation } from "@/hooks/useEducation";
import { LessonDetailView } from "./LessonDetailView";
import { showSuccess } from "@/lib/toast";

// ─── Study Tips for Brazilians with no free time ─────────────
const STUDY_TIPS = [
  {
    emoji: "🚌",
    title: "No Transporte",
    desc: "5 min no ônibus ou metrô. Uma aula por dia = 30 trilhas/ano. Cada aula tem apenas 5-8 min.",
    color: "#4A8BFF",
  },
  {
    emoji: "🍽️",
    title: "No Almoço",
    desc: "10 minutos antes de voltar ao trabalho. A ciência chama de 'consolidação pré-tarde': aprende-se 2x mais logo após uma pausa.",
    color: "#00D991",
  },
  {
    emoji: "🌙",
    title: "Antes de Dormir",
    desc: "O cérebro consolida memórias durante o sono. 5 minutos de leitura financeira antes de apagar a luz têm ROI enorme.",
    color: "#9B7FFF",
  },
  {
    emoji: "🔁",
    title: "Repetição Espaçada",
    desc: "Revise uma aula antiga toda sexta-feira. Em 3 meses, o conhecimento se torna permanente sem esforço.",
    color: "#FFAD3B",
  },
];

// ─── Why Academia page ────────────────────────────────────────
const PANORAMA_STATS = [
  { value: "93%", label: "dos brasileiros não aprenderam finanças na escola", color: "#E94560" },
  { value: "R$ 84k", label: "é o impacto médio anual de uma boa decisão financeira", color: "#00D991" },
  { value: "2 anos", label: "é o tempo médio para quem estuda virar rentista parcial", color: "#4A8BFF" },
];

export const EducationSection = ({ onBack: _onBack }: { onBack?: () => void } = {}) => {

  const { state, completeModule, isModuleCompleted } = useEducation();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeTrilha, setActiveTrilha] = useState<string>('todas');
  const [showPanorama, setShowPanorama] = useState(false);

  const handleComplete = (lessonId: string, xpEarned: number) => {
    completeModule(lessonId);
    showSuccess(`Lição concluída! +${xpEarned} XP 🎉`);
    setActiveLessonId(null);
  };

  const activeLesson = EDUCATION_MODULES.find(m => m.id === activeLessonId);

  if (activeLesson) {
    return (
      <LessonDetailView
        lesson={activeLesson}
        onBack={() => setActiveLessonId(null)}
        onComplete={(xp) => handleComplete(activeLesson.id, xp)}
      />
    );
  }

  const filteredLessons = activeTrilha === 'todas'
    ? EDUCATION_MODULES
    : EDUCATION_MODULES.filter(l => l.trilha === activeTrilha);

  const doneCount = EDUCATION_MODULES.filter(l => isModuleCompleted(l.id)).length;
  const totalCount = EDUCATION_MODULES.length;

  const xpMax = 500;
  const nivel = 4;
  const streak = state.streak || 7;
  const xp = state.xp || 350;

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

      {/* ── PANORAMA HERO ──────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(74,139,255,0.12), rgba(80,72,232,0.18))",
        border: "1px solid rgba(74,139,255,0.2)",
        borderRadius: "20px",
        padding: "20px",
        marginBottom: "14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "16px",
            background: "linear-gradient(135deg, #2F62D9, #5048E8)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0
          }}>🎓</div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--t1)", lineHeight: 1.2 }}>
              A Academia que seus pais deveriam ter tido
            </div>
            <div style={{ fontSize: "12px", color: "var(--t2)", marginTop: "3px" }}>
              Currículo 100% baseado na realidade financeira brasileira
            </div>
          </div>
        </div>

        {/* Impacto Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}>
          {PANORAMA_STATS.map((s, i) => (
            <div key={i} style={{
              background: "rgba(0,0,0,0.25)", borderRadius: "12px", padding: "10px 8px", textAlign: "center"
            }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: s.color, fontFamily: "var(--mono)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "9px", color: "var(--t3)", marginTop: "4px", lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowPanorama(!showPanorama)}
          style={{
            width: "100%", background: "rgba(74,139,255,0.15)", border: "1px solid rgba(74,139,255,0.25)",
            borderRadius: "12px", padding: "10px", color: "var(--blue)", fontSize: "12px", fontWeight: 700,
            cursor: "pointer", transition: "all 0.2s"
          }}
        >
          {showPanorama ? "▲ Fechar" : "▼ Como estudar sem tempo livre — guia do brasileiro ocupado"}
        </button>

        {showPanorama && (
          <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.6, padding: "0 2px" }}>
              <strong style={{ color: "var(--t1)" }}>A realidade:</strong> 76% dos brasileiros trabalham 8+ horas e chegam
              em casa sem energia para estudar. Mas o conhecimento financeiro compõe exatamente como os juros:
              <strong style={{ color: "var(--green)" }}> pequenas doses constantes geram resultados monumentais</strong>.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {STUDY_TIPS.map((tip, i) => (
                <div key={i} style={{
                  background: "rgba(0,0,0,0.3)", borderRadius: "14px", padding: "12px",
                  border: `1px solid ${tip.color}22`
                }}>
                  <div style={{ fontSize: "22px", marginBottom: "6px" }}>{tip.emoji}</div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: tip.color, marginBottom: "4px" }}>{tip.title}</div>
                  <div style={{ fontSize: "10.5px", color: "var(--t3)", lineHeight: 1.4 }}>{tip.desc}</div>
                </div>
              ))}
            </div>
            <div style={{
              background: "rgba(0,217,145,0.08)", border: "1px solid rgba(0,217,145,0.2)",
              borderRadius: "12px", padding: "12px", display: "flex", gap: "10px", alignItems: "flex-start"
            }}>
              <span style={{ fontSize: "20px", flexShrink: 0 }}>💡</span>
              <div style={{ fontSize: "11px", color: "var(--t2)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--green)" }}>Meta mínima viável:</strong> 1 aula por dia = 5 minutos.
                Em 6 meses você terá mais conhecimento financeiro do que 95% dos brasileiros.
                A cada R$ 1.000 de decisão financeira correta, você recupera o investimento de tempo em segundos.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Progress Card ──────────────────────── */}
      <div className="hero" style={{ padding: "18px", marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "3px" }}>Nível {nivel}</div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--t1)" }}>Investidor Consciente</div>
          </div>
          <div style={{ width: "52px", height: "52px", borderRadius: "18px", background: "rgba(74,139,255,0.15)", border: "2px solid rgba(74,139,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>🎖️</div>
        </div>
        <div className="xpbar">
          <div className="xpbar-fill" style={{ width: `${Math.min(100, Math.round((xp / xpMax) * 100))}%` }}></div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--t3)", marginTop: "4px", fontFamily: "var(--mono)" }}>
          <span>{xp} XP</span>
          <span>Próximo: {xpMax} XP</span>
        </div>
        <div className="stat3" style={{ marginTop: "14px" }}>
          <div className="s3i"><div className="s3v" style={{ color: "var(--green)" }}>{doneCount}/{totalCount}</div><div className="s3l">Aulas</div></div>
          <div className="s3i"><div className="s3v" style={{ color: "var(--amber)" }}>{streak} dias</div><div className="s3l">Sequência</div></div>
          <div className="s3i"><div className="s3v" style={{ color: "var(--blue)" }}>{xp} XP</div><div className="s3l">Total</div></div>
        </div>
      </div>

      {/* ── Filtro trilhas ─────────────────────── */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none", margin: "0 -16px", padding: "0 16px 12px" }}>
        <div
          className={`tpill ${activeTrilha === 'todas' ? 'active' : ''}`}
          style={activeTrilha === 'todas' ? { background: "linear-gradient(135deg, #2F62D9, #5048E8)", borderColor: "transparent" } : {}}
          onClick={() => setActiveTrilha('todas')}
        >
          🗂️ Todas
        </div>
        {AULAS_TRILHAS.map(t => (
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
        const isCompleted = isModuleCompleted(l.id);
        const globalIdx = EDUCATION_MODULES.findIndex(m => m.id === l.id);
        const prevCompleted = globalIdx === 0 || isModuleCompleted(EDUCATION_MODULES[globalIdx - 1].id);
        const isLocked = !isCompleted && globalIdx > 0 && !prevCompleted && globalIdx > 1;

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
                <span style={{ fontSize: "10px", color: "var(--t3)" }}>
                  {conceptsCount} conceitos · 1 quiz
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Conquistas ─────────────────────────── */}
      <div className="sec-hd"><span className="sec-title">Conquistas</span></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        {AULAS_CONQUISTAS.map((c, idx) => (
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
