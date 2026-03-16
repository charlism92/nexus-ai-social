// i18n middleware - disabled until [lang] route structure is implemented
// To enable: create src/app/[lang]/ with all pages, then uncomment this.

import { NextRequest, NextResponse } from 'next/server';

export function middleware(_request: NextRequest) {
  // Pass through - no locale redirect for now
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
