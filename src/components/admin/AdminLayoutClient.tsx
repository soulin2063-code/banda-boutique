'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Boxes,
  Layers,
  Users,
  Settings,
  Menu,
  X,
  Search,
  ExternalLink,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Bell,
  Sparkles,
  ShieldCheck,
  Command,
  ArrowUpRight,
  Globe,
} from 'lucide-react';
import {
  AdminLanguageProvider,
  useAdminLanguage,
} from '@/lib/i18n/AdminLanguageContext';
import { AdminLocale } from '@/lib/i18n/adminTranslations';

export interface AdminLayoutClientProps {
  children: React.ReactNode;
  userEmail?: string;
  userRole?: string;
  pendingOrdersCount?: number;
  lowStockCount?: number;
  logoutAction: () => Promise<void>;
  initialLocale?: AdminLocale;
}

interface NavItemConfig {
  key: string;
  titleKey: 'nav_dashboard' | 'nav_orders' | 'nav_products' | 'nav_categories' | 'nav_stock' | 'nav_attributes' | 'nav_customers' | 'nav_settings';
  descKey: 'nav_dashboard_desc' | 'nav_orders_desc' | 'nav_products_desc' | 'nav_categories_desc' | 'nav_stock_desc' | 'nav_attributes_desc' | 'nav_customers_desc' | 'nav_settings_desc';
  href: string;
  icon: React.ElementType;
  badgeType?: 'pending' | 'stock';
  badgeColor?: string;
}

const NAV_CONFIG: NavItemConfig[] = [
  {
    key: 'dashboard',
    titleKey: 'nav_dashboard',
    descKey: 'nav_dashboard_desc',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    key: 'orders',
    titleKey: 'nav_orders',
    descKey: 'nav_orders_desc',
    href: '/admin/commandes',
    icon: ShoppingBag,
    badgeType: 'pending',
    badgeColor: 'bg-amber-500 text-white animate-pulse',
  },
  {
    key: 'products',
    titleKey: 'nav_products',
    descKey: 'nav_products_desc',
    href: '/admin/produits',
    icon: Package,
  },
  {
    key: 'categories',
    titleKey: 'nav_categories',
    descKey: 'nav_categories_desc',
    href: '/admin/categories',
    icon: FolderTree,
  },
  {
    key: 'stock',
    titleKey: 'nav_stock',
    descKey: 'nav_stock_desc',
    href: '/admin/stock',
    icon: Boxes,
    badgeType: 'stock',
    badgeColor: 'bg-rose-500 text-white',
  },
  {
    key: 'attributes',
    titleKey: 'nav_attributes',
    descKey: 'nav_attributes_desc',
    href: '/admin/attributs',
    icon: Layers,
  },
  {
    key: 'customers',
    titleKey: 'nav_customers',
    descKey: 'nav_customers_desc',
    href: '/admin/clients',
    icon: Users,
  },
  {
    key: 'settings',
    titleKey: 'nav_settings',
    descKey: 'nav_settings_desc',
    href: '/admin/parametres',
    icon: Settings,
  },
];

