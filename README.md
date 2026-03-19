# synapso.dev — AI-Powered Tech Blog Generator

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe)](https://stripe.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=flat-square&logo=vercel)](https://vercel.com)

> **코딩만 하세요. 기술 블로그는 AI가 완성합니다.**
> Ship code. AI writes your tech blog.

GitHub 커밋을 Google Gemini AI가 분석하여 **전문적인 기술 블로그 포스트를 자동 생성**하는 멀티유저 SaaS 플랫폼입니다.

---

## ✨ 주요 기능

- **GitHub 자동 연동** — OAuth 한 번으로 모든 리포지토리에 접근
- **AI 심층 분석** — 단순 커밋 요약이 아닌, 코드 변경의 *의도·맥락·영향*을 시니어 엔지니어 관점으로 해석
- **즉시 발행** — AI 생성 → 마크다운 편집 → 원클릭 발행
- **자동 포스팅 모드** — 설정해두면 새 커밋마다 자동으로 포스트 발행 (크론 기반)
- **다중 AI 모델** — 구독 티어에 따라 Gemini 2.5 Flash Lite → Flash → Pro 자동 적용
- **SEO 최적화** — 태그, 제목, 메타데이터 자동 생성 및 ISR 적용
- **저작권 보호** — AI 학습에 코드 미사용, Zero Data Retention

---

## ⚙️ 동작 방식

```
1. GitHub 연결      2. 커밋 분석          3. 포스트 생성         4. 발행
──────────────     ──────────────────    ──────────────────    ──────────────
GitHub OAuth   →   커밋 diff 선택     →   Gemini AI 분석     →   편집 후 발행
로그인 한 번        분석할 커밋 체크        시니어 엔지니어 톤       SEO 자동 적용
                   자동 모드 설정 가능     마크다운 포스트 완성      공개 블로그 개설
```

---

## 💳 구독 플랜

| 플랜         | 월 생성 횟수 | AI 모델               | 자동 저장소 | 워터마크 |
| ------------ | :----------: | --------------------- | :---------: | :------: |
| **Free**     |     3회      | Gemini 2.5 Flash Lite |     1개     |    ✅    |
| **Pro**      |     30회     | Gemini 2.5 Flash      |   무제한    |    ❌    |
| **Business** |    무제한    | Gemini 2.5 Pro        |   무제한    |    ❌    |

---

## 🛠 기술 스택

| 영역           | 기술                                           |
| -------------- | ---------------------------------------------- |
| **Framework**  | Next.js 16.1.6 App Router, React 19.2.3        |
| **Auth**       | NextAuth v5.0.0-beta.30 (GitHub OAuth)         |
| **Database**   | Supabase (PostgreSQL)                          |
| **AI**         | Google Gemini 2.5 (Flash Lite / Flash / Pro)   |
| **Payments**   | Stripe (구독 + Billing Portal)                 |
| **Styling**    | Tailwind CSS v4.2.0, 다크 테마, CSS Variables  |
| **Deployment** | Vercel (ISR + Cron Jobs)                       |
| **Markdown**   | react-markdown + rehype-highlight + remark-gfm |
| **Validation** | Zod                                            |

---

## 📮 문의

- **이메일**: devcraft0416@gmail.com
- **이슈 리포트**: GitHub Issues

---

<p align="center">
  Made with ❤️ for developers who code more than they write
</p>
