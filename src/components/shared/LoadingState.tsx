import React from 'react';

export default function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center bg-[#F8FAFC] px-6" role="status" aria-live="polite">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-[#0B192C]" aria-hidden="true" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-slate-200" aria-hidden="true" />
            <div className="h-3 w-44 animate-pulse rounded bg-slate-100" aria-hidden="true" />
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[#F1C40F]" aria-hidden="true" />
        </div>
        <p className="text-center text-xs font-bold text-slate-500">{label}...</p>
      </div>
    </div>
  );
}
