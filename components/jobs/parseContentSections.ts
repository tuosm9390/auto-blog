import { SECTION_HEADINGS } from "@/lib/constants/sections";

export interface ContentSection {
  label: string;
  content: string;
}

/**
 * content 문자열을 SECTION_HEADINGS 기준으로 탭 배열로 파싱한다.
 * - 5개 헤딩이 모두 존재하면 ContentSection[] 반환
 * - 헤딩이 하나라도 빠지면 null 반환 (→ JobCard가 "전체" 탭 fallback)
 * - 코드블록 내부의 헤딩은 카운트하지 않는다
 */
export function parseContentSections(
  content: string,
  headings: typeof SECTION_HEADINGS
): ContentSection[] | null {
  if (!content) return null;

  const headingPattern = headings
    .map(({ ko, en }) => `(?:${ko}|${en})`)
    .join("|");
  const headingRegex = new RegExp(
    `^###\\s*(${headingPattern})[ \\t]*$`,
    "gim"
  );

  // 각 헤딩의 위치를 수집하되, 코드블록 내부 헤딩은 건너뜀
  const matches: Array<{ index: number; heading: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = headingRegex.exec(content)) !== null) {
    // 해당 위치 이전의 ``` 개수가 홀수이면 코드블록 안 → 스킵
    const before = content.slice(0, m.index);
    const backtickCount = (before.match(/```/g) || []).length;
    if (backtickCount % 2 !== 0) continue;
    matches.push({ index: m.index, heading: m[1].trim() });
  }

  // 5개 헤딩이 모두 발견되지 않으면 fallback
  if (matches.length !== headings.length) return null;

  // 각 섹션의 내용 추출
  const sections: ContentSection[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end =
      i + 1 < matches.length ? matches[i + 1].index : content.length;
    const part = content.slice(start, end);

    // 첫 줄(헤딩 자체) 제거
    const newlinePos = part.indexOf("\n");
    const body = newlinePos >= 0 ? part.slice(newlinePos + 1).trim() : "";

    const foundHeading = headings.find(({ ko, en }) =>
      new RegExp(`^(${ko}|${en})$`, "i").test(matches[i].heading)
    );
    if (!foundHeading) return null;

    sections.push({ label: foundHeading.tabLabel, content: body });
  }

  return sections.length === headings.length ? sections : null;
}
