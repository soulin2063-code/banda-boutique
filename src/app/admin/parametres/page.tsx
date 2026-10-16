'use client';

import React, { useState, useEffect } from 'react';
import {
  Store,
  Phone,
  Truck,
  Bell,
  Sparkles,
  ShieldCheck,
  Save,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Instagram,
} from 'lucide-react';

interface SettingsState {
  store_name: string;
  store_tagline: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  free_shipping_enabled: boolean;
  free_shipping_threshold: number;
  default_home_delivery_price: number;
  default_desk_delivery_price: number;
  checkout_notice: string;
  announcement_enabled: boolean;
  announcement_bar: string;
}

const INITIAL_SETTINGS: SettingsState = {
  store_name: 'Banda Boutique | متجر باندا',
  store_tagline: 'أرقى الحجابات والعبايات والأزياء المحتشمة في الجزائر',
  phone: '0550123456',
  whatsapp: '0550123456',
  instagram: 'banda_boutique_dz',
  facebook: '',
  tiktok: '',
  free_shipping_enabled: true,
  free_shipping_threshold: 10000,
  default_home_delivery_price: 600,
  default_desk_delivery_price: 400,
  checkout_notice: 'الدفع عند الاستلام مع إمكانية فتح الطرد والمعاينة قبل الدفع.',
  announcement_enabled: true,
  announcement_bar: '🌸 مرحباً بكم في متجرنا — شحن متوفر لكافة ولايات الجزائر 58 ولاية مع الدفع عند الاستلام',
};

