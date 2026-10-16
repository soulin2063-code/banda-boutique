/**
 * POST /api/admin/session — إنشاء جلسة الأدمن
 * DELETE /api/admin/session — إلغاء الجلسة
 *
 * القرار الأمني: هذا الـ Route Handler يتحقق من الـ token على السيرفر قبل وضعه في cookie.
 * القرار الأمني: Rate limiting يمنع محاولات استغلال هذا الـ endpoint.
 * القرار الأمني: httpOnly + Secure cookie لا يصل إليها JavaScript.
 * القرار الأمني: SameSite=lax يمنع CSRF في معظم الحالات.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifyAdminToken } from '@/lib/auth/requireAdmin';
import { checkLoginRateLimit } from '@/lib/rateLimit';

const sessionSchema = z.object({
  access_token: z.string().min(10),
});

export async function POST(req: Request) {
  try {
    // 1. Rate limiting — 5 محاولات/IP/15 دقيقة
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // نستخرج الإيميل من الـ token لمنع Brute Force per-user (نقرأه بعد الـ parse)
    const result = sessionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'بيانات الجلسة غير صالحة', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { access_token } = result.data;

    // فحص Rate Limit قبل أي تحقق من Supabase
    // نستخدم بداية الـ token كـ fingerprint للإيميل (لا نعرف الإيميل بعد)
    const rateLimitKey = `token_prefix:${access_token.slice(0, 20)}`;
    const rateCheck = checkLoginRateLimit(ip, rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `تجاوزت عدد المحاولات. حاول مجدداً بعد ${rateCheck.resetInSec} ثانية.`,
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    // 2. التحقق من الـ token مع Supabase Auth (getUser — ليس getSession)
    const authCheck = await verifyAdminToken(access_token);
    if (!authCheck.ok) {
      return authCheck.response;
    }

    // 3. وضع الـ token في httpOnly cookie
    // القرار الأمني: httpOnly يمنع XSS من قراءة الـ token
    // القرار الأمني: Secure يضمن نقل الـ cookie عبر HTTPS فقط
    // القرار الأمني: SameSite=lax يمنع CSRF (forms من مواقع خارجية)
    const cookieStore = await cookies();
    cookieStore.set('admin_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 ساعات (يوم عمل)
      path: '/',
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: authCheck.user.id,
        email: authCheck.user.email,
        role: authCheck.role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'خطأ داخلي في السيرفر', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin_token');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'خطأ داخلي في السيرفر', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
