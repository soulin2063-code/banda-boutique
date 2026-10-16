-- =========================================================================
-- 🌸 BANDA / SHOPDZ — COMPLETE ALL-IN-ONE SUPABASE SETUP SCRIPT
-- شامل بالكامل: مسح وإعادة إنشاء + هيكلة الجداول + RLS + Storage + البيانات الأساسية والمنتجات
--
-- طريقة التشغيل:
-- 1. افتح Supabase Dashboard (https://supabase.com/dashboard)
-- 2. توجّه إلى: SQL Editor
-- 3. انسخ كامل محتوى هذا الملف والصقه هناك
-- 4. اضغط على: RUN
-- =========================================================================

-- =========================================================================
-- 1. DROP EXISTING OBJECTS (إلغاء وحذف أي جداول أو دوال سابقة لضمان بداية نظيفة)
-- =========================================================================
drop table if exists public.audit_log cascade;
drop table if exists public.order_status_history cascade;
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.checkout_leads cascade;
drop table if exists public.wishlist_items cascade;
drop table if exists public.reviews cascade;
drop table if exists public.addresses cascade;
drop table if exists public.customers cascade;
drop table if exists public.delivery_rates cascade;
drop table if exists public.communes cascade;
drop table if exists public.wilayas cascade;
drop table if exists public.product_variant_attribute_values cascade;
drop table if exists public.product_attribute_values cascade;
drop table if exists public.product_variants cascade;
drop table if exists public.product_images cascade;
drop table if exists public.product_translations cascade;
drop table if exists public.products cascade;
drop table if exists public.category_attributes cascade;
drop table if exists public.attribute_option_translations cascade;
drop table if exists public.attribute_options cascade;
drop table if exists public.attribute_translations cascade;
drop table if exists public.attributes cascade;
drop table if exists public.category_translations cascade;
drop table if exists public.categories cascade;
drop table if exists public.brands cascade;
drop table if exists public.carrier_credentials cascade;
drop function if exists public.is_admin() cascade;

-- =========================================================================
-- 2. EXTENSIONS (امتدادات الأمان والبحث)
-- =========================================================================
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

-- =========================================================================
-- 3. SECURITY DEFINER FUNCTION: is_admin()
-- =========================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true,
    false
  );
$$;

-- =========================================================================
-- 4. DATABASE TABLES & SCHEMA (الهيكلة الكاملة)
-- =========================================================================

-- 4.1 Wilayas & Communes (الولايات والبلديات الجزائرية)
create table public.wilayas (
  id int primary key,
  code text not null unique,
  name_ar text not null,
  name_fr text not null
);

create table public.communes (
  id uuid primary key default gen_random_uuid(),
  wilaya_id int not null references public.wilayas(id) on delete cascade,
  name_ar text not null,
  name_fr text not null
);
create index idx_communes_wilaya on public.communes(wilaya_id);

-- 4.2 Brands (العلامات التجارية)
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text
);

-- 4.3 Categories & Translations (الأقسام والتصنيفات)
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  slug text not null unique
);
create index idx_categories_parent on public.categories(parent_id);

create table public.category_translations (
  category_id uuid not null references public.categories(id) on delete cascade,
  locale text not null check (locale in ('ar','fr','en')),
  name text not null,
  primary key (category_id, locale)
);

-- 4.4 Dynamic Attributes & Options (السمات المتغيرة: ألوان، مقاسات، أقمشة)
create table public.attributes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  input_type text not null check (input_type in ('select','multiselect','text','number','boolean')),
  is_variant_defining boolean not null default false
);

create table public.attribute_translations (
  attribute_id uuid not null references public.attributes(id) on delete cascade,
  locale text not null check (locale in ('ar','fr','en')),
  name text not null,
  primary key (attribute_id, locale)
);

create table public.attribute_options (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references public.attributes(id) on delete cascade,
  value_slug text not null,
  position int not null default 0,
  hex_color text check (hex_color is null or hex_color ~* '^#[0-9a-f]{6}$'),
  unique (attribute_id, value_slug)
);

create table public.attribute_option_translations (
  option_id uuid not null references public.attribute_options(id) on delete cascade,
  locale text not null check (locale in ('ar','fr','en')),
  label text not null,
  primary key (option_id, locale)
);

create table public.category_attributes (
  category_id uuid not null references public.categories(id) on delete cascade,
  attribute_id uuid not null references public.attributes(id) on delete cascade,
  is_required boolean not null default false,
  primary key (category_id, attribute_id)
);

-- 4.5 Products & Multi-Language Translations (المنتجات)
create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete set null,
  category_id uuid not null references public.categories(id) on delete cascade,
  slug text not null unique,
  base_price numeric(10,2) not null check (base_price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= base_price),
  status text not null default 'active' check (status in ('draft','active','archived')),
  badge text check (badge is null or badge in ('new','sale','bestseller')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_category on public.products(category_id);
create index idx_products_status on public.products(status);

create table public.product_translations (
  product_id uuid not null references public.products(id) on delete cascade,
  locale text not null check (locale in ('ar','fr','en')),
  name text not null,
  description text,
  meta_title text,
  meta_description text,
  primary key (product_id, locale)
);
create index idx_product_translations_trgm on public.product_translations using gin (name gin_trgm_ops);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  position int not null default 0,
  is_primary boolean not null default false,
  variant_color_option_id uuid references public.attribute_options(id) on delete set null
);
create index idx_product_images_product on public.product_images(product_id);

-- 4.6 Product Variants & Stock (المتغيرات والمخزون)
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  price_override numeric(10,2),
  compare_at_price_override numeric(10,2),
  stock_qty int not null default 10 check (stock_qty >= 0),
  min_stock_threshold int not null default 3,
  cost_price numeric(10,2),
  created_at timestamptz not null default now()
);
create index idx_variants_product on public.product_variants(product_id);

create table public.product_variant_attribute_values (
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  attribute_id uuid not null references public.attributes(id) on delete cascade,
  attribute_option_id uuid not null references public.attribute_options(id) on delete cascade,
  primary key (variant_id, attribute_id)
);

create table public.product_attribute_values (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  attribute_id uuid references public.attributes(id) on delete cascade,
  attribute_option_id uuid references public.attribute_options(id) on delete cascade,
  custom_value text
);

