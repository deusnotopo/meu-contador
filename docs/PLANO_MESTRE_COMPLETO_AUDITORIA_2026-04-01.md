% Plano Mestre de Execução + Auditoria Técnica Profunda — Meu Contador

> Status desta versão: **reauditado contra o código em 2026-04-01**.
> Observação: o plano original estava bem direcionado, mas alguns itens antes marcados como “já avançados” foram reclassificados abaixo para refletir apenas o que está efetivamente comprovado por código e testes atuais.

## 1. Resumo executivo

Este documento consolida:

- o plano de execução por fases
- a reauditoria técnica profunda
- o status real de evolução do app
- a ordem recomendada para concluir o produto com segurança, estabilidade e capacidade de escalar

Objetivo final:

1. fechar riscos críticos de segurança e sessão
2. estabilizar frontend/backend/build/deploy
3. tornar IA/Open Finance auditáveis e minimizados
4. escalar banco e performance com observabilidade
5. elevar qualidade de release com testes e E2E

---

## 2. Estado consolidado atual

### Já avançado

- **Fase 1**: sessão e auth endurecidas parcialmente com expiração curta, refresh flow e cookies
- **Fase 2**: schemas Zod/Fastify padronizados nas rotas críticas, paginação e remoção de `z.any()`
- **Fase 3**: minimização/redaction em IA e hardening de Open Finance/OFX
- **Fase 4**: índices Prisma, migration, audit log persistente e retenção inicial
- **Fase 5**: cliente HTTP centralizado, PWA mais previsível, bundle medido e code splitting aplicado

### Validado por código nesta reauditoria

- **Sessão/Auth**: existe emissão de access token curto + refresh token opaco + CSRF por cookie + rotação em `/auth/refresh`
- **Hardening API**: `Fastify + Zod` aplicados nas rotas principais com schemas de body/query/params/response
- **IA**: há redaction, limitação de payload, rate limit por rota, fallback resiliente e audit log sem PII crua
- **Open Finance**: webhook protegido por shared secret e/ou HMAC, limite de payload, skew de timestamp e trilha de auditoria
- **PWA/SW**: denylist de rotas sensíveis, cache previsível e estratégia explícita para update automático

### Ainda pendente / incompleto

- **Fase 0**: baseline reproduzível e unificação completa de deploy ainda precisam revisão final
- **Fase 6**: frontend estabilizado, backend ainda precisa fechar isolamento determinístico da suíte
- **Cobertura backend**: ainda não há evidência de baseline de release consolidada via suíte automatizada robusta
- **E2E**: os fluxos críticos seguem majoritariamente planejados, não comprovados de ponta a ponta

---

## 2.1 Evidências objetivas da reauditoria

### Execução real validada em 2026-04-01

- `npm run test:run -w backend` ✅ **passou** (após ampliação: 7+ arquivos cobertos)
- `npm run test -w frontend -- --run` ✅ **passou** — 11 arquivos / 34 testes
- `npm run build -w backend` ✅ **passou**
- `npm run build -w frontend` ✅ **passou**
- `npm run test:coverage -w backend` ❌ **falha parcial por threshold**

#### Resultado objetivo de coverage backend

- `lines`: **36.19%** vs threshold **60%**
- `statements`: **36.19%** vs threshold **60%**
- `functions`: **22.22%** vs threshold **60%**
- `branches`: **32.85%** vs threshold **45%**

#### Leitura executiva da baseline

- o projeto **compila** em frontend e backend
- a suíte atual **passa**, mas ainda é pequena para sustentar release madura
- o principal bloqueio técnico imediato permanece sendo **coverage backend insuficiente**

### Backend / build / testes

- `backend/package.json` contém `build`, `test:run` e `test:coverage`
- `backend/vitest.config.ts` usa execução serial (`fileParallelism: false`) e thresholds de cobertura ainda modestos: `60/60/45/60`
- `backend/src/test/setup.ts` ainda cria tabelas manualmente (`Session`, `AuditLog`), indicando que o isolamento de testes/banco ainda não está totalmente estabilizado por migration/fixture determinística
- `backend/src/routes/auth.test.ts` cobre apenas registro e login inválido
- `backend/src/routes/openFinance.test.ts` cobre apenas obtenção de connect token

### Frontend / build / PWA

- `frontend/package.json` contém `build`, `test`, `test:coverage` e `analyze`
- `frontend/src/sw.js` já separa APIs sensíveis via `NetworkOnly` (`/auth/`, `/api/ai-proxy`, `/open-finance/`, `/api/push/`)
- `frontend/src/context/AuthContext.tsx` centraliza restauração de sessão, sincronização e estado auth

### Segurança operacional ainda não fechada

- `backend/src/app.ts` publica `/docs` sem proteção condicional por ambiente/segredo
- `backend/src/routes/auth.ts` mantém `/auth/upgrade` bloqueado com `403`, confirmando que a trilha real de entitlement/PRO ainda não foi concluída
- rotas dev de auth existem em `development`, protegidas por header secreto, mas ainda merecem revisão operacional final

### E2E

