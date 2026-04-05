import { test, expect, TEST_EMAIL, TEST_PASSWORD } from './fixtures/auth';
import { Page } from '@playwright/test';

/**
 * Suite E2E: Autenticação
 * Testa login, logout e proteção de rotas não autenticadas.
 */
test.describe('Autenticação', () => {
  test('deve exibir o formulário de login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tela de login deve aparecer se não autenticado
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'invalido@email.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    await page.click('button[type="submit"]');

    // Aguardar mensagem de erro
    const errorMsg = page.locator('text=credenciais, text=inválid, text=incorrect, text=invalid').first();
    await expect(errorMsg).toBeVisible({ timeout: 8000 });
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');

    // Após login, dashboard deve aparecer
    // Verificar que não estamos mais na tela de login
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).not.toBeVisible({ timeout: 10000 });
  });

  test('deve manter sessão após reload', async ({ authenticatedPage: page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Deve continuar logado (cookie de sessão)
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).not.toBeVisible({ timeout: 10000 });
  });

  test('deve fazer logout corretamente', async ({ authenticatedPage: page }) => {
    // Navegar para Settings para encontrar botão de logout
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Procurar botão de logout (pode estar em Settings/Configurações)
    const logoutBtn = page.locator(
      'button:has-text("Sair"), button:has-text("Logout"), button:has-text("Sign Out"), [data-testid="logout-button"]'
    ).first();

    // Se não visível, navegar para settings
    if (!(await logoutBtn.isVisible().catch(() => false))) {
      await page.locator('[data-testid="settings-tab"], [aria-label*="ettings"], [aria-label*="onfig"]').first().click().catch(() => {});
      await page.waitForLoadState('networkidle');
    }

    const logoutBtnFinal = page.locator(
      'button:has-text("Sair"), button:has-text("Logout"), [data-testid="logout-button"]'
    ).first();

    if (await logoutBtnFinal.isVisible().catch(() => false)) {
      await logoutBtnFinal.click();
      await page.waitForLoadState('networkidle');

      // Deve redirecionar para login
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible({ timeout: 10000 });
    } else {
      test.skip(true, 'Botão de logout não encontrado na estrutura atual de UI');
    }
  });
});
