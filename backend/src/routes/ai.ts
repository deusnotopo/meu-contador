import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function aiRoutes(app: FastifyInstance) {
  app.post('/api/ai-proxy', {
    schema: {
      tags: ['AI'],
      body: z.object({
        conversation: z.array(z.any()),
        data: z.any().optional(),
        systemContext: z.string().optional(),
        userMessage: z.string().optional(),
        financialData: z.any().optional(),
      }),
      response: {
        200: z.object({
          response: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const body = request.body as any;
    const buildFallbackResponse = () => {
      const msg = body?.userMessage || body?.conversation?.[body.conversation.length - 1]?.content || 'sua solicitação';
      return {
        response:
          `Estou operando em modo resiliente no ambiente local. Ainda não consegui consultar a API do Gemini agora, ` +
          `mas posso continuar com análise orientada por regras. Pedido recebido: "${msg}". ` +
          `Sugestão prática: importe seu extrato OFX/CSV/PDF para eu cruzar entradas, saídas, categorias, duplicidades e padrões mensais.`
      };
    };

    try {
      const { conversation, data, systemContext, userMessage, financialData } = request.body as any;
      const apiKey = process.env.GEMINI_API_KEY;
      const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

      if (!apiKey) {
        console.warn('AI API key missing. Returning fallback response.');
        return {
          response: 'Modo demonstração: Configure a variável de ambiente OPENAI_API_KEY ou GEMINI_API_KEY no backend (Render) para ativar a inteligência artificial em tempo real. Os dados financeiros consolidados foram recebidos pelo servidor e estão prontos para análise.',
        };
      }

      // Phase 9: PRO Enforcement Seguro
      let isPro = true;
      if (request.user && (request.user as any).id) {
        const user = await (app as any).db.user.findUnique({
          where: { id: (request.user as any).id },
          select: { isPro: true }
        });
        isPro = !!user?.isPro;
      }

      if (!isPro) {
        return {
          response: '👑 RECURSO PREMIUM: O Centro de Inteligência Financeira está disponível apenas para assinantes PRO. Faça o upgrade agora para desbloquear auditorias ilimitadas e projeções de capital.'
        };
      }

      // Em desenvolvimento local, mantemos a IA acessível para acelerar validação do produto.
      if (process.env.NODE_ENV === 'development') {
        isPro = true;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: "Você é um consultor financeiro ultra-avançado chamado 'Assistente Financeiro IA'. Responda de forma direta, altamente prestativa e profissional em português do Brasil. Ajude o usuário a economizar, analisar os dados em anexo e projetar investimentos. Evite formatação Markdown complexa se não for necessário. Seja breve e cordial na medida do possível."
      });

      // Mapeando histórico do formato Frontend {role: user | assistant, content} para Gemini {role: user | model, parts: [{text}]}
      const historyContents = conversation.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Injetar contexto de dados financeiros no primeiro prompt sem que o usuário precise digitar
      const finalContents: any[] = [];
      if (systemContext) {
        finalContents.push({
          role: 'user',
          parts: [{ text: `[CONTEXTO DO SISTEMA]:\n${systemContext.substring(0, 30000)}` }]
        });
        finalContents.push({
          role: 'model',
          parts: [{ text: 'Contexto operacional recebido e incorporado à análise.' }]
        });
      }

      if (data && Object.keys(data).length > 0) {
        finalContents.push({
          role: "user",
          parts: [{ text: `[DADOS CONTÁBEIS EXPORTADOS PARA ANÁLISE]: \n${JSON.stringify(data).substring(0, 50000)}\n\n(Estas são as informações transacionais em JSON do meu aplicativo. Use-as para basear suas respostas a partir de agora se eu perguntar algo sobre minhas finanças. Se não houver dados o suficiente, responda de forma passiva)` }]
        });
        finalContents.push({
           role: "model",
           parts: [{ text: "Compreendido perfeitamente. O extrato financeiro foi processado e armazenado na minha memória temporária para uso. Em que posso ser útil com suas finanças agora?" }]
        });
      }

      if (financialData && Object.keys(financialData).length > 0) {
        finalContents.push({
          role: 'user',
          parts: [{ text: `[DADOS FINANCEIROS E MÉTRICAS]:\n${JSON.stringify(financialData).substring(0, 40000)}` }]
        });
        finalContents.push({
          role: 'model',
          parts: [{ text: 'Métricas financeiras recebidas. Vou considerá-las nas recomendações.' }]
        });
      }

      // Concatena o histórico originado do ChatBox
      finalContents.push(...historyContents);

      if (userMessage) {
        finalContents.push({
          role: 'user',
          parts: [{ text: userMessage }]
        });
      }

      // Gerando streaming de texto
      const result = await model.generateContent({ contents: finalContents });
      const apiResponseText = result.response.text();

      return { response: apiResponseText };

    } catch (err) {
      console.error('AI Proxy Error (Gemini):', err);
      return buildFallbackResponse();
    }
  });
}
