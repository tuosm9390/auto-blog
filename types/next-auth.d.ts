import 'next-auth'
import 'next-auth/jwt'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string
      username?: string
      avatar_url?: string | null
      /** @server-only GitHub OAuth 토큰 — 클라이언트 컴포넌트에서 사용 금지 */
      accessToken?: string
      role?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
      role?: string
    username?: string
    avatar_url?: string | null
    name?: string | null
    role?: string
  }
}
