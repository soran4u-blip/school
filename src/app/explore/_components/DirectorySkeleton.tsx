import React from 'react';

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} aria-hidden="true" />;
}

export default function DirectorySkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]" role="status" aria-label="Loading directory">
      <div className="h-16 border-b border-slate-200 bg-white" />
      <div className="bg-[#0B192C] px-4 py-12 sm:px-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <SkeletonBlock className="h-3 w-32 bg-white/15" />
          <SkeletonBlock className="h-10 w-3/4 bg-white/15 sm:w-1/2" />
          <SkeletonBlock className="h-4 w-full max-w-xl bg-white/15" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
        <SkeletonBlock className="hidden h-[520px] lg:block" />
        <div className="space-y-5">
          <SkeletonBlock className="h-20 w-full bg-white" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <SkeletonBlock className="h-44 w-full rounded-none" />
              <div className="space-y-3 p-5">
                <SkeletonBlock className="h-5 w-2/3" />
                <SkeletonBlock className="h-3 w-1/3" />
                <SkeletonBlock className="h-10 w-full" />
                <div className="flex gap-2">
                  <SkeletonBlock className="h-9 w-24" />
                  <SkeletonBlock className="h-9 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
