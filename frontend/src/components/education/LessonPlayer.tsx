import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Lesson } from "@/types";
import { CheckCircle, PartyPopper, Trophy } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface LessonPlayerProps {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (lessonId: string) => void;
}

export const LessonPlayer = ({
  lesson,
  isOpen,
  onClose,
  onComplete,
}: LessonPlayerProps) => {
  const [step, setStep] = useState<"content" | "quiz" | "success">("content");
  const [quizSelection, setQuizSelection] = useState<number | null>(null);
  const [error, setError] = useState(false);

  if (!lesson) return null;

  const handleNext = () => {
    if (lesson.quiz) {
      setStep("quiz");
    } else {
      handleFinish();
    }
  };

  const handleQuizSubmit = () => {
    if (quizSelection === lesson.quiz?.correctOption) {
      handleFinish();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleFinish = () => {
    setStep("success");
    onComplete(lesson.id);
  };

  const resetState = () => {
    setStep("content");
    setQuizSelection(null);
    setError(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetState()}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden bg-[#0a0a0a] border-slate-800 text-slate-100">
        <DialogHeader className="p-6 border-b border-white/10 bg-slate-900/50">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              {step === "success" ? (
                <span className="text-yellow-400 flex items-center gap-2">
                  <Trophy size={24} /> Lição Concluída!
                </span>
              ) : (
                lesson.title
              )}
            </DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {step === "content" && (
            <div className="prose prose-invert max-w-none">
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl mb-6 flex items-center gap-3">
                <div className="w-1 h-12 bg-indigo-500 rounded-full" />
                <p className="m-0 text-indigo-300 font-medium">
                  {lesson.description}
                </p>
              </div>
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1
                      className="text-3xl font-black text-white mt-8 mb-4 border-b border-white/10 pb-2"
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-2xl font-bold text-indigo-300 mt-6 mb-3"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p
                      className="text-slate-300 leading-relaxed mb-4 text-lg"
                      {...props}
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      className="list-disc pl-6 space-y-2 mb-4 text-slate-300"
                      {...props}
                    />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-bold text-white" {...props} />
                  ),
                }}
              >
                {lesson.content || "Conteúdo não disponível."}
              </ReactMarkdown>
            </div>
          )}

          {step === "quiz" && lesson.quiz && (
            <div className="flex flex-col items-center justify-center h-full py-10">
              <div className="w-full max-w-lg space-y-8">
                <div className="text-center space-y-4">
                  <div className="inline-flex p-3 rounded-full bg-indigo-500/20 text-indigo-400 mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-2xl font-bold">{lesson.quiz.question}</h3>
                </div>

                <div className="space-y-3">
                  {lesson.quiz.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuizSelection(idx)}
                      className={`w-full p-4 rounded-xl border text-left transition-all font-medium ${
                        quizSelection === idx
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg scale-[1.02]"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                      } ${
                        error && quizSelection === idx
                          ? "animate-shake bg-red-500/50 border-red-500"
                          : ""
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full" />
                <PartyPopper
                  size={80}
                  className="text-yellow-400 relative z-10"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-4xl font-black text-white">Parabéns!</h3>
                <p className="text-xl text-slate-400">
                  Você completou esta lição e ganhou pontos.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">
                    XP Ganho
                  </p>
                  <p className="text-3xl font-black text-indigo-400">+50</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">
                    Streak
                  </p>
                  <p className="text-3xl font-black text-emerald-400">🔥 +1</p>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-sm">
          {step === "content" && (
            <Button
              onClick={handleNext}
              className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-500 rounded-xl"
            >
              Começar Quiz <CheckCircle size={20} className="ml-2" />
            </Button>
          )}

          {step === "quiz" && (
            <Button
              onClick={handleQuizSubmit}
              disabled={quizSelection === null}
              className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-500 rounded-xl disabled:opacity-50"
            >
              Confirmar Resposta
            </Button>
          )}

          {step === "success" && (
            <Button
              onClick={resetState}
              className="w-full h-12 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 rounded-xl"
            >
              Continuar Aprendendo
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
