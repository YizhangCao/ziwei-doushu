/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview Picks the caller's IP address for per-IP rate limits. */

/**
 * Returns the client IP from the request headers, or `unknown`.
 *
 * On Vercel, `x-forwarded-for` starts with the client's address and Vercel
 * overwrites any value the client sent, so it cannot be spoofed there. Requests
 * without it (some local setups) share the `unknown` bucket.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown';
}
