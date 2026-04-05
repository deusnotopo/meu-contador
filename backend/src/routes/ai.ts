import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import { db } from '../lib/db';
import { writeAuditLog } from '../lib/audit';
import { PredictiveEngine } from '../services/ai';
import type { AiConversationMessageDto, AiFinancialSnapshotDto, AiProxyRequestDto, AiProxyResponseDto } from '../../../shared/contracts';

const AI_MAX_REQUESTS_PER_MINUTE = 12;
const AI_MAX_PROMPT_CHARS = 8_000;
const aiLooseDataSchema = z.record(z.string(), z.unknown())
  .refine((value) => Object.keys(value).length <= 100, 'Máximo de 100 chaves')
  .optional();

const aiConversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2_000),
});

const aiFinancialSnapshotSchema = z.object({
  balance: z.number().optional(),
  monthlyIncome: z.number().optional(),
  monthlyExpenses: z.number().optional(),
  savingsRate: z.number().optional(),
  score: z.number().optional(),
  topCategories: z.array(z.object({
    category: z.string().trim().min(1).max(80),
    amount: z.number(),
    share: z.number().optional(),
  })).max(20).optional(),
  alerts: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  recommendations: z.array(z.string().trim().min(1).max(300)).max(20).optional(),
  predictions: z.array(z.string().trim().min(1).max(300)).max(20).optional(),
});

const aiProxyBodySchema = z.object({
  conversation: z.array(aiConversationMessageSchema).min(1).max(12),
  data: aiLooseDataSchema,
  systemContext: z.string().trim().max(5_000).optional(),
  userMessage: z.string().trim().min(1).max(2_000).optional(),
  financialData: aiLooseDataSchema,
  financialSnapshot: aiFinancialSnapshotSchema.optional(),
}).refine((body) => body.userMessage || ((body.conversation as z.infer<typeof aiConversationMessageSchema>[])?.length ?? 0) > 0, {
  message: 'Informe uma mensagem ou histórico de conversa.',
});

const aiProxyResponseSchema = z.object({
  response: z.string(),
  explanation: z.object({
    consideredSources: z.array(z.string()),
    omittedDetails: z.array(z.string()),
  }).optional(),
});

const aiErrorSchema = z.object({ message: z.string() });

function hashForAudit(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function maskSensitiveText(value: string | undefined, maxLength = 600): string | undefined {
  if (!value) return undefined;

  const masked = value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email-redacted]')
    .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[cpf-redacted]')
    .replace(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, '[cnpj-redacted]')
    .replace(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})-?\d{4}\b/g, '[phone-redacted]')
    .replace(/\b\d{12,19}\b/g, '[numeric-sequence-redacted]');

  return trimText(masked.replace(/\s+/g, ' ').trim(), maxLength);
}

function bucketizeCurrency(value: number | undefined): string | undefined {
  if (value === undefined || Number.isNaN(value)) return undefined;
  const abs = Math.abs(value);
  if (abs < 1_000) return 'menos_de_1k';
  if (abs < 5_000) return '1k_a_5k';
  if (abs < 10_000) return '5k_a_10k';
  if (abs < 50_000) return '10k_a_50k';
  return 'acima_de_50k';
}

function buildAiAuditLog(payload: AiProxyRequestDto, userId?: string) {
  return {
    event: 'ai-proxy-audit',
    userId,
    conversationCount: payload.conversation?.length ?? 0,
    maskedUserMessageHash: payload.userMessage ? hashForAudit(payload.userMessage) : undefined,
    hasSystemContext: Boolean(payload.systemContext),
    hasFinancialSnapshot: Boolean(payload.financialSnapshot),
    dataKeys: payload.data ? Object.keys(payload.data as Record<string, unknown>).slice(0, 20) : [],
    financialDataKeys: payload.financialData ? Object.keys(payload.financialData as Record<string, unknown>).slice(0, 20) : [],
  };
}

