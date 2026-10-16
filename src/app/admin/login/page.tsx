'use client';

/**
 * Admin Login Page — Client Component
 *
 * القرار الأمني: بياناتنا الحساسة معالَجة في Server Action (session route).
 * الـ Client Component هنا يتحمل فقط الـ UI وتجربة المستخدم.
 * القرار الأمني: لا نخزّن access_token في localStorage — نرسله فوراً للـ API
 * التي تضعه في httpOnly cookie.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Shield, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devLoading, setDevLoading] = useState(false);
  const [devMessage, setDevMessage] = useState<string | null>(null);

  const handleDevSetup = async () => {
    setDevLoading(true);
    setDevMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/dev-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@boutique.dz', password: 'admin123456' }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setEmail('admin@boutique.dz');
        setPassword('admin123456');
        setDevMessage('✅ تم تجهيز حساب الأدمن! تم إدراج البيانات أدناه، اضغط على "تسجيل الدخول".');
      } else {
        setError(data.error || 'فشل إعداد الحساب');
      }
    } catch {
      setError('تعذر الاتصال بخدمة تجهيز الحساب');
    } finally {
      setDevLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. تسجيل الدخول عبر Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data?.session) {
        // القرار الأمني: رسالة خطأ عامة — لا نُفصح إن كان الإيميل موجوداً أم لا
        setError('بيانات الدخول غير صحيحة. تحقق من الإيميل وكلمة المرور.');
        return;
      }

      // 2. فحص مبدئي من العميل (للـ UX فقط — الفحص الحقيقي في السيرفر)
      const appMeta = data.user?.app_metadata;
      const isAdmin = appMeta?.role === 'admin' || appMeta?.is_admin === true;
      if (!isAdmin) {
        await supabase.auth.signOut();
        setError("هذا الحساب لا يملك صلاحيات المسؤول.");
        return;
      }

      // 3. إرسال الـ token للسيرفر ليضعه في httpOnly cookie
      // القرار الأمني: السيرفر سيتحقق من الـ token مجدداً (getUser) ومن الدور (app_metadata)
      const sessionRes = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: data.session.access_token }),
      });

      if (!sessionRes.ok) {
        const errData = await sessionRes.json().catch(() => ({}));
        // معالجة Rate Limit
        if (sessionRes.status === 429) {
          setError('تجاوزت عدد محاولات الدخول. حاول مجدداً بعد قليل.');
          return;
        }
        setError(errData.error || 'فشل إنشاء الجلسة. حاول مجدداً.');
        return;
      }

      // 4. توجيه المتصفح المباشر لضمان شحن الـ cookies وتحديث الشاشة فوراً
      setDevMessage('✅ تم التحقق بنجاح! جاري التوجيه إلى لوحة التحكم...');
      window.location.href = '/admin';
    } catch {
      setError('خطأ في الاتصال. حاول مجدداً.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
          {/* Logo & Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-900/40 mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              🇩🇿 ShopDZ Admin
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              لوحة إدارة آمنة
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-6">
              تسجيل دخول المسؤول
            </h2>

            {error && (
              <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
                <strong>⚠️</strong> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@boutique.dz"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 pe-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="admin-login-submit"
                type="submit"
                disabled={loading || !email || !password}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري التحقق...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>تسجيل الدخول</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Dev Auto-Setup Helper */}
            <div className="mt-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 p-4 text-center">
              <p className="text-xs text-emerald-300 font-semibold mb-2.5">
                ⚡ إعداد سريع لحساب الأدمن (بيئة التطوير)
              </p>
              <button
                type="button"
                onClick={handleDevSetup}
                disabled={devLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {devLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-emerald-300/30 border-t-emerald-300 rounded-full animate-spin" />
                    <span>جاري التجهيز في Supabase...</span>
                  </>
                ) : (
                  <span>إنشاء / تفعيل حساب الأدمن تلقائياً (بنقرة واحدة)</span>
                )}
              </button>
              {devMessage && (
                <p className="mt-2.5 text-[11px] text-emerald-400 font-medium bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/30">
                  {devMessage}
                </p>
              )}
            </div>

            {/* Security notice */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-[11px] text-slate-500 text-center">
                🔒 اتصال آمن عبر Supabase Auth (HTTPS).
                <br />
                الجلسة مشفّرة — httpOnly cookie لا يصل إليها JavaScript.
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
