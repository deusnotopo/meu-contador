"""
╔══════════════════════════════════════════════════════════════╗
║   COLETOR DE LEADS - ZONA LESTE SP                          ║
║   Pequenos negócios sem site ou com domínio gratuito        ║
╚══════════════════════════════════════════════════════════════╝

REQUISITOS:
    pip install requests pandas tqdm colorama

COMO OBTER A CHAVE DA API GOOGLE:
    1. Acesse: https://console.cloud.google.com/
    2. Crie um projeto → APIs & Services → Enable APIs
    3. Ative: "Places API" e "Places API (New)"
    4. Crie uma credencial → API Key
    5. Cole sua chave em GOOGLE_API_KEY abaixo

LIMITES GRATUITOS (Google):
    - Places API: $200 de crédito/mês (~6.700 buscas grátis)
    - Este script é otimizado para ficar dentro do free tier
"""

import re
import sys
import time
from datetime import datetime
from typing import Optional

import pandas as pd
import requests
from colorama import Fore, init
from tqdm import tqdm

init(autoreset=True)

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

# ─────────────────────────────────────────────
#  ⚙️  CONFIGURAÇÕES — EDITE AQUI
# ─────────────────────────────────────────────

GOOGLE_API_KEY = "SUA_CHAVE_AQUI"   # 🔑 Substitua pela sua chave

# Bairros / regiões da Zona Leste para buscar
BAIRROS_ZONA_LESTE = [
    "Tatuapé, São Paulo",
    "Penha, São Paulo",
    "Vila Matilde, São Paulo",
    "Mooca, São Paulo",
    "Belém, São Paulo",
    "Aricanduva, São Paulo",
    "Itaquera, São Paulo",
    "Guaianases, São Paulo",
    "São Mateus, São Paulo",
    "Ermelino Matarazzo, São Paulo",
    "Cidade Tiradentes, São Paulo",
    "Sapopemba, São Paulo",
    "Vila Prudente, São Paulo",
    "Carrão, São Paulo",
    "Água Rasa, São Paulo",
]

# Tipos de negócios alvo (pequenos negócios)
TIPOS_NEGOCIO = [
    "restaurante",
    "lanchonete",
    "barbearia",
    "salão de beleza",
    "oficina mecânica",
    "pet shop",
    "farmácia",
    "padaria",
    "mercado",
    "açougue",
    "lavanderia",
    "borracharia",
    "eletricista",
    "encanador",
    "clínica odontológica",
    "academia",
    "papelaria",
    "loja de roupa",
    "sapataria",
    "dedetizadora",
]

# Domínios gratuitos / ruins (sem investimento real em web)
DOMINIOS_GRATUITOS = [
    "wix.com", "wixsite.com",
    "blogspot.com", "blogger.com",
    "wordpress.com",
    "weebly.com",
    "jimdo.com",
    "webnode.com", "webnode.com.br",
    "godaddysites.com",
    "site123.me",
    "squarespace.com",
    "netlify.app",
    "vercel.app",
    "github.io",
    "linktr.ee",
    "linkinbio",
    "carrd.co",
    "notion.site",
    "sites.google.com",
    "business.site",
    "negocio.site",
]

# Delay entre requisições (segundos) para não estourar rate limit
DELAY_ENTRE_REQUESTS = 0.5

# Arquivo de saída
ARQUIVO_SAIDA = f"leads_zonaLeste_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"


# ─────────────────────────────────────────────
#  🔍  FUNÇÕES PRINCIPAIS
# ─────────────────────────────────────────────

def banner():
    print(Fore.CYAN + """
╔══════════════════════════════════════════════════════╗
║    🎯 COLETOR DE LEADS — ZONA LESTE SP              ║
║    Negócios sem site ou com site ruim               ║
╚══════════════════════════════════════════════════════╝
""")


