"""
╔══════════════════════════════════════════════════════════════╗
║   LEAD ENGINE PRO v4.0 — QUALITY ENRICHMENT                  ║
║   Asynchronous Harvester + ContactHunter AI                  ║
╚══════════════════════════════════════════════════════════════╝

Architecture:
- Resilient OSM: Targeted 3-niche focus (Dentist, Clinic, Beauty)
- ContactHunter: Meta-data crawler for phone enrichment
- Intelligent Scoring: Verification boost for contact leads
- Real-time: LiveBridge telemetry
"""

import asyncio
import json
import random
import re
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import aiofiles
import aiohttp
import pandas as pd
from colorama import Fore, init

# Windows Encoding Fix
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

init(autoreset=True)

# ─────────────────────────────────────────────
# 🛡️  CONFIGURATION
# ─────────────────────────────────────────────

BBOX_ZONA_LESTE = (-23.650, -46.640, -23.450, -46.360)

# Top 3 High-Ticket Categories
OSM_TAGS = {
    "amenity": ["dentist", "clinic", "physiotherapy", "doctors"],
    "shop": ["beauty", "hairdresser", "massage"],
}

DIAMOND_NICHE_KEYWORDS = ["dentista", "clinica", "consultorio", "estetica", "psicologia", "advogado", "contador", "fisioterapia"]

OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

PROJECT_ROOT = Path("D:/meu-contador/python_projects")
FILE_LEADS = PROJECT_ROOT / "leads_zona_leste_sem_site.json"
FILE_PROGRESS = PROJECT_ROOT / "progresso_google_maps.json"

@dataclass
class Lead:
    nome: str
    telefone: str = ""
    email: str = ""
    website: str = ""
    nicho: str = "Business"
    bairro_consulta: str = "Zona Leste"
    endereco: str = ""
    google_maps_url: str = ""
    fonte: str = "Generic"
    classificacao: str = "sem_site"
    score: int = 0
    lat: Optional[float] = None
    lon: Optional[float] = None
    coletado_em: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    def calculate_score(self):
        base_score = 0
        ws = str(self.website).lower() if self.website else ""
        if not ws:
            base_score += 60
            self.classificacao = "sem_site"
        elif any(dom in ws for dom in ["wix", "blogspot", "wordpress", "business.site", "negocio.site"]):
            base_score += 30
            self.classificacao = "dominio_gratis"
        else:
            self.classificacao = "site_pago"

        if any(kd in self.nome.lower() or kd in self.nicho.lower() for kd in DIAMOND_NICHE_KEYWORDS):
            base_score += 30  # Diamond bonus
        
        if self.telefone and is_mobile(self.telefone):
            base_score += 60  # Celular verificado — máximo valor
        
        if self.email:
            base_score += 30  # Email de contato direto
        
        self.score = base_score

class LiveBridge:
    def __init__(self, total_queries: int):
        self.total = total_queries
        self.current = 0
        self.leads: List[Lead] = []
        self.errors: List[str] = []
        self.status = "Iniciante"

    async def update(self, action: str, status: Optional[str] = None):
        if status: self.status = status
        print(Fore.CYAN + f"[{self.status}] {action} | Leads: {len(self.leads)}")

        progress = {
            "status": self.status,
            "consultas_total": self.total,
            "consulta_atual": self.current,
            "consulta_texto": action,
            "leads_encontrados": len(self.leads),
            "ultima_atualizacao": datetime.now().strftime("%H:%M:%S"),
            "erros": self.errors[-10:],
            "fonte": "AkitaEngine_v3.0"
        }
        
        try:
            async with aiofiles.open(FILE_PROGRESS, mode='w', encoding='utf-8') as f:
                await f.write(json.dumps(progress, ensure_ascii=False, indent=2))
            
            leads_data = [asdict(l) for l in sorted(self.leads, key=lambda x: x.score, reverse=True)]
            async with aiofiles.open(FILE_LEADS, mode='w', encoding='utf-8') as f:
                await f.write(json.dumps(leads_data, ensure_ascii=False, indent=2))
        except Exception: pass

    def add_lead(self, lead: Lead):
        if not any(l.nome.lower() == lead.nome.lower() for l in self.leads):
            lead.calculate_score()
            self.leads.append(lead)
            return True
        return False

def is_mobile(phone: str) -> bool:
    """Retorna True apenas se o número for um celular BR válido.
    Celular: DDD (2 dígitos) + 9 dígitos começando com 9 = 11 dígitos totais.
    Fixo:    DDD (2 dígitos) + 8 dígitos = 10 dígitos totais.
    """
    digits = re.sub(r'\D', '', phone)  # Remove tudo que não é número
    # Pode ter +55 na frente (código do país)
    if digits.startswith('55') and len(digits) in (12, 13):
        digits = digits[2:]  # Remove o código do país
    # Celular válido: 11 dígitos, 3º dígito (após DDD) = 9
    return len(digits) == 11 and digits[2] == '9'


