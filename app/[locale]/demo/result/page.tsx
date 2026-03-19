'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DemoResult {
  title: string;
  content: string;
  commit_count: number;
  repo_count: number;
}

export default function DemoResultPage() {
  const [result, setResult] = useState<DemoResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generate() {
      try {
        const res = await fetch('/api/demo/generate', { method: 'POST' });
        if (res.status === 503) {
          setError('서비스가 일시적으로 이용 불가합니다. 잠시 후 다시 시도해주세요.');
          return;
        }
        if (res.status === 429) {
          setError('오늘의 무료 생성 한도(3회)를 초과했습니다. 내일 다시 시도해주세요.');
          return;
        }
        if (res.status === 401 || res.status === 403) {
          setError('GitHub 인증이 만료되었습니다. 다시 시도해주세요.');
          return;
        }
        if (!res.ok) {
          setError('포스트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          return;
        }
        const data = await res.json();
        setResult(data);
      } catch {
        setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    }
    generate();
  }, []);

  const shareOnX = () => {
    if (!result) return;
    const text = encodeURIComponent(`${result.title}\n\n#Synapso #DevBlog`);
    const url = encodeURIComponent('https://synapso.dev');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent('https://synapso.dev');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-neutral-600">GitHub 커밋을 분석하고 있습니다...</p>
          <p className="text-sm text-neutral-400">최대 30초 소요될 수 있습니다</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <p className="text-neutral-700">{error}</p>
          <Link href="/demo" className="inline-block px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors">
            다시 시도
          </Link>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-6 flex items-center gap-3 text-sm text-neutral-500">
        <span>{result.repo_count}개 레포지토리</span>
        <span>·</span>
        <span>{result.commit_count}개 커밋 분석</span>
      </div>

      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
        {result.title}
      </h1>

      <div className="prose dark:prose-invert max-w-none mb-12">
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
          {result.content}
        </pre>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8 space-y-6">
        <p className="text-sm text-neutral-500">이 포스트가 마음에 드셨나요?</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={shareOnX}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-neutral-800 transition-colors"
          >
            X(트위터)에 공유
          </button>
          <button
            onClick={shareOnLinkedIn}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            LinkedIn에 공유
          </button>
          <Link
            href="/pricing"
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Pro로 전체 기능 사용하기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