export default function AdminParametresPage() {
  const [settings, setSettings] = useState<SettingsState>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.warn('Using default settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (key: keyof SettingsState, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('فشل حفظ الإعدادات');

      setSuccessMsg('تم حفظ وتحديث إعدادات المتجر بنجاح!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const testTelegramAlert = async () => {
    setTestingTelegram(true);
    setTelegramStatus(null);
    try {
      const res = await fetch('/api/telegram-test', { method: 'POST' });
      if (res.ok) {
        setTelegramStatus('✓ وصل إشعار تجريبي لهاتفك بنجاح عبر تيليجرام!');
      } else {
        setTelegramStatus('⚠️ لم يتم ضبط مفتاح بوت تيليجرام بعد في المتغيرات.');
      }
    } catch (err) {
      setTelegramStatus('⚠️ تعذر إرسال الإشعار التجريبي.');
    } finally {
      setTestingTelegram(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-semibold">
        جاري تحميل إعدادات المتجر...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            إعدادات المتجر والتوصيل
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            تحكم كامل في هوية متجرك، أرقام الواتساب، أسعار الشحن، والعروض التسويقية.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-all hover:-translate-y-0.5"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 border border-indigo-200 p-4 text-sm text-indigo-900 font-semibold shadow-2xs">
          <CheckCircle className="h-5 w-5 text-indigo-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 font-semibold shadow-2xs">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Store Identity */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Store className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              1. هوية المتجر وبيانات التواصل مع الزبائن
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم المتجر
              </label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => handleChange('store_name', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                شعار / نبذة المتجر (Tagline)
              </label>
              <input
                type="text"
                value={settings.store_tagline}
                onChange={(e) => handleChange('store_tagline', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                <span>رقم هاتف الاتصال الأساسي</span>
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="0550 12 34 56"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:border-indigo-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">يظهر للزبائن للاتصال المباشر لخدمة العملاء.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>رقم الواتساب لتأكيد الطلبيات</span>
              </label>
              <input
                type="text"
                value={settings.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="0550 12 34 56"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:border-indigo-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">يُستخدم لفتح محادثة واتساب تلقائية مع الزبائن.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Instagram className="h-3.5 w-3.5 text-pink-600" />
                <span>حساب إنستغرام</span>
              </label>
              <input
                type="text"
                value={settings.instagram}
                onChange={(e) => handleChange('instagram', e.target.value)}
                placeholder="banda_boutique"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                حساب تيك توك
              </label>
              <input
                type="text"
                value={settings.tiktok}
                onChange={(e) => handleChange('tiktok', e.target.value)}
                placeholder="@banda_boutique"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                صفحة فيسبوك
              </label>
              <input
                type="text"
                value={settings.facebook}
                onChange={(e) => handleChange('facebook', e.target.value)}
                placeholder="BandaBoutiqueDZ"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Delivery & Shipping */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Truck className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              2. إعدادات الشحن، التوصيل والعروض
            </h2>
          </div>

          {/* Free Shipping Promo Box */}
          <div className="rounded-2xl bg-indigo-50/60 border border-indigo-200/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.free_shipping_enabled}
                  onChange={(e) => handleChange('free_shipping_enabled', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
                <span className="text-sm font-bold text-indigo-950">
                  تفعيل ميزة الشحن المجاني التلقائي كعرض ترويجي
                </span>
              </label>
              <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full">
                عرض تسويقي
              </span>
            </div>

            {settings.free_shipping_enabled && (
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">شحن مجاني عند الشراء بقيمة تزيد عن:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={settings.free_shipping_threshold}
                    onChange={(e) => handleChange('free_shipping_threshold', Number(e.target.value))}
                    className="w-32 rounded-xl border border-indigo-300 bg-white px-3 py-1.5 text-sm font-bold text-indigo-950 focus:border-indigo-600 focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-600">د.ج</span>
                </div>
              </div>
            )}
            <p className="text-[11px] text-indigo-700/90">
              عند تجاوز طلبية الزبون هذا المبلغ، سيتم جعل سعر التوصيل 0 د.ج تلقائياً مما يحفز الزبائن على إضافة المزيد من المنتجات إلى سلتهم.
            </p>
          </div>

          {/* Default Delivery Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                سعر التوصيل الافتراضي لباب المنزل (د.ج)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={settings.default_home_delivery_price}
                onChange={(e) => handleChange('default_home_delivery_price', Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold focus:border-indigo-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">يُطبق على الولايات التي لم يُحدد لها سعر خاص.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                سعر استلام الطرد من مكتب التوصيل (Stop Desk) (د.ج)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={settings.default_desk_delivery_price}
                onChange={(e) => handleChange('default_desk_delivery_price', Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold focus:border-indigo-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">خيار اقتصادي مفضل للكثير من الزبائن.</p>
            </div>
          </div>
        </div>

        {/* Section 3: Announcement Bar */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              3. شريط الإعلانات الترويجي أعلى الموقع
            </h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.announcement_enabled}
                onChange={(e) => handleChange('announcement_enabled', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="text-xs font-bold text-slate-800">
                إظهار شريط إعلانات علوي للزوار أعلى كافة صفحات المتجر
              </span>
            </label>

            {settings.announcement_enabled && (
              <div>
                <input
                  type="text"
                  value={settings.announcement_bar}
                  onChange={(e) => handleChange('announcement_bar', e.target.value)}
                  placeholder="مثال: تخفيضات خاصة بمناسبة الموسم الجديد + شحن متوفر لـ 58 ولاية!"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Trust & Policies */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <ShieldCheck className="h-5 w-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">
              4. سياسة الثقة والضمان في صفحة الطلب
            </h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              عبارة الضمان التي تطمئن الزبون قبل تأكيد الطلب
            </label>
            <textarea
              rows={2}
              value={settings.checkout_notice}
              onChange={(e) => handleChange('checkout_notice', e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              تظهر بخط واضح في صفحة الدفع (مثل: &quot;الدفع عند الاستلام مع إمكانية فتح الطرد والمعاينة قبل الدفع&quot;).
            </p>
          </div>
        </div>

        {/* Section 5: Instant Alerts */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Bell className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              5. إشعارات الطلبيات الجديدة على هاتفك
            </h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            عند قيام أي زبون بالطلب، يقوم نظام المتجر بإرسال تفاصيل الطلبية ورقم هاتف الزبون فوراً إلى بوت تيليجرام الخاص بك لتتصل به مباشرة.
          </p>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={testTelegramAlert}
              disabled={testingTelegram}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span>{testingTelegram ? 'جاري الفحص...' : '📲 إرسال إشعار تجريبي لهاتفي'}</span>
            </button>
            {telegramStatus && (
              <span className="text-xs font-semibold text-indigo-700">
                {telegramStatus}
              </span>
            )}
          </div>
        </div>

        {/* Floating/Bottom Save Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all hover:-translate-y-0.5"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'جاري حفظ التعديلات...' : 'حفظ ونشر التعديلات على المتجر'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