class ContactHunter:
    """Enriches leads with contact info by mining search snippets."""
    
    # Lista de telefones sabidamente falsos ou genéricos (Google/DDG ads, listons, etc)
    BLACKLIST = {"(19) 6053-7479", "(00) 0000-0000"}

    @staticmethod
    async def find_phone(session: aiohttp.ClientSession, name: str, city: str = "São Paulo") -> str:
        # Se for um nome muito genérico (só uma palavra comum), ignorar para evitar lixo
        if len(name.split()) < 2 and name.lower() in ["estetica", "clinica", "dentista", "odontologia"]:
            return ""

        # Usando aspas para forçar correspondência exata do nome e buscando no DuckDuckGo (HTML mais limpo que Google)
        query = f'"{name}" {city}'
        search_url = f"https://html.duckduckgo.com/html/?q={query.replace(' ', '+')}"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
        
        try:
            async with session.get(search_url, headers=headers, timeout=8) as resp:
                if resp.status == 200:
                    text = await resp.text()
                    # Regex EXCLUSIVA para celular BR: DDD + 9 + 4 dígitos + 4 dígitos
                    # Ex: (11) 98765-4321  |  11 987654321  |  +55 11 98765-4321
                    phones = re.findall(r'\(?([1-9][0-9])\)?[\s.-]?(9[0-9]{4})[\s.-]?([0-9]{4})', text)
                    if phones:
                        valid_phones = []
                        for p in phones:
                            phone_str = f"({p[0]}) {p[1]}-{p[2]}"
                            if phone_str not in ContactHunter.BLACKLIST and is_mobile(phone_str):
                                valid_phones.append(phone_str)
                        
                        if valid_phones:
                            from collections import Counter
                            # Pega o celular mais frequente nos resultados
                            most_common = Counter(valid_phones).most_common(1)[0][0]
                            return most_common
        except: pass
        return ""


class OSMEngine:
    def __init__(self, bridge: LiveBridge):
        self.bridge = bridge

    async def fetch_from_mirror(self, mirror: str, query: str):
        headers = {
            "User-Agent": "AkitaLeadHarvester/2.0 (Contact: collector@akita.tech)",
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(mirror, data={"data": query}, headers=headers, timeout=45) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    self.bridge.errors.append(f"Mirror {mirror} returned {resp.status}")
            except Exception as e:
                self.bridge.errors.append(f"Mirror {mirror} connection error")
        return None

    async def run(self):
        s, w, n, e = BBOX_ZONA_LESTE
        query = f"[out:json][timeout:90];("
        for k, vals in OSM_TAGS.items():
            for v in vals:
                query += f"node['{k}'='{v}']({s},{w},{n},{e});way['{k}'='{v}']({s},{w},{n},{e});"
        query += ");out center tags;"

        for mirror in OVERPASS_MIRRORS:
            await self.bridge.update(f"Consultando OSM Mirror: {mirror.split('//')[1][:20]}...")
            data = await self.fetch_from_mirror(mirror, query)
            if data and "elements" in data:
                for el in data["elements"]:
                    tags = el.get("tags", {})
                    nome = tags.get("name")
                    if not nome: continue
                    
                    # Filtering for leads (no website or free website)
                    website = tags.get("website", tags.get("contact:website", ""))
                    
                    lat = el.get("lat") or el.get("center", {}).get("lat")
                    lon = el.get("lon") or el.get("center", {}).get("lon")
                    
                    # Validar se o telefone do OSM é celular; se for fixo, descarta para enriquecimento
                    raw_phone = tags.get("phone", tags.get("contact:phone", ""))
                    osm_phone = raw_phone if (raw_phone and is_mobile(raw_phone)) else ""

                    # Capturar email diretamente do OSM
                    osm_email = tags.get("email", tags.get("contact:email", "")).strip().lower()

                    lead = Lead(
                        nome=nome,
                        telefone=osm_phone,
                        email=osm_email,
                        website=website,
                        nicho=tags.get("amenity", tags.get("shop", "Negócio")),
                        endereco=f"{tags.get('addr:street', '')}, {tags.get('addr:housenumber', '')}",
                        google_maps_url=f"https://www.google.com/maps?q={lat},{lon}" if lat else "",
                        fonte="OpenStreetMap",
                        lat=lat,
                        lon=lon
                    )

                    # Enriquecimento: busca celular no DuckDuckGo se não encontrou no OSM
                    if not lead.telefone:
                        async with aiohttp.ClientSession() as session:
                            lead.telefone = await ContactHunter.find_phone(session, nome, "São Paulo")
                            if lead.telefone:
                                await self.bridge.update(f"📱 Celular encontrado: {nome[:20]}")
                    
                    # FILTRO DE QUALIDADE: só entra na base se tiver celular OU email
                    # Lead sem nenhuma forma de contato = descartado imediatamente
                    if not lead.telefone and not lead.email:
                        continue

                    if self.bridge.add_lead(lead):
                        # Frequent update for first leads, then throttle
                        if len(self.bridge.leads) < 10 or len(self.bridge.leads) % 5 == 0:
                            await self.bridge.update(f"Lead Encontrado: {nome[:20]}")
                return True
        return False

async def main():
    print(Fore.CYAN + "🚀 Initializing LEAD ENGINE v3.0 (Akita Hardened)...")
    bridge = LiveBridge(total_queries=1)
    
    await bridge.update("Iniciando Harvester...", status="Executando")
    
    osm = OSMEngine(bridge)
    success = await osm.run()
    
    if success:
        await bridge.update("Busca Finalizada", status="Concluido")
        # Final export
        df = pd.DataFrame([asdict(l) for l in bridge.leads])
        if not df.empty:
            df = df.sort_values("score", ascending=False)
            df.to_csv(PROJECT_ROOT / "leads_zona_leste_final.csv", index=False, encoding='utf-8-sig')
            print(Fore.GREEN + f"\n✅ Success! {len(df)} High-Quality Leads harvested.")
    else:
        await bridge.update("Falha em todos os mirrors", status="Erro")
        print(Fore.RED + "\n❌ Failed to connect to any data source.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(Fore.YELLOW + "\n⚠️  Halted.")
