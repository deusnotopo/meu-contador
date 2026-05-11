import argparse
import csv
import json
import os
import time
from pathlib import Path
from typing import Iterable, List, Optional, Set, Tuple
from urllib.parse import quote_plus

from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException, TimeoutException, WebDriverException
from selenium.webdriver import ChromeOptions, EdgeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

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


def gerar_consultas(nichos: Iterable[str], bairros: Iterable[str]) -> List[Tuple[str, str, str]]:
    consultas: List[Tuple[str, str, str]] = []
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
            "fonte": "google_maps_scraping",
        },
    )


def detectar_driver_path(nome: str) -> Optional[str]:
    candidatos = [
        Path.cwd() / nome,
        Path("C:/Users/GN/Desktop") / nome,
        Path("D:/meu-contador") / nome,
        Path("D:/meu-contador/python_projects") / nome,
    ]
    for candidato in candidatos:
        if candidato.exists():
            return str(candidato)
    return None


def tentar_edge(headless: bool, usar_driver_local: bool) -> webdriver.Remote:
    options = EdgeOptions()
    options.use_chromium = True
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    if headless:
        options.add_argument("--headless=new")

    if not usar_driver_local:
        return webdriver.Edge(options=options)

    service_path = detectar_driver_path("msedgedriver.exe")
    service = EdgeService(executable_path=service_path) if service_path else EdgeService()
    return webdriver.Edge(service=service, options=options)


def tentar_chrome(headless: bool, usar_driver_local: bool) -> webdriver.Remote:
    options = ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    if headless:
        options.add_argument("--headless=new")

    if not usar_driver_local:
        return webdriver.Chrome(options=options)

    service_path = detectar_driver_path("chromedriver.exe")
    service = ChromeService(executable_path=service_path) if service_path else ChromeService()
    return webdriver.Chrome(service=service, options=options)


def criar_driver(headless: bool, navegador: str, usar_driver_local: bool) -> webdriver.Remote:
    ultimo_erro: Optional[Exception] = None

    if navegador in {"edge", "auto"}:
        try:
            return tentar_edge(headless=headless, usar_driver_local=usar_driver_local)
        except Exception as exc:
            ultimo_erro = exc
            if navegador == "edge":
                raise

    if navegador in {"chrome", "auto"}:
        try:
            return tentar_chrome(headless=headless, usar_driver_local=usar_driver_local)
        except Exception as exc:
            ultimo_erro = exc
            if navegador == "chrome":
                raise

    raise RuntimeError(f"Não foi possível iniciar o navegador automaticamente: {ultimo_erro}")


def extrair_place_id(url: str) -> str:
    if "1s" in url:
        try:
            return url.split("1s", 1)[1].split("!", 1)[0]
        except Exception:
            return ""
    return ""


def texto_por_xpath(driver: webdriver.Remote, xpath: str) -> str:
    try:
        return driver.find_element(By.XPATH, xpath).text.strip()
    except NoSuchElementException:
        return ""


def href_por_xpath(driver: webdriver.Remote, xpath: str) -> str:
    try:
        return (driver.find_element(By.XPATH, xpath).get_attribute("href") or "").strip()
    except NoSuchElementException:
        return ""


def encontrar_painel_resultados(driver: webdriver.Remote):
    seletores = [
        "//div[contains(@role,'feed')]",
        "//div[contains(@aria-label,'Resultados para')]",
        "//div[contains(@aria-label,'Results for')]",
    ]
    for seletor in seletores:
        try:
            return driver.find_element(By.XPATH, seletor)
        except NoSuchElementException:
            continue
    raise NoSuchElementException("Painel de resultados não encontrado")


def encontrar_links_resultados(driver: webdriver.Remote):
    seletores = [
        "//a[contains(@href, '/maps/place')]",
        "//div[@role='feed']//a[contains(@href, '/maps/place')]",
    ]
    vistos = []
    chaves = set()
    for seletor in seletores:
        for elemento in driver.find_elements(By.XPATH, seletor):
            href = (elemento.get_attribute("href") or "").strip()
            texto = (elemento.text or "").strip()
            chave = href or texto
            if not chave or chave in chaves:
                continue
            chaves.add(chave)
            vistos.append(elemento)
    return vistos


def coletar_links_resultados(driver: webdriver.Remote, scrolls: int, pausa: float):
    painel = encontrar_painel_resultados(driver)
    ultima_quantidade = 0
    repeticoes_sem_novidade = 0

    for _ in range(scrolls):
        links = encontrar_links_resultados(driver)
        quantidade = len(links)
        if quantidade == ultima_quantidade:
            repeticoes_sem_novidade += 1
        else:
            repeticoes_sem_novidade = 0
        if repeticoes_sem_novidade >= 3:
            break
        ultima_quantidade = quantidade
        driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", painel)
        time.sleep(pausa)

    return encontrar_links_resultados(driver)


def abrir_query(driver: webdriver.Remote, query: str, wait: WebDriverWait):
    url = f"https://www.google.com/maps/search/{quote_plus(query)}"
    driver.get(url)
    wait.until(lambda d: "/maps" in d.current_url)
    time.sleep(3)

    # tenta aceitar consentimento caso apareça
    possiveis_botoes = [
        "//button[contains(., 'Aceitar')]",
        "//button[contains(., 'I agree')]",
        "//button[contains(., 'Accept all')]",
    ]
    for xpath in possiveis_botoes:
        try:
            driver.find_element(By.XPATH, xpath).click()
            time.sleep(2)
            break
        except NoSuchElementException:
            continue
        except WebDriverException:
            continue

    wait.until(lambda d: len(encontrar_links_resultados(d)) > 0 or "/place/" in d.current_url)


