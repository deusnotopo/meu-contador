# ⚡ Checklist Rápido - Antigravity

## 🔴 ANTES DE COMEÇAR (OBRIGATÓRIO)

- [ ] Li o `.antigravity-rules.md`
- [ ] Entendi o que preciso fazer
- [ ] Sei quais arquivos serão afetados

---

## 🟡 DURANTE O DESENVOLVIMENTO

### Frontend
- [ ] Tipos definidos explicitamente
- [ ] Props interface criada
- [ ] Error handling implementado
- [ ] Loading states adicionados
- [ ] `useCallback`/`useMemo` quando necessário

### Backend
- [ ] Validação com Zod
- [ ] Tipos do Prisma usados
- [ ] Erros tratados adequadamente
- [ ] Logs estruturados

---

## 🟢 ANTES DE FINALIZAR

- [ ] `npm run build` passou (frontend)
- [ ] `npm run build` passou (backend)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npm run lint` sem warnings críticos
- [ ] Funcionalidade testada manualmente
- [ ] Nenhum `any` introduzido

---

## 🚨 SINAIS DE PERIGO

Pare imediatamente se:
- ❌ Build quebrado
- ❌ Erros de TypeScript
- ❌ Imports quebrados
- ❌ Tipos incompatíveis
- ❌ Muitos arquivos alterados

---

## 📞 EM CASO DE PROBLEMA

1. Não entre em pânico
2. Verifique o erro no console
3. Use `git diff` para ver mudanças
4. Desfaça se necessário: `git checkout .`
5. Leia `.antigravity-rules.md` novamente

---

**LEMBRESE**: Devagar e sempre! 🐢