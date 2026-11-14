/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview /api-docs (#25): Swagger UI renders the public API from docs/openapi.yaml. */

import { test, expect } from '@playwright/test';

test('a guest can read the public API docs at /api-docs', async ({ page }) => {
  await page.goto('/api-docs');

  await expect(page.getByRole('heading', { name: 'API 文档' })).toBeVisible();
  // Rendered by Swagger UI from the spec, so this fails if the spec does not load.
  await expect(page.getByText('ZiweiHub public API')).toBeVisible();
  await expect(page.locator('.opblock-summary-path', { hasText: '/api/v1/charts' })).toBeVisible();
});
