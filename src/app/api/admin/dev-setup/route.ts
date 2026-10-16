import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/admin/dev-setup
 * أداة مساعدة لتجهيز حساب مسؤول تلقائياً في بيئة التطوير
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || 'admin@boutique.dz').trim().toLowerCase();
    const password = body.password || 'admin123456';

    // فحص المستخدمين المسجلين
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json(
        { error: `خطأ من Supabase Auth: ${listError.message}` },
        { status: 500 }
      );
    }

    const existingUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === email
    );

    if (existingUser) {
      // ترقية الحساب الحالي وتعيين كلمة المرور ودور الأدمن
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          email_confirm: true,
          app_metadata: {
            ...existingUser.app_metadata,
            role: 'admin',
            is_admin: true,
          },
        }
      );

      if (updateError) {
        return NextResponse.json(
          { error: `خطأ أثناء ترقية الحساب: ${updateError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: 'تم تحديث حساب المسؤول وترقيته بنجاح!',
        email,
        password,
      });
    }

    // إنشاء حساب مسؤول جديد
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role: 'admin',
        is_admin: true,
      },
    });

    if (createError) {
      return NextResponse.json(
        { error: `خطأ أثناء إنشاء الحساب: ${createError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'تم إنشاء حساب مسؤول جديد بنجاح!',
      email: newUser.user?.email || email,
      password,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'خطأ داخلي غير متوقع' },
      { status: 500 }
    );
  }
}
