import argparse
import csv
import json
import os
import time
from pathlib import Path
from typing import Iterable, List, Optional, Set

import requests


TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

DEFAULT_NICHES = [
    "dentista",
    "clínica odontológica",
    "clínica de estética",
    "advogado",
    "contador",
    "clínica médica",
    "eletricista",
    "encanador",
    "vidraçaria",
    "marmoraria",
]

DEFAULT_BAIRROS_ZONA_LESTE = [
    "Tatuapé",
    "Mooca",
    "Belém",
    "Carrão",
    "Vila Formosa",
    "Penha",
    "Vila Matilde",
    "Itaquera",
    "São Miguel Paulista",
    "Itaim Paulista",
    "Guaianases",
    "Cidade Patriarca",
    "Artur Alvim",
    "Vila Prudente",
    "Sapopemba",
    "Aricanduva",
]


def get_api_key() -> str:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("GOOGLE_PLACES_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Defina GOOGLE_MAPS_API_KEY ou GOOGLE_PLACES_API_KEY nas variáveis de ambiente."
        )
    return api_key


def text_search(api_key: str, query: str) -> List[dict]:
    results: List[dict] = []
    next_page_token: Optional[str] = None

    while True:
        params = {"key": api_key, "query": query, "language": "pt-BR", "region": "br"}
        if next_page_token:
            params = {"key": api_key, "pagetoken": next_page_token}
            time.sleep(2)

        response = requests.get(TEXT_SEARCH_URL, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        status = data.get("status")
        if status not in {"OK", "ZERO_RESULTS"}:
            raise RuntimeError(f"Erro no Text Search para '{query}': {status} - {data.get('error_message')}")

        results.extend(data.get("results", []))
        next_page_token = data.get("next_page_token")
        if not next_page_token:
            break

    return results


def place_details(api_key: str, place_id: str) -> dict:
    params = {
        "key": api_key,
        "place_id": place_id,
        "language": "pt-BR",
        "fields": "name,formatted_phone_number,international_phone_number,website,formatted_address,url,place_id,types",
    }
    response = requests.get(DETAILS_URL, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()

    status = data.get("status")
    if status != "OK":
        raise RuntimeError(f"Erro no Place Details ({place_id}): {status} - {data.get('error_message')}")

    return data.get("result", {})


def normalizar_lead(base: dict, details: dict, nicho: str, bairro: str) -> dict:
    return {
        "nicho": nicho,
        "bairro_consulta": bairro,
        "nome": details.get("name") or base.get("name", ""),
        "endereco": details.get("formatted_address") or base.get("formatted_address", ""),
        "telefone": details.get("formatted_phone_number") or details.get("international_phone_number", ""),
        "website": details.get("website", ""),
        "google_maps_url": details.get("url", ""),
        "place_id": details.get("place_id") or base.get("place_id", ""),
        "tipos": ", ".join(details.get("types", []) or base.get("types", [])),
    }


def gerar_consultas(nichos: Iterable[str], bairros: Iterable[str]) -> List[tuple[str, str, str]]:
    consultas: List[tuple[str, str, str]] = []
    for nicho in nichos:
        for bairro in bairros:
            query = f"{nicho} em {bairro}, Zona Leste, São Paulo, SP"
            consultas.append((nicho, bairro, query))
    return consultas


def salvar_csv(leads: List[dict], caminho: Path) -> None:
    campos = [
        "nicho",
        "bairro_consulta",
        "nome",
        "endereco",
        "telefone",
        "website",
        "google_maps_url",
        "place_id",
        "tipos",
    ]
    with caminho.open("w", newline="", encoding="utf-8-sig") as arquivo:
        writer = csv.DictWriter(arquivo, fieldnames=campos)
        writer.writeheader()
        writer.writerows(leads)


def salvar_json(leads: List[dict], caminho: Path) -> None:
    with caminho.open("w", encoding="utf-8") as arquivo:
        json.dump(leads, arquivo, ensure_ascii=False, indent=2)


def salvar_progresso(caminho: Path, payload: dict) -> None:
    with caminho.open("w", encoding="utf-8") as arquivo:
        json.dump(payload, arquivo, ensure_ascii=False, indent=2)


def atualizar_estado(
    leads: List[dict],
    consultas_total: int,
    consulta_atual: int,
    consulta_texto: str,
    csv_path: Path,
    json_path: Path,
    progress_path: Path,
    status: str,
    erros: List[str],
) -> None:
    salvar_csv(leads, csv_path)
    salvar_json(leads, json_path)
    salvar_progresso(
        progress_path,
        {
            "status": status,
            "consultas_total": consultas_total,
            "consulta_atual": consulta_atual,
            "consulta_texto": consulta_texto,
            "leads_encontrados": len(leads),
            "ultima_atualizacao": time.strftime("%Y-%m-%d %H:%M:%S"),
            "erros": erros[-20:],
        },
    )


def coletar_leads_sem_site(
    api_key: str,
    nichos: List[str],
    bairros: List[str],
    delay: float,
    csv_path: Path,
    json_path: Path,
    progress_path: Path,
) -> List[dict]:
    leads: List[dict] = []
    vistos: Set[str] = set()
    erros: List[str] = []
    consultas = gerar_consultas(nichos, bairros)
    total_consultas = len(consultas)

    atualizar_estado(
        leads,
        total_consultas,
        0,
        "Aguardando início",
        csv_path,
        json_path,
        progress_path,
        "iniciando",
        erros,
    )

    for indice, (nicho, bairro, query) in enumerate(consultas, start=1):
        print(f"[BUSCA] {query}")
        atualizar_estado(
            leads,
            total_consultas,
            indice,
            query,
            csv_path,
            json_path,
            progress_path,
            "buscando",
            erros,
        )

        try:
            resultados = text_search(api_key, query)
        except Exception as exc:
            mensagem = f"Falha na busca '{query}': {exc}"
            erros.append(mensagem)
            print(f"[ERRO] {mensagem}")
            atualizar_estado(
                leads,
                total_consultas,
                indice,
                query,
                csv_path,
                json_path,
                progress_path,
                "erro",
                erros,
            )
            continue

        for item in resultados:
            place_id = item.get("place_id")
            if not place_id or place_id in vistos:
                continue

            try:
                details = place_details(api_key, place_id)
                time.sleep(delay)
            except Exception as exc:
                mensagem = f"Falha ao detalhar {place_id}: {exc}"
                erros.append(mensagem)
                print(f"[ERRO] {mensagem}")
                atualizar_estado(
                    leads,
                    total_consultas,
                    indice,
                    query,
                    csv_path,
                    json_path,
                    progress_path,
                    "erro",
                    erros,
                )
                continue

            website = (details.get("website") or "").strip()
            if website:
                vistos.add(place_id)
                continue

            lead = normalizar_lead(item, details, nicho, bairro)
            leads.append(lead)
            vistos.add(place_id)
            print(f"[OK] Sem site: {lead['nome']} | {lead['telefone'] or 'sem telefone'}")

            atualizar_estado(
                leads,
                total_consultas,
                indice,
                query,
                csv_path,
                json_path,
                progress_path,
                "coletando",
                erros,
            )

    atualizar_estado(
        leads,
        total_consultas,
        total_consultas,
        "Finalizado",
        csv_path,
        json_path,
        progress_path,
        "concluido",
        erros,
    )
    return leads


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Coleta leads públicos do Google Places/Maps sem website na Zona Leste de São Paulo."
    )
    parser.add_argument(
        "--nichos",
        nargs="+",
        default=DEFAULT_NICHES,
        help="Lista de nichos para pesquisar. Ex.: --nichos dentista 'clínica de estética' advogado",
    )
    parser.add_argument(
        "--bairros",
        nargs="+",
        default=DEFAULT_BAIRROS_ZONA_LESTE,
        help="Lista de bairros da Zona Leste para consultar.",
    )
    parser.add_argument("--saida-csv", default="leads_zona_leste_sem_site.csv")
    parser.add_argument("--saida-json", default="leads_zona_leste_sem_site.json")
    parser.add_argument("--saida-progresso", default="progresso_google_maps.json")
    parser.add_argument(
        "--delay",
        type=float,
        default=0.25,
        help="Pausa entre chamadas de details para reduzir chance de limite/quota.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    api_key = get_api_key()

    csv_path = Path(args.saida_csv).resolve()
    json_path = Path(args.saida_json).resolve()
    progress_path = Path(args.saida_progresso).resolve()

    leads = coletar_leads_sem_site(
        api_key=api_key,
        nichos=args.nichos,
        bairros=args.bairros,
        delay=args.delay,
        csv_path=csv_path,
        json_path=json_path,
        progress_path=progress_path,
    )

    print("\nConcluído.")
    print(f"Leads encontrados sem site: {len(leads)}")
    print(f"CSV: {csv_path}")
    print(f"JSON: {json_path}")
    print(f"Progresso: {progress_path}")


if __name__ == "__main__":
    main()
