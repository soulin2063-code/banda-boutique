/**
 * Admin Supabase client — server-only.
 * القرار الأمني: server-only يرمي خطأ وقت البناء إذا حاول أي كود عميل استيراد هذا الملف.
 * يستخدم SUPABASE_SERVICE_ROLE_KEY (بدون NEXT_PUBLIC_) فلا يظهر أبداً في المتصفح.
 * لا تستدعِ هذا الملف إلا بعد التحقق من requireAdmin() أولاً.
 */
import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    '[supabase/admin] NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY غير مضبوطَين في بيئة السيرفر.'
  );
}

/**
 * Supabase client بصلاحيات service_role — يتجاوز RLS.
 * القرار الأمني: يُستخدم فقط في Server Actions وRoute Handlers بعد تحقق requireAdmin().
 */
export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
