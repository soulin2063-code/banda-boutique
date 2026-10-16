# 🇩🇿 ShopDZ — Generic Multi-Vertical E-Commerce Store (Algeria, COD)

منصة تجارة إلكترونية متكاملة موجهة للسوق الجزائري تدعم أي نوع من المنتجات (ملابس، عطور، إلكترونيات، مستحضرات تجميل...) عبر نظام خصائص ديناميكي مرن، مع الدفع عند الاستلام (COD) والشحن لـ 58 ولاية.

---

## 🚀 المميزات الرئيسية (Key Features)

1. **التقاط الطلبات المقاوم للأخطاء (Fault-Tolerant COD Checkout):**
   - تسجيل فوري للزبون والعنوان والطلب في قاعدة البيانات عبر Supabase Transaction.
   - حجز المخزون الفوري وفحص الكميات (`select ... for update`).
   - حماية ضد الطلبات الوهمية عبر تحديد معدل الطلبات (Rate Limiting) بالاعتماد على الـ IP ورقم الهاتف.
   - التقاط مسودات الطلبات المتروكة (`checkout_leads`) تلقائياً بمجرد إدخال رقم الهاتف.

2. **توصيل ذكي لـ 58 ولاية (Delivery Rates & Multi-Courier):**
   - دعم التوصيل للمنزل (Home Delivery) والمكتب (Stop Desk).
   - تكامل مع واجهة **dzship** الموحدة لدعم (Yalidine, ZR Express, Maystro, NOEST, Ecotrack).
   - نظام كاش محلي في جدول `delivery_rates` يضمن استمرار عملية الطلب حتى لو توقفت خدمة الشحن الخارجية.

3. **لوحة تحكم إدارية مدمجة (Admin Seller Dashboard):**
   - حماية أمنية على مستوى الخادم (`/admin/*`) تتطلب تسجيل دخول المسؤول.
   - إدارة الخصائص والقيم (`/admin/attributs`) لتخصيص أي مجال منتجات.
   - إدارة المنتجات والخيارات والصور والمخزون (`/admin/produits`, `/admin/stock`).
   - متابعة الطلبات مع فلاتر الحالة والاتصال السريع بالزبون وتحديث سجل الحالات (`/admin/commandes`).
   - إحصائيات بصرية متقدمة (Recharts) لمبيعات الولايات والفئات والزبائن المميزين (`/admin`).

4. **تعدد اللغات والاتجاهات (i18n & RTL/LTR):**
   - العربية (أساسية مع `dir="rtl"` وخط Cairo العربي).
   - الفرنسية والإنجليزية مع `dir="ltr"` وخط Outfit.
   - دعم كامل لخصائص Tailwind المنطقية (`ps-*`, `pe-*`, `ms-*`, `me-*`).

5. **محرك بحث فوري مع التسامح الإملائي (Search Engine):**
   - دعم Meilisearch السريع مع Fallback تلقائي ومجاني إلى Postgres Full-Text Search و `pg_trgm`.

6. **تنبيهات فورية للبائع (Seller Alerts):**
   - إرسال إشعار فوري وتفصيلي بالطلب الجديد عبر Telegram Bot API دون تعطيل استجابة الطلب.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 3, Lucide React Icons
- **i18n:** `next-intl` (ar, fr, en)
- **Database & Auth:** Supabase (Postgres 15, Auth, Storage, Row Level Security)
- **Validation:** Zod + React Hook Form
- **Delivery:** dzship API (Yalidine, ZR Express, etc.)
- **Search:** Meilisearch + Postgres FTS (pg_trgm & unaccent)
- **Charts:** Recharts

---

## 📂 هيكل المشروع (Folder Structure)

