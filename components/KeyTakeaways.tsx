interface KeyTakeawaysProps {
  summary: string;
}

/**
 * GEO 최적화: AI 엔진이 콘텐츠를 인용할 때 참조하는 핵심 요약 블록.
 * summary를 단문 팩트로 노출합니다. 태그는 상단에 이미 표시되므로 중복 제거.
 */
export default function KeyTakeaways({ summary }: KeyTakeawaysProps) {
  if (!summary) return null;

  return (
    <aside
      aria-label="Key Takeaways"
      className="my-8 border border-accent/30 rounded-xl bg-accent/5 p-5"
    >
      <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">
        Key Takeaways
      </p>
      <p className="text-sm text-text-primary leading-relaxed">{summary}</p>
    </aside>
  );
}
