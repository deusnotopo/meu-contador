import { FastifyInstance } from 'fastify';
import { z } from 'zod';

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
      const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.warn('AI API key missing. Returning fallback response.');
        return {
          response: 'Modo demonstração: Configure a variável de ambiente OPENAI_API_KEY ou GEMINI_API_KEY no backend (Render) para ativar a inteligência artificial em tempo real. Os dados financeiros consolidados foram recebidos pelo servidor e estão prontos para análise.',
        };
      }

      // Simple real integration logic calling OpenAI API
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview", // Assume pro model is intended
          messages: [
            {
              role: "system",
              content: "Você é um assistente financeiro ultra-avançado chamado 'Assistente Financeiro IA'. Responda de forma curta, prestativa e profissional em português do Brasil. Você tem acesso aos dados transacionais enviados."
            },
            {
              role: "user",
              content: `Dados Financeiros (contexto): ${JSON.stringify(data).substring(0, 1500)}...`
            },
            ...conversation
          ],
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`AI API Error: ${aiResponse.status} - ${aiResponse.statusText}`);
      }

      const aiData = await aiResponse.json();
      return { response: aiData.choices[0].message.content };

    } catch (err) {
      console.error('AI Proxy Error:', err);
      // Fallback response prevents the UI from breaking
      return { response: 'A Inteligência Artificial obteve um timeout ou erro interativo. Por favor, tente novamente em instantes.' };
    }
  });
}
