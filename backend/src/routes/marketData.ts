import { Router } from "express";
import axios from "axios";

const router = Router();

// Endpoint proxy para dados de mercado (Moedas e Taxas)
router.get("/", async (req, res) => {
  try {
    // 1. Fetch Crypto do CoinGecko (Public API - No auth required)
    const cryptoRes = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl");
    const cryptoData = cryptoRes.data;

    // 2. Fetch Tradicional do HG Brasil (Taxas e Moedas)
    // Se não tiver API Key configurada, cairemos para um mock razoável ou tentaremos rota publica limitada.
    // Rota pública tem CORS block no navegador, mas funciona chamando via servidor Node.
    let hgData = {
        results: {
            currencies: { USD: { buy: 5.75 } },
            taxes: [ { cdi: 11.15, selic: 11.25 } ]
        }
    };
    
    try {
        const hgRes = await axios.get("https://api.hgbrasil.com/finance?format=json");
        hgData = hgRes.data;
    } catch(err) {
        console.log("Falha ao puxar da HG Brasil, mantendo fallback");
    }

    const usdRate = hgData.results?.currencies?.USD?.buy || 5.75;
    const taxes = hgData.results?.taxes || [];
    const selic = taxes.length > 0 && taxes[0].selic ? taxes[0].selic : 11.25;
    const cdi = taxes.length > 0 && taxes[0].cdi ? taxes[0].cdi : 11.15;

    return res.json({
      btc: cryptoData.bitcoin?.brl || 520000,
      eth: cryptoData.ethereum?.brl || 17000,
      usd: usdRate,
      selic: selic,
      cdi: cdi,
    });
  } catch (error) {
    console.error("Failed to fetch proxy market data:", error);
    return res.status(500).json({ error: "Failed to fetch market data" });
  }
});

export default router;
