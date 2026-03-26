export const SECTION_HEADINGS = [
  { ko: "커밋 개발내역", en: "Commit Summary", tabLabel: "커밋 분석" },
  { ko: "작업 순서", en: "Work Order", tabLabel: "작업 순서" },
  { ko: "핵심 기능", en: "Core Features", tabLabel: "핵심 코드" },
  { ko: "개발 스토리", en: "Dev Story", tabLabel: "개발 스토리" },
  { ko: "핵심 교훈", en: "Key Lessons", tabLabel: "핵심 교훈" },
] as const;

export type SectionHeading = typeof SECTION_HEADINGS[number];
