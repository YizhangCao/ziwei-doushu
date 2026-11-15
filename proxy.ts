/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.2
 * Created: November 10, 2026 · San Francisco, California, USA
 * Last Edited: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Next.js proxy for member pages: sends signed-out visitors to
 * /login, and answers 403 to signed-in users outside the page's role.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { pageAccess } from '@/lib/auth/page-access';
import { toSessionUser } from '@/lib/auth/session';

/**
 * Redirects requests without a session to /login, keeping the original path and
 * query in `callbackUrl`, and shows the 403 page, with a 403 status, to non-admins
 * on /admin. This only improves navigation: every protected page and route still
 * checks the session itself.
 */
export const proxy = auth((request) => {
  const user = toSessionUser({ sub: request.auth?.user?.id, role: request.auth?.user?.role });
  const access = pageAccess(request.nextUrl.pathname, user);
  if (access === 'allow') return;
  if (access === 'forbidden') return NextResponse.rewrite(new URL('/forbidden', request.nextUrl.origin), { status: 403 });

  const login = new URL('/login', request.nextUrl.origin);
  login.searchParams.set('callbackUrl', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
});

/** Member-only paths the proxy runs on. */
export const config = {
  matcher: ['/charts/:path*', '/consultations/:path*', '/admin/:path*'],
};
