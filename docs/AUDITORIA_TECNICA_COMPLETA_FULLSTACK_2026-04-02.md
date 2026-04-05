## Auditoria Técnica Completa Full Stack — 2026-04-02

### Escopo
- Frontend
- Backend
- Segurança e resiliência
- Testes, qualidade e CI
- Build, configuração e deploy

### Resumo executivo
O projeto tem base moderna e ampla cobertura funcional, mas apresenta riscos relevantes de arquitetura, segurança, governança de configuração e estabilidade operacional. Os pontos mais críticos estão em: segredos expostos/versionados, superfícies HTTP sem proteção consistente, inconsistência entre múltiplas fontes de verdade no frontend, pipelines de CI/CD divergentes e deploy/configuração fragmentados.

---

## 1. Achados críticos (P0)

### 1.1 Segredos expostos no repositório
**Impacto:** crítico

Foram identificados indícios de segredos e credenciais versionados no repositório e em arquivos de ambiente locais/produtivos. Isso inclui risco sobre JWT secret, chaves Firebase, tokens de terceiros e credenciais de automações.

**Riscos:**
- comprometimento de autenticação
- acesso indevido a APIs externas
- vazamento de dados e abuso de infraestrutura

**Ações recomendadas:**
1. Rotacionar imediatamente todos os segredos.
2. Remover arquivos sensíveis do versionamento.
3. Reescrever histórico Git se necessário.
4. Padronizar `.env.example` por app e usar secret manager por ambiente.

### 1.2 Endpoints com proteção inconsistente no backend
**Impacto:** crítico

Há achados de rotas com schema declarando segurança, mas sem `preHandler` consistente de autenticação/autorização em algumas superfícies. Isso aumenta risco de acesso indevido, especialmente em rotas auxiliares e operacionais.

**Ações recomendadas:**
1. Revisar todas as rotas Fastify e exigir autenticação explícita.
2. Criar teste automatizado de acesso anônimo por rota sensível.
3. Centralizar autorização por recurso/workspace.

### 1.3 CI/CD divergente e parcialmente incompatível com o estado atual do projeto
**Impacto:** crítico

Foram identificados workflows múltiplos e divergentes, com mistura de npm/pnpm, scripts possivelmente obsoletos e mais de uma estratégia de deploy coexistindo.

**Riscos:**
- pipeline verde falso
- deploy inconsistente
- regressões escapando para produção

**Ações recomendadas:**
1. Eleger um único fluxo oficial de CI.
2. Eliminar workflows obsoletos.
3. Validar scripts reais do monorepo no CI.
4. Tornar build, test e lint obrigatórios antes de deploy.

---

## 2. Frontend — achados principais

### 2.1 Roteamento e navegação acoplados a estado interno
O app usa `BrowserRouter`, mas a navegação principal ainda depende de `activeTab` e renderização condicional. Isso reduz previsibilidade, enfraquece deep-linking, dificulta guardas, 404 e loaders padronizados.

**Recomendação:** migrar para rotas declarativas reais com `<Routes>`/data router e guards por área autenticada.

### 2.2 Múltiplas fontes de verdade para sessão/usuário/preferências
Há sinais de sobreposição entre `AuthContext`, storage local, refresh de sessão, preferências e hooks consumidores. Isso favorece race conditions e inconsistências temporárias na inicialização.

**Recomendação:**
- consolidar sessão e preferências em um único provider
- padronizar bootstrap da aplicação
- adotar cache/query layer consistente (ex.: TanStack Query)

### 2.3 Hooks CRUD duplicados e alto acoplamento com API
Os hooks de domínio parecem seguir padrões repetitivos e dispersos, com lógica de fetch, retry, transformação e estado espalhada.

**Recomendação:** criar camada comum de acesso a dados, invalidação, cancelamento e tratamento de erro.

### 2.4 Warnings estruturais e dívida de UX técnica
Foram observados warnings de React Router e animações com `blur(...)` inválido. Parte já foi mitigada localmente, mas indica falta de orçamento de qualidade contínua no frontend.

### 2.5 Tipagem fragmentada
Existem definições semelhantes em múltiplos arquivos (`frontend/src/types`, `shared/types.ts`, contratos compartilhados). Isso aumenta chance de drift entre frontend e backend.

**Recomendação:** unificar contratos de domínio e DTOs em uma única fonte compartilhada.

---

## 3. Backend — achados principais

### 3.1 Fluxos críticos sem atomicidade forte
O fluxo de onboarding executa múltiplas operações de escrita relacionadas. Mesmo com paralelização, sem transação abrangente há risco de estado parcial em falha intermediária.

**Recomendação:** encapsular onboarding e fluxos críticos em `db.$transaction` com estratégia de rollback e idempotência.

### 3.2 Multitenancy/workspace precisa de reforço
Há sinais de papel de workspace e escopos misturados. Isso requer auditoria fina de autorização por recurso, evitando que filtros por usuário sejam confundidos com filtros por workspace.

**Recomendação:** criar camada obrigatória de autorização contextual por workspace/recurso.

