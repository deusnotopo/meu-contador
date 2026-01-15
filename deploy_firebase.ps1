Write-Host "🚀 Iniciando deploy para Firebase Hosting..." -ForegroundColor Cyan
Write-Host ""

# 1. Build local
Write-Host "📦 Buildando aplicação..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build falhou!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
Write-Host ""

# 2. Deploy para Firebase
Write-Host "🔥 Fazendo deploy para Firebase Hosting..." -ForegroundColor Yellow
npx firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 URL de Produção: https://meucontador-367cf.web.app" -ForegroundColor Cyan
    Write-Host "🌐 URL Alternativa: https://meucontador-367cf.firebaseapp.com" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deploy falhou!" -ForegroundColor Red
    exit 1
}