-- 4.7 Delivery Rates (أسعار التوصيل لـ 58 ولاية)
create table public.delivery_rates (
  id uuid primary key default gen_random_uuid(),
  wilaya_id int not null references public.wilayas(id) on delete cascade,
  commune_id uuid references public.communes(id) on delete set null,
  home_price numeric(10,2) not null default 600,
  desk_price numeric(10,2) not null default 400,
  carrier text not null default 'yalidine',
  eta_days int not null default 2,
  is_active boolean not null default true,
  unique (wilaya_id, commune_id, carrier)
);
create index idx_delivery_wilaya on public.delivery_rates(wilaya_id);

-- 4.8 Customers & Addresses (الزبائن وعناوين الشحن)
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  full_name text not null,
  email text,
  created_at timestamptz not null default now()
);
create index idx_customers_phone on public.customers(phone);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  wilaya_id int not null references public.wilayas(id) on delete cascade,
  commune_id uuid not null references public.communes(id) on delete cascade,
  address_text text,
  delivery_type text not null default 'home' check (delivery_type in ('home','desk')),
  created_at timestamptz not null default now()
);
create index idx_addresses_customer on public.addresses(customer_id);

-- 4.9 Orders & Items (الطلبات)
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  address_id uuid not null references public.addresses(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','returned','cancelled')),
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  deposit_paid numeric(10,2) default null,
  payment_type text not null default 'cod_full' check (payment_type in ('cod_full','deposit','installment')),
  notes text,
  confirmation_token text unique default encode(gen_random_bytes(32), 'hex'),
  carrier_tracking_id text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_orders_customer on public.orders(customer_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_confirmation_token on public.orders(confirmation_token) where confirmation_token is not null;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  unit_price numeric(10,2) not null,
  quantity int not null default 1 check (quantity > 0),
  total_price numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index idx_order_items_order on public.order_items(order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  changed_by text,
  changed_at timestamptz not null default now()
);
create index idx_order_status_history_order on public.order_status_history(order_id);

-- 4.10 Carrier Credentials & Audit Log (شركات التوصيل وسجل التدقيق)
create table public.carrier_credentials (
  id uuid primary key default gen_random_uuid(),
  carrier text not null unique,
  api_id text not null,
  api_token text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  actor_email text,
  action text not null,
  resource text not null,
  resource_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);
create index idx_audit_log_actor on public.audit_log(actor_id);
create index idx_audit_log_created on public.audit_log(created_at desc);

-- 4.11 Reviews, Wishlist, Leads
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table public.wishlist_items (
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (customer_id, product_id)
);

create table public.checkout_leads (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  wilaya_id int references public.wilayas(id) on delete set null,
  commune_id uuid references public.communes(id) on delete set null,
  full_name text,
  notes text,
  status text not null default 'new',
  contacted boolean not null default false,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES — الأمان والحماية
-- =========================================================================
alter table public.wilayas enable row level security;
alter table public.communes enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.category_translations enable row level security;
alter table public.attributes enable row level security;
alter table public.attribute_translations enable row level security;
alter table public.attribute_options enable row level security;
alter table public.attribute_option_translations enable row level security;
alter table public.category_attributes enable row level security;
alter table public.products enable row level security;
alter table public.product_translations enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_variant_attribute_values enable row level security;
alter table public.product_attribute_values enable row level security;
alter table public.delivery_rates enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.carrier_credentials enable row level security;
alter table public.audit_log enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.checkout_leads enable row level security;

-- Public read for catalog taxonomy & reference tables
create policy "public_read_wilayas" on public.wilayas for select using (true);
create policy "public_read_communes" on public.communes for select using (true);
create policy "public_read_brands" on public.brands for select using (true);
create policy "public_read_categories" on public.categories for select using (true);
create policy "public_read_category_translations" on public.category_translations for select using (true);
create policy "public_read_attributes" on public.attributes for select using (true);
create policy "public_read_attribute_translations" on public.attribute_translations for select using (true);
create policy "public_read_attribute_options" on public.attribute_options for select using (true);
create policy "public_read_attribute_option_translations" on public.attribute_option_translations for select using (true);
create policy "public_read_category_attributes" on public.category_attributes for select using (true);
create policy "public_read_delivery_rates" on public.delivery_rates for select using (true);

-- Products & variants: public reads active products, admin reads/writes all
create policy "public_read_active_products" on public.products for select using (status = 'active' or public.is_admin());
create policy "admin_all_products" on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "public_read_product_translations" on public.product_translations for select using (true);
create policy "admin_all_product_translations" on public.product_translations for all using (public.is_admin()) with check (public.is_admin());

create policy "public_read_product_images" on public.product_images for select using (true);
create policy "admin_all_product_images" on public.product_images for all using (public.is_admin()) with check (public.is_admin());

create policy "public_read_product_variants" on public.product_variants for select using (true);
create policy "admin_all_product_variants" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

create policy "public_read_product_variant_attrs" on public.product_variant_attribute_values for select using (true);
create policy "admin_all_product_variant_attrs" on public.product_variant_attribute_values for all using (public.is_admin()) with check (public.is_admin());

create policy "public_read_product_attr_values" on public.product_attribute_values for select using (true);
create policy "admin_all_product_attr_values" on public.product_attribute_values for all using (public.is_admin()) with check (public.is_admin());

-- Orders, customers, addresses: admin only (guest COD orders are inserted server-side via service_role)
create policy "admin_all_customers" on public.customers for all using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_addresses" on public.addresses for all using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_order_items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_order_status_history" on public.order_status_history for all using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_carrier_credentials" on public.carrier_credentials for all using (public.is_admin()) with check (public.is_admin());
create policy "admin_read_audit_log" on public.audit_log for select using (public.is_admin());

-- Reviews, Leads: public can insert, admin can manage
create policy "public_read_approved_reviews" on public.reviews for select using (status = 'approved' or public.is_admin());
create policy "public_insert_reviews" on public.reviews for insert with check (true);
create policy "admin_all_reviews" on public.reviews for all using (public.is_admin()) with check (public.is_admin());

create policy "public_insert_leads" on public.checkout_leads for insert with check (true);
create policy "admin_all_leads" on public.checkout_leads for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================================
-- 6. SUPABASE STORAGE (سلة صور المنتجات العامة)
-- =========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true;

drop policy if exists "public_read_products_bucket" on storage.objects;
create policy "public_read_products_bucket"
  on storage.objects
  for select
  using (bucket_id = 'products');

drop policy if exists "admin_manage_products_bucket" on storage.objects;
create policy "admin_manage_products_bucket"
  on storage.objects
  for all
  using (bucket_id = 'products' and (public.is_admin() or auth.role() = 'service_role'))
  with check (bucket_id = 'products' and (public.is_admin() or auth.role() = 'service_role'));

-- =========================================================================
-- 7. SEED DATA (البيانات الجاهزة: 58 ولاية + البلديات + أسعار التوصيل + المنتجات)
-- =========================================================================

-- 7.1 SEED 58 ALGERIAN WILAYAS & COMMUNES
-- ==============================================================================
-- Seed Data for 58 Algerian Wilayas and Communes
-- Sourced from Algerian official administrative divisions (othmanus/algeria-cities)
-- ==============================================================================

-- 1. Insert 58 Wilayas
INSERT INTO wilayas (id, code, name_ar, name_fr) VALUES
  (1, '01', 'أدرار', 'Adrar'),
  (2, '02', 'الشلف', 'Chlef'),
  (3, '03', 'الأغواط', 'Laghouat'),
  (4, '04', 'أم البواقي', 'Oum El Bouaghi'),
  (5, '05', 'باتنة', 'Batna'),
  (6, '06', 'بجاية', 'Béjaïa'),
  (7, '07', 'بسكرة', 'Biskra'),
  (8, '08', 'بشار', 'Béchar'),
  (9, '09', 'البليدة', 'Blida'),
  (10, '10', 'البويرة', 'Bouira'),
  (11, '11', 'تمنراست', 'Tamanrasset'),
  (12, '12', 'تبسة', 'Tébessa'),
  (13, '13', 'تلمسان', 'Tlemcen'),
  (14, '14', 'تيارت', 'Tiaret'),
  (15, '15', 'تيزي وزو', 'Tizi Ouzou'),
  (16, '16', 'الجزائر', 'Alger'),
  (17, '17', 'الجلفة', 'Djelfa'),
  (18, '18', 'جيجل', 'Jijel'),
  (19, '19', 'سطيف', 'Sétif'),
  (20, '20', 'سعيدة', 'Saïda'),
  (21, '21', 'سكيكدة', 'Skikda'),
  (22, '22', 'سيدي بلعباس', 'Sidi Bel Abbès'),
  (23, '23', 'عنابة', 'Annaba'),
  (24, '24', 'قالمة', 'Guelma'),
  (25, '25', 'قسنطينة', 'Constantine'),
  (26, '26', 'المدية', 'Médéa'),
  (27, '27', 'مستغانم', 'Mostaganem'),
  (28, '28', 'المسيلة', 'M''Sila'),
  (29, '29', 'معسكر', 'Mascara'),
  (30, '30', 'ورقلة', 'Ouargla'),
  (31, '31', 'وهران', 'Oran'),
  (32, '32', 'البيض', 'El Bayadh'),
  (33, '33', 'إليزي', 'Illizi'),
  (34, '34', 'برج بوعريريج', 'Bordj Bou Arréridj'),
  (35, '35', 'بومرداس', 'Boumerdès'),
  (36, '36', 'الطارف', 'El Tarf'),
  (37, '37', 'تندوف', 'Tindouf'),
  (38, '38', 'تيسمسيلت', 'Tissemsilt'),
  (39, '39', 'الوادي', 'El Oued'),
  (40, '40', 'خنشلة', 'Khenchela'),
  (41, '41', 'سوق أهراس', 'Souk Ahras'),
  (42, '42', 'تيبازة', 'Tipaza'),
  (43, '43', 'ميلة', 'Mila'),
  (44, '44', 'عين الدفلى', 'Aïn Defla'),
  (45, '45', 'النعامة', 'Naâma'),
  (46, '46', 'عين تموشنت', 'Aïn Témouchent'),
  (47, '47', 'غرداية', 'Ghardaïa'),
  (48, '48', 'غليزان', 'Relizane'),
  (49, '49', 'تيميمون', 'Timimoun'),
  (50, '50', 'برج باجي مختار', 'Bordj Badji Mokhtar'),
  (51, '51', 'أولاد جلال', 'Ouled Djellal'),
  (52, '52', 'بني عباس', 'Béni Abbès'),
  (53, '53', 'عين صالح', 'In Salah'),
  (54, '54', 'عين قزام', 'In Guezzam'),
  (55, '55', 'تقرت', 'Touggourt'),
  (56, '56', 'جانت', 'Djanet'),
  (57, '57', 'المغير', 'El M''Ghaier'),
  (58, '58', 'المنيعة', 'El Meniaa')
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr;

-- 2. Insert Communes
INSERT INTO communes (wilaya_id, name_ar, name_fr) VALUES
  -- Wilaya 01 - Adrar
  (1, 'أدرار', 'Adrar'),
  (1, 'تيمقتن', 'Timekten'),
  (1, 'بودة', 'Bouda'),
  (1, 'أولاد أحمد تيمي', 'Ouled Ahmed Timmi'),
  (1, 'فنوغيل', 'Fenoughil'),
  (1, 'إن زغمير', 'In Zghmir'),
  (1, 'رقان', 'Reggane'),
  (1, 'سالي', 'Sali'),
  (1, 'السبع', 'Sebaa'),
  (1, 'تسابيت', 'Tsabit'),
  (1, 'تامست', 'Tamest'),
  (1, 'تامنطيط', 'Tamantit'),
  (1, 'تيت', 'Tit'),
  (1, 'زاوية كنتة', 'Zaouiet Kounta'),
  (1, 'اقبلي', 'Akabli'),
  (1, 'أولف', 'Aoulef'),

  -- Wilaya 02 - Chlef
  (2, 'الشلف', 'Chlef'),
  (2, 'تلعصة', 'Talassa'),
  (2, 'الزبوجة', 'Zeboudja'),
  (2, 'الحجاج', 'El Hadjadj'),
  (2, 'أولاد بن عبد القادر', 'Ouled Ben Abdelkader'),
  (2, 'عين مران', 'Ain Merane'),
  (2, 'بريرة', 'Breira'),
  (2, 'أولاد عباس', 'Ouled Abbes'),
  (2, 'وادي الفضة', 'Oued Fodda'),
  (2, 'بني راشد', 'Beni Rached'),
  (2, 'الهرانفة', 'Herenfa'),
  (2, 'تاجنة', 'Tadjena'),
  (2, 'المرسى', 'El Marsa'),
  (2, 'أم الدروع', 'Oum Drou'),
  (2, 'سنجاس', 'Sendjas'),
  (2, 'سيدي عبد الرحمن', 'Sidi Abderrahmane'),
  (2, 'سيدي عكاشة', 'Sidi Akkacha'),
  (2, 'تنس', 'Tenes'),
  (2, 'بني بوعتاب', 'Beni Bouattab'),
  (2, 'الكريمية', 'El Karimia'),
  (2, 'حرشون', 'Harchoun'),
  (2, 'بوزغاية', 'Bouzeghaia'),
  (2, 'تاوقريت', 'Taougrit'),
  (2, 'بني حواء', 'Beni Haoua'),
  (2, 'أبو الحسن', 'Abou El Hassane'),
  (2, 'وادي قوسين', 'Oued Goussine'),
  (2, 'الشطية', 'Chettia'),
  (2, 'مصدق', 'Moussadek'),
  (2, 'أولاد فارس', 'Ouled Fares'),
  (2, 'بوقادير', 'Boukadir'),
  (2, 'وادي سلي', 'Oued Sly'),
  (2, 'الصبحة', 'Sobha'),
  (2, 'بنايرية', 'Benairia'),
  (2, 'الأبيض مجاجة', 'Labiod Medjadja'),
  (2, 'الظهرة', 'Dahra'),

  -- Wilaya 03 - Laghouat
  (3, 'الأغواط', 'Laghouat'),
  (3, 'البيضاء', 'El Beidha'),
  (3, 'قلتة سيدي سعد', 'Gueltat Sidi Saad'),
  (3, 'بريدة', 'Brida'),
  (3, 'عين سيدي علي', 'Ain Sidi Ali'),
  (3, 'تاجموت', 'Tadjemout'),
  (3, 'الحاج مشري', 'Hadj Mechri'),
  (3, 'تاويالة', 'Taouiala'),
  (3, 'الغيشة', 'El Ghicha'),
  (3, 'تاجرونة', 'Tadjrouna'),
  (3, 'سبقاق', 'Sebgag'),
  (3, 'سيدي بوزيد', 'Sidi Bouzid'),
  (3, 'وادي مرة', 'Oued Morra'),
  (3, 'وادي مزي', 'Oued M''zi'),
  (3, 'قصر الحيران', 'Ksar El Hirane'),
  (3, 'العسافية', 'El Assafia'),
  (3, 'سيدي مخلوف', 'Sidi Makhlouf'),
  (3, 'حاسي الدلاعة', 'Hassi Delaa'),
  (3, 'حاسي الرمل', 'Hassi R''mel'),
  (3, 'عين ماضي', 'Ain Madhi'),
  (3, 'الحويطة', 'El Haouaita'),
  (3, 'الخنق', 'Kheneg'),
  (3, 'بن ناصر بن شهرة', 'Benacer Benchohra'),
  (3, 'أفلو', 'Aflou'),

  -- Wilaya 04 - Oum El Bouaghi
  (4, 'أم البواقي', 'Oum El Bouaghi'),
  (4, 'فكيرينة', 'Fkirina'),
  (4, 'الفجوج بوغرارة سعودي', 'El Fedjoudj Boughrara Sa'),
  (4, 'عين فكرون', 'Ain Fekroun'),
  (4, 'الرحية', 'Rahia'),
  (4, 'مسكيانة', 'Meskiana'),
  (4, 'البلالة', 'El Belala'),
  (4, 'بحير الشرقي', 'Behir Chergui'),
  (4, 'قصر الصباحي', 'Ksar Sbahi'),
  (4, 'سوق نعمان', 'Souk Naamane'),
  (4, 'أولاد زواي', 'Ouled Zouai'),
  (4, 'أولاد قاسم', 'Ouled Gacem'),
  (4, 'هنشير تومغني', 'Hanchir Toumghani'),
  (4, 'عين كرشة', 'Ain Kercha'),
  (4, 'عين ببوش', 'Ain Babouche'),
  (4, 'عين الديس', 'Ain Diss'),
  (4, 'عين البيضاء', 'Ain Beida'),
  (4, 'بريش', 'Berriche'),
  (4, 'الزرق', 'Zorg'),
  (4, 'عين مليلة', 'Ain M''lila'),
  (4, 'أولاد حملة', 'Ouled Hamla'),
  (4, 'الضلعة', 'Dhalaa'),
  (4, 'الجازية', 'El Djazia'),
  (4, 'عين الزيتون', 'Ain Zitoun'),

  -- Wilaya 05 - Batna
  (5, 'باتنة', 'Batna'),
  (5, 'بريكة', 'Barika'),
  (5, 'عين التوتة', 'Ain Touta'),
  (5, 'مروانة', 'Merouana'),
  (5, 'أريس', 'Arris'),
  (5, 'تازولت', 'Tazoult'),
  (5, 'نقاوس', 'N''Gaous'),
  (5, 'تيمقاد', 'Timgad'),
  (5, 'رأس العيون', 'Ras El Aioun'),
  (5, 'المعذر', 'El Madher'),
  (5, 'سريانة', 'Seriana'),
  (5, 'منعة', 'Menaa'),
  (5, 'الشمرة', 'Chemora'),
  (5, 'الجزار', 'Djezzar'),
  (5, 'تكوت', 'Tkout'),

  -- Wilaya 06 - Béjaïa
  (6, 'بجاية', 'Béjaïa'),
  (6, 'أميزور', 'Amizour'),
  (6, 'أقبو', 'Akbou'),
  (6, 'صدوق', 'Seddouk'),
  (6, 'تزمالت', 'Tazmalt'),
  (6, 'القصر', 'El Kseur'),
  (6, 'سيدي عيش', 'Sidi Aïch'),
  (6, 'خراطة', 'Kherrata'),
  (6, 'أوقاس', 'Aokas'),
  (6, 'تيشي', 'Tichy'),
  (6, 'سوق الإثنين', 'Souk El Ténine'),
  (6, 'أدكار', 'Adekar'),
  (6, 'شميني', 'Chemini'),
  (6, 'درقينة', 'Darguina'),

  -- Wilaya 07 - Biskra
  (7, 'بسكرة', 'Biskra'),
  (7, 'طولقة', 'Tolga'),
  (7, 'سيدي عقبة', 'Sidi Okba'),
  (7, 'أورلال', 'Ourlal'),
  (7, 'زريبة الوادي', 'Zeribet El Oued'),
  (7, 'القنطرة', 'El Kantara'),
  (7, 'الوطاية', 'El Outaya'),
  (7, 'جمورة', 'Djemorah'),
  (7, 'فوغالة', 'Foughala'),
  (7, 'مشونش', 'M''chouneche'),

  -- Wilaya 08 - Béchar
  (8, 'بشار', 'Béchar'),
  (8, 'القنادسة', 'Kenadsa'),
  (8, 'العبادلة', 'Abadla'),
  (8, 'تاغيت', 'Taghit'),
  (8, 'بني ونيف', 'Beni Ounif'),
  (8, 'لحمر', 'Lahmar'),
  (8, 'موغل', 'Mogheul'),
  (8, 'بوكايس', 'Boukais'),

  -- Wilaya 09 - Blida
  (9, 'البليدة', 'Blida'),
  (9, 'بوفاريك', 'Boufarik'),
  (9, 'أولاد يعيش', 'Ouled Yaïch'),
  (9, 'العفرون', 'El Affroun'),
  (9, 'موزاية', 'Mouzaïa'),
  (9, 'مفتاح', 'Meftah'),
  (9, 'الأربعاء', 'Larbaâ'),
  (9, 'بوقرة', 'Bougara'),
  (9, 'بوعينان', 'Bouinan'),
  (9, 'وادي العلايق', 'Oued El Alleug'),
  (9, 'بني مراد', 'Beni Mered'),
  (9, 'الشبلي', 'Chebli'),
  (9, 'الشريعة', 'Chréa'),

  -- Wilaya 10 - Bouira
  (10, 'البويرة', 'Bouira'),
  (10, 'الأخضرية', 'Lakhdaria'),
  (10, 'عين بسام', 'Aïn Bessem'),
  (10, 'سور الغزلان', 'Sour El Ghozlane'),
  (10, 'مشد الله', 'M''Chedallah'),
  (10, 'بئر غبالو', 'Bir Ghbalou'),
  (10, 'برج أوخريص', 'Bordj Okhriss'),
  (10, 'القادرية', 'Kadiria'),
  (10, 'حيزر', 'Haizer'),
  (10, 'الهاشمية', 'El Hachimia'),

  -- Wilaya 11 - Tamanrasset
  (11, 'تمنراست', 'Tamanrasset'),
  (11, 'أباليسا', 'Abalessa'),
  (11, 'تاظروك', 'Tazrouk'),
  (11, 'إدلس', 'Idles'),
  (11, 'إن امقل', 'In Amguel'),

  -- Wilaya 12 - Tébessa
  (12, 'تبسة', 'Tébessa'),
  (12, 'الونزة', 'Ouenza'),
  (12, 'بئر العاتر', 'Bir El Ater'),
  (12, 'العوينات', 'El Aouinet'),
  (12, 'الشريعة', 'Cheria'),
  (12, 'الماء الأبيض', 'El Malabiod'),
  (12, 'الكويف', 'El Kouif'),
  (12, 'مرسط', 'Morsott'),
  (12, 'نقرين', 'Negrine'),

  -- Wilaya 13 - Tlemcen
  (13, 'تلمسان', 'Tlemcen'),
  (13, 'منصورة', 'Mansourah'),
  (13, 'مغنية', 'Maghnia'),
  (13, 'الغزوات', 'Ghazaouet'),
  (13, 'سبدو', 'Sebdou'),
  (13, 'الرمشي', 'Remchi'),
  (13, 'شتوان', 'Chetouane'),
  (13, 'أولاد ميمون', 'Ouled Mimoun'),
  (13, 'ندرومة', 'Nedroma'),
  (13, 'الحناية', 'Hennaya'),

  -- Wilaya 14 - Tiaret
  (14, 'تيارت', 'Tiaret'),
  (14, 'السوقر', 'Sougueur'),
  (14, 'فرندة', 'Frenda'),
  (14, 'قصر الشلالة', 'Ksar Chellala'),
  (14, 'مهدية', 'Mahdia'),
  (14, 'رحوية', 'Rahouia'),
  (14, 'حمادية', 'Hamadia'),

  -- Wilaya 15 - Tizi Ouzou
  (15, 'تيزي وزو', 'Tizi Ouzou'),
  (15, 'عزازقة', 'Azazga'),
  (15, 'ذراع بن خدة', 'Draâ Ben Khedda'),
  (15, 'تيزي غنيف', 'Tizi Gheniff'),
  (15, 'لاربعا ناث إيراثن', 'Larbaâ Nath Irathen'),
  (15, 'عين الحمام', 'Aïn El Hammam'),
  (15, 'واضية', 'Ouadhia'),
  (15, 'بوغني', 'Boghni'),
  (15, 'الجمعة ن سحاريج', 'Djemâa Saharidj'),
  (15, 'أقرو', 'Akerrou'),

  -- Wilaya 16 - Alger
  (16, 'الجزائر الوسطى', 'Alger Centre'),
  (16, 'سيدي امحمد', 'Sidi M''Hamed'),
  (16, 'المدنية', 'El Madania'),
  (16, 'الحامة - العناصر', 'Belouizdad'),
  (16, 'باب الوادي', 'Bab El Oued'),
  (16, 'بولوغين', 'Bologhine'),
  (16, 'القصبة', 'Casbah'),
  (16, 'وادي قريش', 'Oued Koriche'),
  (16, 'بئر مراد رايس', 'Bir Mourad Raïs'),
  (16, 'الأبيار', 'El Biar'),
  (16, 'بوزريعة', 'Bouzareah'),
  (16, 'بن عكنون', 'Ben Aknoun'),
  (16, 'حيدرة', 'Hydra'),
  (16, 'القبة', 'Kouba'),
  (16, 'الحراش', 'El Harrach'),
  (16, 'بوروبة', 'Bourouba'),
  (16, 'حسين داي', 'Hussein Dey'),
  (16, 'المقرية', 'El Magharia'),
  (16, 'باش جراح', 'Bachedjerrah'),
  (16, 'براقي', 'Baraki'),
  (16, 'الكاليتوس', 'Les Eucalyptus'),
  (16, 'سيدي موسى', 'Sidi Moussa'),
  (16, 'بئر خادم', 'Birkhadem'),
  (16, 'جسر قسنطينة', 'Djasr Kasentina'),
  (16, 'السحاولة', 'Sehaoula'),
  (16, 'درارية', 'Draria'),
  (16, 'العاشور', 'El Achour'),
  (16, 'بابا حسن', 'Baba Hassen'),
  (16, 'دويرة', 'Douera'),
  (16, 'خرايسية', 'Khraicia'),
  (16, 'الشراقة', 'Cheraga'),
  (16, 'دالي براهيم', 'Dely Ibrahim'),
  (16, 'أولاد فايت', 'Ouled Fayet'),
  (16, 'عين البنيان', 'Aïn Benian'),
  (16, 'الحمامات', 'El Hammamet'),
  (16, 'زرالدة', 'Zéralda'),
  (16, 'سطاوالي', 'Staoueli'),
  (16, 'المحالمة', 'Rahmania'),
  (16, 'الرويبة', 'Rouïba'),
  (16, 'الرغاية', 'Reghaïa'),
  (16, 'الدار البيضاء', 'Dar El Beïda'),
  (16, 'باب الزوار', 'Bab Ezzouar'),
  (16, 'برج البحري', 'Bordj El Bahri'),
  (16, 'برج الكيفان', 'Bordj El Kiffan'),
  (16, 'المحمدية', 'Mohammadia'),

  -- Wilaya 17 - Djelfa
  (17, 'الجلفة', 'Djelfa'),
  (17, 'عين وسارة', 'Aïn Oussera'),
  (17, 'مسعد', 'Messaâd'),
  (17, 'حاسي بحبح', 'Hassi Bahbah'),
  (17, 'دار الشيوخ', 'Dar Chioukh'),
  (17, 'الشارف', 'Charef'),
  (17, 'الإدريسية', 'El Idrissia'),

  -- Wilaya 18 - Jijel
  (18, 'جيجل', 'Jijel'),
  (18, 'الطاهير', 'Taher'),
  (18, 'الميلية', 'El Milia'),
  (18, 'العوانة', 'El Aouana'),
  (18, 'زيامة منصورية', 'Ziama Mansouriah'),
  (18, 'الشقفة', 'Chekfa'),
  (18, 'عنصر', 'El Ancer'),

  -- Wilaya 19 - Sétif
  (19, 'سطيف', 'Sétif'),
  (19, 'العلمة', 'El Eulma'),
  (19, 'عين أرنات', 'Aïn Arnat'),
  (19, 'عين ولمان', 'Aïn Oulmene'),
  (19, 'عين الكبيرة', 'Aïn El Kebira'),
  (19, 'بوقاعة', 'Bougaa'),
  (19, 'عموشة', 'Amoucha'),
  (19, 'صالح باي', 'Salah Bey'),

  -- Wilaya 20 - Saïda
  (20, 'سعيدة', 'Saïda'),
  (20, 'يوب', 'Youb'),
  (20, 'عين الحجر', 'Aïn El Hadjar'),
  (20, 'سيدي بوبكر', 'Sidi Boubekeur'),
  (20, 'الحساسنة', 'El Hassasna'),

  -- Wilaya 21 - Skikda
  (21, 'سكيكدة', 'Skikda'),
  (21, 'القل', 'Collo'),
  (21, 'عزابة', 'Azzaba'),
  (21, 'الحروش', 'El Harrouch'),
  (21, 'تمالوس', 'Tamalous'),
  (21, 'فلفلة', 'Filfila'),
  (21, 'رمضان جمال', 'Ramdane Djamel'),

  -- Wilaya 22 - Sidi Bel Abbès
  (22, 'سيدي بلعباس', 'Sidi Bel Abbès'),
  (22, 'تلاغ', 'Telagh'),
  (22, 'سفيزف', 'Sfisef'),
  (22, 'بن باديس', 'Ben Badis'),
  (22, 'عين البرد', 'Aïn El Berd'),
  (22, 'سيدي علي بن يوب', 'Sidi Ali Benyoub'),

  -- Wilaya 23 - Annaba
  (23, 'عنابة', 'Annaba'),
  (23, 'البوني', 'El Bouni'),
  (23, 'سيدي عمار', 'Sidi Amar'),
  (23, 'برحال', 'Berrahal'),
  (23, 'الحجار', 'El Hadjar'),
  (23, 'سرايدي', 'Seraïdi'),
  (23, 'شطايبي', 'Chetaïbi'),

  -- Wilaya 24 - Guelma
  (24, 'قالمة', 'Guelma'),
  (24, 'وادي الزناتي', 'Oued Zenati'),
  (24, 'بوشقوف', 'Bouchegouf'),
  (24, 'حمام دباغ', 'Hammam Debagh'),
  (24, 'هيلوبوليس', 'Héliopolis'),

  -- Wilaya 25 - Constantine
  (25, 'قسنطينة', 'Constantine'),
  (25, 'الخروب', 'El Khroub'),
  (25, 'حامة بوزيان', 'Hamma Bouziane'),
  (25, 'ديدوش مراد', 'Didouche Mourad'),
  (25, 'زيغود يوسف', 'Zighoud Youcef'),
  (25, 'عين عبيد', 'Aïn Abid'),
  (25, 'ابن باديس', 'Ibn Badis'),
  (25, 'بني حميدان', 'Beni Hamiden'),

  -- Wilaya 26 - Médéa
  (26, 'المدية', 'Médéa'),
  (26, 'البرواقية', 'Berrouaghia'),
  (26, 'قصر البخاري', 'Ksar El Boukhari'),
  (26, 'بني سليمان', 'Beni Slimane'),
  (26, 'تابلاط', 'Tablat'),
  (26, 'العمارية', 'El Omaria'),

  -- Wilaya 27 - Mostaganem
  (27, 'مستغانم', 'Mostaganem'),
  (27, 'عين تادلس', 'Aïn Tedeles'),
  (27, 'سيدي علي', 'Sidi Ali'),
  (27, 'سيدي لخضر', 'Sidi Lakhdar'),
  (27, 'بوقيرات', 'Bouguirat'),
  (27, 'حاسي مماش', 'Hassi Mameche'),

  -- Wilaya 28 - M'Sila
  (28, 'المسيلة', 'M''Sila'),
  (28, 'بوسعادة', 'Bou Saâda'),
  (28, 'سيدي عيسى', 'Sidi Aïssa'),
  (28, 'عين الحجل', 'Aïn El Hadjel'),
  (28, 'مغرة', 'Magra'),
  (28, 'أولاد دراج', 'Ouled Derradj'),

  -- Wilaya 29 - Mascara
  (29, 'معسكر', 'Mascara'),
  (29, 'سيق', 'Sig'),
  (29, 'تيغنيف', 'Tighennif'),
  (29, 'المحمدية', 'Mohammadia'),
  (29, 'غريس', 'Ghriss'),
  (29, 'عوف', 'Aouf'),

  -- Wilaya 30 - Ouargla
  (30, 'ورقلة', 'Ouargla'),
  (30, 'حاسي مسعود', 'Hassi Messaoud'),
  (30, 'الرويسات', 'Rouissat'),
  (30, 'سيدي خويلد', 'Sidi Khouiled'),
  (30, 'انقوسة', 'N''Goussa'),

  -- Wilaya 31 - Oran
  (31, 'وهران', 'Oran'),
  (31, 'بئر الجير', 'Bir El Djir'),
  (31, 'السانية', 'Es Senia'),
  (31, 'أرزيو', 'Arzew'),
  (31, 'عين الترك', 'Aïn El Turk'),
  (31, 'بطيوة', 'Bethioua'),
  (31, 'وادي تليلات', 'Oued Tlelat'),
  (31, 'قديل', 'Gdyel'),
  (31, 'بوسفر', 'Bousfer'),
  (31, 'المرسى الكبير', 'Mers El Kebir'),
  (31, 'حاسي بن عقبة', 'Hassi Ben Okba'),
  (31, 'سيدي الشحمي', 'Sidi Chami'),

  -- Wilaya 32 - El Bayadh
  (32, 'البيض', 'El Bayadh'),
  (32, 'الأبيض سيدي الشيخ', 'El Abiodh Sidi Cheikh'),
  (32, 'بوعلام', 'Boualem'),
  (32, 'بريزينة', 'Brezina'),
  (32, 'الرقاصة', 'Rogassa'),

  -- Wilaya 33 - Illizi
  (33, 'إليزي', 'Illizi'),
  (33, 'إن أمناس', 'In Amenas'),
  (33, 'برج الحواس', 'Bordj El Haouas'),

  -- Wilaya 34 - Bordj Bou Arréridj
  (34, 'برج بوعريريج', 'Bordj Bou Arréridj'),
  (34, 'رأس الوادي', 'Ras El Oued'),
  (34, 'برج غدير', 'Bordj Ghedir'),
  (34, 'المنصورة', 'Mansoura'),
  (34, 'مجانة', 'Medjana'),

  -- Wilaya 35 - Boumerdès
  (35, 'بومرداس', 'Boumerdès'),
  (35, 'برج منايل', 'Bordj Menaïel'),
  (35, 'بودواو', 'Boudouaou'),
  (35, 'دلس', 'Dellys'),
  (35, 'يسر', 'Isser'),
  (35, 'خميس الخشنة', 'Khemis El Khechna'),
  (35, 'الثنية', 'Thenia'),
  (35, 'زموري', 'Zemmouri'),

  -- Wilaya 36 - El Tarf
  (36, 'الطارف', 'El Tarf'),
  (36, 'القالة', 'El Kala'),
  (36, 'بوثلجة', 'Boutheldja'),
  (36, 'بن مهيدي', 'Ben M''Hidi'),
  (36, 'الذرعان', 'Drean'),

  -- Wilaya 37 - Tindouf
  (37, 'تندوف', 'Tindouf'),
  (37, 'أم العسل', 'Oum El Assel'),

  -- Wilaya 38 - Tissemsilt
  (38, 'تيسمسيلت', 'Tissemsilt'),
  (38, 'ثنية الحد', 'Theniet El Had'),
  (38, 'برج بونعامة', 'Bordj Bou Naama'),
  (38, 'لرجام', 'Lardjem'),
  (38, 'خميستي', 'Khemisti'),

  -- Wilaya 39 - El Oued
  (39, 'الوادي', 'El Oued'),
  (39, 'قمار', 'Guemar'),
  (39, 'الرقيبة', 'Reguiba'),
  (39, 'الدبيلة', 'Debila'),
  (39, 'البياضة', 'Bayadha'),
  (39, 'الرباح', 'Robbah'),

  -- Wilaya 40 - Khenchela
  (40, 'خنشلة', 'Khenchela'),
  (40, 'قايس', 'Kaïs'),
  (40, 'ششار', 'Chechar'),
  (40, 'بابار', 'Babar'),
  (40, 'أولاد رشاش', 'Ouled Rechache'),

  -- Wilaya 41 - Souk Ahras
  (41, 'سوق أهراس', 'Souk Ahras'),
  (41, 'سدراتة', 'Sedrata'),
  (41, 'مداوروش', 'M''daourouch'),
  (41, 'تاورة', 'Taoura'),
  (41, 'المراهنة', 'Merahna'),

  -- Wilaya 42 - Tipaza
  (42, 'تيبازة', 'Tipaza'),
  (42, 'شرشال', 'Cherchell'),
  (42, 'القليعة', 'Kolea'),
  (42, 'بواسماعيل', 'Bou Ismaïl'),
  (42, 'حجوط', 'Hadjout'),
  (42, 'فوكة', 'Fouka'),
  (42, 'الداموس', 'Damous'),
  (42, 'سيدي راشد', 'Sidi Rached'),

  -- Wilaya 43 - Mila
  (43, 'ميلة', 'Mila'),
  (43, 'شلغوم العيد', 'Chelghoum Laïd'),
  (43, 'تلاغمة', 'Teleghma'),
  (43, 'فرجيوة', 'Ferdjioua'),
  (43, 'تاجنانت', 'Tadjenanet'),
  (43, 'قرارم قوقة', 'Grarem Gouga'),

  -- Wilaya 44 - Aïn Defla
  (44, 'عين الدفلى', 'Aïn Defla'),
  (44, 'خميس مليانة', 'Khemis Miliana'),
  (44, 'مليانة', 'Miliana'),
  (44, 'العطاف', 'El Attaf'),
  (44, 'جليدة', 'Djelida'),
  (44, 'العبادية', 'El Abadia'),

  -- Wilaya 45 - Naâma
  (45, 'النعامة', 'Naâma'),
  (45, 'مشرية', 'Mécheria'),
  (45, 'عين الصفراء', 'Aïn Sefra'),
  (45, 'عسلة', 'Assela'),
  (45, 'مكمن بن عمار', 'Makman Ben Amer'),

  -- Wilaya 46 - Aïn Témouchent
  (46, 'عين تموشنت', 'Aïn Témouchent'),
  (46, 'بني صاف', 'Beni Saf'),
  (46, 'حمام بوحجر', 'Hammam Bou Hadjar'),
  (46, 'العامرية', 'El Amria'),
  (46, 'عين الكيحل', 'Aïn Kihal'),

  -- Wilaya 47 - Ghardaïa
  (47, 'غرداية', 'Ghardaïa'),
  (47, 'متليلي', 'Metlili'),
  (47, 'القرارة', 'El Guerrara'),
  (47, 'بريان', 'Berriane'),
  (47, 'بني يزقن', 'Beni Isguen'),
  (47, 'العطف', 'El Atteuf'),
  (47, 'ضاية بن ضحوة', 'Dhayet Bendhahoua'),

  -- Wilaya 48 - Relizane
  (48, 'غليزان', 'Relizane'),
  (48, 'وادي ارهيو', 'Oued Rhiou'),
  (48, 'مازونة', 'Mazouna'),
  (48, 'زمورة', 'Zemmora'),
  (48, 'يلل', 'Yellel'),
  (48, 'عمي موسى', 'Ammi Moussa'),

  -- Wilaya 49 - Timimoun
  (49, 'تيميمون', 'Timimoun'),
  (49, 'أوقروت', 'Aougrout'),
  (49, 'شروين', 'Charouine'),
  (49, 'طالمين', 'Talmine'),
  (49, 'تنركوك', 'Tinerkouk'),
  (49, 'دلدول', 'Deldoul'),

  -- Wilaya 50 - Bordj Badji Mokhtar
  (50, 'برج باجي مختار', 'Bordj Badji Mokhtar'),
  (50, 'تيمياوين', 'Timiaouine'),

  -- Wilaya 51 - Ouled Djellal
  (51, 'أولاد جلال', 'Ouled Djellal'),
  (51, 'سيدي خالد', 'Sidi Khaled'),
  (51, 'رأس الميعاد', 'Ras El Miad'),
  (51, 'الدوسن', 'Doucen'),
  (51, 'الشعيبة', 'Chaïba'),
  (51, 'بسباس', 'Besbes'),

  -- Wilaya 52 - Béni Abbès
  (52, 'بني عباس', 'Béni Abbès'),
  (52, 'كرزاز', 'Kerzaz'),
  (52, 'إقلي', 'Igli'),
  (52, 'تبلبالة', 'Tabelbala'),
  (52, 'الواتة', 'El Ouata'),
  (52, 'أولاد خضير', 'Ouled Khodeir'),

  -- Wilaya 53 - In Salah
  (53, 'عين صالح', 'In Salah'),
  (53, 'فقارة الزوى', 'Foggaret Ezzaouia'),
  (53, 'إن غار', 'In Ghar'),

  -- Wilaya 54 - In Guezzam
  (54, 'عين قزام', 'In Guezzam'),
  (54, 'تين زواتين', 'Tin Zaouatine'),

  -- Wilaya 55 - Touggourt
  (55, 'تقرت', 'Touggourt'),
  (55, 'تماسين', 'Temacine'),
  (55, 'الطيبات', 'Taibet'),
  (55, 'المقارين', 'Megarine'),
  (55, 'بلدة عمر', 'Blidet Amor'),

  -- Wilaya 56 - Djanet
  (56, 'جانت', 'Djanet'),
  (56, 'برج الحواس', 'Bordj El Haouas'),

  -- Wilaya 57 - El M'Ghaier
  (57, 'المغير', 'El M''Ghaier'),
  (57, 'جامعة', 'Djamaa'),
  (57, 'المرارة', 'Mrara'),
  (57, 'أم الطيور', 'Oum El Touyour'),
  (57, 'سيدي عمران', 'Sidi Amrane'),

  -- Wilaya 58 - El Meniaa
  (58, 'المنيعة', 'El Meniaa'),
  (58, 'حاسي القارة', 'Hassi Gara'),
  (58, 'حاسي الفحل', 'Hassi Fehal');


-- 7.2 SEED DEFAULT DELIVERY RATES FOR 58 WILAYAS
insert into public.delivery_rates (wilaya_id, home_price, desk_price, carrier, eta_days)
select id, 
  case 
    when id = 16 then 400 
    when id in (9, 35, 42) then 500 
    when id in (1, 8, 11, 30, 33, 37, 39, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58) then 950 
    else 650 
  end as home_price,
  case 
    when id = 16 then 250 
    when id in (9, 35, 42) then 350 
    when id in (1, 8, 11, 30, 33, 37, 39, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58) then 650 
    else 450 
  end as desk_price,
  'yalidine',
  case 
    when id = 16 then 1 
    when id in (1, 11, 33, 37, 50, 53, 54, 56) then 4 
    else 2 
  end as eta_days
from public.wilayas
on conflict do nothing;
