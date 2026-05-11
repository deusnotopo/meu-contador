import { FastifyInstance } from "fastify";
import { z } from "zod";
import * as BankingService from "../services/BankingService.js";
import { getUserReconciliationSummary } from "../services/ReconciliationService.js";

const importOfxBodySchema = z.object({
  ofxContent: z.string().min(1).max(2_000_000),
});

const importOfxResponseSchema = z.object({
  success: z.boolean(),
  importedCount: z.number().int(),
  message: z.string(),
});

const bankingErrorSchema = z.object({
  message: z.string(),
  details: z.string().optional(),
});

export async function bankingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // POST /banking/import-ofx — Manual OFX/QFX Import
  app.post("/banking/import-ofx", {
    schema: {
      tags: ['Banking'],
      security: [{ bearerAuth: [] }],
      body: importOfxBodySchema,
      response: {
        200: importOfxResponseSchema,
        400: bankingErrorSchema,
        500: bankingErrorSchema,
      },
    },
  }, async (request, reply) => {
    const { ofxContent } = request.body as z.infer<typeof importOfxBodySchema>;

    try {
      const result = await BankingService.importOfx(request.user.id, ofxContent);
      
      return { 
        success: true, 
        importedCount: result.count,
        message: result.message
      };
    } catch (error: unknown) {
      request.log.error(error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = msg.includes("No valid transactions") ? 400 : 500;
      return reply.code(statusCode).send({ 
        message: "Failed to parse or import OFX file", 
        details: msg 
      });
    }
  });

  // GET /banking/health — Reconciliation health for all user accounts
  // Returns matched/discrepant status, health score, and per-account details.
  app.get("/banking/health", {
    schema: {
      tags: ['Banking'],
      security: [{ bearerAuth: [] }],
      description: 'Returns reconciliation health summary for all connected bank accounts.',
    },
  }, async (request) => {
    return getUserReconciliationSummary(request.user.id);
  });
}
