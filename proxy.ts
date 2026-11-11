import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Optimistic redirect for logged-in pages (#15). It only improves navigation: every protected
// route and page still checks the session itself (AGENTS.md "Every protected route checks auth first").
export const proxy = auth((request) => {
  if (request.auth?.user) return;
  const login = new URL('/login', request.nextUrl.origin);
  login.searchParams.set('callbackUrl', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
});

export const config = {
  matcher: ['/charts/:path*', '/consultations/:path*', '/admin/:path*'],
};
