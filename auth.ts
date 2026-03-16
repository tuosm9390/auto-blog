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
      if (account && profile && user) {
        token.accessToken = account.access_token
        const githubProfile = profile as unknown as { login?: string; avatar_url?: string; name?: string };
        const githubUsername = githubProfile.login;

        if (githubUsername) {
          token.username = githubUsername;
          token.avatar_url = githubProfile.avatar_url;
          token.name = githubProfile.name;

          try {
            const dbProfile = await upsertProfile({
              id: user.id as string,
              username: githubUsername,
              name: githubProfile.name || null,
              avatar_url: githubProfile.avatar_url || null,
            });
            
            token.role = dbProfile?.role || "user";
          } catch (err) {
            console.error("Failed to sync profile:", err);
            token.role = "user";
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.username = token.username as string | undefined;
        session.user.avatar_url = token.avatar_url as string | null | undefined;
        session.user.role = (token.role as string) || "user";
      }
      return session
    },
  },
})
