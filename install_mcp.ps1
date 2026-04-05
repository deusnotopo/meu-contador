# INSTALACAO SERVIDORES MCP - SUPER CRIADOR DE APPS
Clear-Host
Write-Host "Iniciando instalacao servidores MCP" -ForegroundColor Cyan

$servers = @(
    "npx -y @executeautomation/mcp-playwright",
    "npx -y @21st-dev/magic-mcp",
    "npx -y @saik0s/mcp-browser-use",
    "npx -y @upstash/context7-mcp",
    "npx -y @jeremylongshore/design-to-code-mcp",
    "npx -y @supabase-community/supabase-mcp",
    "npx -y @brave/search-mcp-server",
    "npx -y @awslabs/mcp-server-code-doc-gen",
    "npx -y @semgrep/semgrep-mcp"
)

$count = $servers.Count
$current = 0

foreach ($cmd in $servers) {
    $current++
    Write-Host "`n[$current/$count] Executando: $cmd" -ForegroundColor Yellow
    
    try {
        & cmd /c $cmd
        Write-Host "OK" -ForegroundColor Green
    }
    catch {
        Write-Host "ERRO: $_" -ForegroundColor Red
    }
    
    Start-Sleep 1
}

Write-Host "`nConcluido. Reinicie o editor para ativar os servidores." -ForegroundColor Green