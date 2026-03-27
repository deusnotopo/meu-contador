import { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db";
import { parseOfx } from "../utils/ofxParser";

export async function bankingRoutes(app: FastifyInstance) {
  // Integração Open Finance Automática mudou para openFinanceRoutes.ts
  // Esta rota mantém apenas a retro-compatibilidade do Importador OFX/QFX Manual.
  app.post("/banking/import-ofx", { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const user = request.user as { id: string };
    
    // Agora o Frontend dispara um JSON { ofxContent: '...' }
    const { ofxContent } = request.body as { ofxContent?: string };

    if (!ofxContent || typeof ofxContent !== "string") {
      return reply.status(400).send({ message: "Corpo do arquivo OFX não dectado." });
    }

    try {
      const ofxString = ofxContent;
      const parsedTransactions = parseOfx(ofxString);
      
      if (parsedTransactions.length === 0) {
        return reply.status(400).send({ message: "No valid transactions found in the OFX file" });
      }

      // Format for Prisma
      const insertData = parsedTransactions.map((t) => ({
        userId: user.id,
        description: t.description || "OFX Import",
        amount: t.amount,
        type: t.amount >= 0 ? "income" : "expense",
        category: "Outros", // Default category, user can re-categorize later
        date: t.date || new Date().toISOString(),
        paymentMethod: "OFX",
        scope: "personal",
      }));

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
