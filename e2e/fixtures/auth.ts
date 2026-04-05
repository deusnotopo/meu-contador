import { test as base, expect, Page } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@mecontador.app';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPassword123';

type AuthFixtures = {
  authenticatedPage: Page;
};

/**
 * Fixture: página já autenticada via login de email/senha.
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Se já estiver logado (token em cookie), pular login
    const isLoggedIn = await page.locator('[data-testid="bottom-nav"]').isVisible().catch(() => false);
    if (!isLoggedIn) {
      await page.fill('[data-testid="email-input"], input[type="email"]', TEST_EMAIL);
      await page.fill('[data-testid="password-input"], input[type="password"]', TEST_PASSWORD);
      await page.click('[data-testid="login-button"], button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }

    await use(page);
  },
});

export { expect };
export { TEST_EMAIL, TEST_PASSWORD };
