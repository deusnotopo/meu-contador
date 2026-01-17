# Meu Contador - Deploy no Vercel

## 🚀 Passos para Deploy

### 1. Instalar Vercel CLI (se ainda não tiver)

```bash
npm install -g vercel
```

### 2. Fazer Login no Vercel

```bash
vercel login
```

- Escolha seu método preferido (GitHub, GitLab, Email)
- Siga as instruções no navegador

### 3. Deploy do Projeto

```bash
cd d:/meu-contador
vercel
```

**Durante o setup, responda:**

- `Set up and deploy "d:/meu-contador"?` → **Y**
- `Which scope?` → Escolha sua conta
- `Link to existing project?` → **N**
- `What's your project's name?` → **meu-contador** (ou o nome que preferir)
- `In which directory is your code located?` → **./** (Enter)
- `Want to override the settings?` → **N**

### 4. Configurar Variável de Ambiente (IMPORTANTE!)

Após o primeiro deploy, você precisa adicionar a chave da API do Mistral:

**Opção A - Via CLI:**

```bash
vercel env add VITE_MISTRAL_API_KEY
```

- Quando perguntar o valor, cole: `jqvq3FN8Svltb0OMkz1E7IcStQb0Yton`
- Escolha: **Production**, **Preview**, e **Development**

**Opção B - Via Dashboard:**

1. Acesse: https://vercel.com/dashboard
2. Clique no projeto **meu-contador**
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   - **Name**: `VITE_MISTRAL_API_KEY`
   - **Value**: `jqvq3FN8Svltb0OMkz1E7IcStQb0Yton`
   - **Environments**: Marque todos (Production, Preview, Development)
5. Clique em **Save**

### 5. Re-deploy com a Variável

```bash
vercel --prod
```

---

## ✅ Pronto!

Seu app estará disponível em:

- **URL de produção**: `https://meu-contador.vercel.app` (ou similar)
- **URL de preview**: Gerada automaticamente a cada commit

---

## 🔄 Deploys Futuros

Depois do primeiro deploy, é só rodar:

```bash
vercel --prod
```

Ou conecte ao GitHub para **deploy automático** a cada push!

---

## 📝 Notas Importantes

- ✅ O Vercel detecta automaticamente que é um projeto Vite
- ✅ HTTPS é configurado automaticamente
- ✅ CDN global para performance máxima
- ⚠️ A chave da API do Mistral fica **segura** nas variáveis de ambiente
- ⚠️ Não commite o arquivo `.env` no Git (já está no `.gitignore`)
