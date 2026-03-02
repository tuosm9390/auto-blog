import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Skip all paths that should not be internationalized.
  // This includes the /api, /_next and all static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/', '/(ko|en)/:path*']
};
