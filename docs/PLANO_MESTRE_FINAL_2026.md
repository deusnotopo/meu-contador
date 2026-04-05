# 🚀 Plano Master Final — Meu Contador → Melhor App de Finanças do Mundo

> **Filosofia**: app 100% completo e estável ANTES de cobrar. Monetização ativa somente quando o produto for irresistível. Infra 100% gratuita até escalar.

---

## 💰 Stack Gratuita (zero mensalidade)

| Serviço | Uso | Gratuito até |
|---|---|---|
| Vercel | Frontend (deploy) | 100GB bandwidth/mês |
| Supabase | PostgreSQL | 500MB banco, 2GB transfer |
| Firebase | Auth + Firestore | 50k reads/dia, 20k writes |
| Upstash Redis | Cache backend | 10k requests/dia |
| Render | Backend Node.js | 750h/mês (cold start) |
| Mercado Pago | Pagamentos | R$0 mensalidade; 4,99% por transação |
| Resend | Emails transacionais | 3k emails/mês |
| GitHub Actions | CI/CD | 2.000 min/mês |

> 💡 Quando escalar: Render $7/mês (sem cold start) + Supabase Pro $25/mês. Só necessário acima de ~500 usuários ativos.

---

## 📅 Roadmap Executivo Detalhado

---

### ✅ Fase 1 — Estabilidade Total
**Meta**: app confiável, sem perda de dados, sem downtime percebido  
**Prazo sugerido**: 3-4 semanas

#### 1.1 Infra e Performance
- [ ] Corrigir cold start — configurar `render.yaml` com `healthCheckPath` e ping periódico via **UptimeRobot (grátis)**
  - UptimeRobot pinga `/health` a cada 5min → mantém Render acordado
  - URL: https://uptimerobot.com (grátis para 50 monitores)
- [ ] Ativar Redis — `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` no Render
  - Cache já implementado, só falta ligar
- [ ] Firebase Admin — configurar `FIREBASE_PRIVATE_KEY` no Render com service account real

#### 1.2 Migração de Dados
- [ ] Auditar hooks secundários: `useDebts`, `useInvoices`, `useRecurringExpenses`, `useEmotionalJournal`, `useGamification`
- [ ] Migrar cada hook para a API REST (já há rotas no backend para maioria)
- [ ] Deprecar `storage.ts` como fonte de escrita primária
- [ ] `localStorage` vira apenas cache de leitura (`stale-while-revalidate`)

#### 1.3 Qualidade
- [ ] Testes E2E com Playwright: login, adicionar transação, visualizar dashboard
- [ ] Testes unitários: `AuthContext`, `storage.ts`, rotas críticas do backend
- [ ] Corrigir erros pre-existentes nos test files do backend (TS1309, TS2835)
- [ ] ErrorBoundary com relatório automático via Sentry (já configurado, ligar DSN)

---

### 🚧 Fase 2 — Produto Completo
**Meta**: todas as features prometidas funcionando perfeitamente  
**Prazo sugerido**: 4-8 semanas

#### 2.1 Open Finance Automático
- [ ] Sync periódico — worker que roda a cada 6h para reconectar e buscar novas transações
- [ ] Reconciliação de saldo — comparar saldo calculado com saldo bancário real, alertar divergências
- [ ] Tratamento de reconexão — quando token Pluggy expira, notificar usuário para reconectar

#### 2.2 IA Proativa (o diferencial)
- [ ] Alertas inteligentes — detectar 15 dias antes que o usuário vai estourar o orçamento
- [ ] "Dinheiro parado" — detectar valores em conta corrente sem rendimento há +30 dias
- [ ] Assinaturas esquecidas — identificar débitos recorrentes e listar para revisão
- [ ] Categorização automática — sugerir categoria baseado em descrição da transação (regex + ML simples)
- [ ] Weekly Digest — email/push toda segunda com resumo da semana (Resend grátis)

#### 2.3 Features Faltantes Críticas
- [ ] Pix QR Code — gerar QR para receber pagamentos (API Banco Central grátis)
- [ ] Relatório de IR — exportar dados no formato da Receita Federal (IRPF)
- [ ] Net Worth completo — incluir imóveis, veículos, outros ativos além de investimentos
- [ ] Modo casal/família — workspace compartilhado com permissões (base já existe no schema)
- [ ] Controle de DAS — para MEIs: calcular e rastrear o boleto mensal obrigatório
- [ ] App nativo — wrapper PWA instalável no iOS/Android (já funciona, melhorar UX de instalação)

#### 2.4 Background Sync Offline Real
- [ ] Implementar fila IndexedDB para operações offline
- [ ] Service Worker drena fila ao reconectar (já declarado em `sw.js`, falta lógica)

---

### 💰 Fase 3 — Monetização
**Meta**: cobrar de forma justa, simples e automática  
**Prazo sugerido**: 2-3 semanas após Fase 2

#### 3.1 Modelo Freemium

| GRATUITO (sempre) | PRO — R$ 19,90/mês |
|---|---|
| ✅ 50 transações/mês | ✅ Transações ilimitadas |
| ✅ 2 contas | ✅ Contas ilimitadas |
| ✅ Orçamentos básicos | ✅ IA proativa + alertas |
| ✅ Relatórios simples | ✅ Open Finance automático |
| ✅ Import manual CSV | ✅ Sync bancário em tempo real |
| ❌ IA financeira | ✅ Relatório de IR |
| ❌ Open Finance | ✅ Modo casal/família |
| ❌ Exportação PDF | ✅ Exportação PDF/Excel |
| ❌ Histórico > 3 meses | ✅ Histórico ilimitado |
| ❌ Investimentos avançados | ✅ Análise de carteira completa |

