import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { parseOFX } from '../lib/ofx-parser';

export async function bankingRoutes(app: FastifyInstance) {
  // GET /banking/institutions
  app.get('/banking/institutions', {
    schema: {
      tags: ['Banking'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.array(z.object({
          id: z.string(),
          name: z.string(),
          color: z.string()
        }))
      }
    },
    preHandler: [app.authenticate]
  }, async () => {
    return [
      { id: "nubank", name: "Nubank", color: "#8a05be" },
      { id: "itau", name: "Itaú", color: "#ec7000" },
      { id: "inter", name: "Inter", color: "#ff7a00" },
      { id: "btg", name: "BTG Pactual", color: "#001a33" },
      { id: "bradesco", name: "Bradesco", color: "#cc092f" },
      { id: "bb", name: "Banco do Brasil", color: "#fcee21" },
    ];
  });

  // GET /banking/accounts/:institution
  app.get('/banking/accounts/:institution', {
    schema: {
      tags: ['Banking'],
      security: [{ bearerAuth: [] }],
      params: z.object({ institution: z.string() })
    },
    preHandler: [app.authenticate]
  }, async (request) => {
    const { institution } = request.params as any;
    return [
      {
        id: uuidv4(),
        name: "Conta Corrente Principal",
        institution,
        balance: 15420.50,
        currency: "BRL",
        type: "checking"
      },
      {
        id: uuidv4(),
        name: "Cartão de Crédito",
        institution,
        balance: -2450.00,
        currency: "BRL",
        type: "credit_card"
      }
    ];
  });

  // POST /banking/sync
  app.post('/banking/sync', {
    schema: {
      tags: ['Banking'],
      security: [{ bearerAuth: [] }],
      body: z.object({
        accountId: z.string()
      })
    },
    preHandler: [app.authenticate]
  }, async (request) => {
    const userId = request.user.id;
    const date = new Date().toISOString().split('T')[0];

    // Generate highly realistic mock transactions and physically inject them INTO the database
    const newTxns = [
      { description: "Supermercado Extra", amount: 432.15, type: "expense", category: "Alimentação", date: new Date(date), paymentMethod: "Débito", scope: "personal", classification: "necessity" },
      { description: "Netflix", amount: 55.90, type: "expense", category: "Lazer", date: new Date(date), paymentMethod: "Cartão de Crédito", scope: "personal", classification: "want" },
      { description: "Uber Viagem", amount: 25.50, type: "expense", category: "Transporte", date: new Date(date), paymentMethod: "Cartão de Crédito", scope: "personal", classification: "necessity" },
      { description: "Gasolina Posto Ipiranga", amount: 150.00, type: "expense", category: "Transporte", date: new Date(date), paymentMethod: "Cartão de Crédito", scope: "personal", classification: "necessity" },
      { description: "Pix Recebido - Salário", amount: 5500.00, type: "income", category: "Salário", date: new Date(date), paymentMethod: "Pix", scope: "personal", classification: "income" }
    ];

    const inserted = await db.$transaction(
      newTxns.map(tx => db.transaction.create({
        data: {
          userId,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          date: tx.date,
          paymentMethod: tx.paymentMethod,
          scope: tx.scope,
          classification: tx.classification,
          currency: "BRL"
        }
      }))
    );

    return inserted;
  });

  // POST /banking/import-ofx
  // Accepts raw OFX/QFX text as multipart field "file" or plain text body
  app.post('/banking/import-ofx', {
    schema: {
      tags: ['Banking'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.user.id;

    // ----- Extract raw OFX text -----
    let rawText = '';

    const contentType = request.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      // Multipart upload: read file field
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ message: 'Nenhum arquivo enviado.' });
      }
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      rawText = Buffer.concat(chunks).toString('utf-8');
    } else {
      // Plain text body (front-end read the file as text and sent directly)
      rawText = (request.body as string) || '';
    }

    if (!rawText || rawText.length < 50) {
      return reply.status(400).send({ message: 'Arquivo OFX inválido ou vazio.' });
    }

    // ----- Parse -----
    let parsed;
    try {
      parsed = parseOFX(rawText);
    } catch (err) {
      return reply.status(422).send({ message: 'Não foi possível processar o arquivo OFX. Verifique se é um extrato válido.' });
    }

    if (parsed.transactions.length === 0) {
      return reply.status(422).send({ message: 'Nenhuma transação encontrada no arquivo OFX.' });
    }

    // ----- Deduplication by FITID -----
    const existingFitids = await db.transaction.findMany({
      where: { userId, fitid: { in: parsed.transactions.map(t => t.fitid) } },
      select: { fitid: true },
    }).then(rows => new Set(rows.map(r => r.fitid)));

    const newTxns = parsed.transactions.filter(t => !existingFitids.has(t.fitid));

    if (newTxns.length === 0) {
      return reply.send({
        imported: 0,
        skipped: parsed.transactions.length,
        message: 'Todas as transações deste extrato já foram importadas anteriormente.',
      });
    }

    // ----- Bulk insert -----
    const inserted = await db.$transaction(
      newTxns.map(tx =>
        db.transaction.create({
          data: {
            userId,
            fitid: tx.fitid,
            description: tx.description,
            amount: tx.amount,
            type: tx.type,
            category: tx.category,
            date: tx.date,
            paymentMethod: tx.paymentMethod,
            scope: 'personal',
            classification: tx.type === 'income' ? 'income' : 'necessity',
            currency: parsed.currency || 'BRL',
          },
        })
      )
    );

    return {
      imported: inserted.length,
      skipped: parsed.transactions.length - inserted.length,
      currency: parsed.currency,
      period: {
        from: parsed.startDate,
        to: parsed.endDate,
      },
      transactions: inserted,
    };
  });
}

