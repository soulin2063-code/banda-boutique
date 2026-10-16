/**
 * Server Supabase client — server-only.
 * القرار الأمني: server-only يمنع استيراده من أي كود عميل.
 * يعمل بصلاحيات anon (مثل المستخدم العادي) — يحترم RLS.
 * للعمليات التي تحتاج service_role استخدم @/lib/supabase/admin.ts بعد requireAdmin().
 *
 * @deprecated supabaseAdmin - استخدم lib/supabase/admin.ts بدلاً منه
 */
import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * @deprecated استخدم lib/supabase/admin.ts — هذا الاسم مبقى للتوافق مع الكود القديم
 * القرار الأمني: server-only مضافة لمنع تسريب مفتاح service_role
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
