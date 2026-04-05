# Script de Verificação de Saúde do Projeto
Write-Host "🔍 Verificando saúde do projeto..." -ForegroundColor Cyan

$errors = 0

# 1. Verificar TypeScript Frontend
Write-Host "`n📦 Frontend TypeScript..." -ForegroundColor Yellow
Set-Location frontend
$npxResult = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROS TypeScript Frontend:" -ForegroundColor Red
    $npxResult | Select-String "error TS"
    $errors++
} else {
    Write-Host "✅ Frontend OK" -ForegroundColor Green
}
Set-Location ..

# 2. Verificar TypeScript Backend
Write-Host "`n📦 Backend TypeScript..." -ForegroundColor Yellow
Set-Location backend
$npxResult = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROS TypeScript Backend:" -ForegroundColor Red
    $npxResult | Select-String "error TS"
    $errors++
} else {
    Write-Host "✅ Backend OK" -ForegroundColor Green
}
Set-Location ..

# 3. Verificar ESLint
Write-Host "`n🔍 ESLint Frontend..." -ForegroundColor Yellow
Set-Location frontend
$eslintResult = npx eslint src/ --max-warnings=10 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ ESLint warnings/errors:" -ForegroundColor Yellow
    $eslintResult | Select-String "error|warning"
} else {
    Write-Host "✅ ESLint OK" -ForegroundColor Green
}
Set-Location ..

# 4. Verificar dependências
Write-Host "`n📚 Verificando dependências..." -ForegroundColor Yellow
$missing = @()
if (-not (Test-Path "frontend/node_modules")) { $missing += "frontend" }
if (-not (Test-Path "backend/node_modules")) { $missing += "backend" }

if ($missing.Count -gt 0) {
    Write-Host "❌ Dependências faltando: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "   Rode: npm install" -ForegroundColor Yellow
    $errors++
} else {
    Write-Host "✅ Dependências OK" -ForegroundColor Green
}

# 5. Verificar .env
Write-Host "`n🔐 Verificando variáveis de ambiente..." -ForegroundColor Yellow
$envFiles = @("backend/.env", "frontend/.env")
foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        Write-Host "✅ $envFile existe" -ForegroundColor Green
    } else {
        Write-Host "⚠️ $envFile não encontrado (pode ser opcional)" -ForegroundColor Yellow
    }
}

# Resultado
Write-Host "`n" -NoNewline
if ($errors -eq 0) {
    Write-Host "🎉 PROJETO SAUDÁVEL - Pode rodar!" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host "   Frontend: npm run dev -w frontend" -ForegroundColor Cyan
    Write-Host "   Backend:  npm run dev -w backend" -ForegroundColor Cyan
} else {
    Write-Host "🚨 ENCONTRADOS $errors ERRO(S) - Corrija antes de rodar!" -ForegroundColor Red -BackgroundColor DarkRed
}