import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as EducationService from '../services/EducationService.js';

const educationStateSchema = z.object({
  completedModules: z.array(z.string()),
  lessonStepProgress: z.record(z.string(), z.number()),
  lessonLastSeenAt: z.record(z.string(), z.string()),
  lessonReviewDueAt: z.record(z.string(), z.string()),
  contextualReinforcements: z.record(z.string(), z.number()),
  xp: z.number(),
  streak: z.number(),
  lastActiveDate: z.string().nullable(),
});

type EducationStateBody = z.infer<typeof educationStateSchema>;

export async function userEducationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // GET /users/education
  app.get('/users/education', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ education: educationStateSchema.nullable() }),
      },
    },
  }, async (request) => {
    const education = await EducationService.getEducationData(request.user.id);
    return { education };
  });

  // PUT /users/education
  app.put('/users/education', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: z.object({ education: educationStateSchema }),
      response: {
        200: z.object({ success: z.boolean(), education: educationStateSchema }),
      },
    },
  }, async (request) => {
    const { education } = request.body as { education: EducationStateBody };
    const result = await EducationService.updateEducationData(request.user.id, education);
    return { success: true, education: result };
  });

  // PUT /users/education/progress
  // Persiste o progresso parcial de um passo dentro de uma lição.
  // Chamado a cada avanço de step pelo front — não marca como "completo", apenas guarda onde o user parou.
  app.put('/users/education/progress', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        moduleId: z.string().min(1),
        completedSteps: z.number().int().min(0),
        lastActiveDate: z.string().datetime({ offset: true }).optional(),
      }),
      response: {
        200: z.object({ success: z.boolean(), moduleId: z.string(), completedSteps: z.number() }),
      },
    },
  }, async (request) => {
    const { moduleId, completedSteps, lastActiveDate } = request.body as {
      moduleId: string;
      completedSteps: number;
      lastActiveDate?: string;
    };
    await EducationService.saveLessonProgress(request.user.id, moduleId, completedSteps, lastActiveDate);
    return { success: true, moduleId, completedSteps };
  });

  // POST /users/education/complete/:moduleId
  // Marca lição como concluída, credita XP e agenda próxima revisão via SM-2.
  // É o endpoint definitivo de conclusão — chamado quando todos os passos foram completados.
  app.post('/users/education/complete/:moduleId', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      params: z.object({ moduleId: z.string().min(1) }),
      response: {
        200: z.object({
          success: z.boolean(),
          moduleId: z.string(),
          xpEarned: z.number(),
          nextReviewAt: z.string().nullable(),
        }),
      },
    },
  }, async (request) => {
    const { moduleId } = request.params as { moduleId: string };
    const { xpEarned } = await EducationService.markLessonComplete(request.user.id, moduleId);
    // nextReviewAt is set internally by markLessonComplete via SM-2; just return a placeholder
    return { success: true, moduleId, xpEarned, nextReviewAt: null };
  });

  // GET /users/education/review-due
  // Retorna as lições cujo prazo de revisão espaçada já venceu.
  app.get('/users/education/review-due', {
    schema: {
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          dueModules: z.array(z.object({
            moduleId: z.string(),
            dueAt: z.string(),
            overdueDays: z.number(),
          })),
        }),
      },
    },
  }, async (request) => {
    const dueModules = await EducationService.getReviewDueModules(request.user.id);
    return { dueModules };
  });
}
