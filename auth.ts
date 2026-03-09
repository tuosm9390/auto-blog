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
      if (account) {
        token.accessToken = account.access_token
        const githubProfile = profile as unknown as { login?: string; avatar_url?: string; name?: string };
        const githubUsername = githubProfile.login;

        if (githubUsername) {
          token.username = githubUsername;
          token.avatar_url = githubProfile.avatar_url;
          token.name = githubProfile.name;

          // DB에 프로필 동기화
          await upsertProfile({
            id: user.id as string,
            username: githubUsername,
            name: githubProfile.name || null,
            avatar_url: githubProfile.avatar_url || null,
          }).catch(err => console.error("Failed to sync profile:", err));
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.username = token.username as string | undefined;
        session.user.avatar_url = token.avatar_url as string | null | undefined;
      }
      return session
    },
  },
})