- `e2e/README.md` confirma fluxos planejados, porém não comprova implementação completa de login/onboarding/transação/orçamento/IA/importação/Open Finance

---

## 3. Auditoria técnica profunda por domínio

### 3.1 Segurança e autenticação

#### Status
- melhorado de forma importante
- ainda requer fechamento fino de testes e governança operacional
- reauditoria confirma implementação funcional de rotação, cookies e CSRF, mas **não** confirma cobertura suficiente para chamar o domínio de “fechado”

#### Riscos residuais
- política de sessão por dispositivo ainda precisa cobertura total de testes
- revogação/expiração precisa validação em cenários reais e automatizados
- fluxo de entitlement/PRO ainda não é uma trilha de negócio madura
- `/docs` segue exposto sem proteção condicional explícita

#### Ações finais
- fechar testes backend de auth e sessão
- testar refresh/rotação/revogação em E2E
- documentar matriz de sessão: login, refresh, logout, expiração, revogação
- proteger `/docs` e revisar rotas dev/admin por ambiente + segredo

---

### 3.2 Hardening de API

#### Status
- estrutura crítica padronizada
- rotas críticas com body/params/query/response
- paginação aplicada nas listagens principais
- reauditoria confirma boa evolução estrutural, porém ainda com lacuna clara em testes negativos e rotas auxiliares

#### Riscos residuais
- garantir cobertura 100% por testes sobre validação e erros
- revisar rotas auxiliares/dev para manter o mesmo padrão

#### Ações finais
- adicionar testes de erro/edge cases por rota
- auditar rotas de desenvolvimento e rotas menos usadas

---

### 3.3 IA e privacidade

#### Status
- prompt minimizado
- redaction implementado
- limites de tamanho/frequência adicionados
- observabilidade sem PII crua iniciada
- fallback resiliente confirmado em código quando provedor falha ou chave não está configurada

#### Riscos residuais
- ainda falta cobertura automatizada forte para falhas de IA
- falta matriz formal LGPD/finalidade por campo enviado ao modelo
- falta política explícita de retenção de eventos sensíveis de IA no nível de produto
- ainda não há evidência de suíte cobrindo rate limit, prompt oversized, provider down e enforcement PRO

#### Ações finais
- testes backend para payload gigante, rate limit, fallback e erro do provedor
- documento de governança de dados de IA
- tabela de “campo original → transformação → destino → retenção”

---

### 3.4 Open Finance e extratos

#### Status
- webhook endurecido
- payload limitado
- logs mascarados
- parser OFX endurecido
- parser frontend com limites e sanitização
- autenticação do webhook por shared secret/HMAC confirmada em código

#### Riscos residuais
- falta corpus real de validação para OFX/CSV/PDF
- falta suíte de regressão por banco/formato
- falta testes de timeout/indisponibilidade do provedor
- testes atuais de Open Finance ainda são superficiais diante do risco operacional do domínio

#### Ações finais
- montar corpus real anonimizado de extratos
- criar suite de parsing por fixture
- criar matriz de compatibilidade por banco/origem

---

### 3.5 Banco, integridade e performance

#### Status
- índices relevantes adicionados
- migration criada
- audit log persistente criado
- retenção/expurgo inicial implementados

#### Riscos residuais
- N+1 e performance ainda precisam medição real com volume
- cache atual é básico e precisa estratégia por domínio
- falta baseline de queries críticas e latência

#### Ações finais
- medir queries principais com volume real/sintético
- definir cache por recurso: token Open Finance, dashboards, agregações, listas
- gerar relatório de queries críticas por rota

---

### 3.6 Frontend, PWA e arquitetura

#### Status
- auth/api centralizados
- leituras espalhadas de token reduzidas
- SW ajustado para cache previsível
- bundle medido
- splitting por domínio aplicado
- denylist de APIs sensíveis no service worker confirmada em código

#### Riscos residuais
- chunks `firebase`, `react-vendor` e `charts` ainda pesados
- acoplamento de alguns hooks/contextos ainda merece refino
- PWA precisa testes funcionais e de atualização offline
- resta comprovar em teste real o ciclo de update do SW e comportamento offline/online

#### Ações finais
- revisar dependências e peso de `firebase` e `recharts`
- testar ciclo de update do service worker
- revisar acoplamento final onboarding/dashboard/AI via boundaries claros

---

### 3.7 Qualidade, testes e release

#### Status
- thresholds definidos
- frontend testado e estável
- base E2E criada
- backend parcialmente coberto
- reauditoria confirma que backend ainda está abaixo do nível de evidência necessário para baseline madura de release

#### Riscos residuais
- backend ainda com instabilidade na suíte por isolamento de banco/fixtures
- coverage backend ainda não consolidada como baseline de release
- E2E ainda não executa fluxos críticos de ponta a ponta
- testes backend atuais ainda cobrem pouco os cenários de erro e segurança dos domínios mais sensíveis

#### Ações finais
- estabilizar banco de testes backend
- concluir coverage backend
- implementar fluxos E2E mínimos

---

## 4. Plano mestre para completar o app

