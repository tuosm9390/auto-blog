import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual, createHmac, randomBytes } from 'crypto';
import { cookies } from 'next/headers';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? process.env.AUTH_GITHUB_ID ?? '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_SECRET ?? process.env.AUTH_GITHUB_SECRET ?? '';
const DEMO_JWT_SECRET = process.env.DEMO_JWT_SECRET ?? '';

/**
 * jose 없이 Node.js crypto 만으로 HS256 JWT를 직접 생성합니다.
 */
function buildJwt(payload: Record<string, unknown>, secret: string, expiresInSeconds: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
    jti: randomBytes(16).toString('hex'),
  };
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signingInput = `${header}.${body}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');
  return `${signingInput}.${signature}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const urlState = searchParams.get('state');
  const cookieStore = await cookies();
  const cookieState = cookieStore.get('demo_oauth_state')?.value;

  // CSRF state 검증
  if (!cookieState || !urlState) {
    return NextResponse.json({ error: 'OAuth state가 없습니다.' }, { status: 403 });
  }

  try {
    const cookieBuf = Buffer.from(cookieState);
    const urlBuf = Buffer.from(urlState);
    if (cookieBuf.length !== urlBuf.length || !timingSafeEqual(cookieBuf, urlBuf)) {
      return NextResponse.json({ error: 'Invalid OAuth state (CSRF 의심).' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'State 검증 오류.' }, { status: 403 });
  }

  // 사용 후 즉시 삭제
  cookieStore.delete('demo_oauth_state');

  if (!code) {
    return NextResponse.json({ error: 'Authorization code가 없습니다.' }, { status: 400 });
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return NextResponse.json({ error: 'GitHub OAuth가 구성되지 않았습니다.' }, { status: 500 });
  }

  // GitHub access token 교환
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.json({ error: 'GitHub token 교환 실패.' }, { status: 502 });
  }

  const tokenData = (await tokenRes.json()) as Record<string, string>;
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return NextResponse.json({ error: 'GitHub access token을 받지 못했습니다.' }, { status: 502 });
  }

  if (!DEMO_JWT_SECRET) {
    return NextResponse.json({ error: 'Demo JWT 시크릿이 구성되지 않았습니다.' }, { status: 500 });
  }

  // JWT 서명 (HS256, 24시간 만료)
  const jwt = buildJwt({ access_token: accessToken }, DEMO_JWT_SECRET, 60 * 60 * 24);

  // locale 감지 후 데모 결과 페이지로 리다이렉트
  const locale = request.headers.get('accept-language')?.includes('ko') ? 'ko' : 'en';
  const response = NextResponse.redirect(new URL(`/${locale}/demo/result`, request.url));

  // httpOnly 쿠키로 저장
  response.cookies.set('demo_token', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24시간
    path: '/',
  });

  return response;
}
