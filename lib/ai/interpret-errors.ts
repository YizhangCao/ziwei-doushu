/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 13, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The /api/interpret error body the reading panel acts on (#118). No imports:
 * the panel is a 'use client' component and imports this.
 */

/** The 500 body's error when the AI isn't set up: final until the deployment is fixed. */
export const AI_NOT_CONFIGURED = 'AI service is not configured';

/**
 * Whether a 500 body says the AI isn't set up, which a retry can't fix. The route also
 * answers 500 for an Anthropic outage or a database timeout, and those can pass.
 *
 * @param body The parsed JSON body, or null when it wasn't JSON.
 */
export function isAiNotConfigured(body: unknown): boolean {
  return typeof body === 'object' && body !== null && (body as { error?: unknown }).error === AI_NOT_CONFIGURED;
}
