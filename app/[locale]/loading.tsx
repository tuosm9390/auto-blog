"use client";

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 animate-pulse">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="h-10 w-48 bg-surface-subtle rounded-md mb-2"></div>
          <div className="h-4 w-96 bg-surface-subtle rounded-md"></div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="h-12 flex-1 bg-surface-subtle rounded-lg"></div>
        <div className="h-12 w-32 bg-surface-subtle rounded-lg"></div>
        <div className="h-12 w-32 bg-surface-subtle rounded-lg"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-surface/50 border border-border-subtle rounded-2xl p-6 flex flex-col justify-between">
            <div className="h-4 w-1/3 bg-surface-subtle rounded"></div>
            <div className="space-y-3">
              <div className="h-6 w-full bg-surface-subtle rounded"></div>
              <div className="h-6 w-5/6 bg-surface-subtle rounded"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-5 w-12 bg-surface-subtle rounded"></div>
              <div className="h-5 w-16 bg-surface-subtle rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