def verificar_api_key():
    """Verifica se a chave da API foi configurada."""
    if GOOGLE_API_KEY == "SUA_CHAVE_AQUI" or not GOOGLE_API_KEY:
        print(Fore.RED + "❌ ERRO: Configure sua GOOGLE_API_KEY no início do script!")
        print(Fore.YELLOW + "   Acesse: https://console.cloud.google.com/")
        raise SystemExit(1)


def classificar_site(url: str) -> str:
    """
    Retorna a classificação do site:
    'sem_site'      → não tem site cadastrado
    'dominio_gratis'→ tem site mas usa domínio gratuito
    'site_pago'     → tem domínio próprio pago
    """
    if not url:
        return "sem_site"

    url_lower = url.lower()
    for dominio in DOMINIOS_GRATUITOS:
        if dominio in url_lower:
            return "dominio_gratis"

    return "site_pago"


def eh_lead_qualificado(classificacao: str) -> bool:
    """Retorna True se o negócio é um lead válido para vender site."""
    return classificacao in ("sem_site", "dominio_gratis")


def buscar_lugares(query: str, location: str) -> list:
    """
    Busca lugares usando Google Places Text Search API.
    Retorna lista de resultados.
    """
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    resultados = []
    next_page_token = None

    for _ in range(3):  # máximo 3 páginas (60 resultados)
        params = {
            "query": f"{query} em {location}",
            "key": GOOGLE_API_KEY,
            "language": "pt-BR",
            "region": "br",
        }
        if next_page_token:
            params = {"pagetoken": next_page_token, "key": GOOGLE_API_KEY}
            time.sleep(2)  # obrigatório antes de usar next_page_token

        try:
            resp = requests.get(url, params=params, timeout=10)
            data = resp.json()

            if data.get("status") == "REQUEST_DENIED":
                print(Fore.RED + f"❌ API negada: {data.get('error_message', '')}")
                break

            resultados.extend(data.get("results", []))
            next_page_token = data.get("next_page_token")
            if not next_page_token:
                break

        except requests.RequestException as e:
            print(Fore.RED + f"⚠️  Erro de rede: {e}")
            break

    return resultados


