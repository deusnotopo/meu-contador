import React, { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { Lesson } from "@/data/educationData";

interface LessonDetailViewProps {
  lesson: Lesson;
  onBack: () => void;
  onComplete: (xpEarned: number) => void;
}

export const LessonDetailView: React.FC<LessonDetailViewProps> = ({ lesson, onBack, onComplete }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const handleOptionClick = (idx: number) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);
  };

  const isCorrect = selectedOption === lesson.quiz.correctIdx;

  return (
    <div style={{ animation: "fsu 0.26s ease", paddingBottom: "80px", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "var(--bg)", zIndex: 50, overflowY: "auto", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", marginTop: "10px" }}>
        <button onClick={onBack} className="back-btn" aria-label="Voltar">
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">{lesson.level}</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--t1)" }}>{lesson.title}</div>
        </div>
      </div>

      <div className="istrip" style={{ background: "var(--glass2)", border: "1px solid var(--border)", marginBottom: "20px" }}>
        {lesson.description}
      </div>

      <div style={{ fontSize: "14px", color: "var(--t1)", lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: "30px" }}>
        {lesson.content}
      </div>

      <div className="sec-hd"><span className="sec-title">Quiz de fixação</span></div>
      
      <div className="card" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--t1)", marginBottom: "16px", lineHeight: 1.4 }}>
          {lesson.quiz.question}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {lesson.quiz.options.map((opt, idx) => {
            let className = "quiz-o";
            if (hasAnswered) {
              if (idx === lesson.quiz.correctIdx) className += " correct";
              else if (idx === selectedOption) className += " wrong";
              else className += " locked";
            }

            return (
              <div
                key={idx}
                className={className}
                onClick={() => handleOptionClick(idx)}
              >
                <div className="quiz-ltr">{String.fromCharCode(65 + idx)}</div>
                <div style={{ flex: 1 }}>{opt}</div>
              </div>
            );
          })}
        </div>

        {hasAnswered && (
          <div style={{ marginTop: "20px", animation: "fsu 0.3s ease" }}>
            <div className={`nudge ${isCorrect ? 'good' : 'warn'}`}>
              <div className="nudge-ttl">{isCorrect ? "Correto!" : "Quase lá..."}</div>
              <div className="nudge-body">{lesson.quiz.explanation}</div>
            </div>

            {isCorrect && (
              <button
                className="btn-p"
                style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                onClick={() => onComplete(lesson.xpReward)}
              >
                <CheckCircle2 size={18} />
                Concluir e ganhar +{lesson.xpReward} XP
              </button>
            )}
            
            {!isCorrect && (
              <button
                className="btn-s"
                style={{ marginTop: "16px" }}
                onClick={() => {
                  setHasAnswered(false);
                  setSelectedOption(null);
                }}
              >
                Tentar novamente
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
