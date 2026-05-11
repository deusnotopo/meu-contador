# Coletor de leads sem site - Zona Leste de São Paulo

Este projeto agora tem **duas partes**:

- `google_maps_sem_site.py` → faz a coleta via Google Places API
- `painel_google_maps.html` → mostra os dados coletados em tempo real no navegador

## O que o coletor gera

Durante a execução, o script atualiza estes arquivos automaticamente:

- `leads_zona_leste_sem_site.csv`
- `leads_zona_leste_sem_site.json`
- `progresso_google_maps.json`

## O que o painel mostra

- status atual da coleta
- quantos leads já foram encontrados
- qual consulta está rodando
- barra de progresso
- tabela com leads coletados
- erros recentes

## Requisito

Você precisa ter uma chave da Google Places API em uma destas variáveis de ambiente:

- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_PLACES_API_KEY`

## Como rodar o coletor no Windows (cmd)

```bat
set GOOGLE_MAPS_API_KEY=SUA_CHAVE_AQUI
python google_maps_sem_site.py
```

## Como rodar com nichos específicos

```bat
set GOOGLE_MAPS_API_KEY=SUA_CHAVE_AQUI
python google_maps_sem_site.py --nichos dentista "clínica de estética" advogado contador
```

## Como abrir o painel HTML

Como o painel usa `fetch()` para ler os JSONs, abra com um servidor local simples na pasta:

```bat
cd /d D:\meu-contador\python_projects
python -m http.server 8080
```

Depois abra no navegador:

```text
http://localhost:8080/painel_google_maps.html
```

## Fluxo ideal de uso

1. abra um terminal na pasta do projeto
2. inicie o servidor local do HTML
3. abra o painel no navegador
4. em outro terminal, rode o script Python de coleta
5. acompanhe os leads entrando em tempo real no painel

## Exemplo completo

Terminal 1:

```bat
cd /d D:\meu-contador\python_projects
python -m http.server 8080
```

Terminal 2:

```bat
cd /d D:\meu-contador\python_projects
set GOOGLE_MAPS_API_KEY=SUA_CHAVE_AQUI
python google_maps_sem_site.py
```

## Observações importantes

- O script usa **API oficial**, não automação visual do navegador.
- A Places API pode ter **custos/quota**, dependendo da sua conta Google Cloud.
- Alguns estabelecimentos não expõem telefone ou podem ter cadastro incompleto.
- “Sem site” significa **sem website retornado pela API** no cadastro do local.
- O painel depende da existência dos arquivos JSON sendo atualizados pelo script.
