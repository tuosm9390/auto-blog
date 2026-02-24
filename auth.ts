import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { upsertProfile } from "@/lib/profiles"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      authorization: { params: { scope: "read:user user:email repo" } },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ auth }) => !!auth,
    async jwt({ token, account, profile, user }) {
      // 최초 로그인 시 (account, profile, user 모두 존재)
      if (account && profile && user) {
        token.accessToken = account.access_token
        const githubUsername = (profile as any).login

        token.username = githubUsername
        token.avatar_url = (profile as any).avatar_url
        token.name = (profile as any).name

        // DB에 프로필 동기화
        await upsertProfile({
          id: user.id as string,
          username: githubUsername,
          name: (profile as any).name || null,
          avatar_url: (profile as any).avatar_url || null,
        }).catch(err => console.error("Failed to sync profile:", err));
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      if (session.user) {
        session.user.username = token.username
        session.user.avatar_url = token.avatar_url
      }
      return session
    },
  },
})
