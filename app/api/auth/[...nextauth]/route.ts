/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.1
 * Created: November 10, 2026 · San Francisco, California, USA
 * Last Edited: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Auth.js endpoints under /api/auth: sign-in, OAuth callback,
 * sign-out, session and CSRF.
 */

import { handlers } from '@/auth';

export const { GET, POST } = handlers;
