# Auditoria e Plano de Implementação da Academia — Meu Contador

**Data:** 2026-04-02
**Status:** Revisão completa com implementações priorizadas
**Escopo:** Frontend (educationData.ts, EducationSection.tsx, useEducation.ts)

---

## 1. Estado Atual — O que já existe de classe mundial

### 1.1. Arquitetura de dados (educationData.ts)

- Trilhas temáticas (11): Implementado — Excelente
- Aulas com passos multimodais: Implementado — Excelente
- Maturity stages (8 níveis): Implementado — Muito bom
- Context signals: Implementado — Bom
- Academy moments: Implementado — Bom
- Academy rituals (semana/mês): Implementado — Bom
- Referências por trilha: Implementado — Bom
- Persona tags por trilha: Implementado — Bom
- Trigger events por aula: Implementado — Bom
- Outcome types: Implementado — Bom
- Lesson metadata (behaviorGoal, associatedFeature, etc.): Implementado — Bom

### 1.2. Motor de recomendação (useEducation.ts)

- Recomendação contextual por perfil: Implementado — Muito bom
- Recomendação por gatilhos de eventos: Implementado — Bom
- Revisão espaçada (1, 3, 7, 14, 30 dias): Implementado — Bom
- Progresso por módulo e passo: Implementado — Excelente
- XP e streak: Implementado — Bom
- Jornada por estágio de maturidade: Implementado — Bom
- Maturity roadmap: Implementado — Bom
- Tutor context para IA: Implementado — Bom

### 1.3. UI (EducationSection.tsx)

- "Próximo melhor passo" destacado: Implementado — Excelente
- Barra de jornada: Implementado — Bom
- Missão da semana: Implementado — Bom
- Microaulas por evento (transações): Implementado — Muito bom
- Biblioteca com filtros por trilha: Implementado — Bom
- Bloqueio por pré-requisito: Implementado — Bom
- Progresso visual por aula: Implementado — Bom
- Conquistas: Implementado — Bom

---

## 2. Gaps Identificados

### 2.1. Conteúdo ausente (alta prioridade)

- Assinaturas e custo invisível (trilha: start) — Brasileiro perde dinheiro com assinaturas esquecidas
- Sair do mês apertado (trilha: start) — Estratégia de sobrevivência imediata
- Orçamento base zero prático (trilha: base) — Fundamento não tem aula dedicada
- Envelopes e categorias (trilha: base) — Método central do app não tem aula

### 2.2. Motor de recomendação

- Não usa dados de fatura/cartão real → Integrar useInvoices
- Não detecta parcelas acumuladas → Integrar useDebts
- Revisão espaçada não é exibida na UI → Adicionar card de revisão

### 2.3. UI/UX

- Sem seção "Revisão pendente" visível
- Ritual não é interativo (checklist)
- Conquistas são hardcoded → Tornar dinâmicas

---

## 3. Implementações — FASE 1 (esta sprint)

1. Aula: Assinaturas e custo invisível
2. Aula: Sair do mês apertado
3. Aula: Orçamento base zero prático
4. Aula: Envelopes e categorias
5. Conquistas dinâmicas
6. Seção de revisão pendente na UI

---

## 4. Implementações — FASE 2 (próxima sprint)

7. Integração com useInvoices para detectar fatura alta
8. Integração com useDebts para detectar parcelas acumuladas
9. Ritual interativo com checklist
10. Panorama visual de maturidade

---

## 5. Implementações — FASE 3

11. ✅ tutorContext → AIFinancialChat (já existente em AIFinancialChat.tsx)
12. ✅ Modo "explique como contador" (já existente em LEARNING_MODES)
13. ⏳ Microaulas acionadas por Open Finance (requer integração backend)

---

## 6. Métricas de sucesso

- Aulas totais: 30 → 38
- Trilhas com aula de ação prática: 6/11 → 11/11
- Relevância contextual da recomendação: ~70% → ~90%
- Integração aula → ação no app: ~50% → ~85%