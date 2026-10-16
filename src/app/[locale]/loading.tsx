import React from 'react';

export default function LocaleLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10 animate-fade-in">
      {/* Top Banner Skeleton */}
      <div className="h-44 sm:h-64 w-full rounded-3xl bg-gradient-to-r from-[#EAE1D9]/40 via-[#FDF5F2]/80 to-[#EAE1D9]/40 animate-pulse border border-[#EAE1D9]/50" />

      {/* Category Circles Skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-36 rounded-full bg-[#EAE1D9]/60 animate-pulse" />
        <div className="flex gap-4 overflow-hidden py-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2.5 shrink-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#EAE1D9]/50 border border-[#E4B8AD]/30 animate-pulse" />
              <div className="h-3 w-12 rounded-full bg-[#EAE1D9]/60 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Products Grid Skeleton */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 rounded-full bg-[#EAE1D9]/70 animate-pulse" />
          <div className="h-4 w-20 rounded-full bg-[#EAE1D9]/50 animate-pulse" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-3xl bg-white/70 border border-[#EAE1D9]/60 p-3.5 space-y-3 shadow-sm animate-pulse"
            >
              <div className="aspect-square w-full rounded-2xl bg-[#EAE1D9]/40" />
              <div className="space-y-2">
                <div className="h-3 w-16 rounded-full bg-[#C59B76]/20" />
                <div className="h-4 w-full rounded-full bg-[#1A1615]/10" />
                <div className="h-4 w-2/3 rounded-full bg-[#1A1615]/10" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#EAE1D9]/40">
                <div className="h-5 w-20 rounded-full bg-[#1A1615]/15" />
                <div className="h-8 w-8 rounded-full bg-[#EAE1D9]/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
