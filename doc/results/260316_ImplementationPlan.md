Date: 2026-03-16 14:15:00
Author: Antigravity

# 빌드 에러 해결을 위한 구현 계획서

## 1. 개요
현재 프로젝트 빌드(npm run build) 시 lib/posts.ts, lib/billing.ts, lib/jobs.ts 파일에서 발생하는 구문 오류(Syntax Error)를 해결합니다.

## 2. 주요 수정 사항

### 2.1 lib/posts.ts 수정
- slugify 함수 내 return \-;를 return \\-\\;로 수정.
- createPost 함수 내 .like("slug", \%);를 .like("slug", \\%\);로 수정.
- while (slugSet.has(\-))를 while (slugSet.has(\\-\\))로 수정.
- uniqueSlug = \-;를 uniqueSlug = \\-\\;로 수정.

### 2.2 lib/billing.ts 수정
- success_url, cancel_url, return_url 등 환경 변수 사용 시 백틱(\) 추가.
- Stripe 고객 검색 쿼리 metadata["username"]:""를 올바른 구문으로 수정.
- console.log 내 누락된 따옴표 및 변수 처리 수정.

### 2.3 lib/jobs.ts 수정
- updateJobStatus 함수 내 console.error 구문 수정.
- runAIAnalysisBackground 함수 내 repoFullName 및 로그 출력 구문 수정.

## 3. 검증 계획
1. 파일 수정 후 npm run build를 실행하여 빌드 성공 여부 확인.
2. 단위 테스트(존재하는 경우) 실행.
