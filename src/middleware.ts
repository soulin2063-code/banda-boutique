/**
 * Next.js Middleware — طبقة تجربة المستخدم (UX Layer)
 *
 * القرار الأمني: هذا الـ Middleware ليس الحماية الحقيقية.
 * هدفه الوحيد: إعادة التوجيه السريع لمنع flash محتوى الأدمن قبل التحقق.
 *
 * الحماية الحقيقية (Defense in Depth):
 *   1. app/admin/layout.tsx → يستدعي requireAdmin() من DAL
 *   2. كل Route Handler / Server Action → يستدعي requireAdmin() / verifyAdmin() من DAL
 *   3. Supabase RLS → سياسات قاعدة البيانات
 *
 * لماذا لا نتحقق من الـ JWT هنا؟
 *   - الـ Middleware يعمل على Edge Runtime (لا Crypto كامل)
 *   - التحقق الحقيقي يجب أن يكون في السيرفر (requireAdmin في DAL)
 *   - مقارنة وجود cookie فقط كافية لـ UX redirect السريع
 */
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['ar', 'fr', 'en'],
  defaultLocale: 'ar',
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. استثناء فوري وفوري لأي ملفات ثابتة أو favicon أو وسائط لمنع استنزاف موارد السيرفر
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('favicon.ico') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  // ── Admin routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const isLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login');
    const requestHeaders = new Headers(request.headers);
    // نمرر الـ pathname للـ layout ليعرف إن كانت صفحة login أم لا
    requestHeaders.set('x-pathname', pathname);
    requestHeaders.set('x-is-admin-login', isLogin ? '1' : '0');

    // صفحة تسجيل الدخول متاحة دائماً بدون توكن
    if (isLogin) {
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    // UX-only: إذا لم توجد cookie → redirect فوري لتجنب flash
    // الحماية الحقيقية في admin/layout.tsx + DAL + RLS
    const hasToken = request.cookies.has('admin_token');
    if (!hasToken) {
      const loginUrl = new URL('/admin/login', request.url);
      // القرار الأمني: 307 مؤقت (ليس 301 دائم) لتجنب cache المتصفح
      return NextResponse.redirect(loginUrl, 307);
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // ── Seller routes ─────────────────────────────────────────────────────────
  if (pathname.startsWith('/seller')) {
    const isLogin = pathname === '/seller/login' || pathname.startsWith('/seller/login');
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);

    if (isLogin) {
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    const hasToken = request.cookies.has('admin_token');
    if (!hasToken) {
      const loginUrl = new URL('/seller/login', request.url);
      return NextResponse.redirect(loginUrl, 307);
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // ── Frontend i18n routing ────────────────────────────────────────────────
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/',
    '/(ar|fr|en)/:path*',
    '/admin/:path*',
    '/seller/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
