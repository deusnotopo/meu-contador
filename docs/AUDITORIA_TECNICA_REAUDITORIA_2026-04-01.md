# 🔎 REAUDITORIA TÉCNICA COMPLETA — MEU CONTADOR

**Data:** 01/04/2026  
**Escopo:** backend, frontend, banco, integrações, deploy, testes, PWA  
**Base:** estado atual do workspace após correções parciais da auditoria anterior

---

## Resumo executivo

Houve melhora real nos pontos críticos anteriores, principalmente em:

- expiração de JWT no backend
- rate limit específico em rotas sensíveis de auth
- remoção de `prisma db push --accept-data-loss` do build do backend
- endurecimento parcial de CSP
- redução de PII em logs de autenticação

Mesmo assim, **o app ainda não está pronto do ponto de vista técnico e de segurança para produção madura**. A nova auditoria encontrou problemas relevantes ainda abertos em autenticação, proteção de sessão, validação, privacidade de IA, consistência de deploy, cobertura de testes e build do frontend.

---

## Status atual por severidade

| Severidade | Quantidade | Situação |
|---|---:|---|
| 🔴 Crítico | 8 | ainda requer ação imediata |
| 🟠 Alto | 15 | risco real de regressão, abuso ou indisponibilidade |
| 🟡 Médio | 18 | dívida técnica e operacional relevante |
| 🟢 Baixo | 9 | melhorias importantes, mas não bloqueantes |

---

## O que foi corrigido desde a auditoria anterior

1. **JWT com expiração curta**
   - Arquivos: `backend/src/app.ts`, `backend/src/routes/auth.ts`
   - Situação: **corrigido parcialmente**
   - Observação: ainda falta refresh token/rotação/revogação.

2. **Rate limit específico para auth**
   - Arquivo: `backend/src/routes/auth.ts`
   - Situação: **corrigido**

3. **Build inseguro com `db push --accept-data-loss`**
   - Arquivo: `backend/render-build.sh`
   - Situação: **corrigido** com `prisma migrate deploy`

4. **PII explícita em logs de autenticação**
   - Arquivo: `backend/src/app.ts`
   - Situação: **reduzido**, mas ainda falta política de audit/logging.

5. **CSP com `unsafe-eval` e domínio hardcoded**
   - Arquivos: `vercel.json`, `frontend/vercel.json`
   - Situação: **corrigido parcialmente**
   - Observação: ainda há inconsistência entre os dois arquivos e ausência de estratégia única de deploy.

6. **Proteção de endpoints dev**
   - Arquivo: `backend/src/routes/auth.ts`
   - Situação: **corrigido parcialmente** com `AUTH_DEVTOOLS_SECRET`

---

## Achados críticos abertos

### 1. Ausência de refresh token, revogação e rotação de sessão
**Severidade:** 🔴 Crítico  
**Arquivos:** `backend/src/app.ts`, `backend/src/routes/auth.ts`

O backend agora expira access tokens em 15 minutos, mas ainda não existe:

- refresh token
- rotação de refresh token
- revogação por dispositivo
- `jti` / session store
- logout real com invalidação de sessão

**Risco:** se o token for roubado, ele só expira por tempo; não há kill switch seletivo.

---

### 2. Auth token armazenado em `localStorage`
**Severidade:** 🔴 Crítico  
**Arquivos:** `frontend/src/context/AuthContext.tsx`, `frontend/src/lib/ai.ts`, `frontend/src/lib/api.ts`, `frontend/src/hooks/useWebPush.ts`

O token continua exposto a qualquer XSS, extensão maliciosa ou script terceiro executado no contexto da página.

**Risco:** exfiltração de sessão e takeover de conta.

**Recomendação:** migrar para cookie `HttpOnly` + `SameSite` + refresh flow server-side.

---

### 3. Falta de proteção CSRF / modelo de sessão inconsistente
**Severidade:** 🔴 Crítico  
**Arquivos:** `backend/src/app.ts`, arquitetura de autenticação inteira

Atualmente o app usa Bearer token no cliente, sem CSRF, sem cookies seguros e sem modelo final definido. A migração para cookies HttpOnly exigirá proteção CSRF explícita.

**Risco:** se a estratégia de sessão for evoluída sem desenho correto, abre nova superfície crítica.

---

### 4. Validação permissiva e sem limites robustos em AI
**Severidade:** 🔴 Crítico  
**Arquivo:** `backend/src/routes/ai.ts`

Há uso de `z.any()` em payloads e ausência de limites fortes para:

