# AutoBlog 마케팅 콘텐츠

플랫폼별로 바로 사용할 수 있는 마케팅 문구 모음입니다.

---

## 1. 핵심 메시지 (브랜드 보이스)

| 항목 | 내용 |
|------|------|
| **한국어 슬로건** | 코딩만 하세요. 기술 블로그는 AI가 완성합니다. |
| **영어 슬로건** | Ship code. AI writes your tech blog. |
| **핵심 가치** | 자동화 · 전문성 · 저작권 보호 |
| **타겟 사용자** | GitHub에 꾸준히 커밋하지만 블로그 글 쓸 시간이 없는 개발자 |

---

## 2. Product Hunt 런치 포스트

### 영어 버전

**Tagline** (60자 이내)
```
AutoBlog — Turn GitHub commits into polished tech blog posts with AI
```

**Description**
```
AutoBlog analyzes your GitHub commit diffs using Google Gemini and
automatically generates professional tech blog posts.

🔗 Connect GitHub once → ✍️ AI writes your posts → 🚀 Publish instantly

Instead of just summarizing commits, AutoBlog interprets the *intent*,
*context*, and *impact* of your code changes — the way a senior engineer
would explain them to their team.

Key features:
• Auto-posting mode: new commits → posts published automatically
• Tier-based AI models: Gemini 2.5 Flash Lite / Flash / Pro
• Full markdown editor for post refinement before publishing
• SEO metadata, tags, and slugs generated automatically
• Zero Data Retention — your code is never used for AI training
• Your content, your copyright. 100%.

Free tier available. No credit card required.
```

