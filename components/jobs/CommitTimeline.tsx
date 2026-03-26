interface CommitTimelineProps {
  commitShas: string[];
  repo: string; // "owner/repo" 형식
}

export function CommitTimeline({ commitShas, repo }: CommitTimelineProps) {
  if (!commitShas || commitShas.length === 0) {
    return (
      <p className="text-sm text-text-tertiary py-4 text-center">
        커밋 정보가 없습니다.
      </p>
    );
  }

  return (
    <div className="relative pl-8 mb-6" aria-label="커밋 작업 순서">
      {commitShas.map((sha, idx) => (
        <div key={sha} className="relative mb-4 last:mb-0">
          {/* 세로 연결선 */}
          {idx < commitShas.length - 1 && (
            <div className="absolute left-[-1.25rem] top-6 h-full border-l border-border-subtle" />
          )}
          {/* 순서 번호 원형 */}
          <div className="absolute left-[-1.75rem] top-0.5 w-6 h-6 rounded-full bg-elevated border border-border-strong flex items-center justify-center text-[10px] font-bold text-text-secondary select-none">
            {idx + 1}
          </div>
          {/* SHA GitHub 링크 */}
          <a
            href={`https://github.com/${repo}/commit/${sha}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-sm text-accent hover:opacity-75 transition-opacity"
          >
            {sha.substring(0, 7)}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      ))}
    </div>
  );
}
