import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { supabaseAdmin as supabase } from './lib/supabase-admin'
import { upsertProfile } from './lib/profiles'


export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      authorization: { params: { scope: 'read:user user:email repo' } },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as any)?.role || 'user';
      const isAdmin = role === 'admin';
      const isTester = role === 'tester';
      const isPrivileged = isAdmin || isTester;
      
      const pathname = nextUrl.pathname;

      // 로케일 접두사 제거 (e.g. /ko/@username → /@username)
      const locales = ['ko', 'en'];
      const localePrefix = locales.find(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`);
      const cleanPath = localePrefix ? pathname.replace(`/${localePrefix}`, '') || '/' : pathname;

      // 1. 완전 공개 페이지 (비로그인/로그인 무관)
      const isPublicPage =
        cleanPath === '/' ||
        cleanPath.includes('/about') ||
        cleanPath.includes('/pricing') ||
        cleanPath.includes('/terms') ||
        cleanPath.includes('/login') ||
        pathname.startsWith('/api/auth');

      if (isPublicPage) return true;

      // 2. 사용자 블로그 페이지 — 로그인 없이 공개 열람 허용
      if (cleanPath.startsWith('/@')) {
        return true;
      }

      // 3. 로그인 필수 체크
      if (!isLoggedIn) return false;

      // 4. 테스터 신청 페이지는 일반 유저(권한 없음)만 접근 가능
      if (cleanPath.includes('/tester-apply')) {
        return !isPrivileged;
      }

      // 5. 핵심 기능 및 설정 페이지 (관리자/테스터 전용)
      const isRestrictedPage =
        cleanPath.includes('/generate') ||
        cleanPath.includes('/jobs') ||
        cleanPath.includes('/settings');

      if (isRestrictedPage) {
        return isPrivileged;
      }

      // 6. 관리자 전용 페이지 (startsWith로 정밀 매칭 — /@admin-user 같은 username 오탐 방지)
      if (cleanPath.startsWith('/admin') || cleanPath.startsWith('/admin-portal-v5-secret')) {
        return isAdmin;
      }

      return isLoggedIn;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      
      // 세션 유지 중에도 DB에서 최신 역할 정보를 가져옵니다 (실시간 권한 반영)
      if (token.sub) {
        const { data } = await supabase.from('profiles').select('role, username, avatar_url').eq('id', token.sub).single();
        if (data) {
          token.role = data.role || 'user';
          token.username = data.username;
          token.avatar_url = data.avatar_url;
        }
      }
      
      if (account && profile) {
        const githubProfile = profile as Record<string, any>;
        if (githubProfile.login) {
          await upsertProfile({
            id: token.sub as string,
            username: githubProfile.login,
            email: githubProfile.email || (profile as any)?.email,
            name: githubProfile.name || (profile as any)?.name,
            avatar_url: githubProfile.avatar_url, role: token.role as string
          });
        }
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.username = token.username;
        session.user.avatar_url = token.avatar_url;
        session.user.accessToken = token.accessToken;
        session.user.role = token.role;
      }
      return session;
    },
  },
})
