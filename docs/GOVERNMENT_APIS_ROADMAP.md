# Guia de Integração: APIs Governamentais Brasileiras

Este documento serve como referência para a automação e enriquecimento de dados do **Meu Contador** utilizando fontes oficiais do Governo Brasileiro.

## 1. Banco Central do Brasil (Dados Abertos)

Excelente para contextualização macroeconômica.

| Funcionalidade | API / Endpoint | Descrição |
| :--- | :--- | :--- |
| **Câmbio (PTAX)** | [Olinda - PTAX](https://dadosabertos.bcb.gov.br/) | Cotações oficiais diárias (Dólar, Euro, etc.). |
| **Taxas de Juros** | [SGS - Selic/CDI](https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json) | Séries temporais da Selic (11) e CDI (12). |
| **Inflação** | [SGS - IPCA](https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json) | Índice de Preços ao Consumidor Amplo. |
| **PIX** | [PIX API](https://www.bcb.gov.br/estabilidadefinanceira/pixapi) | Geração de QRCodes e gestão de cobranças. |

## 2. Receita Federal & Serpro (ConectaGov)

Essencial para validação de dados e suporte a MEI/Empresas.

*   **Consulta CNPJ**: Verificação de situação cadastral e dados societários.
*   **Simples Nacional**: Identificação de enquadramento em regimes tributários (MEI/ME).
*   **CPF**: Validação de dados cadastrais.
*   **Acesso**: Requer cadastro no [Serpro/Conecta Gov](https://www.serpro.gov.br/).

## 3. Open Finance Brasil (Sistema Financeiro Aberto)

O ecossistema definitivo para agregação de dados e serviços.

| Fase | Grupo de APIs | Descrição | Status no App |
| :--- | :--- | :--- | :--- |
| **Fase 1** | **Dados Abertos** | Taxas de produtos, canais e tarifas de todas as IFs. | Explorando |
| **Fase 2** | **Dados do Cliente** | Cadastro, Contas e Cartões (Requer Consentimento). | Planejado (Pluggy) |
| **Fase 3** | **Serviços** | Iniciação de Pagamentos (PIX). | Futuro |
| **Fase 4** | **Investimentos/Seguros** | Prêmios, Fundos e Títulos do Tesouro Direto. | **Prioridade** |

*   **Diretório de Participantes**: [https://data.directory.openbankingbrasil.org.br/participants](https://data.directory.openbankingbrasil.org.br/participants)
*   **Acesso**: Dados Abertos (Fase 1/4A) são públicos. Dados do Cliente (Fase 2/4B) requerem autenticação mTLS e certificados ICP-Brasil.

## 4. BrasilAPI (Agregador Open Source)

Utilizada como camada de abstração para simplificar o acesso a dados governamentais.

*   **CNPJ**: Consulta de dados cadastrais da Receita Federal.
*   **Bancos**: Lista consolidada de instituições (fallback para o BCB).
*   **CEP**: Busca de endereços.

---

## Roadmap de Implementação

1.  **Fase 1 (Concluída)**: Migração de SELIC, CDI e IPCA para BCB SGS.
2.  **Fase 2 (Concluída)**: Implementação de PTAX e Catálogo de Bancos Oficial (BCB Olinda).
3.  **Fase 3 (Atual)**: Integração **BrasilAPI** para Consulta de CNPJ e Fallback de Bancos.
4.  **Fase 4**: Comparativo de Taxas (CDB/LCI/LCA) via Open Finance Dados Abertos.