- `systemContext`
- `userMessage`
- `conversation[].content`
- `data`
- `financialData`

**Risco:** abuso de custo, payload gigante, prompt poisoning indireto, pressão de memória e vazamento acidental de dados.

---

### 5. Envio excessivo de PII/dados financeiros para provedor de IA
**Severidade:** 🔴 Crítico  
**Arquivo:** `backend/src/routes/ai.ts`

O backend ainda compartilha contexto comportamental/financeiro extenso com o provedor de IA:

- idade
- dependentes
- emprego CLT/PJ
- nome/segmento empresarial
- metas e perfil financeiro
- snapshot financeiro

**Risco:** privacidade, LGPD, excesso de dado por finalidade, ausência de minimização e rastreabilidade formal.

---

### 6. Rotas ainda com validação incompleta / inconsistente
**Severidade:** 🔴 Crítico  
**Arquivos:** múltiplos em `backend/src/routes/*.ts`

A reauditoria identificou padrão misto: algumas rotas usam Zod/Fastify adequadamente; outras validam só body, deixam params/query frouxos ou fazem validação manual parcial.

**Risco:** inconsistência de segurança, documentação OpenAPI incompleta, edge cases não tratados.

---

### 7. Build do frontend continua quebrado
**Severidade:** 🔴 Crítico  
**Comando:** `npm run build -w frontend`  
**Erro atual:** `Could not load ... frontend/node_modules/react/jsx-runtime`

Isso bloqueia validação real de produção do frontend.

**Risco:** pipeline não confiável; release pode falhar ou depender de estado local inconsistente.

---

### 8. Cobertura de testes extremamente insuficiente para áreas críticas
**Severidade:** 🔴 Crítico  
**Arquivos:** configs Vitest + testes frontend/backend

Backend testado quase só em `transactions` e `debts`. Frontend tem vários testes superficiais, alguns quase cosméticos.

**Risco:** regressões silenciosas em auth, AI, onboarding, investimentos, Open Finance, preferências e SW.

---

## Achados altos

### 9. Índices Prisma ainda insuficientes para padrão real de queries
**Severidade:** 🟠 Alto  
**Arquivo:** `backend/prisma/schema.prisma`

Foreign keys e colunas muito consultadas continuam sem estratégia robusta de indexação.

---

### 10. Sem audit log para ações sensíveis
**Severidade:** 🟠 Alto  
**Arquivos:** backend em geral

Não há trilha formal para login, falha de auth, alterações financeiras, integrações bancárias e eventos administrativos.

---

### 11. Configuração duplicada e divergente de Vercel
**Severidade:** 🟠 Alto  
**Arquivos:** `vercel.json`, `frontend/vercel.json`

Existem dois arquivos de configuração ativos com headers/CSP/build diferentes.

**Risco:** comportamento de segurança não determinístico por ambiente/projeto.

---

### 12. Swagger/Docs expostos sem guarda explícita
**Severidade:** 🟠 Alto  
**Arquivo:** `backend/src/app.ts`

`/docs` permanece registrado sem proteção condicional por ambiente.

---

### 13. Endpoint de upgrade manual bloqueado, mas fluxo de entitlement não existe
**Severidade:** 🟠 Alto  
**Arquivo:** `backend/src/routes/auth.ts`

Melhorou por não promover usuário para PRO arbitrariamente, mas o produto segue sem fluxo real de entitlement/assinatura.

---

### 14. Open Finance e AI sem observabilidade forte
**Severidade:** 🟠 Alto  
**Arquivos:** `backend/src/routes/openFinance.ts`, `backend/src/routes/ai.ts`

Falta correlação, métricas, tracing e política clara de erros para integrações externas.

---

### 15. Parser financeiro/OFX com risco de edge cases e corrupção silenciosa
**Severidade:** 🟠 Alto  
**Arquivos:** `backend/src/lib/ofx-parser.ts`, `frontend/src/lib/statements/parser.ts`

Formato OFX/SGML brasileiro é notoriamente irregular. Ainda há risco de parsing incorreto, deduplicação imperfeita e classificação errada.

---

### 16. Política de secrets/env ainda frágil
**Severidade:** 🟠 Alto  
**Arquivos:** `render.yaml`, configs gerais

Há dependência forte de variáveis críticas sem checklist automatizado completo de presença/validação por ambiente.

---

