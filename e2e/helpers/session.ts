import type { Page } from '@playwright/test';

/**
 * Makes the page see a signed-in member by answering /api/auth/session (#118). The AI
 * reading panel shows only for members, so specs that stub /api/interpret sign in this way.
 * Nothing reaches the database: server routes still see a guest, which is why every spec
 * that uses this also stubs /api/interpret.
 */
export async function stubMemberSession(page: Page): Promise<void> {
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      json: { user: { name: 'E2E Member', email: 'e2e-session@ziweihub.test', role: 'member' }, expires: '2099-01-01T00:00:00.000Z' },
    }),
  );
}
