import asyncio
import aiohttp
import re

async def test_search():
    query = "Climesp Fisioterapia São Paulo telefone"
    url = f"https://html.duckduckgo.com/html/?q={query.replace(' ', '+')}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            text = await resp.text()
            phones = re.findall(r'\(?([1-9][1-9])\)?\s?(9?[0-9]{4})-?([0-9]{4})', text)
            print("DDG HTML:", phones)

    # test google
    url_g = f"https://www.google.com/search?q={query.replace(' ', '+')}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url_g, headers=headers) as resp:
            text = await resp.text()
            phones = re.findall(r'\(?([1-9][1-9])\)?\s?(9?[0-9]{4})-?([0-9]{4})', text)
            print("Google HTML:", phones)

asyncio.run(test_search())
