'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Search,
  Heart,
  ShoppingBag,
  Shield,
  Truck,
  Sparkles,
  X,
  Menu,
} from 'lucide-react';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

interface StoreHeaderProps {
  locale: string;
}

export function StoreHeader({ locale }: StoreHeaderProps) {
  const pathname = usePathname() || '';
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  const isArabic = locale === 'ar';

  useEffect(() => {
    const read = () => {
      try {
        const stored = localStorage.getItem('shopdz_wishlist');
        if (stored) {
          const items = JSON.parse(stored);
          setWishlistCount(Array.isArray(items) ? items.length : 0);
        }
      } catch {
        setWishlistCount(0);
      }
    };
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, []);

  const getLocaleUrl = (newLocale: string) => {
    if (!pathname) return `/${newLocale}`;
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return `/${newLocale}`;
    segments[0] = newLocale;
    return `/${segments.join('/')}`;
  };

  const navLinks = [
    { href: `/${locale}`,            label: isArabic ? 'الرئيسية' : 'Accueil' },
    { href: `/${locale}/produits`,   label: isArabic ? 'المجموعة الفاخرة' : 'Collections' },
    { href: `/${locale}/recherche`,  label: isArabic ? 'البحث السريع' : 'Recherche' },
    { href: `/${locale}/mes-favoris`,label: isArabic ? 'مفضلاتي' : 'Favoris' },
  ];

  return (
    <>
      {/* High-Fashion Continuous Marquee Ribbon */}
      <div className="bg-[#1A1615] text-[#EAE1D9] text-[11px] sm:text-xs py-2 overflow-hidden border-b border-[#2B2320] select-none">
        <div className={isArabic ? 'animate-marquee-rtl' : 'animate-marquee-ltr'}>
          {[1, 2, 3].map((rep) => (
            <div key={rep} className="flex items-center gap-8 px-4 whitespace-nowrap">
              <span className="inline-flex items-center gap-2 font-medium tracking-wide">
                <Sparkles className="h-3 w-3 text-[#C59B76] animate-pulse" />
                {isArabic
                  ? 'تشكيلة أنثوية راقية بأعلى معايير الجودة'
                  : 'Collection exclusive et féminine de haute qualité'}
              </span>
              <span className="text-[#C59B76] text-xs opacity-60">✦</span>
              <span className="inline-flex items-center gap-2 font-medium tracking-wide">
                <Truck className="h-3 w-3 text-[#C59B76]" />
                {isArabic
                  ? 'توصيل سريع لكافة الـ 58 ولاية إلى باب منزلك'
                  : 'Livraison express sur 58 wilayas à domicile'}
              </span>
              <span className="text-[#C59B76] text-xs opacity-60">✦</span>
              <span className="inline-flex items-center gap-2 font-medium tracking-wide">
                <Shield className="h-3 w-3 text-[#C59B76]" />
                {isArabic
                  ? 'الدفع نقداً عند الاستلام مع إمكانية فحص الطرد'
                  : 'Paiement cash à la livraison avec vérification'}
              </span>
              <span className="text-[#C59B76] text-xs opacity-60">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Luxury Header with Silk Frosted Glass */}
      <header className="sticky top-0 z-40 bg-[#FAF7F5]/85 backdrop-blur-xl border-b border-[#EAE1D9]/80 shadow-[0_4px_24px_-4px_rgba(228,184,173,0.12)] transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Left: 4-dot Grid Icon (Categories Menu) & Desktop Nav */}
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/produits`}
              className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1A1615] hover:bg-[#FBF4F1] hover:text-[#C59B76] transition-all duration-300 border border-[#EAE1D9] shadow-sm hover:shadow"
              aria-label={isArabic ? 'تصفح الأقسام' : 'Browse Collections'}
            >
              <LayoutGrid className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-45" />
            </Link>

            {/* Desktop Navigation */}
            <nav
              aria-label="Desktop Navigation"
              className="hidden md:flex items-center gap-7 ms-4"
            >
              {navLinks.map((item) => {
                const isActive =
                  item.href === `/${locale}`
                    ? pathname === `/${locale}` || pathname === `/${locale}/`
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={`relative text-xs uppercase tracking-wider font-bold transition-all duration-200 py-1 ${
                      isActive
                        ? 'text-[#1A1615]'
                        : 'text-[#8C7F77] hover:text-[#1A1615]'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 inset-x-0 h-0.5 rounded-full bg-gradient-to-r from-[#C59B76] to-[#E4B8AD]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center: Brand Name in Haute Couture Serif */}
          <div className="text-center group">
            <Link href={`/${locale}`} className="inline-flex flex-col items-center">
              <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1A1615] transition-transform duration-300 group-hover:scale-105">
                Banda
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#C59B76] font-semibold -mt-1 opacity-90">
                Haute Élégance
              </span>
            </Link>
          </div>

          {/* Right: Actions (Search, Language, Wishlist, Cart Bag) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Desktop Search Link */}
            <Link
              href={`/${locale}/recherche`}
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1A1615] hover:bg-[#FBF4F1] hover:text-[#C59B76] transition-all duration-300 border border-[#EAE1D9] shadow-sm hover:shadow"
              aria-label="Search"
            >
              <Search className="h-4.5 w-4.5" />
            </Link>

            {/* Language Switcher */}
            <div className="flex items-center rounded-full bg-white border border-[#EAE1D9] p-1 text-[11px] font-bold shadow-sm">
              {(['ar', 'fr', 'en'] as const).map((l) => (
                <Link
                  key={l}
                  href={getLocaleUrl(l)}
                  className={`px-2.5 py-0.5 rounded-full transition-all duration-200 ${
                    locale === l
                      ? 'bg-[#1A1615] text-[#EAE1D9] shadow-sm'
                      : 'text-[#8C7F77] hover:text-[#1A1615]'
                  }`}
                  aria-label={l}
                >
                  {l === 'ar' ? 'ع' : l.toUpperCase()}
                </Link>
              ))}
            </div>

            {/* Shopping Bag Button with Delicate Rose Pulse */}
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1A1615] hover:bg-[#FBF4F1] hover:text-[#C59B76] transition-all duration-300 border border-[#EAE1D9] shadow-sm hover:shadow"
              aria-label="Open Cart"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1A1615] text-white px-1 text-[9px] font-bold pulse-rose border border-white">
                  {wishlistCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Cart Drawer Slide-out */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        locale={locale}
      />

      {/* Mobile Floating Pill Dock matching Banda screenshot */}
      <MobileBottomNav
        locale={locale}
        onOpenCart={() => setCartDrawerOpen(true)}
        wishlistCount={wishlistCount}
      />
    </>
  );
}
