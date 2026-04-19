# 🛡️ Manifesto de Saneamento Ambiental - Meu Contador

> "Ambiente de desenvolvimento não é lugar de mágica. É lugar de determinismo." — Fabio Akita (Mode)

Este documento serve como a fonte da verdade para o provisionamento técnico do projeto. Se o seu ambiente não atende a estes requisitos, ele é considerado instável.

## 🛠️ Requisitos de Sistema (Core)

| Componente | Versão Requerida | Status | Verificação |
| :--- | :--- | :--- | :--- |
| **Node.js** | v24.x (LTS/Experimental) | Requerido | `node -v` |
| **NPM** | v10.x+ | Requerido | `npm -v` |
| **Dart SDK** | v3.x+ | Requerido (MCP) | `dart --version` |
| **Docker** | v24.x+ | Recomendado | `docker --version` |

## 📦 Dependências Críticas de Infra (Root)

Para estabilizar ferramentas executadas via `npx`, as seguintes bibliotecas devem estar presentes no root:

- `ajv` (^8.17.1): Core validator necessário para sub-tools de validação Zod/JSON.
- `ajv-formats` (^3.0.1): Extensões de formato para o AJV.

## 🔌 Configurações de Ferramentas (MCP)

### Database Toolbox (`tools.yaml`)
- Localização: `./tools.yaml` (Root)
- Finalidade: Interface auditável com o PostgreSQL via Prisma.

### Dart MCP Server
- Localização: Definida no PATH do sistema.
- Requisito: Comando `dart` deve estar acessível globalmente.

## 🚨 Troubleshooting Comum

### "Module Not Found: ajv"
- **Causa:** Peer dependency não resolvida pelo `npx`.
- **Solução:** `npm install` no root para atualizar o cache local.

### "Dart: executable file not found"
- **Causa:** Dart SDK não instalado ou PATH corrompido.
- **Solução:** Instalar Dart SDK e reiniciar o terminal.