```
src/
├── app/
│   ├── [locale]/             # متجر الزبائن (عربي، فرنسي، إنجليزي)
│   │   ├── layout.tsx        # مزود اللغة والاتجاه RTL/LTR
│   │   ├── page.tsx          # الصفحة الرئيسية والبانر
│   │   ├── produits/         # قائمة المنتجات وتفاصيل المنتج [slug]
│   │   ├── categories/       # تصنيفات المنتجات
│   │   ├── recherche/        # البحث الفوري والفلترة
│   │   ├── commande/         # صفحة تأكيد الطلب [id]
│   │   └── mes-favoris/      # قائمة الرغبات المحفوظة
│   ├── admin/                # لوحة تحكم التاجر المأمونة
│   │   ├── layout.tsx        # حارس المصادقة Server-Side
│   │   ├── login/page.tsx    # تسجيل دخول التاجر
│   │   ├── page.tsx          # الإحصائيات والمخططات
│   │   ├── attributs/        # إدارة الخصائص والفئات
│   │   ├── produits/         # إدارة الكتالوج
│   │   ├── stock/            # متابعة تنبيهات انخفاض المخزون
│   │   ├── commandes/        # معالجة الطلبات وشحنها
│   │   ├── clients/          # إدارة الزبائن
│   │   └── parametres/       # إعدادات الشحن ومفاتيح API
│   └── api/                  # مسارات الواجهة البرمجية المحمية
│       ├── orders/           # تسجيل واسترجاع الطلبات
│       ├── delivery-rates/   # حساب أسعار التوصيل
│       ├── checkout-lead/    # التقاط أرقام الزبائن
│       ├── yalidine-shipment/# إنشاء بوليصات الشحن
│       └── search-sync/      # مزامنة محرك البحث
├── components/               # مكونات UI المعيارية
├── lib/                      # دوال الاتصال بقاعدة البيانات والخدمات الخارجية
├── i18n/                     # ملفات الترجمة للغات الثلاث
└── types/                    # تعريفات TypeScript الشاملة لقاعدة البيانات
supabase/
└── migrations/               # ملفات ترحيل قاعدة البيانات (0001 - 0011)
```

---

## ⚡ البدء والتشغيل (Getting Started)

### 1. تثبيت الحزم:
```bash
npm install
```

### 2. إعداد المتغيرات البيئية:
انسخ الملف `.env.example` إلى `.env.local` وأدخل مفاتيحك:
```bash
cp .env.example .env.local
```

> ⚠️ **تحذير أمني هام (Security Warning):**
> لا تقم مطلقاً بمشاركة ملف `.env.local` أو رفعه إلى مستودع Git. إذا تم تسريب المفاتيح عن طريق الخطأ، سارع فوراً إلى تدوير مفاتيح Supabase (Rotate API Keys) من لوحة تحكم Supabase.

### 3. إنشاء أول حساب مسؤول (Creating the first admin):
1. قم بإنشاء مستخدم عبر لوحة تحكم Supabase Auth أو عبر واجهة التسجيل.
2. امنح المستخدم صلاحية المسؤول من خلال الـ SQL Editor في Supabase:
```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
where email = '<ADMIN_EMAIL>';
```
*(تم توثيق ذلك أيضاً في ملف الترحيل `supabase/migrations/20260930000001_admin_role_note.sql`).*

### 4. ترحيل قاعدة البيانات (Supabase Migrations):
طبق ملفات الترحيل في مجلد `supabase/migrations/` بالترتيب:
- `20260920000001_reference_data.sql`
- `20260920000002_catalog_taxonomy.sql`
- `20260920000003_attributes.sql`
- `20260920000004_products.sql`
- `20260920000005_variants_and_attribute_values.sql`
- `20260920000006_delivery.sql`
- `20260920000007_customers.sql`
- `20260920000008_orders.sql`
- `20260920000009_reviews_wishlist_leads.sql`
- `20260920000010_rls_policies.sql`
- `20260920000011_carrier_and_tracking.sql`
- `20260930000001_admin_role_note.sql`

أو باستخدام Supabase CLI:
```bash
supabase db push
```

### 5. تشغيل خادم التطوير:
```bash
npm run dev
```

### 6. البناء للإنتاج:
```bash
npm run build
```
