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
      // Persist the OAuth access_token to the token right after signin
      if (account && profile && user) {
        token.accessToken = account.access_token
        const githubUsername = (profile as any).login

        // Save to DB
        await upsertProfile({
          id: user.id as string, // NextAuth user.id mapped to Supabase auth.users.id
          username: githubUsername,
          name: (profile as any).name || null,
          avatar_url: (profile as any).avatar_url || null,
        }).catch(err => console.error("Failed to sync profile:", err));
      }
      if (account) {
        token.accessToken = account.access_token
      }
      if (profile && (profile as any).login) {
        token.username = (profile as any).login
        token.avatar_url = (profile as any).avatar_url
        token.name = (profile as any).name
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken
      if (session.user) {
        session.user.username = token.username as string
          ; (session.user as any).avatar_url = token.avatar_url
      }
      return session
    },
  },
})
