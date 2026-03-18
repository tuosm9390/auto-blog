# 🧠 Synapso.dev 마케팅 브레인스토밍

> Date: 2026-03-19
> Author: Antigravity
> Status: 완료 (브레인스토밍 단계)

---

## 📌 제품 이해 요약

**Synapso.dev** = **GitHub 커밋/Diff → AI 기술 블로그 자동 생성 SaaS**

| 항목              | 내용                                             |
| ----------------- | ------------------------------------------------ |
| **핵심 가치**     | 코드를 쓰면 블로그 포스트가 자동 생성됨          |
| **타깃 ICP**      | 개발자, 인디해커, DevRel 팀, 스타트업 CTO        |
| **현재 스테이지** | Early (테스터 프로그램 운영 중)                  |
| **주요 기능**     | Gemini 2.5 Pro 기반 diff 분석, i18n, Stripe 구독 |
| **인증**          | GitHub OAuth (= 타깃이 GitHub 사용자)            |

---

## 🧬 마케팅 심리학 모델 (PLFS 스코어링)

### Model 1: Loss Aversion (손실 회피) — PLFS: `+15`

- **적용 위치**: 랜딩 히어로 카피, 무료 데모 CTA
- **핵심 메시지**: "오늘도 커밋했지만, 아무도 그 과정을 모른다"
- **타깃 행동**: 무료 체험 가입

### Model 2: Social Proof (사회적 증거) — PLFS: `+13`

- **적용 위치**: 실제 테스터 생성 포스트 갤러리, "이 주의 포스트" 피처링
- **타깃 행동**: 신뢰 형성 → 가입 전환

### Model 3: Default Effect (기본값 효과) — PLFS: `+14`

- **적용 위치**: GitHub Action 설치 플로우, 온보딩 첫 화면
- **핵심 메커니즘**: "매 머지 → 포스트 자동 생성" 기본 ON

### Model 4: Authority Bias (권위 편향) — PLFS: `+10`

- **적용 위치**: 오픈소스 파트너십 배지, "XXX 프로젝트에서 사용 중"

### Model 5: Endowment Effect (소유 효과) — PLFS: `+9`

- **적용 위치**: 온보딩 첫 화면 즉시 포스트 생성, GitHub 회고 이벤트

---

## 💡 마케팅 아이디어 TOP 5 (MFS 스코어링)

### Idea 1: Build in Public — MFS: `+11` 🏆

- **핵심**: Synapso로 Synapso의 개발 일지를 자동 생성 → X/Dev.to 배포
- **성공 지표**: 주간 포스트 노출 수, 레퍼럴 가입자 수
- **실행 비용**: 거의 없음 (제품 자체 사용)

### Idea 2: "GitHub Wrapped" 스타일 무료 데모 — MFS: `+9` 🏆

- **핵심**: 내 GitHub 최근 90일 → 회고 포스트 1-클릭 무료 생성
- **바이럴 메커니즘**: X/LinkedIn 공유 시 Pro 1개월 무료 쿠폰
- **심리 모델**: Loss Aversion + Social Proof 동시 활성화

### Idea 3: Dev Community 배포 채널 — MFS: `+9` 🏆

- **핵심**: Synapso 생성 포스트 → Dev.to/Hashnode 자동 크로스포스팅
- **바이럴 루프**: 포스트 하단 "Powered by Synapso" 배지 → 백링크
- **Pro 기능**: 무제한 배포 / Free: 1개/월

### Idea 4: GitHub Action 오픈소스 — MFS: `+7`

- **핵심**: `synapso-blog-action` GitHub Marketplace 등록
- **전환 경로**: Action 설치 → API 키 연동 → Pro 전환

### Idea 5: 오픈소스 레포 파트너십 — MFS: `+7`

- **핵심**: Stars 1000+ 레포에 무료 Business 계정 제공
- **목표**: 레퍼런스 확보 + Authority 구축

---

## 🗺️ 실행 로드맵

```
즉시 (이번 주)
├── Build in Public 시작: Synapso → Synapso 연결
└── 랜딩 카피 Loss Aversion 프레임으로 A/B 테스트

단기 (2-4주)
├── "GitHub Wrapped" 무료 데모 캠페인 기획
└── Dev.to 크로스포스팅 기능 개발 착수

중기 (1-3개월)
├── GitHub Action 오픈소스 배포
└── 오픈소스 파트너십 아웃리치 시작
```

---

## ✅ 우선순위 요약

| 순위 | 아이디어            | MFS | 핵심 이유                         |
| ---- | ------------------- | --- | --------------------------------- |
| 1    | Build in Public     | +11 | 제로 비용, 즉시 실행, 최고의 데모 |
| 2    | GitHub Wrapped 데모 | +9  | 바이럴 내장, Loss Aversion 극대화 |
| 3    | Dev.to 배포 채널    | +9  | ICP 집중 채널, 바이럴 루프        |
| 4    | GitHub Action       | +7  | 장기 유기 성장                    |
| 5    | 오픈소스 파트너십   | +7  | 권위 구축                         |
