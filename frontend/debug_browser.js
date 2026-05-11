const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Captura os logs do navegador e imprime no nosso terminal
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      console.log(`[BROWSER UNCAUGHT ERROR] ${error.message}`);
    });

    console.log("Iniciando navegação para http://localhost:5173 ...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Aguarda mais um segundinho pra ver se algum erro assíncrono pipoca
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Navegação concluída.");
    await browser.close();
  } catch (err) {
    console.error("Erro no script:", err);
  }
})();
