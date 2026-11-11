/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.1
 * Created: November 10, 2026 · San Francisco, California, USA
 * Last Edited: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview Adds our user role to the Auth.js `User` type. */

import type { Role } from '@/lib/auth/types';

declare module '@auth/core/types' {
  interface User {
    /** Database role, copied onto `session.user` by the session callback in auth.ts. */
    role?: Role;
  }
}
