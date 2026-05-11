/**
 * AiService
 * ─────────
 * Application layer for Intelligence and NLP.
 */

import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from "../lib/db.js";
import { writeAuditLog } from "../lib/audit.js";
import { PredictiveEngine } from "./ai.js";

const MAX_PROMPT_CHARS = 8000;

export interface AiPayload {
  userMessage?: string;
  conversation?: Array<{ role: string; content: string }>;
  systemContext?: string;
}

export async function* askGemini(userId: string | undefined, payload: AiPayload): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    yield JSON.stringify({ response: 'Modo demonstração: Configure GEMINI_API_KEY para ativar a Inteligência Artificial.' });
    return;
  }

  // 1. Prepare sensitive context
  const userProfile = userId ? await db.user.findUnique({
    where: { id: userId },
    select: { age: true, dependents: true, employmentType: true, financialGoal: true, riskProfile: true, isPro: true }
  }) : null;

  if (userProfile && !userProfile.isPro) {
    yield JSON.stringify({
      response: '🔒 RECURSO PREMIUM: O Consultor Neural é exclusivo para assinantes PRO. Faça o upgrade para desbloquear inteligência artificial financeira.',
    });
    return;
  }

  const userContext = userProfile ? `
[PERFIL FINANCEIRO]:
- Idade: ${userProfile.age || 0}
- Dependentes: ${userProfile.dependents || 0}
- Carreira: ${(userProfile.employmentType || 'clt').toUpperCase()}
- Risco: ${userProfile.riskProfile || 'moderate'}
- Objetivo: ${userProfile.financialGoal || 'save'}` : "";

  // 2. Setup Model — injeta contexto pedagógico/financeiro do frontend
  const genAI = new GoogleGenerativeAI(apiKey);
  const injectedContext = payload.systemContext
    ? `\n\n[CONTEXTO PEDAGÓGICO E FINANCEIRO INJETADO PELO APP]:\n${payload.systemContext}`
    : '';
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    systemInstruction: `Você é o 'Consultor Neural Premium' do Meu Contador. Responda sempre em Português-BR. Seja executivo, prático e didático — sem economês desnecessário. ${userContext}${injectedContext}`,
  });

  // 3. Compact & Mask Conversation
  const history = (payload.conversation || []).slice(-8).map((m: { role: string; content: string }) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: maskSensitiveText(m.content) }]
  }));

  if (payload.userMessage) {
    history.push({ role: 'user', parts: [{ text: maskSensitiveText(payload.userMessage) }] });
  }

  const promptFootprint = JSON.stringify(history).length + (payload.systemContext?.length || 0);

  if (promptFootprint > MAX_PROMPT_CHARS) {
    const error = Object.assign(new Error(`Prompt excede tamanho máximo de ${MAX_PROMPT_CHARS} caracteres.`), { statusCode: 400 });
    throw error;
  }

  // 4. Generate Stream
  const result = await model.generateContentStream({ contents: history });

  for await (const chunk of result.stream) {
    yield chunk.text();
  }

  // 5. Audit
  if (userId) {
    await writeAuditLog({
      userId,
      action: 'AI_PROXY_COMPLETE_STREAM',
      resource: 'ai_proxy',
      metadata: { promptLength: JSON.stringify(history).length }
    });
  }
}

export async function predictTransaction(description: string, amount: number) {
  return PredictiveEngine.predictTransaction(description, amount);
}

/**
 * PII Redaction logic
 */
function maskSensitiveText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email-redacted]')
    .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[cpf-redacted]')
    .replace(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, '[cnpj-redacted]')
    .replace(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})-?\d{4}\b/g, '[phone-redacted]');
}
