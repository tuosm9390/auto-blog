import 'next-auth'
import 'next-auth/jwt'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string
      username?: string
      avatar_url?: string | null
      accessToken?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    username?: string
    avatar_url?: string | null
    name?: string | null
  }
}