import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import dotenv from 'dotenv';
import { db } from './lib/db';
import { transactionRoutes } from './routes/transactions';
import { investmentRoutes } from './routes/investments';
import { budgetRoutes } from './routes/budgets';
import { goalRoutes } from './routes/goals';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  export interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

dotenv.config();

const app = fastify({
  logger: true,
}).withTypeProvider<ZodTypeProvider>();

// --- Plugins (Enterprise Foundation) ---
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(helmet);
app.register(cors, {
  origin: true, // In production, define specific origins
});
app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'super-secret-key-enterprise-grade',
});

// --- Swagger Documentation ---
app.register(swagger, {
  openapi: {
    info: {
      title: 'Meu Contador API',
      description: 'Documentação da API do Super App de Inteligência Financeira',
      version: '1.0.0-enterprise',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});

app.register(swaggerUi, {
  routePrefix: '/docs',
});

// Auth Middleware
app.decorate('authenticate', async (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// --- Error Handler (enterpriseBest Practice) ---
app.setErrorHandler((error, request, reply) => {
  if (error instanceof z.ZodError) {
    return reply.status(400).send({
      message: 'Validation error',
      errors: error.flatten(),
    });
  }
  
  app.log.error(error);
  return reply.status(500).send({ message: 'Internal server error' });
});

// --- Routes ---
app.get('/health', async (request, reply) => {
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'connected', timestamp: new Date(), version: '1.0.0-enterprise' };
  } catch (error) {
    request.log.error(error);
    return reply.status(503).send({ status: 'error', database: 'disconnected', timestamp: new Date() });
  }
});

app.register(authRoutes);
app.register(userRoutes);
app.register(transactionRoutes);
app.register(investmentRoutes);
app.register(budgetRoutes);
app.register(goalRoutes);

// --- Bootstrap ---
async function bootstrap() {
  try {
    // Ensure at least one user exists for development
    const userCount = await db.user.count();
    if (userCount === 0) {
      await db.user.create({
        data: {
          email: 'admin@meucontador.com',
          name: 'Admin Enterprise',
          isPro: true,
        },
      });
      console.log('✅ Default development user created');
    }

    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
