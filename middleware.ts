import { auth } from "@/auth"
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  
  // 관리자 경로 보호 (/admin 또는 /ko/admin, /en/admin)
  const pathname = nextUrl.pathname;
  const isAdminPath = pathname.startsWith('/admin') || 
                     pathname.startsWith('/ko/admin') || 
                     pathname.startsWith('/en/admin');

  if (isAdminPath) {
    if (session?.user?.role !== 'admin') {
      const url = new URL('/', nextUrl.origin);
      return Response.redirect(url);
    }
  }

  // x-url-pathname 헤더 추가 (서버 컴포넌트에서 경로 감지용)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-url-pathname', pathname);

  const response = intlMiddleware(req);
  // intlMiddleware가 반환하는 응답 헤더에도 pathname이 반영되도록 처리
  response.headers.set('x-url-pathname', pathname);
  
  return response;
});

export const config = {
  // Skip all paths that should not be internationalized.
  // This includes the /api, /_next and all static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/', '/(ko|en)/:path*']
};
