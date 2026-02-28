# 모바일 햄버거 메뉴 구현 계획

## 현재 상태 분석

### 문제점
- `Header.tsx`는 서버 컴포넌트 (`async`, `await auth()` 사용)
- 모바일에서 `hidden sm:inline`으로 링크를 **숨기기만** 할 뿐, 대체 메뉴 없음
- 모바일 사용자는 아래 링크에 접근 불가:
  - 서비스 소개 (`/about`)
  - 요금제 (`/pricing`)
  - 작업 현황 (`/jobs`)
  - 설정 (`/settings`)

### 현재 파일
- `components/Header.tsx` — 서버 컴포넌트, 세션 fetch 후 nav 렌더링
- `components/auth-components.tsx` — `SignIn`, `SignOut` Server Actions

---

## 아키텍처 결정

### 왜 별도 클라이언트 컴포넌트인가?
`Header.tsx`는 `await auth()`를 사용하는 서버 컴포넌트이므로 `useState`를 직접 쓸 수 없다.
→ 햄버거 토글 상태 관리를 위한 **별도 클라이언트 컴포넌트** `MobileMenu.tsx`를 만들고,
  서버 컴포넌트에서 필요한 데이터를 props로 전달한다.

```
Header.tsx (서버 컴포넌트)
  ├── 로고 (그대로 유지)
  ├── 데스크탑 nav (sm: 이상에서만 표시)
  └── MobileMenu.tsx (클라이언트 컴포넌트)  ← 신규
        ├── 햄버거 버튼 (모바일에서만 표시)
        └── 드롭다운 메뉴 (토글 시 표시)
```

---

## 변경 파일 목록

| 파일 | 작업 |
|---|---|
| `components/MobileMenu.tsx` | **신규 생성** — 클라이언트 컴포넌트 |
| `components/Header.tsx` | **수정** — MobileMenu 임포트 및 props 전달 |

---

## MobileMenu.tsx 상세 설계

### Props 인터페이스
```typescript
interface MobileMenuProps {
  isLoggedIn: boolean;
  username?: string | null;
  userImage?: string | null;
}
```

### 메뉴 항목 (로그인 전)
- 서비스 소개 → `/about`
- 요금제 → `/pricing`
- GitHub 로그인 버튼 (`SignIn` 컴포넌트)

### 메뉴 항목 (로그인 후)
- ✦ 새 글 생성 → `/generate`
- 서비스 소개 → `/about`
- 요금제 → `/pricing`
- 작업 현황 → `/jobs`
- 설정 → `/settings`
- 내 프로필 → `/@{username}`
- 로그아웃 버튼 (`SignOut` 컴포넌트)

### UI/UX 동작
- 햄버거 아이콘: 3선(☰) → 닫기(✕) 전환 (CSS transition)
- 메뉴: 헤더 바로 아래 전체 너비 드롭다운
- 배경: `bg-canvas/95 backdrop-blur-md` (헤더 스타일 통일)
- 바깥 클릭 시 메뉴 닫힘 (`useEffect` + `mousedown` 리스너)
- 메뉴 링크 클릭 시 자동 닫힘
- `sm:hidden`으로 데스크탑에서 숨김

### 애니메이션
```
열릴 때: opacity 0→1, translateY -8px→0
닫힐 때: opacity 1→0 (CSS transition)
```

---

## Header.tsx 수정 내용

1. `MobileMenu` 임포트 추가
2. 데스크탑 nav에 `hidden sm:flex` 추가 (모바일에서 완전히 숨김)
3. 햄버거 버튼 영역에 `<MobileMenu>` 삽입 (모바일에서만 표시)

### 수정 전 nav 구조
```tsx
<nav className="flex items-center gap-4">
  {/* 모든 링크가 hidden sm:inline 혼재 */}
</nav>
```

### 수정 후 nav 구조
```tsx
{/* 데스크탑 전용 nav */}
<nav className="hidden sm:flex items-center gap-4">
  {/* 기존 링크들 — hidden sm:inline 제거 */}
</nav>

{/* 모바일 햄버거 메뉴 */}
<div className="sm:hidden">
  <MobileMenu
    isLoggedIn={!!session?.user}
    username={session?.user?.username}
    userImage={session?.user?.image}
  />
</div>
```

---

## 구현 순서

1. `components/MobileMenu.tsx` 생성
   - `"use client"` 선언
   - `useState`로 `isOpen` 상태 관리
   - 햄버거 버튼 (SVG 아이콘)
   - 드롭다운 메뉴 (조건부 렌더링)
   - `useEffect`로 바깥 클릭 감지

2. `components/Header.tsx` 수정
   - 데스크탑 nav를 `hidden sm:flex`로 변경
   - `hidden sm:inline` 클래스 전부 제거 (데스크탑 nav 안에서는 불필요)
   - `<MobileMenu>` 컴포넌트 추가

---

## 디자인 토큰 (기존 시스템 활용)

```
bg-canvas         → #030303  (메뉴 배경)
bg-elevated       → #1a1a1a  (메뉴 항목 hover)
border-border-subtle → rgba(255,255,255,0.08)
text-text-secondary  → #888888
text-accent          → #ededed (강조 링크)
```

---

## 완료 기준

- [ ] 모바일(640px 미만)에서 햄버거 아이콘 표시
- [ ] 햄버거 클릭 시 전체 메뉴 드롭다운 표시
- [ ] 메뉴 내 모든 링크 클릭 시 메뉴 닫힘
- [ ] 바깥 클릭 시 메뉴 닫힘
- [ ] 데스크탑(640px 이상)에서 기존 nav 유지, 햄버거 숨김
- [ ] 로그인/비로그인 상태에 따른 메뉴 항목 분기
- [ ] 기존 디자인 토큰(다크 테마) 일관성 유지
