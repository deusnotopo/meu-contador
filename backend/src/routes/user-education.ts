import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db.js';

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

export async function userEducationRoutes(app: FastifyInstance) {
  app.get('/users/education', {
    schema: {
      description: 'Obtém o progresso educacional do usuário logado',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ education: educationStateSchema.nullable() }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const user = await db.user.findUnique({
      where: { id: request.user.id },
      select: { educationData: true },
    });

    if (!user) throw new Error('User not found');

    let educationState = null;
    if (user.educationData) {
      if (typeof user.educationData === 'string') {
        try { educationState = JSON.parse(user.educationData); } catch {}
      } else {
        educationState = user.educationData;
      }
    }

    return { education: educationState };
  });

  app.put('/users/education', {
    schema: {
      description: 'Atualiza o progresso educacional do usuário logado',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: z.object({ education: educationStateSchema }),
      response: {
        200: z.object({ success: z.boolean(), education: educationStateSchema }),
      },
    },
    preHandler: [app.authenticate],
  }, async (request) => {
    const { education } = request.body as { education: z.infer<typeof educationStateSchema> };

    await db.user.update({
      where: { id: request.user.id },
      data: { educationData: JSON.stringify(education) },
    });

    return { success: true, education };
  });
}
