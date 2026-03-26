#!/bin/bash

# 🚀 Script de Validação - Meu Contador
# Este script deve ser executado antes de cada commit

set -e  # Sair em caso de erro

echo "🔍 Iniciando validação do projeto..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para printar status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

# 1. Verificar Frontend
echo "📦 Validando Frontend..."
cd frontend

echo "  → Verificando dependências..."
npm list --depth=0 > /dev/null 2>&1
print_status $? "Dependências do frontend OK"

echo "  → Executando build..."
npm run build > /dev/null 2>&1
print_status $? "Build do frontend OK"

echo "  → Verificando tipos TypeScript..."
npx tsc --noEmit > /dev/null 2>&1
print_status $? "Tipos TypeScript OK"

echo "  → Executando linter..."
npm run lint > /dev/null 2>&1
print_status $? "Lint do frontend OK"

cd ..

# 2. Verificar Backend
echo ""
echo "🔧 Validando Backend..."
cd backend

echo "  → Verificando dependências..."
npm list --depth=0 > /dev/null 2>&1
print_status $? "Dependências do backend OK"

echo "  → Executando build..."
npm run build > /dev/null 2>&1
print_status $? "Build do backend OK"

echo "  → Verificando Prisma..."
npx prisma generate > /dev/null 2>&1
print_status $? "Prisma Client OK"

cd ..

# 3. Verificar formatação
echo ""
echo "✨ Verificando formatação..."
if [ -f ".prettierrc" ]; then
    npx prettier --check "frontend/src/**/*.{ts,tsx}" > /dev/null 2>&1
    print_status $? "Formatação OK"
else
    echo -e "${YELLOW}⚠ Prettier não configurado (opcional)${NC}"
fi

# 4. Verificar tipos compartilhados
echo ""
echo "🔗 Verificando compatibilidade de tipos..."
if [ -f "shared/types.ts" ]; then
    echo -e "${GREEN}✓ Tipos compartilhados encontrados${NC}"
else
    echo -e "${YELLOW}⚠ Tipos compartilhados não encontrados (recomendado)${NC}"
fi

# Resumo
echo ""
echo "========================================"
echo -e "${GREEN}✅ Validação concluída com sucesso!${NC}"
echo "========================================"
echo ""
echo "📊 Resumo:"
echo "  • Frontend: Build, Types, Lint ✓"
echo "  • Backend: Build, Prisma ✓"
echo "  • Pronto para commit! 🚀"
echo ""