import { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db";
import { parseOfx } from "../utils/ofxParser";
import { PredictiveEngine } from "../services/ai";

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
  // Integração Open Finance Automática mudou para openFinanceRoutes.ts
  // Esta rota mantém apenas a retro-compatibilidade do Importador OFX/QFX Manual.
  app.post("/banking/import-ofx", {
    preHandler: [(app as any).authenticate],
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
    const user = request.user as { id: string };
    
    // Agora o Frontend dispara um JSON { ofxContent: '...' }
    const { ofxContent } = request.body as z.infer<typeof importOfxBodySchema>;

    try {
      const ofxString = ofxContent;
      const parsedTransactions = parseOfx(ofxString);
      
      if (parsedTransactions.length === 0) {
        return reply.status(400).send({ message: "No valid transactions found in the OFX file" });
      }

      // Format for Prisma
      const insertData = parsedTransactions.map((t) => {
        const rawDesc = t.description || "OFX Import";
        const prediction = PredictiveEngine.predictTransaction(rawDesc, t.amount);

        return {
          userId: user.id,
          description: prediction.cleanedDescription,
          amount: t.amount,
          type: t.amount >= 0 ? "income" : "expense",
          category: prediction.suggestedCategory,
          date: t.date || new Date().toISOString(),
          paymentMethod: "OFX",
          scope: "personal",
        };
      });

      const result = await db.transaction.createMany({
        data: insertData as any
      });

      return { 
        success: true, 
        importedCount: result.count,
        message: `Successfully imported ${result.count} transactions from OFX`
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ message: "Failed to parse or import OFX file", details: error.message });
    }
  });
}
