import React from 'react';

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-lg bg-slate-200 animate-pulse" />
          <div className="h-3.5 w-72 rounded-lg bg-slate-100 animate-pulse" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-slate-200 animate-pulse" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 shadow-sm animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-8 w-8 rounded-lg bg-slate-100" />
            </div>
            <div className="h-7 w-32 rounded bg-slate-300" />
            <div className="h-3 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Main Table / Content Skeleton */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm animate-pulse">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 w-full rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
