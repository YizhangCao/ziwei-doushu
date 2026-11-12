/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The message the reading panels show for a 429. No server imports:
 * client components use it.
 */

/**
 * Builds the user-facing message for a rate-limited AI request.
 *
 * @param retryAfterSeconds The response's Retry-After value; NaN or 0 if missing.
 */
export function rateLimitMessage(retryAfterSeconds: number): string {
  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0) return 'AI 解读请求太频繁，请稍后再试。';
  const minutes = Math.ceil(retryAfterSeconds / 60);
  const wait = minutes < 60 ? `${minutes} 分钟` : `${Math.ceil(minutes / 60)} 小时`;
  return `AI 解读请求太频繁，请约 ${wait}后再试。`;
}
