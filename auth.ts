/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.4
 * Created: November 10, 2026 · San Francisco, California, USA
 * Last Edited: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Auth.js (NextAuth v5) configuration: GitHub OAuth, JWT sessions,
 * no database adapter. Reads AUTH_SECRET, AUTH_GITHUB_ID and AUTH_GITHUB_SECRET.
 */

import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { prisma } from '@/lib/db';
import { resolveToken, toSessionUser } from '@/lib/auth/session';

/**
 * Auth.js entry points: the `/api/auth/*` route `handlers`, `auth()` for reading
 * the session on the server, and the `signIn` / `signOut` server actions.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    // Sign-in resolves the GitHub account to our User row; every later read refreshes a
    // stale role and ends the session if the user no longer exists.
    jwt: ({ token, user, account }) => resolveToken(prisma, { token, user, account }, Date.now()),
    session({ session, token }) {
      // Expose only a validated id and role; a malformed token leaves both unset,
      // which the auth guards treat as signed out.
      const user = toSessionUser(token);
      if (user && session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
});