#### 3.2 Integração Mercado Pago (gratuito, sem mensalidade)

Por que Mercado Pago:
- 0% de taxa mensal
- 4,99% por transação (aceitável para R$19,90 = R$1,00 de taxa)
- PIX instantâneo (taxa reduzida ~1%)
- SDK bem documentado para Node.js
- Webhooks confiáveis para ativar `isPro` automaticamente

**Fluxo técnico**:
```
Usuário clica "Assinar PRO"
    ↓
Frontend → POST /auth/create-subscription
    ↓ 
Backend cria preferência no Mercado Pago via API
    ↓
Usuário é redirecionado para checkout do MP
    ↓
Usuário paga (cartão, PIX, boleto)
    ↓
Mercado Pago chama webhook → POST /webhooks/mercadopago
    ↓
Backend verifica assinatura do webhook
    ↓
db.user.update({ isPro: true, proExpiresAt: +30 dias })
    ↓
AuthContext detecta isPro = true → desbloqueia features
```

#### 3.3 Implementação Técnica

**Backend — novas rotas:**
```typescript
// POST /auth/create-subscription
// Cria preferência de pagamento no Mercado Pago
// Retorna { checkoutUrl, preferenceId }

// POST /webhooks/mercadopago  
// Recebe notificação de pagamento
// Verifica assinatura HMAC
// Atualiza isPro + proExpiresAt no banco

// GET /auth/subscription-status
// Retorna plano atual, data de vencimento, histórico
```

**Schema Prisma — campos novos:**
```prisma
model User {
  // ... campos existentes
  isPro              Boolean   @default(false)
  proExpiresAt       DateTime?          // null = free, data = PRO até
  subscriptionId     String?            // ID da assinatura no MP
  subscriptionStatus String?            // active | cancelled | expired
}
```

**Frontend — componentes novos:**
```
src/components/billing/
├── UpgradeModal.tsx       // Modal de apresentação do PRO
├── PricingCard.tsx        // Card de preço com features
├── SubscriptionStatus.tsx // Badge "PRO" no header
└── PaymentSuccess.tsx     // Página de sucesso pós-pagamento
```

#### 3.4 Controle de Features PRO no Frontend

```typescript
// hook: useProGate.ts
const { isPro, showUpgradeModal } = usePro();

// Uso em qualquer componente:
if (!isPro) {
  return <ProGate feature="Open Finance" />;
}
```

```typescript
// Middleware no backend (já existe, melhorar):
// GET /api/ai-proxy → verifica isPro antes de chamar Gemini
// GET /open-finance/token → verifica isPro
// GET /transactions (>50) → verifica isPro + conta registros
```

---

### 📈 Fase 4 — Crescimento
**Meta**: 1.000 usuários pagantes  
**Prazo sugerido**: contínuo após lançamento

#### 4.1 SEO e Conteúdo (gratuito)
- Landing page com blog integrado (Vercel + MDX)
- Palavras-chave: "controle financeiro gratuito", "app de finanças pessoais", "planilha de gastos online"
- Artigos SEO: "Como sair das dívidas em 12 meses", "Open Finance: o que é e como usar"

#### 4.2 Canais de Aquisição Gratuitos
- Product Hunt launch
- Reddit: `r/investimentos`, `r/financaspessoais`, `r/brdev`
- Instagram/TikTok: conteúdo educacional financeiro (sem custo)
- Programa de afiliados: 30% de comissão para quem indicar

#### 4.3 Retenção
- Email onboarding (7 emails nos primeiros 7 dias — Resend grátis)
- Push notifications semanais com insights personalizados
- Gamificação: streak de uso, conquistas, ranking (já implementado)

---

## ✅ Checklist "App 100% Completo"

Antes de ativar cobrança, marcar **TODOS**:

### Estabilidade
- [ ] Cold start eliminado (UptimeRobot ou Render pago)
- [ ] Zero perda de dados entre dispositivos
- [ ] Uptime > 99.5% por 30 dias consecutivos
- [ ] Tempo de carregamento inicial < 3s

### Produto
- [ ] Open Finance sincronizando automaticamente
- [ ] IA gerando alertas proativos reais
- [ ] Todos os hooks usando API (não localStorage)
- [ ] Import de extrato funcionando (CSV, OFX, PDF)
- [ ] Relatórios exportáveis (PDF, Excel)
- [ ] Modo casal/família

### Qualidade
- [ ] Cobertura de testes > 60% (funções críticas)
- [ ] Sentry capturando erros em produção
- [ ] Nenhum erro visível no console em produção
- [ ] Acessibilidade básica (WCAG AA)

### Legal (antes de cobrar)
- [ ] Termos de Uso
- [ ] Política de Privacidade (LGPD)
- [ ] Política de Reembolso
- [ ] CNPJ (MEI mínimo) para receber pagamentos

---

## 🎯 Conclusão

**O caminho mais eficiente agora é exatamente o que está descrito aqui: primeiro estabilizar, depois completar o produto, depois monetizar.**

Esse plano não tem riscos, custos mensais zero no início, e garante que quando chegar a hora de cobrar, o produto vai ser tão bom que o usuário vai pagar com prazer.

**O Meu Contador já é o melhor app de finanças pessoais feito por brasileiro. Agora é só terminar de polir e lançar direito.**