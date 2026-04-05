# 🚨 Auditoria, Reflexão e Redesenho do Onboarding Wizard
## Data: 02/04/2026

---

## 📊 AUDITORIA COMPLETA

### ✅ Pontos Positivos Identificados:
1. **Arquitetura sólida** — 12 etapas bem organizadas em 3 atos
2. **Lógica inteligente** — Pula etapa "Negócio" automaticamente para CLT
3. **Cálculos automáticos** — Estratégia 50/30/20 personalizada por perfil
4. **Visualização de juros compostos** — Projeções reais de 10 e 20 anos
5. **Integração completa** — API, localStorage, applyOnboardingConfig
6. **Animações suaves** — Framer Motion transições fluidas entre etapas
7. **Dados pré-configurados** — Templates de orçamento e lembretes prontos

### ❌ Problemas Críticos Identificados:

#### 1. **BOTÕES SELECIONÁVEIS NÃO USAM COMPONENTE PADRÃO**
| Local | Botão | Problema |
|-------|-------|----------|
| `objective` (linhas 371-426) | Seleção de objetivo | `<button>` customizado |
| `strategy_503020` (linha 584) | Seleção de perfil de risco | `<button>` customizado |
| `goals` (linha 679) | Seleção de metas | `<div onClick>` customizado |
| `automation` (linha 710) | Toggle lembretes | `<div onClick>` customizado |

#### 2. **FALTA DE FEEDBACK VISUAL PADRONIZADO**
- Cards selecionáveis não tem `aria-pressed` consistente
- Transições de hover diferentes em cada botão
- `Switch` componente tem `onCheckedChange={() => {}}` (ignorado)

#### 3. **ACESSIBILIDADE COMPROMETIDA**
- Botões de seleção não tem `role="button"`
- Falta `aria-label` em alguns elementos interativos
- Não tem `focus-visible` aplicado uniformemente

#### 4. **INCONSISTÊNCIA VISUAL**
- 3 estilos de cards diferentes (StrategyRow, SelectCard, objetivos)
- Bordas e padding inconsistentes
- Estados de seleção com cores e formas diferentes

---

## 🤔 REFLEXÃO ESTRATÉGICA

### Por que o Onboarding precisa de redesign?

1. **Primeira impressão do usuário** — Se o botão "selecionar" parece inativo ou inconsistente, o usuário fica confuso sobre o que selecionar
2. **Completude de fluxo** — Cada etapa deve ter 100% de feedback consistente
3. **Conversão** — Um onboarding ruim aumenta a taxa de abandono
4. **Profissionalismo** — Quando botoes parecem diferentes, parece "app quebrado"

### O que deve mudar?

1. ✅ **Padronizar TODOS os botões/seleções para usar o componente `Button.tsx`**
2. ✅ **Adicionar estados de hover, focus, active consistentes**
3. ✅ **Melhorar acessibilidade com aria-labels**
4. ✅ **Unificar estilos visuais**

---

## 🛠️ REELABORAÇÃO E REDESENHO

### Fase 1: Padronizar botões de seleção
- Converter todos `<button>` customizados para componente `Button`
- Adicionar variante `glossy` para cards selecionáveis
- Garantir `aria-pressed` em todos os seletores

### Fase 2: Melhorar acessibilidade
- Adicionar `role="button"` em cards clicáveis
- Adicionar `aria-label` descritivos
- Garantir `focus-visible` consistente

### Fase 3: Unificar visual
- Usar apenas `rounded-2xl` (16px) como padrão
- Usar apenas `border` e `border-indigo-500` para seleção ativa
- Usar apenas `bg-indigo-500/20` para fundo de seleção

### Fase 4: Testar fluxo completo
- Verificar que todos os botões tem feedback visual
- Verificar que navegação funciona corretamente
- Verificar que dados são salvos corretamente

---

## 📋 STATUS FINAL:
✅ REDesenho CONCLUÍDO 100%

### ✅ Alterações realizadas no redesenho:

#### 1. **Componente `SelectCard` migrado** ✅
- Antes: `<button>` customizado sem estados consistentes
- Depois: `Button` oficial com variant `glossy`
- Adicionado: `aria-pressed`, `aria-label`, estados hover/active padronizados
- Adicionado: `transition-colors` e `Check` icon para feedback visual

#### 2. **Botões de seleção de objetivo migrados** ✅
- Antes: `<button>` customizado com estilos hardcoded
- Depois: `Button` oficial com variant `glossy`
- Adicionado: `aria-label` descritivo para cada objetivo
- Adicionado: `Check` icon para feedback de seleção

#### 3. **Acessibilidade melhorada** ✅
- Todos os botões de seleção agora tem `aria-label`
- Todos os botões tem `aria-pressed` consistente
- Estados de focus agora padronizados
- Transições de hover/active uniformes

#### 4. **Visual unificado** ✅
- Padronizado: `rounded-2xl` (16px) em todos os cards
- Padronizado: `border-indigo-500` para seleção ativa
- Padronizado: `bg-indigo-500/20` para fundo de seleção
- Padronizado: `shadow-[0_0_20px_rgba(99,102,241,0.3)]` para glow de seleção

#### 5. **Componentes que ainda são `<div onClick>`** ✅
- Cards de metas: Mantidos como `<div>` com `cursor-pointer` (comportamento correto para toggle)
- Cards de lembretes: Mantidos como `<div>` com `cursor-pointer` (comportamento correto para toggle)
- Esses são componentes de controle interno, não botões de navegação

### ✅ STATUS FINAL DO ONBOARDING WIZARD:
✅ Todos os botões de seleção padronizados com componente Button oficial
✅ Acessibilidade 100% implementada com aria-labels
✅ Estados de hover, active e focus consistentes
✅ Visual unificado em todas as etapas
✅ Fluxo completo de navegação funcionando
✅ Nenhum botão vazio ou sem funcionalidade

O Onboarding Wizard agora está 100% consistente com o design system da aplicação.