**First Comment (maker's comment)**
```
Hey PH! 👋

I built AutoBlog because I kept putting off writing about my projects.

The problem: I commit code every day, but turning that into a readable
blog post takes 1-2 hours I rarely have.

The solution: connect your GitHub, pick your commits, and Gemini AI
produces a full technical post — in under 60 seconds.

It's not a commit summarizer. It understands *why* you made the change
and explains it like a senior engineer writing for their team.

Would love your feedback — especially on the writing quality. 🙏
```

---

### 한국어 버전

**태그라인**
```
AutoBlog — GitHub 커밋을 AI가 기술 블로그 포스트로 자동 변환
```

**소개 문구**
```
AutoBlog는 GitHub 커밋 diff를 Google Gemini AI가 분석하여 전문적인
기술 블로그 포스트를 자동으로 완성하는 서비스입니다.

🔗 GitHub 연결 → ✍️ AI가 포스트 작성 → 🚀 즉시 발행

커밋을 단순히 요약하는 게 아닙니다. 코드 변경의 의도, 맥락, 영향을
시니어 엔지니어의 시각으로 해석해 독자가 이해할 수 있는 글로 완성합니다.

주요 기능:
• 자동 포스팅 모드 — 새 커밋 push 시 자동으로 글 발행
• 티어별 AI 모델 — Gemini 2.5 Flash Lite / Flash / Pro
• 마크다운 에디터로 발행 전 자유롭게 수정
• SEO 메타데이터, 태그, 슬러그 자동 생성
• Zero Data Retention — 코드가 AI 학습에 절대 사용되지 않음
• 생성된 콘텐츠의 저작권은 100% 사용자 귀속

무료 플랜 제공. 신용카드 불필요.
```

---

## 3. Dev.to / Hashnode 블로그 포스트 (한국어)

**제목**
```
개발자가 기술 블로그를 자동화한 방법: GitHub 커밋 → AI 포스트 자동 생성
```

**태그**
```
#개발 #AI #자동화 #블로그 #GitHub #Gemini
```

**본문**

---

### 개발자에게 블로그는 왜 항상 미뤄질까?

GitHub에 꾸준히 커밋하는 개발자는 많습니다. 하지만 그 코드 작업을 블로그 글로 남기는 개발자는 드뭅니다.

이유는 단순합니다. **시간이 없기 때문입니다.**

어렵게 구현한 기능, 까다로운 버그 수정, 신중하게 설계한 아키텍처 결정 — 이 모든 것들이 커밋 로그에만 남고 사라집니다. 나중에 "그때 왜 그렇게 했더라?" 싶을 때 답을 찾기 어렵고, 다른 개발자들과 그 경험을 나눌 기회도 없어집니다.

기술 블로그가 중요한 건 알지만, 코딩을 마치고 글까지 쓰는 건 현실적으로 너무 버거웠습니다.

그래서 만들었습니다. **AutoBlog**.

---

### AutoBlog가 하는 일

AutoBlog는 GitHub 커밋 diff를 Google Gemini AI가 분석하여 전문적인 기술 블로그 포스트를 자동으로 완성해주는 서비스입니다.

**동작 방식은 4단계:**

**1. GitHub 연결**
GitHub OAuth 로그인 한 번으로 모든 공개·비공개 리포지토리에 접근 권한을 설정합니다.

**2. 커밋 선택**
분석할 커밋을 선택합니다. 단일 커밋 하나도, 여러 커밋을 묶어서도 가능합니다. 자동 포스팅 모드를 켜두면 새 커밋이 push될 때마다 자동으로 처리됩니다.

**3. AI 분석 및 포스트 생성**
Gemini AI가 코드 변경 내용을 분석합니다. 단순한 diff 요약이 아닙니다. "왜 이 변경이 필요했는가", "어떤 문제를 해결했는가", "이 접근 방식의 트레이드오프는 무엇인가"를 시니어 엔지니어의 관점으로 서술합니다.

약 60초 안에 마크다운 형식의 완성된 포스트가 생성됩니다.

**4. 편집 및 발행**
AI가 생성한 글을 마크다운 에디터에서 수정하고 원클릭으로 발행합니다. SEO 제목, 태그, 메타데이터는 자동으로 생성됩니다.

---

### 단순 요약이 아닌 이유

많은 AI 도구들이 커밋 메시지나 diff를 "요약"합니다. AutoBlog는 다릅니다.

Gemini에게 넘기는 컨텍스트에는 단순 변경 내역뿐만 아니라 변경된 파일의 구조적 맥락, 관련된 코드 패턴이 포함됩니다. 그리고 AI에게 요청하는 것은 "이 커밋을 설명해줘"가 아니라 "이 코드 변경을 경험 있는 엔지니어가 팀 블로그에 쓰는 것처럼 작성해줘"입니다.

결과물은 독자가 읽고 싶은 기술 글입니다.

---

### 저작권은 100% 사용자에게

많은 분들이 "내 코드를 AI에 넣으면 학습 데이터로 쓰이는 거 아닌가?" 라고 걱정합니다.

AutoBlog는 Zero Data Retention 정책을 채택하고 있습니다. 분석에 사용된 코드 diff는 포스트 생성 후 즉시 파기됩니다. AI 학습에 사용되지 않습니다. 생성된 콘텐츠의 저작권은 100% 사용자에게 귀속됩니다.

---

### 구독 플랜

| 플랜 | 월 생성 | AI 모델 | 가격 |
|------|:-------:|---------|------|
| Free | 3회 | Gemini 2.5 Flash Lite | 무료 |
| Pro | 30회 | Gemini 2.5 Flash | 유료 |
| Business | 무제한 | Gemini 2.5 Pro | 유료 |

무료 플랜으로 먼저 직접 체험해보세요.

---

### 마치며

개발자가 꾸준히 배우고 성장하는 과정은 커밋 히스토리 안에 다 담겨 있습니다. AutoBlog는 그 기록이 묻히지 않도록, 읽히는 글로 만들어드립니다.

코딩만 하세요. 기술 블로그는 AI가 완성합니다.

**[지금 무료로 시작하기 →]**

---

## 4. Twitter / X 스레드

### 한국어 스레드

```
🧵 개발자가 기술 블로그를 1년 넘게 미뤘습니다.
커밋은 매일 했는데요.

그래서 GitHub 커밋 → AI 블로그 포스트 자동 생성 서비스를 만들었습니다.

이름은 AutoBlog. 어떻게 동작하는지 알려드릴게요 👇
```

```
1/ 문제

코드를 짜는 시간 = 무한
그 코드에 대해 글 쓰는 시간 = 0

어렵게 해결한 버그, 신중하게 설계한 아키텍처가
커밋 로그에만 묻혀 사라집니다.

기술 블로그 쓰고 싶은데 시간이 없는 개발자, 저만 그런 게 아니죠?
```

```
2/ 솔루션

AutoBlog = GitHub 커밋 diff → Gemini AI 분석 → 기술 블로그 포스트

단순 요약이 아닙니다.
"왜 이 변경이 필요했는가"
"어떤 문제를 해결했는가"
"이 접근 방식의 트레이드오프는?"

시니어 엔지니어가 팀 블로그에 쓰는 것처럼 작성합니다.
```

```
3/ 사용 방법 (3단계)

① GitHub OAuth 로그인
② 분석할 커밋 선택
③ AI가 마크다운 포스트 생성 (약 60초)

편집하고 원클릭 발행.
SEO 메타데이터, 태그 자동 생성.
```

```
4/ 자동 포스팅 모드

설정해두면
새 커밋 push → 자동으로 포스트 발행

말 그대로 제로 터치.
코딩만 하면 블로그가 쌓입니다.
```

```
5/ 저작권 걱정하는 분들께

Zero Data Retention 정책:
- 분석 후 코드 diff 즉시 파기
- AI 학습에 코드 미사용
- 생성 콘텐츠 저작권 100% 사용자 귀속

내 코드, 내 글입니다.
```

```
6/ 무료 플랜부터 시작하세요

Free: 월 3회, 무료
Pro: 월 30회, Gemini 2.5 Flash
Business: 무제한, Gemini 2.5 Pro

신용카드 없이 바로 시작 가능합니다.

👉 [링크]

RT 해주시면 같은 고민 가진 개발자 친구에게 닿을 거예요 🙏
```

---

### 영어 스레드

```
🧵 I had 1,000+ GitHub commits but zero blog posts.

So I built AutoBlog — it turns commits into tech blog posts using AI.

Here's how it works 👇
```

```
1/ The problem

I commit code every day.
Writing a blog post about it? That takes 2 hours I never have.

Great features, clever bug fixes, architectural decisions —
all buried in git history, seen by no one.
```

```
2/ The solution

AutoBlog analyzes your GitHub commit diffs with Google Gemini
and generates a full technical blog post.

Not a summary — a real post that explains:
→ Why you made the change
→ What problem it solves
→ What tradeoffs you considered

Like a senior engineer explaining their work to the team.
```

```
3/ How it works

① Connect GitHub (OAuth, one click)
② Select commits to analyze
③ Gemini generates a markdown post in ~60s

Edit → Publish.
SEO titles, tags, metadata: auto-generated.
```

```
4/ Auto-posting mode

Set it once.
New commit pushed → post published automatically.

Zero touch. Your blog grows while you code.
```

```
5/ Your code stays yours

Zero Data Retention policy:
- Code diffs deleted after analysis
- Never used for AI training
- 100% copyright stays with you
```

```
6/ Free to start

Free plan: 3 posts/month
Pro: 30 posts/month (Gemini 2.5 Flash)
Business: Unlimited (Gemini 2.5 Pro)

No credit card needed.

👉 [link]

If this sounds useful, RT to reach other developers 🙏
```

---

## 5. GitHub 리포지토리 소개 (영어, 140자 이내)

```
AI-powered tech blog generator. Connect GitHub → select commits → Gemini writes your blog post. Auto-posting mode included.
```

---

## 6. LinkedIn 포스트 (한국어)

```
개발자로 일하면서 기술 블로그를 꾸준히 쓰는 게 얼마나 어려운지 잘 알고 있습니다.

코딩 자체도 바쁜데, 그 내용을 다시 글로 정리하는 건 현실적으로 쉽지 않습니다.

그래서 만들었습니다. GitHub 커밋을 AI가 분석해서 자동으로 기술 블로그 포스트를 완성해주는 서비스, AutoBlog.

단순 커밋 요약이 아닙니다. 코드 변경의 의도와 맥락, 기술적 판단을 시니어 엔지니어의 관점으로 풀어냅니다.

자동 포스팅 모드를 설정해두면 커밋 push만으로 블로그가 자동 업데이트됩니다.

무료 플랜으로 먼저 체험해보세요.

#개발 #AI #자동화 #기술블로그 #개발자 #Gemini #GitHub
```

---

## 7. 이메일 뉴스레터 / 커뮤니티 소개글 (한국어)

**제목**: 커밋하면 블로그가 써지는 서비스를 만들었습니다

**본문**:

```
안녕하세요,

개발자가 기술 블로그를 꾸준히 쓰기 어려운 이유 중 하나는,
코딩과 글쓰기가 전혀 다른 뇌를 쓰는 작업이기 때문이라고 생각합니다.

AutoBlog는 그 간극을 없애기 위해 만든 서비스입니다.

GitHub에 커밋하면 AI가 코드 변경 내용을 분석하고,
전문적인 기술 블로그 포스트를 자동으로 생성합니다.

────────────────────────────────
✅ GitHub 연동 → 커밋 선택 → AI 분석 → 즉시 발행
✅ 자동 포스팅 모드로 완전 자동화 가능
✅ 마크다운 에디터로 발행 전 자유롭게 수정
✅ Zero Data Retention — 코드 AI 학습 미사용
✅ 저작권 100% 사용자 귀속
────────────────────────────────

무료 플랜으로 바로 시작하실 수 있습니다.

[AutoBlog 시작하기 →]

더 좋은 서비스를 만들기 위해 피드백을 기다리고 있습니다.

감사합니다.
AutoBlog 팀 드림
```

---

## 8. 커뮤니티 게시판 (개발자 커뮤니티, 한국어)

### 제목
```
GitHub 커밋으로 기술 블로그 자동 생성하는 서비스 만들었습니다 (무료 체험 가능)
```

### 본문
```
안녕하세요, AutoBlog를 만든 개발자입니다.

개발자들이 기술 블로그를 미루는 가장 큰 이유가 "시간 없음"이라는 걸
직접 겪으면서 느꼈습니다. 커밋은 매일 하는데 글은 못 쓰는 상황이요.

그래서 GitHub 커밋을 AI가 분석해서 블로그 포스트를 자동으로 써주는
서비스를 만들었습니다.

**주요 특징:**
- GitHub 커밋 diff를 Google Gemini AI가 분석
- 단순 요약이 아닌 의도·맥락·트레이드오프까지 서술
- 자동 포스팅 모드 (커밋 push → 자동 발행)
- 마크다운 에디터로 수정 후 발행
- 무료 플랜: 월 3회 생성 가능

**한 가지 강조하고 싶은 점:**
코드를 AI 학습에 사용하지 않습니다. 분석 후 즉시 파기합니다.
생성된 콘텐츠 저작권은 100% 작성자에게 귀속됩니다.

무료로 먼저 체험해보시고 피드백 주시면 감사하겠습니다.
관심 있으신 분은 댓글로 질문 남겨주세요!

[서비스 바로가기]
```

---

*최종 업데이트: 2026-03-02*