function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useAdminLanguage();

  const languages: { code: AdminLocale; label: string; flag: string }[] = [
    { code: 'ar', label: 'العربية', flag: '🇩🇿' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  if (compact) {
    return (
      <div className="flex items-center rounded-xl bg-slate-900/90 p-1 border border-slate-800 text-xs w-full justify-between">
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLocale(lang.code)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold transition-all ${
              locale === lang.code
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 shadow-xs">
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => setLocale(lang.code)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all min-h-[32px] ${
            locale === lang.code
              ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200/50'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title={lang.label}
        >
          <span>{lang.flag}</span>
          <span className="hidden sm:inline">{lang.label}</span>
          <span className="sm:hidden uppercase">{lang.code}</span>
        </button>
      ))}
    </div>
  );
}

function AdminLayoutClientInner({
  children,
  userEmail = 'admin@shopdz.com',
  userRole = 'مدير النظام',
  pendingOrdersCount = 0,
  lowStockCount = 0,
  logoutAction,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const { t, locale, dir } = useAdminLanguage();
  const isRtl = dir === 'rtl';

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  // Keyboard shortcut for search modal (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = NAV_CONFIG.map((item) => {
    const badge =
      item.badgeType === 'pending'
        ? pendingOrdersCount > 0
          ? pendingOrdersCount
          : undefined
        : item.badgeType === 'stock'
        ? lowStockCount > 0
          ? lowStockCount
          : undefined
        : undefined;

    return {
      title: t[item.titleKey],
      description: t[item.descKey],
      href: item.href,
      icon: item.icon,
      badge,
      badgeColor: item.badgeColor,
    };
  });

  // Quick search items list
  const searchResults = navItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate breadcrumb title
  const currentNav = navItems.find((item) =>
    item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
  );

  return (
    <div
      dir={dir}
      className="min-h-screen bg-slate-950/2 text-slate-900 font-sans flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white"
    >
      {/* ── DESKTOP SIDEBAR ────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col bg-slate-950 text-slate-200 ${
          isRtl ? 'border-l' : 'border-r'
        } border-slate-800/80 sticky top-0 h-screen z-30 transition-all duration-300 ease-in-out shrink-0 ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <Link
            href="/admin"
            className={`flex items-center gap-3 overflow-hidden transition-all ${
              isSidebarCollapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <Sparkles className="h-5 w-5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="font-black text-lg text-white tracking-tight flex items-center gap-1.5">
                  {t.brand}
                  <span className="rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 border border-indigo-500/30">
                    {t.brand_pro}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {t.brand_tagline}
                </span>
              </div>
            )}
          </Link>

          {!isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title={t.nav_collapse}
            >
              {isRtl ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Re-expand button when collapsed */}
        {isSidebarCollapsed && (
          <div className="py-2 flex justify-center border-b border-slate-800/60">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={t.nav_expand}
            >
              {isRtl ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {!isSidebarCollapsed && (
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t.menu_title}
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isSidebarCollapsed ? item.title : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  }`}
                />

                {!isSidebarCollapsed && (
                  <span className="flex-1 truncate text-xs">{item.title}</span>
                )}

                {item.badge !== undefined && (
                  <span
                    className={`shrink-0 rounded-full text-[10px] font-black px-2 py-0.5 shadow-xs ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    } ${isSidebarCollapsed ? 'absolute -top-1 -right-1' : ''}`}
                  >
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <span
                    className={`absolute top-2 bottom-2 w-1 bg-white ${
                      isRtl ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Preview Store Link */}
        <div className="px-3 py-2 border-t border-slate-800/80">
          <Link
            href={`/${locale}`}
            target="_blank"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-all group ${
              isSidebarCollapsed ? 'justify-center px-0' : ''
            }`}
            title={t.nav_view_store}
          >
            <ArrowUpRight className="h-4 w-4 text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            {!isSidebarCollapsed && (
              <span className="flex-1 truncate">{t.nav_view_store}</span>
            )}
          </Link>
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
          <div
            className={`flex items-center gap-3 ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-indigo-400 shrink-0 font-bold text-xs shadow-inner">
              <ShieldCheck className="h-4 w-4" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{userEmail}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-slate-400">
                    {userRole.includes('admin') || userRole.includes('مدير')
                      ? t.role_admin
                      : t.role_sales}
                  </span>
                </div>
              </div>
            )}
            {!isSidebarCollapsed && (
              <form
                action={() => {
                  startTransition(async () => {
                    await logoutAction();
                  });
                }}
              >
                <button
                  type="submit"
                  disabled={isPending}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title={t.logout}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </aside>

      {/* ── MOBILE SLIDE-OUT DRAWER ─────────────────────────────────── */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div
            className={`relative w-4/5 max-w-xs bg-slate-950 text-white h-full shadow-2xl flex flex-col z-10 animate-in ${
              isRtl ? 'slide-in-from-right' : 'slide-in-from-left'
            } duration-200`}
          >
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <div className="font-black text-base">{t.brand} {t.brand_pro}</div>
                  <div className="text-[10px] text-slate-400">{t.nav_dashboard}</div>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Language Switcher in Drawer */}
            <div className="p-4 border-b border-slate-800/80">
              <div className="text-[11px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-indigo-400" />
                <span>{t.select_language}</span>
              </div>
              <LanguageSwitcher compact />
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold min-h-[44px] transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{item.title}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`rounded-full text-[11px] font-black px-2 py-0.5 ${
                          item.badgeColor || 'bg-slate-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-800 space-y-3">
              <Link
                href={`/${locale}`}
                target="_blank"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 min-h-[44px]"
              >
                <span>{t.visit_store}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <form
                action={() => {
                  startTransition(async () => {
                    await logoutAction();
                  });
                }}
              >
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 min-h-[44px]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t.logout}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
          <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-3">
              {/* Left Side: Mobile Menu Button & Breadcrumbs */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Toggle Menu"
                >
                  <Menu className="h-5 w-5" />
                </button>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Link
                    href="/admin"
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {t.breadcrumb_home}
                  </Link>
                  {currentNav && currentNav.href !== '/admin' && (
                    <>
                      <span className="text-slate-300">/</span>
                      <span className="text-slate-900 font-bold">
                        {currentNav.title}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Center / Right: Language Switcher, Quick Search Button & Actions */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* 🌐 Language Switcher Pill */}
                <LanguageSwitcher />

                {/* Search Trigger */}
                <button
                  type="button"
                  onClick={() => setIsSearchModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 border border-slate-200/80 text-xs transition-all min-h-[38px]"
                >
                  <Search className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden lg:inline">{t.search_btn_text}</span>
                  <span className="hidden sm:inline-flex items-center gap-0.5 rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200">
                    <Command className="h-2.5 w-2.5" />K
                  </span>
                </button>

                {/* Quick Store Preview */}
                <Link
                  href={`/${locale}`}
                  target="_blank"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-all min-h-[38px]"
                >
                  <span>{t.visit_store}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </Link>

                {/* Quick Notifications */}
                {(pendingOrdersCount > 0 || lowStockCount > 0) && (
                  <Link
                    href={pendingOrdersCount > 0 ? '/admin/commandes' : '/admin/stock'}
                    className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title={`${pendingOrdersCount} ${t.pending_badge_tooltip}`}
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white animate-ping" />
                  </Link>
                )}

                {/* Logout for mobile / compact */}
                <form
                  action={() => {
                    startTransition(async () => {
                      await logoutAction();
                    });
                  }}
                  className="md:hidden"
                >
                  <button
                    type="submit"
                    disabled={isPending}
                    className="p-2 rounded-xl text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title={t.logout}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAVIGATION (Thumb-friendly) ───────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-1.5 px-4 md:hidden shadow-lg shadow-slate-900/10">
        <div className="flex items-center justify-around">
          {[
            { href: '/admin', title: t.nav_dashboard, icon: LayoutDashboard },
            {
              href: '/admin/commandes',
              title: t.nav_orders,
              icon: ShoppingBag,
              badge: pendingOrdersCount,
            },
            { href: '/admin/produits', title: t.nav_products, icon: Package },
            {
              href: '/admin/stock',
              title: t.nav_stock,
              icon: Boxes,
              badge: lowStockCount,
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl min-h-[44px] min-w-[54px] transition-colors ${
                  isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5">{item.title}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-slate-900 min-h-[44px] min-w-[54px]"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">{t.nav_more}</span>
          </button>
        </div>
      </nav>

      {/* ── QUICK SEARCH COMMAND PALETTE MODAL ───────────────────────── */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsSearchModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50/50">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search_placeholder}
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
                autoFocus
              />
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {searchResults.length > 0 ? (
                searchResults.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSearchModalOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      {isRtl ? (
                        <ChevronLeft className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      )}
                    </Link>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  {t.search_no_results} &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            {/* Modal Footer Note */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>{t.search_hint_click}</span>
              <span className="font-mono">{t.search_hint_esc}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminLayoutClient(props: AdminLayoutClientProps) {
  return (
    <AdminLanguageProvider initialLocale={props.initialLocale || 'ar'}>
      <AdminLayoutClientInner {...props} />
    </AdminLanguageProvider>
  );
}
