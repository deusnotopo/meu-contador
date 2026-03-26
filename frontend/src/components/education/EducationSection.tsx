import React, { useState } from "react";
import { EDUCATION_MODULES } from "@/data/educationData";
import { useEducation } from "@/hooks/useEducation";
import { LessonDetailView } from "./LessonDetailView";
import { Flame, Star, Trophy, Lock } from "lucide-react";
import { showSuccess } from "@/lib/toast";

export const EducationSection = ({ onBack }: { onBack?: () => void }) => {
  const { state, completeModule, isModuleCompleted, getProgressPct } = useEducation();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

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

  return (
    <div style={{ paddingTop: "10px", animation: "fsu 0.26s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
        {onBack && (
          <button className="back-btn" onClick={onBack} style={{ marginBottom: "8px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
        <div>
          <div className="eyebrow">Aprenda a investir</div>
          <div className="page-title" style={{ margin: 0 }}>Academia</div>
        </div>
      </div>
      
      {/* Gamification Header */}
      <div style={{ display: "flex", gap: "10px", marginTop: "14px", marginBottom: "20px" }}>
        <div className="mini-card" style={{ flex: 1, padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "var(--amber-d)", border: "1px solid rgba(255,173,59,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--amber)" }}>
            <Flame size={20} fill="currentColor" />
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "var(--t3)", fontWeight: 600, textTransform: "uppercase" }}>Ofensiva</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)" }}>{state.streak} dias</div>
          </div>
        </div>

        <div className="mini-card" style={{ flex: 1, padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "var(--blue3)", border: "1px solid rgba(74,139,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)" }}>
            <Star size={20} fill="currentColor" />
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "var(--t3)", fontWeight: 600, textTransform: "uppercase" }}>Experiência</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)" }}>{state.xp} XP</div>
          </div>
        </div>
      </div>

      <div className="sec-hd">
        <span className="sec-title">Progresso Geral</span>
        <span style={{ fontSize: "12px", color: "var(--blue)", fontWeight: 700, fontFamily: "var(--mono)" }}>{getProgressPct()}%</span>
      </div>
      <div className="prog" style={{ marginBottom: "20px", height: "6px" }}>
        <div className="prog-fill" style={{ width: `${getProgressPct()}%`, background: "var(--green)" }} />
      </div>

      <div className="sec-hd"><span className="sec-title">Módulos</span></div>
      
      <div className="card">
        {EDUCATION_MODULES.map((mod, i) => {
          const isCompleted = isModuleCompleted(mod.id);
          // Unlock rule: first module always unlocked, others unlock if previous is completed.
          const isUnlocked = i === 0 || isModuleCompleted(EDUCATION_MODULES[i-1].id);
          
          let statusText = "Bloqueado";
          let statusColor = "var(--t3)";
          if (isCompleted) {
            statusText = "Concluído";
            statusColor = "var(--green)";
          } else if (isUnlocked) {
            statusText = "Começar";
            statusColor = "var(--blue)";
          }

          return (
            <div 
              key={mod.id} 
              className="row" 
              style={{ alignItems: "flex-start", opacity: isUnlocked ? 1 : 0.5, cursor: isUnlocked ? "pointer" : "default" }}
              onClick={() => {
                if (isUnlocked) setActiveLessonId(mod.id);
              }}
            >
              <div 
                className="row-ico" 
                style={{ background: isCompleted ? "var(--green-d)" : isUnlocked ? "var(--blue3)" : "var(--glass2)", fontSize: "16px", color: isCompleted ? "var(--green)" : isUnlocked ? "var(--blue)" : "var(--t3)", marginTop: "2px" }}
              >
                {isCompleted ? <Trophy size={16} /> : isUnlocked ? "▶" : <Lock size={16} />}
              </div>
              
              <div className="row-main" style={{ flex: 1 }}>
                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: isCompleted ? "var(--green)" : "var(--blue)", marginBottom: "4px" }}>
                  {mod.level} · {mod.duration} min
                </div>
                <div className="row-title">{mod.title}</div>
                <div className="row-sub" style={{ fontSize: "11px", lineHeight: 1.4 }}>{mod.description}</div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                  <span style={{ fontSize: "10px", color: statusColor, fontFamily: "var(--mono)", fontWeight: 700 }}>
                    {statusText}
                  </span>
                  <div className="prog" style={{ width: "60px", height: "4px" }}>
                    <div className="prog-fill" style={{ width: isCompleted ? "100%" : "0%", background: statusColor }}></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