## Etapa A — Fechar qualidade mínima de release

### Objetivo
parar regressão e tornar entrega confiável

### Checklist
- [ ] estabilizar suíte backend
- [ ] rodar `backend test:run`
- [ ] rodar `backend test:coverage`
- [ ] validar thresholds definidos
- [ ] manter `frontend test --run` verde
- [ ] validar `frontend build` e `backend build`
- [ ] remover dependência de criação manual de tabela no setup de testes backend
- [ ] ampliar testes de auth, IA, Open Finance e rotas auxiliares com cenários negativos

### Saída esperada
- backend build OK
- frontend build OK
- backend tests OK
- frontend tests OK

---

## Etapa B — Fechar governança de segurança e dados

### Objetivo
ter postura de produção madura

### Checklist
- [ ] documento final de sessão e autenticação
- [ ] documento LGPD/minimização IA/Open Finance
- [ ] política de retenção por tipo de dado
- [ ] matriz de observabilidade e auditoria
- [ ] proteção condicional de docs/admin/dev endpoints
- [ ] revisar segredos/flags operacionais de webhook e devtools por ambiente

### Saída esperada
- política operacional documentada
- trilha auditável por domínio sensível

---

## Etapa C — Escala e confiabilidade operacional

### Objetivo
aguentar crescimento real de dados e uso

### Checklist
- [ ] benchmark de queries críticas
- [ ] tuning de índices restantes
- [ ] baseline de performance frontend
- [ ] revisão de bundle pesado
- [ ] testes de cache e SW update
- [ ] simulação de falha de integrações externas
- [ ] medir impacto real de `firebase`, `recharts` e chunks de vendor após splitting atual

### Saída esperada
- performance previsível
- app resiliente a falhas externas

---

## Etapa D — Cobertura funcional completa

### Objetivo
garantir operação real do produto

### Fluxos mínimos E2E
- [ ] login
- [ ] onboarding
- [ ] criação de transação
- [ ] criação/edição de orçamento
- [ ] chamada de IA
- [ ] importação de extrato
- [ ] fluxo Open Finance
- [ ] refresh/rotação/logout/expiração de sessão

### Saída esperada
- regressão crítica coberta de ponta a ponta

---

## 5. Roadmap executivo recomendado

### Sprint 1 — Fechamento técnico do que já foi construído
- estabilizar backend tests
- consolidar coverage backend
- confirmar build/test/release baseline
- fechar cenários negativos de auth/IA/Open Finance antes de qualquer nova feature

### Sprint 2 — Governança e segurança operacional
- políticas de sessão
- políticas LGPD/IA/Open Finance
- hardening final de docs/admin/dev routes
- fechar matriz operacional de segredos, retenção e auditoria por domínio sensível

### Sprint 3 — Performance e escala
- benchmark Prisma
- tuning de consultas
- otimização de chunks críticos
- revisão de SW/cache/update

### Sprint 4 — E2E e readiness de produção
- automação dos fluxos críticos
- smoke suite de deploy
- checklist final de release

---

## 6. Critério de pronto do app

O app pode ser considerado **tecnicamente pronto para produção madura** quando todos os itens abaixo forem verdadeiros:

- [ ] backend build OK
- [ ] frontend build OK
- [ ] backend tests OK
- [ ] frontend tests OK
- [ ] coverage mínima validada
- [ ] E2E dos fluxos críticos implementados
- [ ] sessão segura com rotação/revogação validada
- [ ] IA/Open Finance com minimização e auditoria formalizadas
- [ ] banco otimizado e queries críticas medidas
- [ ] PWA previsível e estratégia de cache validada
- [ ] deploy/config unificados e reproduzíveis

---

## 7. Recomendação final

O caminho mais eficiente agora **não é abrir novas features**, e sim concluir o ciclo de confiabilidade:

1. fechar testes backend
2. consolidar coverage e E2E
3. formalizar governança de segurança/privacidade
4. rodar benchmark de banco/performance
5. só depois retomar expansão funcional

Esse é o caminho com melhor custo/benefício para transformar o Meu Contador de app promissor em produto confiável de produção.

---

## 8. Conclusão validada por código

O diagnóstico estratégico original estava correto: **o gargalo agora não é feature, é confiabilidade**. A reauditoria mostrou que existe boa evolução estrutural em segurança, schemas, IA, Open Finance e PWA, porém a maior parte da confiança ainda está no código implementado — não em evidência automatizada suficiente de build, cobertura, regressão e E2E.

Portanto, a priorização recomendada fica oficialmente consolidada assim:

1. **Etapa A primeiro** — estabilizar backend tests, coverage e baseline de release
2. **Etapa B em seguida** — formalizar governança e fechar superfícies expostas (`/docs`, rotas dev/admin, retenção, LGPD)
3. **Etapa C depois** — medir performance real de banco, cache, bundle e SW
4. **Etapa D por último** — provar os fluxos críticos com E2E ponta a ponta

Enquanto esses itens não forem concluídos, o app pode ser considerado **tecnicamente avançado, porém ainda não maduro para produção plena**.