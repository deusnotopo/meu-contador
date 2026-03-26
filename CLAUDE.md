# 🤖 Instruções para Cline - Projeto Meu Contador

## 🎯 Contexto
Este é um projeto full stack de contador financeiro pessoal com:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Fastify + Prisma + PostgreSQL/SQLite
- **Autenticação**: Firebase Auth
- **Deploy**: Vercel (frontend) + Railway/Render (backend)

---

## ⚠️ Regras Críticas para Este Projeto

### 1. ANTES DE QUALQUER ALTERAÇÃO
```bash
# SEMPRE verificar se o build está funcionando
cd frontend && npm run build

# Verificar tipos
cd frontend && npx tsc --noEmit

# Verificar linting
cd frontend && npm run lint
```

### 2. ESTRUTURA DE TIPOS
O projeto usa tipos definidos em `frontend/src/types/index.ts`. SEMPRE:
- Verificar se o tipo existe antes de criar novo
- Usar tipos do Prisma quando possível
- Evitar `any` a todo custo

### 3. COMPONENTES REGRAS
- Todos os componentes devem ter Props interface definida
- Usar `memo()` para componentes que não precisam re-renderizar
- Envolver componentes complexos em ErrorBoundary
- Usar Suspense para lazy loading

### 4. HOOKS
- Criar hooks customizados para lógica de fetch
- Sempre tratar loading, error e data
- Usar useCallback para funções que são dependências

### 5. BACKEND
- Validar TODAS as entradas com Zod
- Usar tipos do Prisma
- Tratar erros de forma consistente
- Logar erros mas nunca expor detalhes ao cliente

---

## 🔧 Scripts Úteis

```bash
# Frontend
cd frontend
npm run dev          # Iniciar dev server
npm run build        # Build de produção
npm run lint         # Verificar linting
npm run type-check   # Verificar tipos (adicione este script)

# Backend
cd backend
npm run dev          # Iniciar dev server
npm run build        # Compilar TypeScript
npx prisma migrate dev  # Rodar migrations
npx prisma generate  # Gerar cliente Prisma
```

---

## 📁 Estrutura de Pastas Importante

```
frontend/src/
├── components/      # Componentes React
│   ├── ui/         # Componentes base (Button, Card, etc)
│   ├── layout/     # Layout (Sidebar, BottomNav)
│   └── [feature]/  # Componentes por feature
├── hooks/          # Hooks customizados
├── lib/            # Utilitários e helpers
├── types/          # Definições de tipos
├── context/        # React Contexts
└── App.tsx         # Componente principal

backend/src/
├── routes/         # Rotas da API
├── lib/            # Utilitários (db, auth, etc)
├── services/       # Serviços externos
└── server.ts       # Servidor principal
```

---

## 🚨 Erros Comuns a Evitar

### ❌ NÃO FAZER:
1. Alterar tipos sem verificar onde são usados
2. Criar componentes sem interface de Props
3. Fazer fetch sem tratar erros
4. Usar `any` como tipo
5. Mutar estado diretamente
6. Usar índices como key em listas
7. Fazer alterações sem testar build

### ✅ SEMPRE FAZER:
1. Verificar dependências antes de alterar
2. Definir tipos explicitamente
3. Tratar todos os erros
4. Usar Error Boundaries
5. Testar build após alterações
6. Fazer commit incremental

---

## 🔍 Checklist de Validação

Antes de considerar uma tarefa completa:

- [ ] `npm run build` passa sem erros
- [ ] `npx tsc --noEmit` não mostra erros
- [ ] `npm run lint` não mostra warnings críticos
- [ ] Funcionalidade testada manualmente
- [ ] Tipos compatíveis entre frontend e backend
- [ ] Nenhum `any` introduzido
- [ ] Error handling implementado
- [ ] Loading states implementados

---

## 💡 Dicas de Performance

1. **Lazy Loading**: Usar `lazy()` para componentes grandes
2. **Memoization**: Usar `memo()` e `useMemo()` quando necessário
3. **Debounce**: Para inputs de busca
4. **Pagination**: Para listas grandes
5. **Caching**: Usar React Query ou similar para cache de API

---

## 🆘 Quando Algo Quebra

1. **Não entre em pânico**
2. Verificar o erro no console do navegador
3. Verificar logs do backend
4. Desfazer última alteração se necessário
5. Verificar se dependências estão instaladas
6. Limpar cache: `rm -rf node_modules && npm install`

---

## 📞 Contato e Recursos

- Documentação do projeto: `/docs`
- Issues: GitHub Issues
- Logs: Console do navegador + terminal

---

**LEMBRE-SE**: Qualidade > Velocidade
É melhor fazer devagar e certo do que rápido e quebrado.

**Última atualização: 2026-03-26**