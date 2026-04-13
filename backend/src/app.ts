import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { z } from 'zod';
import dotenv from 'dotenv';
import { db } from './lib/db';
import { transactionRoutes } from './routes/transactions';
import { investmentRoutes } from './routes/investments';
import { budgetRoutes } from './routes/budgets';
import { goalRoutes } from './routes/goals';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { aiRoutes } from './routes/ai';
import { bankingRoutes } from './routes/banking';
import { debtRoutes } from './routes/debts';
import { openFinanceRoutes } from './routes/openFinance';
import { pushRoutes } from './routes/push';
import { invoiceRoutes } from './routes/invoices';
import { reminderRoutes } from './routes/reminders';
import { graphqlRoutes } from './routes/graphql';
import { websocketRoutes } from './routes/websocket';
import { auditRoutes } from './routes/audit.js';
import { gamificationRoutes } from './routes/gamification';
import { emotionalRoutes } from './routes/emotional';
import { workspaceRoutes } from './routes/workspace';
import { marketRoutes } from './routes/market';
import { bankRoutes } from './routes/banks';
import { businessRoutes } from './routes/business';
import { assetRoutes } from './routes/assets';
import { interestRoutes } from './routes/interest';
import { provisionRoutes } from './routes/provisions';
import { analyticsRoutes } from './routes/analytics';
import { notificationsRoutes } from './routes/notifications';
import { cashflowRoutes } from './routes/cashflow';

const ACCESS_COOKIE_NAME = 'mc_access_token';
const CSRF_COOKIE_NAME = 'mc_csrf_token';

declare module 'fastify' {
  export interface FastifyInstance {
    authenticate(request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply): Promise<void>;
    signAccessToken(payload: { id: string; email: string; name: string | null; isPro: boolean }): string;
  }
}

dotenv.config();

// âœ… VALIDAÃ‡ÃƒO OBRIGATÃ“RIA DE AMBIENTE NO BOOT
// Fail Fast: Se qualquer variÃ¡vel obrigatÃ³ria faltar, o app NÃƒO INICIA
// Isso evita deploy quebrado em produÃ§Ã£o com comportamento indefinido
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`âŒ ERRO CRÃTICO: VariÃ¡veis de ambiente obrigatÃ³rias faltando: ${missingEnvVars.join(', ')}`);
  console.error('âœ… Regra do jogo: Falhar rÃ¡pido, falhar cedo. NÃ£o execute cÃ³digo com configuraÃ§Ã£o incompleta.');
  process.exit(1);
}

console.log('âœ… ValidaÃ§Ã£o de ambiente concluÃ­da');

const PRODUCTION_FALLBACK_ORIGINS = [
  'https://meucontador-367cf.web.app',
  'https://meucontador-367cf.firebaseapp.com',
  'https://meucontador.com.br',
  'https://www.meucontador.com.br',
];

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

const corsOrigin = allowedOrigins.length > 0
  ? allowedOrigins
  : isProduction
    ? PRODUCTION_FALLBACK_ORIGINS
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:4173', 'http://localhost:3000'];

const allowedOriginSet = new Set(corsOrigin);

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Support JWT secret rotation: primary + optional previous secrets
const JWT_SECRETS = [
  process.env.JWT_SECRET,
  process.env.JWT_SECRET_PREVIOUS,
].filter(Boolean) as string[];

export const app = fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(helmet, {
  global: true,
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.gstatic.com", "https://firebase.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://firebaseinstallations.googleapis.com", "https://fcmregistrations.googleapis.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://*.firebaseapp.com"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
  hsts: process.env.NODE_ENV === 'production'
    ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }
    : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  xPoweredBy: false,
  frameguard: { action: 'deny' },
});
app.register(cors, {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOriginSet.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['set-cookie'],
});
app.register(rateLimit, {
  global: true,
  max: isProduction ? 45 : 100000,
  timeWindow: '1 minute',
  skipOnError: true,
  allowList: isProduction ? undefined : ['127.0.0.1', '::1'],
  errorResponseBuilder: () => ({ message: 'Too many requests' }),
  keyGenerator: (request) => request.ip,
});

app.register(jwt, { secret: process.env.JWT_SECRET });
app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
app.decorate('signAccessToken', (payload) => app.jwt.sign(payload, { expiresIn: '15m' }));

