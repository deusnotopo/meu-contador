import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';

export async function investmentRoutes(app: FastifyInstance) {
  // GET all investments for user
  app.get('/investments', async (request, reply) => {
    const user = await db.user.findFirst();
    if (!user) return reply.status(404).send({ message: 'User not found' });

    const investments = await db.investment.findMany({
      where: { userId: user.id },
      include: { dividends: true, sales: true },
    });
    return investments;
  });

  // POST create new investment
  app.post('/investments', async (request, reply) => {
    const schema = z.object({
      name: z.string(),
      ticker: z.string(),
      type: z.enum(['stock', 'fii', 'crypto', 'fixed_income', 'etf']),
      amount: z.number(),
      averagePrice: z.number(),
      currentPrice: z.number(),
      currency: z.string().default('BRL'),
      sector: z.string().optional(),
    });

    const body = schema.parse(request.body);
    const user = await db.user.findFirst();
    if (!user) return reply.status(404).send({ message: 'User not found' });

    const investment = await db.investment.create({
      data: {
        ...body,
        userId: user.id,
      },
    });

    return investment;
  });

  // DELETE investment
  app.delete('/investments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.investment.delete({ where: { id } });
    return reply.status(204).send();
  });

  // POST add dividend
  app.post('/investments/:id/dividends', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      amount: z.number(),
      date: z.string(),
      type: z.enum(['dividend', 'jcp']),
    });

    const body = schema.parse(request.body);
    const dividend = await db.dividend.create({
      data: {
        ...body,
        date: new Date(body.date),
        investmentId: id,
      },
    });

    return dividend;
  });

  // POST add sale
  app.post('/investments/:id/sales', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      amount: z.number(),
      price: z.number(),
      date: z.string(),
    });

    const body = schema.parse(request.body);
    
    // Get the investment to update its amount
    const investment = await db.investment.findUnique({ where: { id } });
    if (!investment) return reply.status(404).send({ message: 'Investment not found' });

    if (investment.amount < body.amount) {
      return reply.status(400).send({ message: 'Insufficient quantity' });
    }

    // Create sale record and update investment in a transaction
    const [sale] = await db.$transaction([
      db.investmentSale.create({
        data: {
          investmentId: id,
          ticker: investment.ticker,
          amount: body.amount,
          price: body.price,
          totalValue: body.amount * body.price,
          date: new Date(body.date),
          userId: investment.userId,
          currency: investment.currency,
        },
      }),
      db.investment.update({
        where: { id },
        data: {
          amount: investment.amount - body.amount,
        },
      }),
    ]);

    return sale;
  });
}
