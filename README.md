# synapso.dev — AI-native Project Memory

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=flat-square&logo=vercel)](https://vercel.com)

> **AI와 만든 프로젝트, 어디까지 왔는지 잊지 않게.**

GitHub 활동과 프로젝트 문서를 Google Gemini AI가 분석하여 **프로젝트 상태, 진행률, 리스크, 드리프트를 스냅샷으로 정리**하는 멀티유저 SaaS 플랫폼입니다.

---

## ✨ 주요 기능

- **프로젝트 상태판** — 현재 단계, 진행률, 막힘, 리스크를 한 화면에 정리
- **Evidence 문서 관리** — PRD, roadmap, backlog, decision log 등 상태 판단 근거를 편집
- **GitHub 근거 연결** — 최근 커밋, PR, 이슈를 스냅샷 evidence로 연결
- **드리프트 감지** — 원래 방향과 현재 구현 방향의 변화를 기록
- **Zero Data Retention 원칙** — AI 학습에 코드를 사용하지 않는 보안 지향 분석

---

## ⚙️ 동작 방식

```
1. 프로젝트 생성      2. 문서 연결          3. GitHub 근거 수집      4. 상태 스냅샷
────────────────     ──────────────────    ──────────────────    ──────────────
기준 테제 기록    →   PRD와 Evidence 문서 →   커밋, PR, 이슈 확인 →   진행률과 drift 저장
```

---

## 🛠 기술 스택

| 영역           | 기술                                           |
| -------------- | ---------------------------------------------- |
| **Framework**  | Next.js 16.1.6 App Router, React 19.2.3        |
| **Auth**       | NextAuth v5.0.0-beta.30 (GitHub OAuth)         |
| **Database**   | Supabase (PostgreSQL)                          |
| **AI**         | Google Gemini 2.5 (Flash Lite / Flash / Pro)   |
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
  Made for builders who need their project context back
</p>
