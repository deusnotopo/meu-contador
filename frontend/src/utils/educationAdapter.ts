import type { Lesson as LegacyLesson } from "@/types";
import type { Lesson as JourneyLesson } from "@/data/educationData";

export const adaptLessonToJourney = (lesson: LegacyLesson): JourneyLesson => ({
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
