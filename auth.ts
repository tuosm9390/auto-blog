import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { upsertProfile } from '@/lib/profiles'

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
    authorized: ({ auth }) => !!auth,
    async jwt({ token, account, profile, user }) {
      if (account) {
        token.accessToken = account.access_token;
        const githubProfile = profile as any;
        
        if (githubProfile?.login) {
          token.username = githubProfile.login;
          token.avatar_url = githubProfile.avatar_url;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.username = token.username;
        session.user.avatar_url = token.avatar_url;
        session.user.accessToken = token.accessToken;
      }
      return session;
    },
  },
})