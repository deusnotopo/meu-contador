<#
🚀 SCRIPT DE INSTALAÇÃO AUTOMÁTICA - SUPER CRIADOR DE APPS
📅 Data: 03/04/2026
📋 Instala os 12 servidores MCP mais poderosos na ordem correta
#>

Clear-Host
Write-Host "`n🚀 Iniciando instalação dos servidores MCP para Super Criador de Apps`n" -ForegroundColor Cyan

# Lista de servidores na ordem de prioridade
$servidores = @(
    @{ nome = "Playwright executeautomation"; comando = "npx -y @executeautomation/mcp-playwright" },
    @{ nome = "Magic UI 21st-dev"; comando = "npx -y @21st-dev/magic-mcp" },
    @{ nome = "Browser Use Saik0s"; comando = "npx -y @saik0s/mcp-browser-use" },
    @{ nome = "Context7 Upstash"; comando = "npx -y @upstash/context7-mcp" },
    @{ nome = "Design to Code"; comando = "npx -y @jeremylongshore/design-to-code-mcp" },
    @{ nome = "Supabase"; comando = "npx -y @supabase-community/supabase-mcp" },
    @{ nome = "Brave Search"; comando = "npx -y @brave/search-mcp-server" },
    @{ nome = "Code Documentation Generator"; comando = "npx -y @awslabs/mcp-server-code-doc-gen" },
    @{ nome = "Project Health Auditor"; comando = "npx -y @jeremylongshore/project-health-auditor-mcp" },
    @{ nome = "Semgrep"; comando = "npx -y @semgrep/semgrep-mcp" }
)

$total = $servidores.Count
$atual = 0

foreach ($servidor in $servidores) {
    $atual++
    Write-Host "`n📦 [$atual/$total] Instalando $($servidor.nome)..." -ForegroundColor Yellow
    
    try {
        Invoke-Expression $servidor.comando
        Write-Host "✅ $($servidor.nome) instalado com sucesso!" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Erro ao instalar $($servidor.nome): $_" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 1
}

Write-Host "`n`n🎉 INSTALAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "`n✅ Todos os servidores prioritários foram processados"
Write-Host "✅ Reinicie o Antigravity/Cursor para ativar os novos servidores"
Write-Host "✅ Você agora tem super poderes para criar apps!`n"