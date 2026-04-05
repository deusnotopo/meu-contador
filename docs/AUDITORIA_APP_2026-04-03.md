# Auditoria Completa do App — 2026-04-03

## Escopo
- Frontend React/Vite/TypeScript
- Backend Fastify/Prisma
- CI/CD
- Testes e qualidade
- Observabilidade e segurança

## Resumo Executivo
O app tem base sólida, build funcional e boas práticas importantes no backend, mas há inconsistências estruturais que reduzem confiabilidade operacional. O principal problema é o desalinhamento entre banco de dados, runtime e pipeline. Também existem falhas de tooling que enfraquecem a auditoria contínua, como lint quebrado e scripts raiz incompletos.

## Verificações Executadas
- `npm run build` ✅
- `npm run test -- --run` ❌ sem script root `test`
- `npm run lint -w frontend` ❌ comando incompatível com `eslint.config.js`

## Achados Críticos

### 1. Inconsistência de banco de dados
**Evidência**
- `backend/prisma/schema.prisma`: `provider = "sqlite"`
- `backend/src/lib/db.ts`: consulta `pg_stat_activity` (PostgreSQL)
- `.github/workflows/ci.yml`: sobe PostgreSQL no CI

**Impacto**
- Ambiente local, CI e runtime podem se comportar de forma diferente
- Health checks e métricas de pool podem quebrar silenciosamente
- Alto risco de bugs ambientais e deploy inconsistente

**Prioridade**
- Crítica

**Ação recomendada**
- Escolher definitivamente SQLite ou PostgreSQL
- Alinhar schema Prisma, consultas SQL específicas e CI

## Achados Altos

### 2. Lint do frontend quebrado
**Evidência**
- `npm run lint -w frontend` falha por uso de `--ext` com `eslint.config.js`

**Impacto**
- CI não valida estilo/qualidade como esperado
- Problemas podem entrar em produção

**Ação recomendada**
- Ajustar script para sintaxe compatível com Flat Config do ESLint

### 3. Scripts raiz incompletos
**Evidência**
- `package.json` raiz não possui script `test`
- Execução `npm run test -- --run` falha

**Impacto**
- Auditoria automatizada incompleta
- Experiência de manutenção pior

**Ação recomendada**
- Criar scripts root: `test`, `lint`, `typecheck`, `audit`

### 4. Chunking circular no frontend
**Evidência**
- Build reporta ciclos entre `react-vendor`, `charts`, `ai-module`, `ui-vendor`

**Impacto**
- Piora previsibilidade do bundle
- Pode afetar cache, performance e manutenção

**Ação recomendada**
- Revisar `manualChunks` e dependências cruzadas
- Isolar módulo de IA e gráficos

### 5. Mistura de import dinâmico e estático em `frontend/src/lib/api.ts`
**Impacto**
- Dynamic import perde benefício de split real
- Bundle maior que o necessário

## Achados Médios

### 6. `AuthContext` com responsabilidade excessiva
**Evidência**
- `frontend/src/context/AuthContext.tsx` concentra auth, preferências, sync, analytics, tema e retry

**Impacto**
- Alto acoplamento
- Testabilidade baixa
- Risco maior de regressão

**Ação recomendada**
- Separar em hooks/serviços: sessão, preferências, sync, analytics

### 7. README desatualizado em relação à stack real
**Evidência**
- README cita Express/Firebase DB, enquanto backend usa Fastify/Prisma

**Impacto**
- Onboarding incorreto
- Documentação perde credibilidade

### 8. CI mascara problemas reais
**Evidência**
- `continue-on-error: true` em lint, e2e e audit de segurança

**Impacto**
- Pipeline verde com problemas relevantes

**Ação recomendada**
- Manter tolerância só onde houver justificativa clara
- Separar jobs obrigatórios e informativos

### 9. Observabilidade ainda básica
**Evidência**
- `frontend/src/lib/monitoring.ts` coleta Web Vitals básicos e usa console em dev

**Impacto**
- Pouca profundidade para incidentes reais

**Ação recomendada**
- Adicionar correlação de sessão/usuário, métricas customizadas e tracing

## Pontos Positivos
- Build de produção passa
- Backend com validação fail-fast de ambiente
- Uso de Helmet, CORS, rate limit, CSRF e JWT
- Error handler centralizado com suporte a Zod
- CI existente com backend, frontend, e2e e security
- Projeto possui documentação ampla e organização razoável

## Riscos por Área

### Segurança
- Boa base HTTP/security no backend
- Risco principal: pipeline permissivo e possíveis MCPs/integrações exigindo revisão operacional

### Performance
- Build funcional, mas bundles grandes e chunking circular
- Firebase e módulos AI concentram peso alto

### Confiabilidade
- Principal fragilidade é infraestrutura de dados inconsistente

### Manutenibilidade
- `AuthContext` muito grande
- Documentação técnica não totalmente alinhada ao código

## Prioridades Imediatas
1. Unificar banco (SQLite vs PostgreSQL)
2. Corrigir lint do frontend
3. Criar scripts root de qualidade/teste
4. Remover `continue-on-error` onde não fizer sentido
5. Refatorar `AuthContext`
6. Revisar chunking e imports do frontend
7. Atualizar README e docs principais

## Nota Geral
- **Arquitetura:** 7/10
- **Qualidade operacional:** 5.5/10
- **Segurança base:** 7.5/10
- **Confiabilidade de pipeline:** 5/10
- **Prontidão para escala:** 6/10

## Conclusão
O app está funcional e tem boa fundação, mas ainda não está completamente coerente em termos operacionais. A maior urgência não é feature, e sim consistência de ambiente, tooling e governança técnica. Corrigindo esses pontos, a plataforma sobe de nível rapidamente.
