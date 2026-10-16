'use client';

import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductGalleryProps {
  images: Array<{ url: string; position?: number }>;
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square w-full rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
        <Package className="h-12 w-12 text-slate-300" aria-hidden="true" />
      </div>
    );
  }

  const activeImage = images[selectedIndex]?.url || images[0]?.url;

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="aspect-square w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
        <img
          src={activeImage}
          alt={productName}
          className="h-full w-full object-cover object-center transition-opacity duration-200"
        />
      </div>

      {/* Thumbnails (if multiple images) */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                selectedIndex === idx
                  ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img.url}
                alt={`${productName} - thumbnail ${idx + 1}`}
                className="h-full w-full object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
