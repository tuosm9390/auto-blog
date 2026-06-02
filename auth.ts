import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { supabaseAdmin as supabase } from './lib/supabase-admin'
import { upsertProfile, migrateProfileId } from './lib/profiles'

interface GitHubProfile {
  login?: string;
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
}

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
      const role = auth?.user?.role || 'user';
      const isAdmin = role === 'admin';

      const pathname = nextUrl.pathname;

      // 로케일 접두사 제거 (e.g. /ko/@username → /@username)
      const locales = ['ko', 'en'];
      const localePrefix = locales.find(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`);
      const cleanPath = localePrefix ? pathname.replace(`/${localePrefix}`, '') || '/' : pathname;

      // 1. 완전 공개 페이지 (비로그인/로그인 무관)
      const isPublicPage =
        cleanPath === '/' ||
        cleanPath.startsWith('/about') ||
        cleanPath.startsWith('/tester-apply') ||
        cleanPath.startsWith('/terms') ||
        cleanPath.startsWith('/login') ||
        cleanPath.startsWith('/demo') ||
        pathname.startsWith('/api/auth');

      if (isPublicPage) return true;

      // 2. 사용자 블로그 페이지 — 로그인 없이 공개 열람 허용
      if (cleanPath.startsWith('/@')) {
        return true;
      }

      // 3. 로그인 필수 체크
      if (!isLoggedIn) return false;

      // 4. 핵심 기능 및 설정 페이지 (로그인 유저 전체 허용)
      const isRestrictedPage =
        cleanPath.includes('/projects') ||
        cleanPath.includes('/generate') ||
        cleanPath.includes('/jobs') ||
        cleanPath.includes('/settings');

      if (isRestrictedPage) {
        return isLoggedIn;
      }

      // 5. 관리자 전용 페이지 (startsWith로 정밀 매칭 — /@admin-user 같은 username 오탐 방지)
      if (cleanPath.startsWith('/admin') || cleanPath.startsWith('/admin-portal-v5-secret')) {
        return isAdmin;
      }

      return isLoggedIn;
    },
    async jwt({ token, account, profile }) {
      // ✅ 최초 로그인 시: account.providerAccountId(GitHub numeric ID)를 sub으로 명시 고정
      // 이렇게 하지 않으면 NextAuth v5가 내부적으로 randomUUID()를 sub으로 할당해
      // 로그인할 때마다 user.id가 달라지는 문제가 발생합니다.
      if (account) {
        token.accessToken = account.access_token;
        token.sub = account.providerAccountId; // GitHub user numeric ID (안정적, 불변)
      }

      if (account && profile) {
        const githubProfile = profile as GitHubProfile;
        if (githubProfile.login) {
          // 기존 프로필의 id(UUID)를 GitHub numeric ID로 마이그레이션 (1회성)
          await migrateProfileId(githubProfile.login, token.sub as string);

          await upsertProfile({
            id: token.sub as string,
            username: githubProfile.login,
            email: githubProfile.email,
            name: githubProfile.name,
            avatar_url: githubProfile.avatar_url,
            role: token.role as string,
          });
        }
      }

      // 세션 유지 중에도 DB에서 최신 역할 정보를 가져옵니다 (실시간 권한 반영)
      if (token.sub) {
        const { data } = await supabase
          .from('profiles')
          .select('role, username, avatar_url')
          .eq('id', token.sub)
          .single();
        if (data) {
          token.role = data.role || 'user';
          token.username = data.username;
          token.avatar_url = data.avatar_url;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.username = token.username;
        session.user.avatar_url = token.avatar_url;
        session.user.accessToken = token.accessToken;
        session.user.role = token.role;
      }
      return session;
    },
  },
})