function trimText(value: string | undefined, maxLength: number): string | undefined {
  if (!value) return undefined;
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

function compactConversation(conversation: AiConversationMessageDto[] = []): AiConversationMessageDto[] {
  return conversation.slice(-8).map((message) => ({
    role: message.role,
    content: maskSensitiveText(message.content, 600) || '',
  }));
}

function buildFinancialSummary(snapshot?: AiFinancialSnapshotDto): string | undefined {
  if (!snapshot) return undefined;

  const lines = [
    snapshot.score !== undefined ? `Score financeiro: ${snapshot.score}/100` : undefined,
    snapshot.balance !== undefined ? `Faixa de saldo atual: ${bucketizeCurrency(snapshot.balance)}` : undefined,
    snapshot.monthlyIncome !== undefined ? `Faixa de receita mensal: ${bucketizeCurrency(snapshot.monthlyIncome)}` : undefined,
    snapshot.monthlyExpenses !== undefined ? `Faixa de despesa mensal: ${bucketizeCurrency(snapshot.monthlyExpenses)}` : undefined,
    snapshot.savingsRate !== undefined ? `Taxa de poupança: ${snapshot.savingsRate}%` : undefined,
    snapshot.topCategories?.length ? `Principais categorias: ${snapshot.topCategories.map((item) => `${maskSensitiveText(item.category, 40)} (${bucketizeCurrency(item.amount)})`).join(', ')}` : undefined,
    snapshot.alerts?.length ? `Alertas: ${snapshot.alerts.map((item) => maskSensitiveText(item, 120)).filter(Boolean).join(' | ')}` : undefined,
    snapshot.recommendations?.length ? `Recomendações: ${snapshot.recommendations.map((item) => maskSensitiveText(item, 120)).filter(Boolean).join(' | ')}` : undefined,
    snapshot.predictions?.length ? `Previsões: ${snapshot.predictions.map((item) => maskSensitiveText(item, 120)).filter(Boolean).join(' | ')}` : undefined,
  ].filter(Boolean);

  return lines.length ? lines.join('\n') : undefined;
}

export async function aiRoutes(app: FastifyInstance) {
  app.post('/api/ai-proxy', {
    config: {
      rateLimit: {
        max: AI_MAX_REQUESTS_PER_MINUTE,
        timeWindow: '1 minute',
      },
    },
    schema: {
      tags: ['AI'],
      security: [{ bearerAuth: [] }],
      body: aiProxyBodySchema,
      response: {
        200: aiProxyResponseSchema,
        400: aiErrorSchema,
        401: aiErrorSchema,
      },
    },
    preHandler: [app.authenticate, (app as any).proGuard],
  }, async (request, reply) => {
    const body = request.body as AiProxyRequestDto;
    request.log.info(buildAiAuditLog(body, (request.user as { id?: string } | undefined)?.id));
    await writeAuditLog({
      userId: (request.user as { id?: string } | undefined)?.id,
      action: 'AI_PROXY_REQUESTED',
      resource: 'ai_proxy',
      metadata: buildAiAuditLog(body, (request.user as { id?: string } | undefined)?.id),
    });

    const buildFallbackResponse = () => {
      const msg = maskSensitiveText(body?.userMessage || body?.conversation?.[body.conversation.length - 1]?.content || 'sua solicitação', 200);
      return {
        response:
          `Estou operando em modo resiliente no ambiente local. Ainda não consegui consultar a API do Gemini agora, ` +
          `mas posso continuar com análise orientada por regras. Pedido recebido: "${msg}". ` +
          `Sugestão prática: importe seu extrato OFX/CSV/PDF para eu cruzar entradas, saídas, categorias, duplicidades e padrões mensais.`
      };
    };

    try {
      const { conversation, data, systemContext, userMessage, financialData, financialSnapshot } = request.body as AiProxyRequestDto;
      const apiKey = process.env.GEMINI_API_KEY;
      const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
      const sanitizedUserMessage = maskSensitiveText(userMessage, 800);

      if (!apiKey) {
        console.warn('AI API key missing. Returning fallback response.');
        return {
          response: 'Modo demonstração: Configure a variável de ambiente OPENAI_API_KEY ou GEMINI_API_KEY no backend (Render) para ativar a inteligência artificial em tempo real. Os dados financeiros consolidados foram recebidos pelo servidor e estão prontos para análise.',
        };
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const compactSystemContext = trimText(systemContext, 2500);
      const compactFinancialSummary = buildFinancialSummary(financialSnapshot);
      const compactHistory = compactConversation(conversation);
      const promptFootprint = [
        maskSensitiveText(compactSystemContext, 1800),
        compactFinancialSummary,
        sanitizedUserMessage,
        ...compactHistory.map((item) => item.content),
      ].filter(Boolean).join('\n').length;

      if (promptFootprint > AI_MAX_PROMPT_CHARS) {
        return reply.status(400).send({ message: 'Prompt excede o limite seguro.' });
      }

      const explanation = {
        consideredSources: [
          'perfil do usuário minimizado',
          compactSystemContext ? 'contexto operacional resumido' : undefined,
          compactFinancialSummary ? 'snapshot financeiro resumido' : undefined,
          compactHistory.length ? 'últimas mensagens com redaction' : undefined,
        ].filter(Boolean) as string[],
        omittedDetails: [
          data ? 'payload bruto data omitido do prompt' : undefined,
          financialData ? 'payload bruto financialData omitido do prompt' : undefined,
          userMessage && sanitizedUserMessage !== userMessage ? 'userMessage sofreu mascaramento/redaction' : undefined,
          systemContext && systemContext.length > 2500 ? 'systemContext truncado para resumo executivo' : undefined,
          conversation.length > compactHistory.length ? 'histórico antigo resumido/descartado' : undefined,
        ].filter(Boolean) as string[],
      };
      
      // Phase 10: Deep Behavioral Context Injection
      let userContext = "";
      if (request.user && (request.user as any).id) {
        const fullUser = await db.user.findUnique({
          where: { id: (request.user as any).id },
          select: { 
            age: true, 
            dependents: true, 
            employmentType: true, 
            financialGoal: true,
            riskProfile: true,
          }
        });
        
        if (fullUser) {
          userContext = `
[PERFIL FINANCEIRO MINIMIZADO]:
- Idade: ${fullUser.age || 0} anos
- Dependentes: ${fullUser.dependents || 0}
- Perfil de Carreira: ${(fullUser.employmentType || 'clt').toUpperCase()}
- Perfil de Risco: ${fullUser.riskProfile || 'moderate'}
- Objetivo: ${fullUser.financialGoal || 'save'}

[DIRETRIZ DE CONSULTORIA]:
Como o usuário é ${fullUser.employmentType === 'pj' ? 'PJ (Pessoa Jurídica)' : 'CLT'}, suas recomendações de reserva de emergência devem ser de ${fullUser.employmentType === 'pj' ? '12 meses' : '6 meses'} de custo fixo. 
Sempre considere que ele tem ${fullUser.dependents || 0} dependentes ao sugerir gastos supérfluos.
Se o usuário disser que gastou ou recebeu algo, responda confirmando os detalhes e use um tom prestativo.`;
        }
      }

      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: `Você é o 'Consultor Neural Premium' do app Meu Contador. 
Responda em português do Brasil de forma executiva, breve e ultra-especializada.
${userContext}
Ajude o usuário a economizar, analisar os dados e projetar o futuro.
Se o usuário descrever uma transação (ex: "gastei 50 no almoço"), você deve validar os dados e encorajá-lo. 
Não use Markdown complexo.
Ao responder, inclua brevemente em linguagem natural em que dados você se baseou e quando houver incerteza, explicite.`
      });

      // Mapeando histórico do formato Frontend {role: user | assistant, content} para Gemini {role: user | model, parts: [{text}]}
      const historyContents = compactHistory.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Injetar contexto de dados financeiros no primeiro prompt sem que o usuário precise digitar
      const finalContents: any[] = [];
      if (compactSystemContext) {
        finalContents.push({
          role: 'user',
          parts: [{ text: `[CONTEXTO DO SISTEMA - RESUMIDO E MASCARADO]:\n${maskSensitiveText(compactSystemContext, 1800)}` }]
        });
        finalContents.push({
          role: 'model',
          parts: [{ text: 'Resumo operacional recebido e indexado.' }]
        });
      }

      if (compactFinancialSummary) {
        finalContents.push({
          role: 'user',
          parts: [{ text: `[SNAPSHOT FINANCEIRO RESUMIDO]:\n${compactFinancialSummary}` }]
        });
        finalContents.push({
          role: 'model',
          parts: [{ text: 'Snapshot financeiro resumido integrado à análise.' }]
        });
      }

      // Concatena o histórico originado do ChatBox
      finalContents.push(...historyContents);

      if (sanitizedUserMessage) {
        finalContents.push({
          role: 'user',
          parts: [{ text: sanitizedUserMessage }]
        });
      }

      // Gerando streaming de texto
      const result = await model.generateContent({ contents: finalContents });
      const apiResponseText = result.response.text();

      return { response: apiResponseText, explanation } satisfies AiProxyResponseDto;

    } catch (err) {
      request.log.error({
        event: 'ai-proxy-error',
        userId: (request.user as { id?: string } | undefined)?.id,
        errorName: (err as Error | undefined)?.name,
        errorMessage: (err as Error | undefined)?.message,
      });
      return buildFallbackResponse();
    }
  });

  const aiPredictBodySchema = z.object({
    description: z.string(),
    amount: z.number().optional().default(0),
  });

  app.post('/api/ai/predict', {
    preHandler: [(app as any).authenticate],
    schema: {
      tags: ['AI'],
      security: [{ bearerAuth: [] }],
      body: aiPredictBodySchema,
    },
  }, async (request) => {
    const { description, amount } = request.body as z.infer<typeof aiPredictBodySchema>;
    return PredictiveEngine.predictTransaction(description, amount);
  });
}
