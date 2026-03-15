# 🛠️ 기술 스택 (Infrastructure)

## 1. 프레임워크 및 라이브러리

- **Frontend**: Next.js 15.x (App Router), Tailwind CSS v4.0.0
- **Backend**: Next.js API Routes, NextAuth v5 (Beta)
- **Database**: Supabase (PostgreSQL), Kysely or Drizzle (ORM 선택 사항)
- **AI Integration**: @google/generative-ai (Gemini 2.0 Flash/Pro)
- **Payments**: Stripe SDK v17+

## 2. 필수 명령어

- **빌드**:
  ```bash
  npm run build
  ```
- **린트**:
  ```bash
  npm run lint
  ```
- **타입 체크**:
  ```bash
  npm run tsc --noEmit
  ```
- **로컬 실행**:
  ```bash
  npm run dev
  ```

## 3. 환경 변수

- .env.local에 정의된 NEXT_PUBLIC_SUPABASE_URL, STRIPE_SECRET_KEY 등을 서버에서만 호출한다.