def extrair_detalhes_local(driver: webdriver.Remote, nicho: str, bairro: str) -> dict:
    time.sleep(2)
    url_atual = driver.current_url
    nome = texto_por_xpath(driver, "//h1")
    endereco = texto_por_xpath(driver, "//button[@data-item-id='address']//div[contains(@class,'fontBodyMedium')]")
    if not endereco:
        endereco = texto_por_xpath(driver, "//button[contains(@data-item-id,'address')]")
    telefone = texto_por_xpath(driver, "//button[contains(@data-item-id,'phone:tel')]//div[contains(@class,'fontBodyMedium')]")
    if not telefone:
        telefone = texto_por_xpath(driver, "//button[contains(@data-item-id,'phone:tel')]")
    website = href_por_xpath(driver, "//a[contains(@data-item-id,'authority')]")
    tipos = texto_por_xpath(driver, "//button[contains(@jsaction,'pane.rating.category')]")

    return {
        "nicho": nicho,
        "bairro_consulta": bairro,
        "nome": nome,
        "endereco": endereco,
        "telefone": telefone,
        "website": website,
        "google_maps_url": url_atual,
        "place_id": extrair_place_id(url_atual),
        "tipos": tipos,
    }


def coletar_leads_sem_site(
    driver: webdriver.Remote,
    nichos: List[str],
    bairros: List[str],
    csv_path: Path,
    json_path: Path,
    progress_path: Path,
    limite_por_consulta: int,
    scrolls: int,
    pausa_scroll: float,
) -> List[dict]:
    wait = WebDriverWait(driver, 20)
    leads: List[dict] = []
    vistos: Set[str] = set()
    erros: List[str] = []
    consultas = gerar_consultas(nichos, bairros)
    total_consultas = len(consultas)

    atualizar_estado(leads, total_consultas, 0, "Aguardando início", csv_path, json_path, progress_path, "iniciando", erros)

    for indice, (nicho, bairro, query) in enumerate(consultas, start=1):
        try:
            print(f"[BUSCA] {query}")
            atualizar_estado(leads, total_consultas, indice, query, csv_path, json_path, progress_path, "buscando", erros)
            abrir_query(driver, query, wait)
            links = coletar_links_resultados(driver, scrolls=scrolls, pausa=pausa_scroll)
        except Exception as exc:
            mensagem = f"Falha ao abrir a busca '{query}': {exc}"
            erros.append(mensagem)
            print(f"[ERRO] {mensagem}")
            atualizar_estado(leads, total_consultas, indice, query, csv_path, json_path, progress_path, "erro", erros)
            continue

        processados = 0
        hrefs = []
        for link in links:
            href = (link.get_attribute("href") or "").strip()
            if href and href not in hrefs:
                hrefs.append(href)

        for href in hrefs:
            if processados >= limite_por_consulta:
                break
            try:
                driver.get(href)
                wait.until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
                lead = extrair_detalhes_local(driver, nicho, bairro)
                chave = lead.get("google_maps_url") or lead.get("place_id") or lead.get("nome")
                if not chave or chave in vistos:
                    continue
                vistos.add(chave)

                if lead.get("website"):
                    continue

                leads.append(lead)
                processados += 1
                print(f"[OK] Sem site: {lead['nome']} | {lead['telefone'] or 'sem telefone'}")
                atualizar_estado(leads, total_consultas, indice, query, csv_path, json_path, progress_path, "coletando", erros)
            except Exception as exc:
                mensagem = f"Falha ao coletar resultado de '{query}': {exc}"
                erros.append(mensagem)
                print(f"[ERRO] {mensagem}")
                atualizar_estado(leads, total_consultas, indice, query, csv_path, json_path, progress_path, "erro", erros)
                continue

    atualizar_estado(leads, total_consultas, total_consultas, "Finalizado", csv_path, json_path, progress_path, "concluido", erros)
    return leads


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scraping do Google Maps sem API para coletar negócios sem site.")
    parser.add_argument("--nichos", nargs="+", default=DEFAULT_NICHES)
    parser.add_argument("--bairros", nargs="+", default=DEFAULT_BAIRROS_ZONA_LESTE)
    parser.add_argument("--saida-csv", default="leads_zona_leste_sem_site.csv")
    parser.add_argument("--saida-json", default="leads_zona_leste_sem_site.json")
    parser.add_argument("--saida-progresso", default="progresso_google_maps.json")
    parser.add_argument("--headless", action="store_true", help="Executa o navegador sem interface.")
    parser.add_argument("--navegador", choices=["auto", "edge", "chrome"], default="auto")
    parser.add_argument(
        "--usar-driver-local",
        action="store_true",
        help="Força uso do chromedriver/msedgedriver local encontrado no computador.",
    )
    parser.add_argument("--limite-por-consulta", type=int, default=10)
    parser.add_argument("--scrolls", type=int, default=8)
    parser.add_argument("--pausa-scroll", type=float, default=2.0)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    csv_path = Path(args.saida_csv).resolve()
    json_path = Path(args.saida_json).resolve()
    progress_path = Path(args.saida_progresso).resolve()

    driver = criar_driver(
        headless=args.headless,
        navegador=args.navegador,
        usar_driver_local=args.usar_driver_local,
    )
    try:
        leads = coletar_leads_sem_site(
            driver=driver,
            nichos=args.nichos,
            bairros=args.bairros,
            csv_path=csv_path,
            json_path=json_path,
            progress_path=progress_path,
            limite_por_consulta=args.limite_por_consulta,
            scrolls=args.scrolls,
            pausa_scroll=args.pausa_scroll,
        )
        print("\nConcluído.")
        print(f"Leads encontrados sem site: {len(leads)}")
        print(f"CSV: {csv_path}")
        print(f"JSON: {json_path}")
        print(f"Progresso: {progress_path}")
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
