# Memória de Infraestrutura - Meu Contador (Disco D)

Este arquivo serve como um espelho de contexto para a IA Antigravity, garantindo que o progresso seja mantido mesmo que o disco C: (sistema) apresente instabilidades por falta de espaço.

## Estado Atual da Infraestrutura (13/04/2026)

### 1. Servidores e Portas
- **Backend**: Porta 3000. Rodando no disco D:. Variáveis `TEMP` e `TMP` redirecionadas para `D:\temp`.
- **Frontend**: Porta 5173. Rodando no disco D:. Cache do Vite redirecionado para `D:\vite-cache`.

### 2. Integração com IA (Gemini)
- **Status**: Rota `/ai-proxy` alinhada entre Frontend e Backend.
- **Modelo**: Atualizado para `gemini-2.5-flash` para garantir compatibilidade com a chave API.
- **Segurança**: Injeção de `X-CSRF-Token` via `api.ts` implementada.

### 3. Problemas Conhecidos
- **Disco C: Lotado (0 bytes)**: impede a gravação de logs do sistema e artefatos de IA da DeepGate.
- **Ação**: Todo o fluxo de build e temporário foi movido para o **Disco D: (820 GB livres)**.

## Registro de Mudanças em Arquivos
- `backend/src/routes/ai.ts`: Padronização de rota e correção de modelo.
- `frontend/vite.config.ts`: Configuração de `cacheDir` no disco D e proxy ajustado.
- `frontend/src/components/ai/AIFinancialChat.tsx`: Migração para cliente central `api.post`.
