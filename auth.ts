/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.2
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
import { toSessionUser, upsertUserFromProfile } from '@/lib/auth/session';

/**
 * Auth.js entry points: the `/api/auth/*` route `handlers`, `auth()` for reading
 * the session on the server, and the `signIn` / `signOut` server actions.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    async jwt({ token, user, account }) {
      // `account` is set only on sign-in. Resolve the GitHub account to our User row once,
      // then carry our own user id and role in the token.
      if (account?.provider === 'github' && user) {
        const dbUser = await upsertUserFromProfile(prisma, {
          githubId: account.providerAccountId,
          email: user.email,
          name: user.name,
          image: user.image,
        });
        token.sub = dbUser.id;
        token.role = dbUser.role;
      }
      return token;
    },
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
