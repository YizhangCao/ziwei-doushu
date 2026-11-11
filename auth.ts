import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { prisma } from '@/lib/db';
import { toSessionUser, upsertUserFromProfile } from '@/lib/auth/session';

// Auth.js (NextAuth v5) with GitHub OAuth and JWT sessions; no database adapter (#15).
// Env: AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    async jwt({ token, user, account }) {
      // `account` is only present on sign-in: link the GitHub login to our User row by email,
      // and keep our own user id and role in the token from then on.
      if (account && user) {
        const dbUser = await upsertUserFromProfile(prisma, { email: user.email, name: user.name, image: user.image });
        token.sub = dbUser.id;
        token.role = dbUser.role;
      }
      return token;
    },
    session({ session, token }) {
      const user = toSessionUser(token);
      if (user && session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
});
