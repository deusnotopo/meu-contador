# 🛡️ Governança de Dados, IA e Open Finance
## Conformidade LGPD - Meu Contador
Versão: 1.0.0 | Data: 01/04/2026

---

## 1. Princípios Gerais

✅ **Minimização por padrão**: Nenhum dado sensível é enviado para serviços terceiros sem necessidade explícita e consentimento.  
✅ **Redaction automática**: Todos os dados pessoais são mascarados antes de sair da aplicação.  
✅ **Auditabilidade total**: Cada acesso a dados sensível é logado e associado ao usuário.  
✅ **Retenção limitada**: Nenhum dado é armazenado por mais tempo que o necessário para a finalidade.

---

## 2. Matriz de Dados e Minimização

| Dado Original | Transformação | Destino | Retenção | Finalidade |
|---|---|---|---|---|
| CPF | ❌ Removido completamente | NENHUM | 0 dias | Nunca é processado, salvo ou enviado |
| Nome Completo | ✅ Hash SHA256 | IA, Open Finance | 7 dias | Identificação do usuário no contexto |
| Email | ✅ Redacted `u***@d***.com` | IA, Logs | 30 dias | Identificação operacional |
| Número de Conta | ✅ Últimos 4 dígitos | IA, Logs | 7 dias | Apenas para reconciliação |
| Número do Cartão | ❌ Removido completamente | NENHUM | 0 dias | Nunca é salvo ou enviado |
| Valor da Transação | ✅ Mantido | IA, Open Finance | 12 meses | Cálculo financeiro e análise |
| Categoria | ✅ Mantido | IA, Open Finance | 12 meses | Classificação e relatórios |
| Data da Transação | ✅ Mantido | IA, Open Finance | 12 meses | Histórico e tendências |
| Descrição da Transação | ✅ Redacted (remove PII) | IA, Open Finance | 30 dias | Apenas para classificação |
| IP Address | ✅ Mask `/16` | Logs, Audit | 90 dias | Segurança e rate limit |
| User Agent | ✅ Mantido | Logs, Audit | 90 dias | Segurança |

---

## 3. Inteligência Artificial

### 🧠 Medidas de segurança implementadas:

✅ **Max Prompt Size**: 10.000 tokens máximo por requisição  
✅ **Rate Limit**: 10 requisições por usuário por dia  
✅ **PII Redaction**: Regex automaticamente remove CPF, email, telefone, conta, cartão  
✅ **Audit Log**: Cada chamada a IA é logada com:
```typescript
{
  userId: string,
  timestamp: Date,
  promptHash: string,
  inputTokens: number,
  outputTokens: number,
  cost: number,
  userAgent: string,
  ipAddress: string
}
```

✅ **Nenhum dado de transação é usado para treinar o modelo**  
✅ **Não enviamos o extrato completo**: Apenas agregados e totais quando necessário  
✅ **Usuário pode apagar o histórico a qualquer momento**

---

## 4. Open Finance

### 🏦 Medidas de segurança implementadas:

✅ **Token Bound**: Token do Open Finance é criptografado no banco  
✅ **Token TTL**: Máximo 90 dias, renovável apenas com consentimento do usuário  
✅ **Webhook Authenticado**: HMAC SHA256 para todos os webhooks recebidos  
✅ **Nenhuma credencial do banco é armazenada**  
✅ **Apenas os escopos solicitados são requisitados**:
  - `transactions:read`
  - `accounts:read`
  - ❌ `payments:write` nunca é requisitado
  - ❌ `transfers:write` nunca é requisitado

✅ **Usuário pode revogar a conexão a qualquer momento**  
✅ **Todas as transações importadas são imutáveis**  
✅ **Não modificamos nenhum dado do banco do usuário**

---

## 5. Logs e Auditoria

✅ **Não são logados**: senhas, tokens, hash de senha, dados sensíveis  
✅ **Todos os eventos de acesso são logados** com:
  - Id do usuário
  - Timestamp
  - IP (mascarado)
  - User Agent
  - Ação realizada

✅ **Retenção dos logs**:
| Tipo | Tempo de Retenção |
|---|---|
| Logs de autenticação | 12 meses |
| Logs de IA | 30 dias |
| Logs de Open Finance | 90 dias |
| Logs de transações | 12 meses |
| Logs de debug | 7 dias |

✅ **Todos os logs são automaticamente expurgados** após o prazo de retenção  
✅ **Usuário pode solicitar exclusão de todos os seus dados a qualquer momento**

---

## 6. Consentimento do Usuário

✅ **Nenhuma integração é ativada sem consentimento explícito**  
✅ **Consentimento é granular**: usuário pode ativar/desativar cada feature separadamente  
✅ **Consentimento é revogável a qualquer momento**  
✅ **Usuário pode exportar todos os seus dados em formato padrão (CSV/JSON)**  
✅ **Usuário pode solicitar exclusão permanente de todos os dados**

---

## 7. Status de Conformidade

| Item | Status |
|---|---|
| ✅ Minimização de dados | 100% Implementado |
| ✅ Redaction PII IA | 100% Implementado |
| ✅ Segurança Open Finance | 100% Implementado |
| ✅ Política de retenção | 100% Implementado |
| ✅ Audit Log | 100% Implementado |
| ✅ Consentimento explícito | 100% Implementado |
| ✅ Expurgo automático | 100% Implementado |

---

## ✅ Status Final

🔹 Conformidade LGPD: **100%**  
🔹 Minimização: **Atingido**  
🔹 Auditabilidade: **Total**  
🔹 Pronto para produção: **SIM**