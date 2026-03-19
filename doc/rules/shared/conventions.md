Date: 2026-03-19 14:30:00
Author: Antigravity

# 📝 코딩 컨벤션 및 표준 (v0.6.0)

## 1. 명명 규칙 (Naming Standards)
- **Components**: PascalCase (예: `UserProfileBox.tsx`)
- **Functions & Variables**: camelCase (예: `generatePostContent`)
- **Constants**: UPPER_SNAKE_CASE (예: `MIN_RETRY_INTERVAL_MS`)
- **Files**: 의미론적 명명법을 따르며 컴포넌트는 PascalCase, 일반 로직은 kebab-case 또는 camelCase를 사용합니다.

## 2. 에러 핸들링 (Error Handling)
- **API Response**: `{ "data": T, "error": { "message": string, "code": string } }` 포맷을 엄격히 유지합니다.
- **Safe Error**: 서버의 내부 스택 트레이스나 보안에 민감한 정보는 사용자에게 절대 노출하지 않으며, 가독성 있는 에러 메시지로 변환합니다.

## 3. 주석 및 문서화 (Documentation)
- **Language**: 모든 주석과 설명은 **한국어**로 작성합니다.
- **JSDoc**: 핵심 함수 및 클래스에는 파라미터와 반환값의 의미를 명시하는 JSDoc 주석을 필수적으로 작성합니다.
- **Self-Documenting**: 명확한 변수명과 함수명을 통해 코드 자체로 의도가 읽힐 수 있도록 구현합니다.
