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
      }),
      response: {
        200: z.object({
          response: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { conversation, data } = request.body as any;
      const apiKey = process.env.GEMINI_API_KEY;

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

      // Conectando com a SDK Real do Google (Gemini)
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "Você é um consultor financeiro ultra-avançado chamado 'Assistente Financeiro IA'. Responda de forma direta, altamente prestativa e profissional em português do Brasil. Ajude o usuário a economizar, analisar os dados em anexo e projetar investimentos. Evite formatação Markdown complexa se não for necessário. Seja breve e cordial na medida do possível."
      });

      // Mapeando histórico do formato Frontend {role: user | assistant, content} para Gemini {role: user | model, parts: [{text}]}
      const historyContents = conversation.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Injetar contexto de dados financeiros no primeiro prompt sem que o usuário precise digitar
      const finalContents: any[] = [];
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

      // Concatena o histórico originado do ChatBox
      finalContents.push(...historyContents);

      // Gerando streaming de texto
      const result = await model.generateContent({ contents: finalContents });
      const apiResponseText = result.response.text();

      return { response: apiResponseText };

    } catch (err) {
      console.error('AI Proxy Error (Gemini):', err);
      return { response: 'A Inteligência Artificial obteve um timeout ou erro nos servidores da Google. Por favor, tente novamente em instantes.' };
    }
  });
}
