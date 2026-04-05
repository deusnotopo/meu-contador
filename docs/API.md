# 📚 Meu Contador — Referência da API REST

> **Versão:** 1.0.0-enterprise  
> **Base URL (produção):** `https://meu-contador-api.onrender.com`  
> **Base URL (desenvolvimento):** `http://localhost:3000`  
> **Swagger UI interativo:** `[BASE_URL]/docs`  
> **Autenticação:** Cookie HttpOnly (`mc_access_token`) + Header CSRF (`x-csrf-token`)

---

## 🔐 Autenticação

O sistema usa **HttpOnly Cookies** + **CSRF Token** duplo. Após o login:

1. O servidor emite 3 cookies:
   - `mc_access_token` (HttpOnly, 15 min) — JWT de acesso
   - `mc_refresh_token` (HttpOnly, 7 dias) — token opaco para refresh
   - `mc_csrf_token` (legível pelo JS, 7 dias) — token CSRF

2. Nas requisições mutantes (POST/PUT/DELETE/PATCH), enviar o header:
   ```
   X-CSRF-Token: <valor do mc_csrf_token>
   ```

3. Para renovar o access token, chamar `POST /auth/refresh` antes de expirar.

### Códigos de erro comuns

| Código | Significado |
|--------|-------------|
| `401` | Não autenticado / token expirado |
| `403` | CSRF token inválido |
| `404` | Recurso não encontrado |
| `409` | Conflito (ex: email já cadastrado) |
| `429` | Rate limit (100 req/min global; 5 req/min em rotas críticas) |
| `500` | Erro interno |

---

## 🧑 Auth Routes — `/auth`

### `POST /auth/register`
Registrar novo usuário com email e senha.

**Rate limit:** 5 req/min

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "minimo8chars",
  "name": "João Silva"
}
```

**Response 200:**
```json
{
  "user": {
    "id": "clu...",
    "email": "usuario@email.com",
    "name": "João Silva",
    "isPro": false,
    "createdAt": "2026-04-01T00:00:00.000Z"
  },
  "csrfToken": "abc123..."
}
```

**Response 409:** `{ "message": "User already exists" }`

---

### `POST /auth/login`
Login com email e senha.

**Rate limit:** 5 req/min

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "minimo8chars"
}
```

**Response 200:** igual ao `/auth/register`  
**Response 401:** `{ "message": "Invalid credentials" }`

---

### `POST /auth/google`
Login/cadastro via token do Firebase Auth (Google Sign-In).

**Rate limit:** 10 req/min

**Body:**
```json
{
  "token": "<Firebase ID Token>"
}
```

**Response 200:** igual ao `/auth/register`

---

### `POST /auth/refresh`
Renova o access token usando o refresh token do cookie.

**Response 200:**
```json
{
  "success": true,
  "csrfToken": "novo-csrf-token..."
}
```

**Response 401:** sessão expirada ou inválida.

---

### `POST /auth/logout`
Encerra a sessão e revoga o refresh token.

**Response 200:** `{ "success": true }`

---

### `GET /auth/me` 🔒
Retorna perfil do usuário autenticado.

**Response 200:**
```json
{
  "id": "clu...",
  "email": "usuario@email.com",
  "name": "João Silva",
  "isPro": false,
  "monthlyIncome": 5000.00,
  "onboardingCompleted": true
}
```

---

## 💸 Transactions — `/transactions`

> Todas as rotas requerem autenticação. 🔒

### `GET /transactions`
Lista transações paginadas do usuário.

**Query params:**
| Param | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `page` | int | `1` | Página atual |
| `limit` | int | `20` | Itens por página (máx 100) |
| `scope` | enum | — | `personal` ou `business` |

**Response 200:**
```json
{
  "items": [
    {
      "id": "clu...",
      "description": "Salário",
      "amount": 5000.00,
      "type": "income",
      "category": "Renda",
      "date": "2026-04-01T00:00:00.000Z",
      "scope": "personal",
      "receiptUrl": null
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 42,
  "totalPages": 3
}
```

---

### `POST /transactions`
Criar nova transação.

**Body:**
```json
{
  "description": "Aluguel",
  "amount": 1800.00,
  "type": "expense",
  "category": "Moradia",
  "date": "2026-04-01T00:00:00.000Z",
  "scope": "personal",
  "receiptUrl": "https://..."
}
```

**Tipos:** `income` (receita) | `expense` (despesa)  
**Response 200:** objeto de transação criado.

---

### `PUT /transactions/:id`
Atualizar transação. Todos os campos são opcionais (patch parcial).

**Response 200:** transação atualizada.  
**Response 404:** `{ "message": "Transaction not found" }`

---

### `DELETE /transactions/:id`
Deletar transação.

**Response 204:** sem body.  
**Response 404:** `{ "message": "Transaction not found" }`

---

## 📊 Budgets (Envelopes) — `/budgets`

> Todas as rotas requerem autenticação. 🔒

### `GET /budgets`
Lista orçamentos paginados.

**Query params:** `page`, `limit`, `month` (formato `YYYY-MM`)

**Response 200:**
```json
{
  "items": [
    {
      "id": "clu...",
      "category": "Alimentação",
      "limit": 800.00,
      "spent": 420.00,
      "month": "2026-04"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 5,
  "totalPages": 1
}
```

