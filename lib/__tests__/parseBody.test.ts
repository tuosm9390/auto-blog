import { describe, test, expect } from "vitest";
import { parseBody } from "../changelog";

const FULL_BODY = `## 🚀 새 기능
- AI Reverse Spec Recovery
- Project Memory 상태 분석 전환

## 🐛 버그 수정
- 포스트 링크 404 수정

## 🔒 보안
- 보안 취약점 8건 패치

## ♻️ 리팩토링
- Header 컴포넌트 분리`;

describe("parseBody()", () => {
  test("모든 섹션 있을 때 올바르게 분리", () => {
    const result = parseBody(FULL_BODY);
    expect(result.features).toEqual([
      "AI Reverse Spec Recovery",
      "Project Memory 상태 분석 전환",
    ]);
    expect(result.fixes).toEqual(["포스트 링크 404 수정"]);
    expect(result.security).toEqual(["보안 취약점 8건 패치"]);
    expect(result.other).toEqual(["Header 컴포넌트 분리"]);
  });

  test("없는 섹션은 [] 반환 (undefined 아님)", () => {
    const result = parseBody("## 🚀 새 기능\n- feat1");
    expect(result.fixes).toEqual([]);
    expect(result.security).toEqual([]);
    expect(result.other).toEqual([]);
  });

  test("빈 body → 모든 필드 []", () => {
    const result = parseBody("");
    expect(result.features).toEqual([]);
    expect(result.fixes).toEqual([]);
    expect(result.security).toEqual([]);
    expect(result.other).toEqual([]);
  });

  test("불릿 제거 및 trim", () => {
    const result = parseBody("## 🚀 새 기능\n-  공백 포함 항목  \n- 일반 항목");
    expect(result.features).toEqual(["공백 포함 항목", "일반 항목"]);
  });

  test("이모지 포함 헤더(♻️ 리팩토링) → other 매핑", () => {
    const result = parseBody("## ♻️ 리팩토링\n- refactor item");
    expect(result.other).toEqual(["refactor item"]);
  });
});
