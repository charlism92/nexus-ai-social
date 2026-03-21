import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['en-us', 'es-es'];
const DEFAULT_LOCALE = 'en-us';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the URL already has a locale prefix
  const hasLocale = LOCALES.some(l => pathname.startsWith(`/${l}`));

  if (hasLocale) {
    // Extract locale and rewrite to the actual page path
    const locale = LOCALES.find(l => pathname.startsWith(`/${l}`))!;
    const actualPath = pathname.replace(`/${locale}`, '') || '/';

    const response = NextResponse.rewrite(new URL(actualPath, request.url));
    response.headers.set('x-locale', locale);
    response.cookies.set('NEXT_LOCALE', locale, { path: '/' });
    return response;
  }

  // No locale prefix — pass through (default English)
  const response = NextResponse.next();
  if (!request.cookies.get('NEXT_LOCALE')) {
    response.cookies.set('NEXT_LOCALE', DEFAULT_LOCALE, { path: '/' });
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
