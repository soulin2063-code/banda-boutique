/**
 * @deprecated استخدم @/lib/dal/auth.ts مباشرة.
 *
 * هذا الملف مبقى للتوافق مع Route Handlers القديمة التي تستخدم الأسلوب القديم
 * (token من header أو cookie يدوياً + NextResponse).
 *
 * للكود الجديد: استخدم verifyAdmin() من @/lib/dal/auth.ts في Route Handlers،
 * و requireAdmin() من @/lib/dal/auth.ts في Server Components/Actions.
 */
import 'server-only';

import { NextResponse } from 'next/server';
import { verifyAdmin, verifyStaff, StaffRole, AdminAuthResult } from '@/lib/dal/auth';
import type { User } from '@supabase/supabase-js';

export type { StaffRole };

export type AuthSuccess = {
  ok: true;
  user: User;
  role: StaffRole;
};

export type AuthFailure = {
  ok: false;
  status: 401 | 403;
  error: string;
  code: 'UNAUTHORIZED' | 'FORBIDDEN';
  response: NextResponse;
};

export type RequireAdminResult = AuthSuccess | AuthFailure;

/**
 * Guard للاستخدام في Route Handlers.
 * يقرأ admin_token من cookie ويتحقق من الدور.
 * القرار الأمني: يعتمد على DAL الذي يستخدم getUser() وليس getSession().
 */
export async function requireAdmin(_req?: Request): Promise<RequireAdminResult> {
  return requireStaff(['admin'], _req);
}

/**
 * يسمح بـ admin أو seller.
 */
export async function requireSeller(_req?: Request): Promise<RequireAdminResult> {
  return requireStaff(['admin', 'seller'], _req);
}

/**
 * Core guard — يفحص الدور من app_metadata عبر DAL.
 */
export async function requireStaff(
  allowedRoles: StaffRole[] = ['admin'],
  _req?: Request
): Promise<RequireAdminResult> {
  const result = await verifyStaff(allowedRoles);

  if (!result.ok) {
    const code = result.status === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED';
    return {
      ok: false,
      status: result.status,
      error: result.error,
      code,
      response: NextResponse.json(
        { error: result.error, code },
        { status: result.status }
      ),
    };
  }

  return {
    ok: true,
    user: result.user,
    role: result.role,
  };
}

/**
 * يتحقق مباشرة من token string (للاستخدام في session route).
 * القرار الأمني: يستخدم supabaseAdmin.auth.getUser(token) للتحقق السيرفري.
 */
export async function verifyAdminToken(
  token: string | null | undefined,
  allowedRoles: StaffRole[] = ['admin']
): Promise<RequireAdminResult> {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return {
      ok: false,
      status: 401,
      error: "جلسة غير صالحة: token مفقود",
      code: 'UNAUTHORIZED',
      response: NextResponse.json(
        { error: "جلسة غير صالحة: token مفقود", code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }

  try {
    // استيراد مباشر لـ supabaseAdmin لتجنّب الدائرة المرجعية
    const { supabaseAdmin } = await import('@/lib/supabase/admin');
    const { data, error } = await supabaseAdmin.auth.getUser(token.trim());

    if (error || !data?.user) {
      return {
        ok: false,
        status: 401,
        error: 'Token منتهي أو غير صالح',
        code: 'UNAUTHORIZED',
        response: NextResponse.json(
          { error: 'Token منتهي أو غير صالح', code: 'UNAUTHORIZED' },
          { status: 401 }
        ),
      };
    }

    const appMeta = data.user.app_metadata ?? {};
    let role = appMeta.role as StaffRole | undefined;
    if (!role && appMeta.is_admin === true) role = 'admin';

    if (!role || !allowedRoles.includes(role)) {
      return {
        ok: false,
        status: 403,
        error: `ممنوع: دور مطلوب (${allowedRoles.join(' أو ')})`,
        code: 'FORBIDDEN',
        response: NextResponse.json(
          { error: `ممنوع: دور مطلوب (${allowedRoles.join(' أو ')})`, code: 'FORBIDDEN' },
          { status: 403 }
        ),
      };
    }

    return { ok: true, user: data.user, role };
  } catch {
    return {
      ok: false,
      status: 401,
      error: 'خطأ في التحقق من الجلسة',
      code: 'UNAUTHORIZED',
      response: NextResponse.json(
        { error: 'خطأ في التحقق من الجلسة', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }
}