app.register(swagger, {
  openapi: {
    info: {
      title: 'Meu Contador API',
      description: 'DocumentaÃ§Ã£o da API do Super App de InteligÃªncia Financeira',
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

app.register(swaggerUi, { routePrefix: '/docs' });

function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const cookies = cookieHeader.split(';').map((item) => item.trim());
  const target = cookies.find((item) => item.startsWith(`${name}=`));
  return target ? decodeURIComponent(target.slice(name.length + 1)) : undefined;
}

app.addHook('onRequest', async (request, reply) => {
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return;

  // Auth endpoints use their own token mechanisms â€” skip CSRF for them
  const authOnlyPaths = ['/auth/login', '/auth/register', '/auth/google', '/auth/refresh', '/auth/logout', '/auth/upgrade'];
  if (authOnlyPaths.some(p => request.url === p || request.url.startsWith(p + '?'))) return;

  const cookieCsrfToken = readCookie(request.headers.cookie, CSRF_COOKIE_NAME);
  const hasSessionCookie = Boolean(readCookie(request.headers.cookie, ACCESS_COOKIE_NAME));
  const headerCsrfToken = request.headers['x-csrf-token'];

  if (hasSessionCookie) {
    if (!cookieCsrfToken || typeof headerCsrfToken !== 'string' || headerCsrfToken !== cookieCsrfToken) {
      return reply.status(403).send({ message: 'Invalid CSRF token' });
    }
  }
});

app.decorate('authenticate', async (request, reply) => {
  try {
    const bearerToken = request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.slice(7)
      : undefined;
    const cookieToken = readCookie(request.headers.cookie, ACCESS_COOKIE_NAME);
    const token = bearerToken || cookieToken;

    if (!token) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const decoded = await app.jwt.verify(token);
    if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    (request as typeof request & {
      user: { id: string; email: string; name: string | null; isPro: boolean };
    }).user = decoded as { id: string; email: string; name: string | null; isPro: boolean };

    if (!request.user || !('id' in request.user)) {
      app.log.warn({ event: 'authenticate failed: user missing id' });
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const userId = (request.user as any).id;
    const user = await db.user.findFirst({ where: { id: String(userId), deletedAt: null } });

    if (!user) {
      return reply.status(401).send({ message: 'SessÃ£o expirada' });
    }

    (request as any).user = { ...request.user, isPro: !!user.isPro };
  } catch (err) {
    app.log.warn({ event: 'authenticate error', errorName: (err as Error | undefined)?.name });
    return reply.status(401).send({ message: 'SessÃ£o expirada' });
  }
});

app.decorate('proGuard', async (request: any, reply: any) => {
  if (!request.user || !(request.user as any).isPro) {
    return reply.status(403).send({ 
      message: 'ðŸ‘‘ RECURSO PREMIUM: Esta funcionalidade exige o plano PRO. FaÃ§a o upgrade para continuar.',
      error: 'PRO subscription required',
    });
  }
});

app.setErrorHandler((error, request, reply) => {
  const statusCode = typeof (error as { statusCode?: unknown }).statusCode === 'number'
    ? (error as { statusCode: number }).statusCode
    : undefined;

  const errorMessage = error instanceof Error ? error.message : '';

  if (
    statusCode === 429
    || errorMessage === 'Too many requests'
    || (error as { code?: string }).code === 'FST_ERR_RATE_LIMIT'
  ) {
    return reply.status(429).send({
      message: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  if ((error as { validation?: unknown }).validation) {
    return reply.status(400).send({
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: (error as { validation: unknown }).validation,
    });
  }

  if (error instanceof z.ZodError) {
    return reply.status(400).send({
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: error.flatten(),
    });
  }

  app.log.error(error);
  return reply.status(500).send({
    message: 'Internal server error',
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
  });
});

app.get('/health', {
  schema: {
    tags: ['Health'],
    response: {
      200: z.object({
        status: z.string(),
        timestamp: z.string(),
        version: z.string(),
        uptime: z.number(),
        database: z.object({
          status: z.string(),
          responseTimeMs: z.number().optional(),
        }),
        memory: z.object({
          rss: z.number(),
          heapTotal: z.number(),
          heapUsed: z.number(),
          external: z.number(),
        }),
        services: z.object({
          cache: z.string(),
        }),
      }),
      503: z.object({
        status: z.string(),
        timestamp: z.string(),
        database: z.object({
          status: z.string(),
          error: z.string().optional(),
        }),
      }),
    },
  },
}, async (request, reply) => {
  const startTime = Date.now();
  
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startTime;
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0-enterprise',
      uptime: process.uptime(),
      database: {
        status: 'connected',
        responseTimeMs: dbResponseTime,
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      services: {
        cache: 'operational',
      },
    };
  } catch (error: any) {
    request.log.error(error);
    return reply.status(503).send({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: error.message,
      },
    });
  }
});

app.register(authRoutes);
app.register(userRoutes);
app.register(transactionRoutes);
app.register(investmentRoutes);
app.register(budgetRoutes);
app.register(goalRoutes);
app.register(aiRoutes);
app.register(bankingRoutes);
app.register(debtRoutes);
app.register(openFinanceRoutes);
app.register(pushRoutes);
app.register(invoiceRoutes);
app.register(reminderRoutes);
app.register(graphqlRoutes);
app.register(websocketRoutes);
app.register(auditRoutes);
app.register(gamificationRoutes);
app.register(emotionalRoutes);
app.register(workspaceRoutes, { prefix: '/workspace' });
app.register(marketRoutes);
app.register(bankRoutes);
app.register(businessRoutes);
app.register(assetRoutes);
app.register(interestRoutes);
app.register(provisionRoutes);
app.register(analyticsRoutes);
  app.register(notificationsRoutes);
  app.register(cashflowRoutes);
