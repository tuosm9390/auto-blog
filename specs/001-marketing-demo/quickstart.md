# Quickstart: Testing Marketing Demo Page

이 문서는 `001-marketing-demo` 피처를 로컬에서 테스트하는 방법을 설명합니다.

## 1. Prerequisites
- 로컬 개발 환경 (`npm run dev`) 실행 중.
- Supabase에 `status = 'published'` 인 포스트 데이터가 1개 이상 존재해야 함.

## 2. Accessing the Demo
1. 브라우저에서 `http://localhost:3000/ko/demo` (또는 `/en/demo`)에 접속합니다.
2. **비로그인 상태**로 접근 가능한지 확인합니다. (로그인 중이라면 로그아웃 후 확인 권장)

## 3. Verification Points
- [ ] 헤더에 "테스터 신청" 버튼과 로고만 노출되는가?
- [ ] 포스트 목록에서 작성자 이름이나 GitHub 리포지토리 정보가 보이는가? (보이지 않아야 함)
- [ ] 포스트 상세 페이지(`/demo/[slug]`)로 이동이 원활한가?
- [ ] 상세 페이지 본문 내의 GitHub 커밋 링크들이 텍스트로 치환되어 클릭이 불가능한가?
- [ ] 상세 페이지 상단에 "이전 페이지로 이동" 버튼이 작동하는가?

## 4. Archiving Check
- 기존 데모 기능이 필요하다면 `http://localhost:3000/ko/demo-archive` 경로가 유효한지 확인합니다.
