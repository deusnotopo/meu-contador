# Auditoria de UI e UX — Meu Contador (03 Abr 2026)

## 🎯 Resumo Executivo
A interface do Meu Contador apresenta um nível de qualidade visual **Premium** altíssimo, fazendo excelente uso de Glassmorphism, micro-animações (como Dynamic Island e barras de progresso), paletas de cores modernas e componentes responsivos na medida. A identidade "Mobile First" encapsulada num *"Phone Shell"* confere um charme profissional imenso ao app web. 

A Experiência do Usuário (UX) durante os fluxos também é admirável: animações ricas no *Onboarding* (`framer-motion`), gráficos sofisticados (`recharts`) e padronização (como numpads digitais para inputs de valores). 

Entretanto, **a arquitetura do código que sustenta a UI (a "cola" entre UX e lógica técnica)** está sobrecarregada, o que pode cobrar um preço a médio prazo em manutenção e performance de renderização.

---

## ✅ Pontos Fortes e Destaques (O que manter)

1. **Excelência no Design System (`index.css`)**
   - O uso consistente de variáveis CSS (`--t1`, `--bg3`, `--glass`) permite temas flexíveis com um esforço baixíssimo.
   - Micro-interações valiosas em elementos corriqueiros, como `.tab-pip`, `hero::before` e a Dynamic Island (`.di`), estimulam o engajamento emocional do usuário.

2. **Fluxo de Onboarding (O "Fator Uau")**
   - O `OnboardingWizard.tsx` possui transições requintadas usando `AnimatePresence`. Isso diminui muito a taxa de rejeição natural que os usuários possuem de preencher dados chatos como renda ou gastos.
   - Divisão excelente entre Atos (Identity, Income, Strategy) ajuda o fluxo cognitivo.

3. **Cuidado com Acessibilidade (a11y) em Pontos Chaves**
   - No `LaunchScreen.tsx`, ao escolher Categorias de Gasto/Receita, os modais exibem claramente marcações WAI-ARIA, como `role="radiogroup"`, `role="radio"`, `aria-checked` e `aria-label`. 
   - Elementos em botões têm suporte satisfatório a foco e tabs de navegação.

---

## 🛠 Oportunidades de Melhoria (Gargalos)

> [!WARNING]
> Muitas das melhorias de UX encontradas afetam indiretamente a Arquitetura (DX - Developer Experience) e a Performance, não sendo meros ajustes de "design limpo".

### 1. Poluição de "Business Logic" nas Views UI
Componentes como o `OnboardingWizard.tsx` e o `GlobalDashboard.tsx` estão exercendo papel duplo, engolindo muita Lógica de Negócio para si:
- **`GlobalDashboard.tsx`:** Realiza todas as reduções de array do usuário (`totals.income + business.totals.income`), contém helpers de parsing de datas e lógica matemática inteira inline para gerar o *Score de Saúde Financeira* (`calculateScore()`), variação mensal e alertas comportamentais.
- **`OnboardingWizard.tsx`:** Possui um switch massivo que calcula ativamente (`pE = 0.5, pL = 0.3, pF = 0.2`) as proporções do *Rule of 50/30/20*, calcula CDI e faz previsões previdenciárias inline.

**📝 Recomendações UX/DX:**
Isolar essa lógica pesada em Hooks dedicados (ex: `useFinancialScore()`, `useStrategyRule()`) para que a renderização da interface seja puramente visual. Em casos de re-render (digitação contínua), dispositivos de baixa memória podem experienciar lag ou "engasgos", degradando a experiência final do usuário.

### 2. O Gargalo do `AuthContext`
De carona no ponto técnico citado na auditoria anterior, o `AuthContext.tsx` tem hoje 435 linhas e carrega responsabilidades que fogem de Autenticação:
- Estado Global Analítico (Sync data).
- Customização Visual (Tema Light/Dark).
- Configuração de Localização (Idioma).

**📝 Recomendações UX/DX:**
Um `AuthContext` inchado causa renders desnecessários de topo de funil global na árvore de componentes inteira sempre que *qualquer* destas dependências atualiza. Separar em contextos distintos (`ThemeProvider`, `PreferencesProvider`).

### 3. Fuga da Paleta Padrão de System Tokens
Enquanto um exímio esforço foi tido em modular variáveis CSS no `index.css`, telas como `LaunchScreen.tsx` misturam chamadas inline via HEX code hardcoded (ex: `accentColor = isExpense ? "#F05A7E" : "#00D991"`).
- O mesmo vale para alguns trechos do Onboarding com classes Tailwind literais (`text-rose-500`, `bg-indigo-500`) em vez de reciclar componentes core (`bdg-r`, ou classes de badge e botões com as vars CSS originais do sistema).

**📝 Recomendações UX/DX:**
Estabelecer um `tailwind.config.ts` unificado e estrito onde `accent-expense` referencia `var(--red)` e `accent-income` remeta a `var(--green)`. Isso viabiliza o *white-labeling* do app ou o ajuste do Dark Mode perfeito em um piscar de olhos.

### 4. Input Keyboard Injection (`LaunchScreen`)
O componente `LaunchScreen.tsx` captura `window.addEventListener("keydown")` globalmente para seu numpad personalizado. Embora exista um filtro (`isTypingInField`), o hook global é poderoso e agressivo. 

**📝 Recomendações UX/DX:**
Ligar esse eventListener aos estados de *mount/unmount* apenas quando o fluxo numpad em si está ativado em tela pode evitar efeitos colaterais de fechar modais indesejados caso uma tecla backspace perca o target de input.

---

## 📈 Conclusões

**A fundação estética do app é excepcional.** A percepção de valor do `Meu Contador` para qualquer usuário da base será percebida nos primeiros três cliques.

A evolução natural desta interface para elevar ainda mais a usabilidade agora é técnica: refatorar os React Components para o modelo de Presentational vs. Container (ou separar em Hooks customizados focados em Regras de Negócio). Uma separação madura garantirá frames fluidos (60 FPS) e zero engasgos (janks) quando os dados dos extratos bancários estiverem rodando na mão de usuários de longa data com grandes volumes de transações na carteira.