### 17. Inconsistências de cliente HTTP / token handling espalhado
**Severidade:** 🟠 Alto  
**Arquivos:** `frontend/src/context/AuthContext.tsx`, `frontend/src/lib/ai.ts`, demais consumidores de API

O token é lido em múltiplos pontos e nem sempre por uma única abstração consolidada.

---

### 18. PWA/SW ainda suscetível a cache inconsistente
**Severidade:** 🟠 Alto  
**Arquivos:** `frontend/src/sw.js`, `frontend/vite.config.ts`

Risco de serving de assets velhos, comportamento offline incompleto e inconsistência entre versões.

---

### 19. Testes frontend não exercitam comportamento real suficiente
**Severidade:** 🟠 Alto  
**Arquivos:** testes em `frontend/src/**/*.test.tsx`

Há vários testes de “presença/exportação” que passam mesmo sem garantir fluxo real.

---

### 20. Falta de paginação/limites padronizados em endpoints de listagem
**Severidade:** 🟠 Alto  
**Arquivos:** rotas de listagem no backend

Pode causar consultas pesadas e degradação de performance conforme dados crescerem.

---

## Achados médios

1. Sem `coverage thresholds` fortes no pipeline de teste
2. Sem `coverage.all` consistente
3. Logging ainda pouco padronizado entre rotas
4. Falta de normalização de erro para integrações externas
5. Sem estratégia clara de retry/backoff centralizado
6. Falta de minimização/mascaramento sistemático de payloads sensíveis
7. Possível N+1 em consultas Prisma de módulos financeiros
8. Falta de testes de autorização por workspace/role
9. Falta de testes de falha/timeout em AI/Open Finance
10. Bundle frontend e code splitting ainda precisam medição real
11. Fluxo de onboarding e dashboards com alto acoplamento de estado
12. Ausência de teste e2e real cobrindo login → onboarding → transações → AI
13. Sem verificação automatizada de CSP efetiva em deploy
14. Duplicidade de configs e timestamps temporários no frontend
15. Dependências e lockfiles com estado inconsistente no frontend
16. Sem política clara de retenção/expurgo de dados integrados
17. Sem saneamento forte para arquivos importados em todos os cenários
18. Sem hardening específico para abuse/cost control em IA

---

## Achados baixos

1. Documentação técnica desatualizada frente às correções recentes
2. Relatório anterior já não reflete integralmente o estado atual
3. Alguns testes/lints parecem mais estruturais do que comportamentais
4. Falta checklist de release único
5. Nomenclatura e responsabilidades ainda dispersas em partes do frontend
6. Duplicidade de configs de deploy reduz legibilidade operacional
7. Falta baseline formal de performance
8. Falta baseline formal de segurança por ambiente
9. Falta playbook de incidente para integrações críticas

---

## Validações executadas nesta reauditoria

### Backend
- `npm run build -w backend` ✅
- `npm test -w backend -- --run` ✅

### Frontend
- `npm run build -w frontend` ❌

Erro atual:

```text
Could not load d:\meu-contador\frontend\node_modules\react/jsx-runtime
```

**Conclusão:** há problema real de instalação/estrutura de dependências do frontend que precisa ser resolvido antes de considerar a aplicação validada para release.

---

## O que falta fazer agora

### Prioridade 0
1. Implementar refresh token + rotação + revogação
2. Migrar auth de `localStorage` para cookie HttpOnly
3. Definir e implementar proteção CSRF
4. Fechar payloads de AI com schemas rígidos e limites de tamanho
5. Reduzir/minimizar PII enviada ao provedor de IA
6. Restaurar build confiável do frontend

### Prioridade 1
1. Unificar `vercel.json` e `frontend/vercel.json`
2. Proteger `/docs` por ambiente
3. Criar audit log
4. Adicionar índices Prisma
5. Padronizar validação Zod em todas as rotas
6. Criar suíte de testes para auth, AI, user, investments, openFinance

### Prioridade 2
1. Medir bundle e code splitting real
2. Revisar SW/PWA e estratégia de cache
3. Testar parsers financeiros com corpus real de extratos
4. Criar E2E dos fluxos críticos
5. Instrumentar observabilidade das integrações

---

## Conclusão final

**O app melhorou**, mas ainda **faltam fundamentos de produção** em três frentes principais:

1. **Sessão/autenticação robusta**
2. **Privacidade/segurança em IA e integrações**
3. **Confiabilidade operacional do frontend e testes**

Se quiser, o próximo passo ideal é eu transformar esta reauditoria em um **plano de execução por fases**, e depois começar a implementar na ordem certa.