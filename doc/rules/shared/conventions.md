# 📝 코딩 컨벤션 및 표준

## 1. 명명 규칙 (Naming)
- **Components**: PascalCase (예: PostCard.tsx)
- **Functions/Vars**: camelCase (예: getPostById)
- **Constants**: UPPER_SNAKE_CASE (예: MAX_POST_COUNT)

## 2. 에러 핸들링 (Error Handling)
- 모든 API 응답은 일관된 JSON 포맷을 유지한다: { "data": null, "error": { "message": "...", "code": "..." } }.
- 서버 스택 트레이스는 클라이언트에 절대 노출하지 않는다.

## 3. 주석 및 문서화
- 주요 로직에는 JSDoc 스타일의 주석을 작성한다.
- 모든 주석은 **한국어**로 작성한다.
