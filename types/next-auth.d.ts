// NextAuth 세션과 JWT에 앱 전용 사용자 필드를 추가한다.
import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      username?: string | null;
      avatar_url?: string | null;
      accessToken?: string;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string | null;
    avatar_url?: string | null;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    username?: string | null;
    avatar_url?: string | null;
    role?: string;
  }
}
