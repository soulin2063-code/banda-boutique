/**
 * Data Access Layer — Auth Guards
 *
 * القرار الأمني: import 'server-only' يمنع bundler من تضمين هذا الملف في bundle العميل.
 * إذا حاول أي كود عميل استيراده، سيرمي Next.js خطأ وقت البناء.
 *
 * القرار الأمني: React.cache() يضمن استدعاء Supabase مرة واحدة فقط per-request،
 * حتى لو استدعت عدة Server Components/Actions requireAdmin() في نفس الطلب.
 *
 * القرار الأمني: getUser() وليس getSession() — getSession تقرأ JWT محلياً
 * قابل للتزوير. getUser تتحقق من Supabase Auth server مباشرة.
 */
import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { User } from '@supabase/supabase-js';

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────

export type StaffRole = 'admin' | 'seller';

export interface AdminAuthResult {
  user: User;
  role: StaffRole;
}

// ────────────────────────────────────────────────────────────────────────────────
// Core: مُخزَّنة بـ React.cache() — استدعاء واحد فقط per-request
// ────────────────────────────────────────────────────────────────────────────────

/**
 * يقرأ token من httpOnly cookie ويتحقق من صحته مع Supabase Auth.
 * القرار الأمني: React.cache() يمنع الاستدعاءات المتكررة غير الضرورية.
 * القرار الأمني: getUser() يتحقق من Supabase server مباشرة (ليس من JWT محلي).
 */
export const getAdminUser = cache(async (): Promise<AdminAuthResult | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return null;
    }

    // القرار الأمني: getUser(token) يتحقق من الـ token مع Supabase Auth API
    // وليس من الـ JWT payload محلياً. هذا يمنع قبول tokens مزوّرة.
    const { data, error } = await supabaseAdmin.auth.getUser(token.trim());

    if (error || !data?.user) {
      return null;
    }

    const appMeta = data.user.app_metadata ?? {};

    // القرار الأمني: نقرأ الدور من app_metadata فقط (يُعيَّن من السيرفر بـ service_role).
    // ممنوع استخدام user_metadata (يمكن للمستخدم تعديلها).
    // ممنوع مقارنة الإيميل (يمكن تغييره).
    let role = appMeta.role as StaffRole | undefined;
    if (!role && appMeta.is_admin === true) {
      role = 'admin'; // توافق مع الإعداد القديم
    }

    if (!role || !['admin', 'seller'].includes(role)) {
      return null;
    }

    return { user: data.user, role };
  } catch {
    return null;
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// Guards للاستخدام في Server Actions / Route Handlers / Layouts
// ────────────────────────────────────────────────────────────────────────────────

/**
 * تتحقق أن المستخدم الحالي أدمن.
 * إذا لم يكن كذلك، تعيد { ok: false, status, error }.
 *
 * استخدم هذا في Route Handlers حيث لا يمكن redirect().
 */
export async function verifyAdmin(): Promise<
  | { ok: true; user: User; role: StaffRole }
  | { ok: false; status: 401 | 403; error: string }
> {
  const result = await getAdminUser();

  if (!result) {
    return { ok: false, status: 401, error: 'غير مصرّح: يرجى تسجيل الدخول' };
  }

  if (result.role !== 'admin') {
    return { ok: false, status: 403, error: 'ممنوع: دور admin مطلوب' };
  }

  return { ok: true, ...result };
}

/**
 * يتحقق أن المستخدم أدمن أو seller.
 * إذا لم يكن كذلك، يعيد { ok: false }.
 */
export async function verifyStaff(
  allowedRoles: StaffRole[] = ['admin', 'seller']
): Promise<
  | { ok: true; user: User; role: StaffRole }
  | { ok: false; status: 401 | 403; error: string }
> {
  const result = await getAdminUser();

  if (!result) {
    return { ok: false, status: 401, error: 'غير مصرّح: يرجى تسجيل الدخول' };
  }

  if (!allowedRoles.includes(result.role)) {
    return {
      ok: false,
      status: 403,
      error: `ممنوع: الأدوار المسموح بها هي (${allowedRoles.join(', ')})`,
    };
  }

  return { ok: true, ...result };
}

/**
 * Guard للاستخدام في Server Components و Layouts.
 * يعيد user مباشرة أو يعيد توجيه لصفحة الدخول.
 *
 * القرار الأمني: redirect() في Next.js يرمي exception لا يمكن التحكم به،
 * مما يضمن وقف التنفيذ فوراً.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const auth = await getAdminUser();

  if (!auth || auth.role !== 'admin') {
    redirect('/admin/login');
  }

  return auth;
}

/**
 * Guard يسمح بـ admin أو seller.
 */
export async function requireStaff(
  allowedRoles: StaffRole[] = ['admin', 'seller']
): Promise<AdminAuthResult> {
  const auth = await getAdminUser();

  if (!auth || !allowedRoles.includes(auth.role)) {
    redirect('/admin/login');
  }

  return auth;
}
