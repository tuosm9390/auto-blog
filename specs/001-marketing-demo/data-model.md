# Data Model: Marketing Demo Page

## Entities

### DemoPost (Virtual Entity)

실제 `Post` 엔티티를 기반으로 하지만, 외부 노출을 위해 개인정보가 마스킹된 가상 모델입니다.

| Field   | Type          | Description                            | Validation |
| ------- | ------------- | -------------------------------------- | ---------- |
| id      | string (UUID) | 원본 포스트 ID                         | Required   |
| slug    | string        | URL 슬러그                             | Required   |
| title   | string        | 포스트 제목                            | Required   |
| date    | string (ISO)  | 생성일                                 | Required   |
| summary | string        | 짧은 요약                              | Required   |
| content | string (MD)   | **[Masked]** GitHub 링크가 제거된 본문 | Required   |
| tags    | string[]      | 기술 태그 목록                         | Optional   |
| author  | string        | **[Empty]** 항상 빈 값                 | Always ""  |
| repo    | string        | **[Empty]** 항상 빈 값                 | Always ""  |

## State Transitions

- `Post.status == 'published'` 인 데이터만 `DemoPost`로 변환 가능합니다.
- `Post.deletedAt != null` 인 데이터는 제외됩니다.

## Validation Rules

- **PII Strip Validation**: `author`, `repo` 필드는 반드시 빈 문자열이어야 함.
- **Link Strip Validation**: `content` 내에 `github.com` 도메인을 포함한 커밋 링크가 존재해서는 안 됨.
