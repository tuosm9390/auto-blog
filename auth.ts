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

      // 1. 완전 공개 페이지 (비로그인/로그인 무관)
      const isPublicPage = 
        pathname === '/' || 
        pathname.includes('/about') || 
        pathname.includes('/pricing') || 
        pathname.includes('/terms') ||
        pathname.includes('/login') ||
        pathname.startsWith('/api/auth');

      if (isPublicPage) return true;

      // 2. 로그인 필수 체크
      if (!isLoggedIn) return false;

      // 3. 테스터 신청 페이지는 일반 유저(권한 없음)만 접근 가능
      if (pathname.includes('/tester-apply')) {
        return !isPrivileged;
      }

      // 4. 핵심 기능 및 설정 페이지 (관리자/테스터 전용)
      const isRestrictedPage = 
        pathname.includes('/generate') || 
        pathname.includes('/jobs') || 
        pathname.includes('/settings');

      if (isRestrictedPage) {
        return isPrivileged;
      }

      // 5. 관리자 전용 페이지
      if (pathname.includes('/admin')) {
        return isAdmin;
      }

      // 6. 사용자 블로그 페이지 (본인 또는 타인 공개용)
      if (pathname.startsWith('/@')) {
        return true;
      }

      return isLoggedIn;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        const githubProfile = profile as Record<string, any>;
        
        if (githubProfile?.login && token.sub) {
          // 최신 정보로 프로필 동기화
          await upsertProfile({
            id: token.sub as string,
            username: githubProfile.login,
            email: githubProfile.email || (profile as any)?.email,
            name: githubProfile.name || (profile as any)?.name,
            avatar_url: githubProfile.avatar_url
          });

          const { data } = await supabase.from('profiles').select('role').eq('id', token.sub).single();
          token.role = data?.role || 'user';
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
