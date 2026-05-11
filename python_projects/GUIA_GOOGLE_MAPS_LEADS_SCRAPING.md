# Scraping do Google Maps sem API

Arquivo principal:
- `google_maps_scraper_sem_api.py`

Esse script usa **Selenium** para abrir o Google Maps no navegador, pesquisar nichos e bairros da Zona Leste de São Paulo e coletar apenas negócios **sem website visível** na ficha.

## Arquivos gerados em tempo real

- `leads_zona_leste_sem_site.csv`
- `leads_zona_leste_sem_site.json`
- `progresso_google_maps.json`

Esses arquivos são compatíveis com o painel já criado:
- `painel_google_maps.html`

## Como executar

### Exemplo básico

```bat
cd /d D:\meu-contador\python_projects
python google_maps_scraper_sem_api.py
```

### Exemplo com navegador visível

```bat
cd /d D:\meu-contador\python_projects
python google_maps_scraper_sem_api.py --navegador edge
```

### Exemplo headless

```bat
cd /d D:\meu-contador\python_projects
python google_maps_scraper_sem_api.py --headless
```

### Limitar por consulta

```bat
python google_maps_scraper_sem_api.py --limite-por-consulta 5 --scrolls 6
```

## Painel em tempo real

Em outro terminal:

```bat
cd /d D:\meu-contador\python_projects
python -m http.server 8081 --directory D:\meu-contador\python_projects
```

Depois abra:

```text
http://localhost:8081/painel_google_maps.html
```

## Observações importantes

- Esse método depende da estrutura atual do Google Maps, então seletores podem precisar de ajuste no futuro.
- O Google Maps pode exibir captcha, bloqueios temporários ou consentimento de cookies.
- O ideal é testar primeiro com poucas consultas.
- Respeite os termos de uso do site e use intervalos moderados para evitar bloqueios.
- “Sem site” aqui significa: a ficha do local não exibiu link de website no momento da coleta.
