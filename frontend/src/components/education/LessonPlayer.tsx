import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Lesson as LegacyLesson } from "@/types";
import type { Lesson as JourneyLesson } from "@/data/educationData";
import { LessonDetailView } from "./LessonDetailView";

interface LessonPlayerProps {
  lesson: LegacyLesson | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (lessonId: string) => void;
}

const adaptLessonToJourney = (lesson: LegacyLesson): JourneyLesson => ({
  id: lesson.id,
  trilha: lesson.category || 'base',
  title: lesson.title,
  sub: lesson.description,
  emoji: '🎓',
  dur: lesson.duration,
  xp: 50,
  ok: lesson.completed,
  grad: 'linear-gradient(135deg,#13283D,#29537A)',
  passos: [
    {
      tipo: 'teoria',
      titulo: lesson.title,
      conteudo: (lesson.content || 'Conteúdo não disponível.').replace(/\n/g, '<br />'),
      visual: '📘',
    },
    ...(lesson.quiz ? [{
      tipo: 'quiz' as const,
      pergunta: lesson.quiz.question,
      opcoes: lesson.quiz.options,
      correta: lesson.quiz.correctOption,
      expl: 'Boa resposta. Continue a jornada para consolidar este conceito.',
    }] : []),
    {
      tipo: 'acao',
      titulo: 'Fechar módulo',
      conteudo: 'Você concluiu esta versão da lição no player unificado.',
      cta: 'Concluir aula',
    },
  ],
});

export const LessonPlayer = ({
  lesson,
  isOpen,
  onClose,
  onComplete,
}: LessonPlayerProps) => {
  if (!lesson) return null;

  const adaptedLesson = adaptLessonToJourney(lesson);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden bg-[#0a0a0a] border-slate-800 text-slate-100">
        <DialogHeader className="p-6 border-b border-white/10 bg-slate-900/50">
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            {lesson.title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-6">
          <LessonDetailView
            lesson={adaptedLesson}
            checkpointLabel="Experiência unificada entre detalhe e player"
            onBack={onClose}
            onComplete={() => {
              onComplete(lesson.id);
              onClose();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
