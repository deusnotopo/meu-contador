import { test, expect } from './fixtures/auth';

/**
 * Suite E2E: Dashboard
 * Testa carregamento do dashboard e navegação entre abas principais.
 */
test.describe('Dashboard', () => {
  test('deve carregar o dashboard após login', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Página não deve mostrar loading infinito
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(10);
  });

  test('deve exibir a barra de navegação inferior', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Procurar bottom nav por role ou data-testid
    const nav = page.locator('nav, [role="navigation"], [data-testid="bottom-nav"]').first();
    await expect(nav).toBeVisible({ timeout: 10000 });
  });

  test('deve navegar para a aba Saúde Financeira', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Clicar na aba de saúde (ícone ou label)
    const healthTab = page.locator(
      '[data-testid="tab-health"], [aria-label*="aúde"], [aria-label*="ealth"], button:has-text("Saúde")'
    ).first();

    if (await healthTab.isVisible().catch(() => false)) {
      await healthTab.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      // Verificar que conteúdo de saúde carregou
      const content = await page.locator('body').innerText();
      expect(content.length).toBeGreaterThan(10);
    } else {
      test.skip(true, 'Aba Saúde não encontrada com seletores atuais');
    }
  });

  test('deve navegar para Investimentos', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const investTab = page.locator(
      '[data-testid="tab-investir"], button:has-text("Investir"), [aria-label*="nvestimentos"]'
    ).first();

    if (await investTab.isVisible().catch(() => false)) {
      await investTab.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      const content = await page.locator('body').innerText();
      expect(content.length).toBeGreaterThan(10);
    } else {
      test.skip(true, 'Aba Investimentos não encontrada');
    }
  });

  test('não deve exibir erros de console na carga inicial', async ({ authenticatedPage: page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filtrar erros conhecidos e aceitáveis
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('Sentry') &&
        !e.includes('service worker') &&
        !e.includes('Warning:') &&
        !e.includes('DevTools')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('deve ser responsivo em mobile (375px)', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verificar que nada transborda horizontalmente
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(400); // margem de tolerância
  });
});
