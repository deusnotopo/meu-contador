import { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db";
import { parseOfx } from "../utils/ofxParser";
import { PluggyService } from "../services/pluggy";

export async function bankingRoutes(app: FastifyInstance) {
  // Pluggy Connect Token
  app.post("/banking/pluggy/connect-token", { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const user = request.user as { id: string };
    try {
      const token = await PluggyService.createConnectToken(user.id);
      return token;
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  });

  // Pluggy Sync (fetch accounts and transactions for a new item)
  app.post("/banking/pluggy/sync", { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const user = request.user as { id: string };
    const schema = z.object({
      itemId: z.string(),
    });

    const { itemId } = schema.parse(request.body);

    try {
      const accounts = await PluggyService.getAccounts(itemId);
      let totalImported = 0;

      for (const account of accounts) {
        const transactions = await PluggyService.getTransactions(account.id);
        
        const insertData = transactions.map((t) => ({
          userId: user.id,
          description: t.description,
          amount: t.amount,
          type: t.amount >= 0 ? "income" : "expense",
          category: t.category || "Outros",
          date: new Date(t.date),
          paymentMethod: "Pluggy",
          scope: "personal",
          fitid: t.id, // Use Pluggy transaction ID for dedup
        }));

        const result = await db.transaction.createMany({
          data: insertData as any,
          skipDuplicates: true,
        });

        totalImported += result.count;
      }

      return { success: true, importedCount: totalImported };
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  });

  app.get("/banking/institutions", { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    // Return mock supported institutions
    return [
      { id: "itau", name: "Itaú Unibanco", type: "retail" },
      { id: "nubank", name: "Nubank", type: "digital" },
      { id: "bb", name: "Banco do Brasil", type: "retail" },
      { id: "bradesco", name: "Bradesco", type: "retail" },
      { id: "santander", name: "Santander", type: "retail" },
      { id: "inter", name: "Banco Inter", type: "digital" },
    ];
  });

  app.post("/banking/sync", { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const schema = z.object({
      institutionId: z.string(),
      credentials: z.object({
        account: z.string().optional(),
        password: z.string().optional(),
      }).optional(),
    });

    const body = schema.parse(request.body);
    const user = request.user as { id: string };

    // Inject 5 mock transactions directly into PostgreSQL for this user
    const mockTransactions = [
      { description: "Uber EATS", amount: -45.9, category: "Delivery", date: new Date().toISOString(), type: "expense", paymentMethod: "Credit Card", scope: "personal", userId: user.id },
      { description: "Posto Ipiranga", amount: -120.0, category: "Transporte", date: new Date().toISOString(), type: "expense", paymentMethod: "Debit", scope: "personal", userId: user.id },
      { description: "Salário ACME Corp", amount: 4500.0, category: "Salário", date: new Date().toISOString(), type: "income", paymentMethod: "Pix", scope: "personal", userId: user.id },
      { description: "Netflix", amount: -39.9, category: "Lazer", date: new Date().toISOString(), type: "expense", paymentMethod: "Credit Card", scope: "personal", userId: user.id },
      { description: "Mercado Extra", amount: -312.45, category: "Mercado", date: new Date().toISOString(), type: "expense", paymentMethod: "Credit Card", scope: "personal", userId: user.id },
    ];

    await db.transaction.createMany({
      data: mockTransactions as any
    });

    return { 
      success: true, 
      message: `Successfully synchronized 5 transactions from ${body.institutionId}` 
    };
  });

  app.post("/banking/ofx", { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const user = request.user as { id: string };
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ message: "No file uploaded" });
    }

    try {
      const ofxBuffer = await data.toBuffer();
      const ofxString = ofxBuffer.toString("utf-8");
      
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