---

### `POST /budgets`
Criar orçamento para uma categoria/mês.

**Body:**
```json
{
  "category": "Alimentação",
  "limit": 800.00,
  "month": "2026-04"
}
```

---

### `PUT /budgets/:id`
Atualizar limite ou gasto de um orçamento.

**Body:**
```json
{
  "limit": 1000.00,
  "spent": 650.00
}
```

---

### `DELETE /budgets/:id`
Deletar orçamento.

**Response 204:** sem body.

---

## 🎯 Goals (Metas) — `/goals`

> Rotas padrão CRUD. Requerem autenticação. 🔒

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/goals` | Listar metas (paginado) |
| `POST` | `/goals` | Criar meta |
| `PUT` | `/goals/:id` | Atualizar meta |
| `DELETE` | `/goals/:id` | Excluir meta |

**Campos de meta:**
```json
{
  "name": "Viagem Europa",
  "targetAmount": 15000.00,
  "currentAmount": 3200.00,
  "deadline": "2026-12-31T00:00:00.000Z"
}
```

---

## 📈 Investments — `/investments`

> Requerem autenticação. 🔒

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/investments` | Listar investimentos |
| `POST` | `/investments` | Adicionar ativo |
| `PUT` | `/investments/:id` | Atualizar posição |
| `DELETE` | `/investments/:id` | Remover ativo |
| `POST` | `/investments/sync-prices` | Atualizar cotações (BRAPI) |

---

## 💳 Debts — `/debts`

> Requerem autenticação. 🔒

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/debts` | Listar dívidas |
| `POST` | `/debts` | Cadastrar dívida |
| `PUT` | `/debts/:id` | Atualizar dívida |
| `DELETE` | `/debts/:id` | Excluir dívida |

---

## 🤖 AI — `/ai`

> Requerem autenticação. 🔒

### `POST /ai/chat`
Chat com assistente financeiro (Gemini).

**Body:**
```json
{
  "message": "Como posso economizar mais este mês?"
}
```

**Response:** análise personalizada baseada nas transações do usuário.

---

## 🏦 Banking — `/banking`

> Requerem autenticação. 🔒

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/banking/accounts` | Listar contas bancárias |
| `POST` | `/banking/sync` | Sincronizar dados bancários |

---

## 🔗 Open Finance — `/open-finance`

> Requerem autenticação. 🔒

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/open-finance/connections` | Listar conexões Open Finance |
| `POST` | `/open-finance/connect` | Iniciar conexão via Pluggy |
| `DELETE` | `/open-finance/connections/:id` | Remover conexão |

---

## 🔔 Push Notifications — `/push`

> Requerem autenticação. 🔒

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/push/subscribe` | Registrar subscription para Web Push |
| `POST` | `/push/unsubscribe` | Remover subscription |

---

## ⏰ Reminders — `/reminders`

> Requerem autenticação. 🔒

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/reminders` | Listar lembretes |
| `POST` | `/reminders` | Criar lembrete |
| `PUT` | `/reminders/:id` | Atualizar lembrete |
| `DELETE` | `/reminders/:id` | Excluir lembrete |

---

## 📄 Invoices — `/invoices`

> Requerem autenticação. 🔒

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/invoices` | Listar faturas |
| `POST` | `/invoices` | Criar fatura |
| `PUT` | `/invoices/:id` | Atualizar fatura |
| `DELETE` | `/invoices/:id` | Excluir fatura |

---

## 👤 User — `/user`

> Requerem autenticação. 🔒

### `GET /user/profile`
Perfil completo com workspaces e configurações.

### `PATCH /user/profile`  
Atualizar nome, renda mensal, preferências.

### `DELETE /user/account`
Deletar conta (LGPD — apagamento de dados).

---

## 🏥 Health Check

### `GET /health`
Endpoint público para monitoramento (UptimeRobot).

**Response 200:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-04-01T22:00:00.000Z",
  "version": "1.0.0-enterprise"
}
```

**Response 503:** banco de dados inacessível.

---

## 📖 Swagger UI

Acesse a documentação interativa em:  
`[BASE_URL]/docs`

A interface Swagger permite testar todas as rotas diretamente no browser com autenticação JWT.

---

## 🔧 Exemplos com cURL

### Login
```bash
curl -X POST https://meu-contador-api.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"usuario@email.com","password":"minimo8chars"}'
```

### Criar transação (usando cookie + CSRF)
```bash
# Primeiro pegue o CSRF token do cookie mc_csrf_token
CSRF=$(grep mc_csrf_token cookies.txt | awk '{print $7}')

curl -X POST https://meu-contador-api.onrender.com/transactions \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF" \
  -b cookies.txt \
  -d '{
    "description": "Salário",
    "amount": 5000.00,
    "type": "income",
    "category": "Renda",
    "date": "2026-04-01T00:00:00.000Z",
    "scope": "personal"
  }'
```

### Listar transações
```bash
curl https://meu-contador-api.onrender.com/transactions?page=1&limit=10 \
  -b cookies.txt
```

---

*Documentação gerada em 2026-04-01 | Meu Contador v1.0.0-enterprise*
