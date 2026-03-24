import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? process.env.AUTH_GITHUB_ID ?? '';
const GITHUB_OAUTH_SCOPE = 'read:user public_repo';

export async function GET(request: NextRequest) {
  if (!GITHUB_CLIENT_ID) {
    return NextResponse.json({ error: 'GitHub OAuth가 구성되지 않았습니다.' }, { status: 500 });
  }

  const state = randomUUID();
  const cookieStore = await cookies();

  // CSRF 방지: state를 httpOnly 쿠키에 저장 (15분 만료)
  cookieStore.set('demo_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 900, // 15분
    path: '/',
  });

  const callbackUrl = new URL('/api/demo/github-oauth/callback', request.url).toString();
  const githubUrl = new URL('https://github.com/login/oauth/authorize');
  githubUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
  githubUrl.searchParams.set('redirect_uri', callbackUrl);
  githubUrl.searchParams.set('scope', GITHUB_OAUTH_SCOPE);
  githubUrl.searchParams.set('state', state);

  return NextResponse.redirect(githubUrl.toString());
}