def obter_detalhes(place_id: str) -> dict:
    """Busca detalhes completos de um lugar: telefone, site, endereço, etc."""
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    campos = [
        "name",
        "formatted_phone_number",
        "international_phone_number",
        "website",
        "formatted_address",
        "rating",
        "user_ratings_total",
        "business_status",
        "types",
        "url",
    ]

    params = {
        "place_id": place_id,
        "fields": ",".join(campos),
        "key": GOOGLE_API_KEY,
        "language": "pt-BR",
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        data = resp.json()
        return data.get("result", {})
    except requests.RequestException:
        return {}


def formatar_telefone(tel: str) -> str:
    """Limpa e formata o número de telefone."""
    if not tel:
        return ""
    return re.sub(r"[^\d+\-() ]", "", tel).strip()


def extrair_dominio(url: str) -> str:
    """Extrai o domínio principal de uma URL."""
    if not url:
        return ""
    match = re.search(r"(?:https?://)?(?:www\.)?([^/\s]+)", url)
    return match.group(1) if match else url


def processar_negocio(lugar: dict, bairro: str, tipo: str) -> Optional[dict]:
    """
    Dado um resultado do Places API, retorna o lead formatado
    ou None se não for qualificado.
    """
    place_id = lugar.get("place_id")
    if not place_id:
        return None

    detalhes = obter_detalhes(place_id)
    time.sleep(DELAY_ENTRE_REQUESTS)

    if detalhes.get("business_status") == "PERMANENTLY_CLOSED":
        return None

    nome = detalhes.get("name", "")
    telefone = formatar_telefone(detalhes.get("formatted_phone_number", ""))
    tel_intl = formatar_telefone(detalhes.get("international_phone_number", ""))
    site = detalhes.get("website", "")
    endereco = detalhes.get("formatted_address", "")
    rating = detalhes.get("rating", "")
    avaliacoes = detalhes.get("user_ratings_total", 0)
    maps_url = detalhes.get("url", "")

    classificacao = classificar_site(site)
    if not eh_lead_qualificado(classificacao):
        return None

    prioridade = "🔥 ALTA" if classificacao == "sem_site" else "🟡 MÉDIA"

    return {
        "Nome": nome,
        "Telefone BR": telefone,
        "Telefone Intl": tel_intl,
        "Tipo Negócio": tipo,
        "Bairro": bairro,
        "Endereço": endereco,
        "Site Atual": site if site else "(sem site)",
        "Domínio": extrair_dominio(site) if site else "",
        "Classificação": classificacao,
        "Prioridade": prioridade,
        "Avaliação": rating,
        "Nº Avaliações": avaliacoes,
        "Google Maps": maps_url,
        "Coletado Em": datetime.now().strftime("%d/%m/%Y %H:%M"),
    }


# ─────────────────────────────────────────────
#  🚀  EXECUÇÃO PRINCIPAL
# ─────────────────────────────────────────────

def main():
    banner()
    verificar_api_key()

    leads = []
    place_ids_vistos = set()

    total_combinacoes = len(BAIRROS_ZONA_LESTE) * len(TIPOS_NEGOCIO)
    print(
        Fore.YELLOW
        + f"📍 Bairros: {len(BAIRROS_ZONA_LESTE)} | "
        + f"🏪 Tipos: {len(TIPOS_NEGOCIO)} | "
        + f"🔄 Combinações: {total_combinacoes}\n"
    )

    barra = tqdm(total=total_combinacoes, desc="Buscando", colour="cyan")

    for bairro in BAIRROS_ZONA_LESTE:
        for tipo in TIPOS_NEGOCIO:
            barra.set_postfix_str(f"{tipo[:20]} | {bairro[:20]}")
            lugares = buscar_lugares(tipo, bairro)
            time.sleep(DELAY_ENTRE_REQUESTS)

            for lugar in lugares:
                pid = lugar.get("place_id")
                if pid in place_ids_vistos:
                    continue
                place_ids_vistos.add(pid)

                lead = processar_negocio(lugar, bairro, tipo)
                if lead:
                    leads.append(lead)

            barra.update(1)

    barra.close()

    if not leads:
        print(Fore.RED + "\n⚠️  Nenhum lead qualificado encontrado. Verifique a API key.")
        return

    df = pd.DataFrame(leads)
    ordem_class = {"sem_site": 0, "dominio_gratis": 1}
    df["_ordem"] = df["Classificação"].map(ordem_class).fillna(2)
    df = df.sort_values(["_ordem", "Nº Avaliações"], ascending=[True, False])
    df = df.drop(columns=["_ordem"])

    df.to_csv(ARQUIVO_SAIDA, index=False, encoding="utf-8-sig")

    sem_site = len(df[df["Classificação"] == "sem_site"])
    dom_gratis = len(df[df["Classificação"] == "dominio_gratis"])

    print(
        Fore.GREEN
        + f"""
╔══════════════════════════════════════════╗
║  ✅  COLETA FINALIZADA                  ║
╠══════════════════════════════════════════╣
║  📊 Total de leads:      {len(df):<16}║
║  🔥 Sem site algum:      {sem_site:<16}║
║  🟡 Com domínio grátis:  {dom_gratis:<16}║
║  💾 Arquivo salvo:                      ║
║     {ARQUIVO_SAIDA:<38}║
╚══════════════════════════════════════════╝
"""
    )

    print(Fore.CYAN + "─── TOP 10 LEADS (sem site) ───\n")
    top = df[df["Classificação"] == "sem_site"].head(10)
    for _, row in top.iterrows():
        print(f"  🏪 {row['Nome']}")
        print(f"     📞 {row['Telefone BR']}  |  📍 {row['Bairro']}")
        print(f"     ⭐ {row['Avaliação']} ({row['Nº Avaliações']} avaliações)")
        print()


if __name__ == "__main__":
    main()
