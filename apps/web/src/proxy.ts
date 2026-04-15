import { getSessionCookie } from 'better-auth/cookies';
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { type NextRequest, NextResponse } from 'next/server';
import { docsContentRoute, docsRoute } from '@/lib/shared';
import { getSession } from './actions/get-session';

const { rewrite: rewriteDocs } = rewritePath(
  `${docsRoute}{/*path}`,
  `${docsContentRoute}{/*path}/content.md`
);
const { rewrite: rewriteSuffix } = rewritePath(
  `${docsRoute}{/*path}.mdx`,
  `${docsContentRoute}{/*path}/content.md`
);

const runDocsMiddleware = (request: NextRequest) => {
  const result = rewriteSuffix(request.nextUrl.pathname);

  if (result) {
    return NextResponse.rewrite(new URL(result, request.nextUrl));
  }

  if (isMarkdownPreferred(request)) {
    const result = rewriteDocs(request.nextUrl.pathname);

    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl));
    }
  }
};

const authMiddleware = {
  serverPathMatchers: ['/dashboard'],
  optimisticPathMatchers: [],
  async runServer(request: NextRequest) {
    const sessionResponse = await getSession();

    // Error checking session (network error, server error, etc.)
    if (!sessionResponse.ok) {
      const error = sessionResponse.error;
      console.error('Error checking session in auth middleware:', error);
      const url = new URL('/auth/error', request.url);
      const message = `Unable to verify session: ${error.message}`;
      url.searchParams.set('next', request.nextUrl.pathname);
      url.searchParams.set('error', message);
      return NextResponse.redirect(url);
    }

    // Unauthenticated
    if (sessionResponse.data === null) {
      const url = new URL('/auth/sign-in', request.url);
      url.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Authenticated, proceed to the requested page
    return null;
  },
  async runOptimistic(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);

    // Not (optimistically) authenticated, redirect to sign-in
    // This is the recommended approach to optimistically redirect users
    // We recommend handling auth checks in each page/route (THIS IS NOT SECURE!!!)
    if (!sessionCookie) {
      const url = new URL('/auth/sign-in', request.url);
      url.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    return null;
  },
};

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith(docsRoute)) {
    const response = runDocsMiddleware(request);

    if (response) {
      return response;
    }
  }

  if (
    authMiddleware.serverPathMatchers.some((matcher) => pathname === matcher)
  ) {
    const response = await authMiddleware.runServer(request);

    if (response) {
      return response;
    }
  } else if (
    authMiddleware.optimisticPathMatchers.some(
      (matcher) => pathname === matcher
    )
  ) {
    const response = await authMiddleware.runOptimistic(request);

    if (response) {
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', `/docs:path*`],
};
