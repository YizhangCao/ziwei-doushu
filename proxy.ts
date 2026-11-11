/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.1
 * Created: November 10, 2026 · San Francisco, California, USA
 * Last Edited: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Next.js proxy that sends signed-out visitors from member pages
 * to /login.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Redirects requests without a session to /login, keeping the original path and
 * query in `callbackUrl`. This only improves navigation: every protected page and
 * route still checks the session itself.
 */
export const proxy = auth((request) => {
  if (request.auth?.user) return;
  const login = new URL('/login', request.nextUrl.origin);
  login.searchParams.set('callbackUrl', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
});

/** Member-only paths the proxy runs on. */
export const config = {
  matcher: ['/charts/:path*', '/consultations/:path*', '/admin/:path*'],
};