### 3.3 Tratamento de erro ainda heterogêneo
Rotas usam respostas e logs de erro com padrões diferentes. Isso impacta observabilidade, DX e resposta a incidentes.

**Recomendação:**
- handler global de erro
- envelope único de erro
- códigos padronizados
- correlação de request/trace em todos os logs

### 3.4 Soft delete e consistência de dados
Há indícios de combinação de soft delete com operações que assumem entidades vivas. Isso costuma gerar bugs silenciosos, exports incorretos e relatórios inconsistentes.

**Recomendação:** padronizar política de exclusão e filtros default no acesso a dados.

### 3.5 Dependência de fallback menos seguro em autenticação
Foi reportado fallback operacional de autenticação Google via validação externa quando Firebase Admin não está plenamente configurado. Em produção, o correto é falhar fechado.

---

## 4. Segurança e resiliência

### 4.1 Segredos, tokens e ambientes
Ponto mais urgente da auditoria. A gestão de segredos precisa ser tratada como incidente de segurança até prova em contrário.

### 4.2 CORS/CSRF/webhooks
Há indícios de superfícies com políticas permissivas demais e validação insuficiente em webhook/rotas auxiliares.

**Recomendação:**
- revisar CORS por ambiente
- exigir assinatura/HMAC em webhooks
- nunca usar `Allow-Origin: *` com credenciais
- garantir CSRF somente onde o modelo de autenticação exige

### 4.3 Logs sensíveis
Revisar logs de autenticação, dados de usuário, payloads externos e traces de erro para evitar exposição de PII e segredos.

### 4.4 Dependências vulneráveis
O `npm install` já apontou 58 vulnerabilidades. Nem todas serão exploráveis, mas o projeto precisa de triagem formal.

**Recomendação:**
1. Rodar `npm audit` e classificar por explorabilidade.
2. Atualizar dependências críticas.
3. Adotar rotina periódica de patching.

---

## 5. Testes, qualidade e CI

### 5.1 Base existente, mas cobertura desigual
Existem testes backend, frontend e E2E, porém com maturidade desigual e risco de falsa confiança.

### 5.2 E2E frágeis
Os testes E2E parecem depender de fluxos reais, login e condições de ambiente que podem oscilar. Isso reduz confiança em regressões.

**Recomendação:**
- criar fixtures determinísticas
- isolar ambiente de teste
- evitar dependência de terceiros reais

### 5.3 Falta de gates únicos
Sem uma esteira única e confiável, o projeto pode “parecer testado” sem estar realmente protegido.

**Pipeline mínimo recomendado:**
1. typecheck
2. lint
3. testes unitários frontend/backend
4. build frontend/backend
5. smoke/e2e críticos

---

## 6. Build, configuração e deploy

### 6.1 Estratégia de deploy fragmentada
Há sinais de coexistência entre Render, Vercel, Firebase e configurações locais. Isso eleva muito o risco operacional.

**Recomendação:** definir plataforma oficial por componente:
- frontend oficial
- backend oficial
- banco oficial
- observabilidade oficial

### 6.2 Configuração ambiental pouco governada
Variáveis obrigatórias, opcionais e degradadas não parecem estar formalizadas com validação central única.

**Recomendação:**
- schema de env no boot
- fail fast para produção
- documentação única de ambientes

### 6.3 PWA/service worker
Há cuidados em dev para limpar SW/cache, o que é positivo, mas a estratégia PWA precisa de testes específicos para evitar comportamento divergente entre dev/prod.

---

## 7. Forças do projeto

- stack moderna e produtiva
- backend com Fastify + Prisma + Zod
- cobertura de domínio ampla
- sinais de preocupação com monitoramento, error boundary e PWA
- existência de testes automatizados em múltiplas camadas
- boa velocidade local após startup

---

## 8. Plano de ação priorizado

### Fase 1 — 24/48h
1. Rotacionar segredos e remover exposições.
2. Revisar rotas sem autenticação consistente.
3. Unificar CI oficial.
4. Validar fallback de auth para falha fechada em produção.

### Fase 2 — 3 a 7 dias
1. Colocar onboarding e fluxos críticos em transações.
2. Consolidar contratos/tipos compartilhados.
3. Padronizar error handling/logging.
4. Revisar CORS/CSRF/webhooks.

### Fase 3 — 1 a 3 semanas
1. Refatorar roteamento frontend para modelo declarativo.
2. Centralizar data fetching/cache.
3. Fortalecer suíte E2E com fixtures determinísticas.
4. Simplificar estratégia de deploy/plataforma.

---

## 9. Nota técnica geral

### Maturidade atual estimada
- **Produto/escopo funcional:** alta
- **Arquitetura frontend:** média
- **Arquitetura backend:** média
- **Segurança operacional:** baixa a média
- **Confiabilidade de CI/CD:** média-baixa
- **Prontidão para escala/manutenção:** média

### Conclusão
O sistema tem potencial forte e escopo maduro, mas precisa de uma rodada séria de endurecimento técnico. O maior risco não é “código ruim”, e sim a combinação de crescimento rápido com governança incompleta em segurança, configuração e consistência arquitetural.