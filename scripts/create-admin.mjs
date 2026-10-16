import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envVars = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      envVars[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envVars['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ خطأ: يرجى التأكد من ضبط NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في ملف .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log(`
ℹ️ الاستخدام:
  npm run create-admin <البريد_الإلكتروني> <كلمة_المرور>

مثال:
  npm run create-admin admin@boutique.dz 12345678
`);
  process.exit(0);
}

async function main() {
  console.log(`⏳ جاري إنشاء / ترقية حساب الأدمن لـ: ${email}...`);

  // Check if user already exists
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ خطأ أثناء الاتصال بقاعدة البيانات:', listError.message);
    process.exit(1);
  }

  const existingUser = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    // Update existing user with admin metadata and new password
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: password,
      app_metadata: {
        ...existingUser.app_metadata,
        role: 'admin',
        is_admin: true,
      },
    });

    if (updateError) {
      console.error('❌ خطأ أثناء ترقية الحساب:', updateError.message);
      process.exit(1);
    }

    console.log(`✅ تم تحديث الحساب الموجود وترقيته إلى مسؤول (Admin) بنجاح!`);
  } else {
    // Create new admin user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role: 'admin',
        is_admin: true,
      },
    });

    if (createError) {
      console.error('❌ خطأ أثناء إنشاء الحساب:', createError.message);
      process.exit(1);
    }

    console.log(`✅ تم إنشاء حساب مسؤول (Admin) جديد بنجاح: ${newUser.user.email}`);
  }

  console.log(`
🎉 يمكنك الآن تسجيل الدخول مباشرة من:
  http://localhost:3000/admin/login
  البريد: ${email}
  كلمة المرور: ${password}
`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
