'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, ShoppingBag } from 'lucide-react';

interface MobileBottomNavProps {
  locale: string;
  onOpenCart?: () => void;
  wishlistCount?: number;
}

export function MobileBottomNav({
  locale,
  onOpenCart,
  wishlistCount = 0,
}: MobileBottomNavProps) {
  const pathname = usePathname() || '';

  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isSearch = pathname.includes('/recherche');
  const isFavorites = pathname.includes('/mes-favoris');

  return (
    <div className="md:hidden fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
      <nav
        aria-label="Mobile Navigation"
        className="pointer-events-auto flex items-center justify-between gap-6 px-7 py-3 rounded-full bg-[#1A1615]/92 text-white backdrop-blur-xl border border-[#C59B76]/30 shadow-[0_14px_36px_rgba(26,22,21,0.45)]"
      >
        {/* Home */}
        <Link
          href={`/${locale}`}
          prefetch={false}
          className={`flex items-center justify-center p-2 rounded-full transition-all duration-300 ${
            isHome ? 'text-[#E4B8AD] bg-white/10 scale-105' : 'text-white/70 hover:text-white'
          }`}
          aria-label="Home"
        >
          <Home className="h-5 w-5" />
        </Link>

        {/* Search */}
        <Link
          href={`/${locale}/recherche`}
          prefetch={false}
          className={`flex items-center justify-center p-2 rounded-full transition-all duration-300 ${
            isSearch ? 'text-[#E4B8AD] bg-white/10 scale-105' : 'text-white/70 hover:text-white'
          }`}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Link>

        {/* Wishlist */}
        <Link
          href={`/${locale}/mes-favoris`}
          prefetch={false}
          className={`relative flex items-center justify-center p-2 rounded-full transition-all duration-300 ${
            isFavorites ? 'text-[#E4B8AD] bg-white/10 scale-105' : 'text-white/70 hover:text-white'
          }`}
          aria-label="Wishlist"
        >
          <Heart className="h-5 w-5" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1A1615] border border-white/40 px-1 text-[9px] font-bold text-[#E4B8AD] pulse-rose">
              {wishlistCount}
            </span>
          )}
        </Link>

        {/* Cart Bag */}
        <button
          type="button"
          onClick={onOpenCart}
          className="flex items-center justify-center p-2 rounded-full text-white/70 hover:text-white transition-colors"
          aria-label="Cart"
        >
          <ShoppingBag className="h-5 w-5" />
        </button>
      </nav>
    </div>
  );
}
