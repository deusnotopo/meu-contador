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

export async function askGemini(userId: string | undefined, payload: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      response: 'Modo demonstração: Configure GEMINI_API_KEY para ativar a Inteligência Artificial.',
    };
  }

  // 1. Prepare sensitive context
  const userProfile = userId ? await db.user.findUnique({
    where: { id: userId },
    select: { age: true, dependents: true, employmentType: true, financialGoal: true, riskProfile: true, isPro: true }
  }) : null;

  if (userProfile && !userProfile.isPro) {
    return {
      response: '🔒 RECURSO PREMIUM: O Consultor Neural é exclusivo para assinantes PRO. Faça o upgrade para desbloquear inteligência artificial financeira.',
    };
  }

  const userContext = userProfile ? `
[PERFIL FINANCEIRO]:
- Idade: ${userProfile.age || 0}
- Dependentes: ${userProfile.dependents || 0}
- Carreira: ${(userProfile.employmentType || 'clt').toUpperCase()}
- Risco: ${userProfile.riskProfile || 'moderate'}
- Objetivo: ${userProfile.financialGoal || 'save'}` : "";

  // 2. Setup Model
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    systemInstruction: `Você é o 'Consultor Neural Premium' do Meu Contador. Responda em Português-BR de forma executiva. ${userContext}`
  });

  // 3. Compact & Mask Conversation
  const history = (payload.conversation || []).slice(-8).map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: maskSensitiveText(m.content) }]
  }));

  if (payload.userMessage) {
    history.push({ role: 'user', parts: [{ text: maskSensitiveText(payload.userMessage) }] });
  }

  const promptFootprint = JSON.stringify(history).length + (payload.systemContext?.length || 0);

  if (promptFootprint > MAX_PROMPT_CHARS) {
    const error: any = new Error(`Prompt excede tamanho máximo de ${MAX_PROMPT_CHARS} caracteres.`);
    error.statusCode = 400;
    throw error;
  }

  // 4. Generate
  const result = await model.generateContent({ contents: history });
  const responseText = result.response.text();

  // 5. Audit
  if (userId) {
    await writeAuditLog({
      userId,
      action: 'AI_PROXY_COMPLETE',
      resource: 'ai_proxy',
      metadata: { promptLength: JSON.stringify(history).length }
    });
  }

  return { response: responseText };
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
