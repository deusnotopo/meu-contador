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
    const { education } = request.body as { education: any };
    const result = await EducationService.updateEducationData(request.user.id, education);
    return { success: true, education: result };
  });
}
