# Plano de Execução por Fases — Meu Contador

## Fase 0 — Estabilização imediata
**Objetivo:** parar riscos críticos e restaurar capacidade de entrega.

### Itens
1. Corrigir build do frontend (`react/jsx-runtime` / node_modules / lockfile / workspace)
2. Unificar estratégia de instalação do monorepo
3. Congelar baseline técnica com build/test/documentação reproduzível
4. Unificar `vercel.json` e `frontend/vercel.json`

### Entregáveis
- `npm run build -w frontend` funcionando
- build raiz reproduzível
- configuração única de deploy frontend

### Critério de saída
- backend build OK
- frontend build OK
- backend tests OK

---

## Fase 1 — Segurança de sessão e autenticação
**Objetivo:** fechar a principal superfície de comprometimento de conta.

### Itens
1. Implementar refresh token
2. Implementar rotação de refresh token
3. Implementar revogação de sessão por dispositivo
4. Adicionar `jti`/store de sessão
5. Migrar auth de `localStorage` para cookie `HttpOnly`
6. Implementar logout real
7. Definir política de expiração de sessão
8. Implementar proteção CSRF

### Arquivos-alvo
- `backend/src/app.ts`
- `backend/src/routes/auth.ts`
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/lib/api.ts`

### Critério de saída
- access token curto
- refresh token rotativo
- sessão revogável
- sem token JWT no `localStorage`

---

## Fase 2 — Hardening de API e validação
**Objetivo:** eliminar entradas permissivas e inconsistência entre rotas.

### Itens
1. Padronizar Zod/Fastify schema em todas as rotas
2. Validar `body`, `params`, `querystring` e `response`
3. Remover `z.any()` de payloads críticos
4. Definir limites de tamanho por payload
5. Padronizar tratamento de erro
6. Revisar paginação e limites de listagem

### Arquivos-alvo
- `backend/src/routes/*.ts`
- `backend/src/routes/ai.ts`
- `backend/src/routes/openFinance.ts`

### Critério de saída
- 100% das rotas críticas com schema
- endpoints de listagem com paginação/limit

---

## Fase 3 — Privacidade e segurança de IA/Open Finance
**Objetivo:** reduzir risco regulatório, vazamento e custo.

### Itens
1. Minimizar dados enviados à IA
2. Remover PII desnecessária do prompt
3. Criar política de redaction/mascaramento
4. Limitar tamanho e frequência de requisições AI
5. Criar logs/auditoria de chamadas sensíveis sem PII crua
6. Revisar validação e robustez de Open Finance
7. Revisar parser OFX/CSV/PDF com corpus real

### Arquivos-alvo
- `backend/src/routes/ai.ts`
- `backend/src/routes/openFinance.ts`
- `backend/src/lib/ofx-parser.ts`
- `frontend/src/lib/statements/*`

### Critério de saída
- prompts minimizados
- payload AI com schema rígido
- trilha de observabilidade sem dados sensíveis crus

---

## Fase 4 — Banco, performance e integridade
**Objetivo:** sustentar crescimento de dados sem degradação.

### Itens
1. Adicionar índices Prisma para queries reais
2. Revisar N+1 queries
3. Padronizar paginação
4. Planejar cache de dados frequentes
5. Criar audit log persistente
6. Revisar retenção/expurgo de dados sensíveis

### Arquivos-alvo
- `backend/prisma/schema.prisma`
- serviços e rotas com listagens financeiras

### Critério de saída
- índices adicionados via migration
- queries críticas revisadas
- audit log operacional

---

## Fase 5 — Frontend confiável, PWA e arquitetura
**Objetivo:** melhorar robustez operacional e UX técnica.

### Itens
1. Centralizar cliente HTTP e auth state
2. Remover leituras espalhadas de token
3. Revisar service worker e estratégia de cache
4. Medir bundle real
5. Aplicar code splitting nos módulos pesados
6. Reduzir acoplamento de onboarding/dashboard/AI

### Arquivos-alvo
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/sw.js`
- `frontend/vite.config.ts`

### Critério de saída
- PWA previsível
- build estável
- bundle medido e otimizado

---

## Fase 6 — Testes e qualidade de release
**Objetivo:** impedir regressões.

### Itens
1. Cobrir auth backend
2. Cobrir AI/Open Finance backend
3. Cobrir user/preferences/investments
4. Reescrever testes frontend superficiais
5. Adicionar thresholds de coverage
6. Criar E2E dos fluxos críticos

### Fluxos mínimos E2E
- login
- onboarding
- criação de transação
- orçamento
- chamada de IA
- importação de extrato

### Critério de saída
- coverage mínima definida
- testes críticos automatizados

---

## Ordem recomendada de execução
1. **Fase 0**
2. **Fase 1**
3. **Fase 2**
4. **Fase 3**
5. **Fase 4**
6. **Fase 5**
7. **Fase 6**

---

## Sequência prática imediata

### Sprint 1
- corrigir build frontend
- unificar config de deploy frontend
- mapear fluxo atual de auth

### Sprint 2
- refresh token + cookies HttpOnly + logout real
- CSRF
- centralização do cliente de auth/API

### Sprint 3
- schemas completos nas rotas críticas
- hardening de AI/Open Finance
- limites de payload

### Sprint 4
- índices Prisma + audit log
- paginação + testes backend críticos

### Sprint 5
- PWA/cache/bundle
- testes frontend reais + E2E

---

## Definição de pronto final
- backend build OK
- frontend build OK
- testes críticos backend OK
- auth baseada em sessão segura
- rotas críticas validadas por schema
- AI/Open Finance com minimização de dados
- deploy unificado e previsível
- cobertura e2e mínima dos fluxos principais