import React from 'react';

export default function AdminLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200" dir="rtl">
      {/* Top Banner Skeleton */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded-full bg-slate-800" />
        <div className="h-9 w-72 sm:w-96 rounded-xl bg-slate-800" />
        <div className="h-4 w-full max-w-lg rounded-lg bg-slate-800/60" />
      </div>

      {/* 6 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 space-y-3 shadow-xs animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="h-9 w-9 rounded-xl bg-slate-100" />
            </div>
            <div className="h-8 w-28 rounded-lg bg-slate-300" />
            <div className="h-3 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-6 space-y-4 shadow-xs animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-8 w-36 rounded-xl bg-slate-100" />
          </div>
          <div className="h-64 rounded-xl bg-slate-50" />
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-6 space-y-4 shadow-xs animate-pulse">
          <div className="h-5 w-36 rounded bg-slate-200" />
          <div className="space-y-3 pt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table Skeleton */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 space-y-4 shadow-xs animate-pulse">
        <div className="h-5 w-44 rounded bg-slate-200" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
