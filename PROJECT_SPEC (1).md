# PROJECT SPEC — Generic Multi-Vertical E-commerce Store (Algeria, COD)

> **Purpose of this document:** This is the single source of truth for an AI coding agent building this project. All architectural decisions below are FINAL — do not propose alternatives, do not ask which library/approach to use unless something here is genuinely ambiguous or missing. Follow this spec exactly. When a task references a section number, read that section fully before starting the task.

## 1. Project Overview

A production e-commerce web platform for the Algerian market, generic enough to be reconfigured for **any product vertical** (perfume, clothing, electronics, cosmetics, footwear, etc.) via a flexible attribute system — not hardcoded to one product type. Core non-negotiable priorities, in order:

1. **Order capture must never fail silently.** Every submitted order is either fully recorded or the customer sees an explicit error — no partial/lost writes.
2. **Search must be fast and typo-tolerant.**
3. **Real, SEO-indexable URLs** for every product/category page, in 3 languages (Arabic RTL primary, French, English).
4. **Cash-on-delivery (COD)** is the default payment flow, with wilaya/commune-based delivery pricing (home delivery vs. office pickup).
5. **Mobile-first performance** on average Algerian mobile connections.
6. A seller/admin dashboard, built into the same app, not a separate project.

No mobile app is built now. The backend is API-first (Supabase) so a future mobile client can be added without backend changes.

## 2. Final Tech Stack — DO NOT SUBSTITUTE

| Layer | Choice | Exact version/notes |
|---|---|---|
| Frontend framework | Next.js | `15.x`, App Router, TypeScript strict mode |
| Styling | Tailwind CSS | `3.x` |
| i18n | `next-intl` | locales: `ar` (default, RTL), `fr`, `en` |
| Forms/validation | `react-hook-form` + `zod` | all form and API input validation goes through Zod schemas in `src/lib/validators/` |
| Backend/DB | Supabase | Postgres 15, Auth, Storage, Edge Functions |
| Search | Meilisearch | self-hosted via Docker, `v1.10+` (see §10 for the low-cost Postgres FTS fallback variant) |
| Charts (admin) | Recharts | `2.x` |
| 3D hero (optional, vertical-dependent) | `@react-three/fiber` + `@react-three/drei` + `three` | gated behind `prefers-reduced-motion` and `navigator.connection.saveData` |
| Icons | `lucide-react` | |
| Notifications | Telegram Bot API (primary), CallMeBot WhatsApp webhook (optional secondary) | seller-facing alerts only, never customer-facing automated messages |
| Delivery | Yalidine API | `getRates`, `createShipment`, tracking — see §11 |
| Hosting (standard) | Vercel | frontend |
| Hosting (zero-cost reseller variant) | Cloudflare Pages + `@cloudflare/next-on-pages` | see §17 |
| Package manager | `npm` | do not switch to yarn/pnpm mid-project |

Do not add an ORM (Prisma/Drizzle). Use the Supabase JS client directly with generated TypeScript types (`supabase gen types typescript`). Do not add a state management library (Redux/Zustand) — React Server Components + local state is sufficient for this app's complexity.

## 3. Folder Structure — Create Exactly This

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── produits/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── categories/[slug]/page.tsx
│   │   ├── recherche/page.tsx
│   │   ├── commande/confirmation/[id]/page.tsx
│   │   └── mes-favoris/page.tsx
│   ├── admin/
│   │   ├── layout.tsx          (auth guard — redirect to /admin/login if no session)
│   │   ├── login/page.tsx
│   │   ├── page.tsx             (dashboard home)
│   │   ├── produits/page.tsx
│   │   ├── attributs/page.tsx
│   │   ├── commandes/page.tsx
│   │   ├── clients/page.tsx
│   │   ├── stock/page.tsx
│   │   └── parametres/page.tsx
│   └── api/
│       ├── orders/route.ts
│       ├── search-sync/route.ts
│       ├── delivery-rates/route.ts
│       ├── yalidine-shipment/route.ts
│       └── checkout-lead/route.ts
├── components/
│   ├── product/ (ProductCard.tsx, ProductGallery.tsx, ProductFilters.tsx)
│   ├── hero/ (Hero3D.tsx, HeroStatic.tsx)
│   ├── admin/ (SummaryCards.tsx, SalesChart.tsx, WilayaHeatmap.tsx)
│   └── forms/ (OrderForm.tsx)
├── lib/
│   ├── supabase/
│   │   ├── client.ts   (browser client, anon key only)
│   │   └── server.ts   (server client, service role — NEVER imported in a "use client" file)
│   ├── meilisearch.ts
│   ├── yalidine.ts
│   ├── telegram.ts
│   └── validators/ (order.ts, product.ts, attribute.ts)
├── i18n/
│   ├── ar.json / fr.json / en.json
│   └── request.ts
└── types/
    └── database.ts   (generated: `supabase gen types typescript --local > src/types/database.ts`)
supabase/
└── migrations/   (numbered files, see §4)
```

## 4. Database Schema — Complete SQL, Apply in This Exact Order

Each block below is one migration file. Create them under `supabase/migrations/` with these exact filenames (timestamps are placeholders — use `supabase migration new <name>` to generate correct timestamps, then paste this SQL in).

### `0001_reference_data.sql`

```sql
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

create table wilayas (
  id int primary key,
  code text not null unique,
  name_ar text not null,
  name_fr text not null
);

create table communes (
  id uuid primary key default gen_random_uuid(),
  wilaya_id int not null references wilayas(id),
  name_ar text not null,
  name_fr text not null
);
create index idx_communes_wilaya on communes(wilaya_id);
```

Seed `wilayas` and `communes` from a public open-source Algeria administrative-division dataset (58 wilayas). Do not hand-type this data.

### `0002_catalog_taxonomy.sql`

```sql
create table brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id),
  slug text not null unique
);
create index idx_categories_parent on categories(parent_id);

create table category_translations (
  category_id uuid not null references categories(id) on delete cascade,
  locale text not null check (locale in ('ar','fr','en')),
  name text not null,
  primary key (category_id, locale)
);
```

### `0003_attributes.sql`

```sql
create table attributes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  input_type text not null check (input_type in ('select','multiselect','text','number','boolean')),
  is_variant_defining boolean not null default false
);

create table attribute_translations (
  attribute_id uuid not null references attributes(id) on delete cascade,
  locale text not null check (locale in ('ar','fr','en')),
  name text not null,
  primary key (attribute_id, locale)
);

create table attribute_options (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references attributes(id) on delete cascade,
  value_slug text not null,
  unique (attribute_id, value_slug)
);

create table attribute_option_translations (
  option_id uuid not null references attribute_options(id) on delete cascade,
  locale text not null check (locale in ('ar','fr','en')),
  label text not null,
  primary key (option_id, locale)
);

create table category_attributes (
  category_id uuid not null references categories(id) on delete cascade,
  attribute_id uuid not null references attributes(id) on delete cascade,
  is_required boolean not null default false,
  primary key (category_id, attribute_id)
);
```

### `0004_products.sql`

```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id),
  category_id uuid not null references categories(id),
  slug text not null unique,
  base_price numeric(10,2) not null check (base_price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= base_price),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  created_at timestamptz not null default now()
);
create index idx_products_category on products(category_id);
create index idx_products_brand on products(brand_id);
create index idx_products_status on products(status);

create table product_translations (
  product_id uuid not null references products(id) on delete cascade,
  locale text not null check (locale in ('ar','fr','en')),
  name text not null,
  description text,
  meta_title text,
  meta_description text,
  primary key (product_id, locale)
);
-- Full-text search support columns for the zero-cost search fallback (§10)
create index idx_product_translations_fts on product_translations
  using gin (to_tsvector('simple', unaccent(coalesce(name,'') || ' ' || coalesce(description,''))));
create index idx_product_translations_trgm on product_translations
  using gin (name gin_trgm_ops);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  position int not null default 0
);
create index idx_product_images_product on product_images(product_id);
```

### `0005_variants_and_attribute_values.sql`

```sql
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text unique,
  price_override numeric(10,2),
  compare_at_price_override numeric(10,2),
  stock_qty int not null default 0 check (stock_qty >= 0),
  min_stock_threshold int not null default 3,
  cost_price numeric(10,2)
);
create index idx_variants_product on product_variants(product_id);

create table product_attribute_values (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  attribute_option_id uuid not null references attribute_options(id)
);
create index idx_pav_product on product_attribute_values(product_id);
create index idx_pav_variant on product_attribute_values(variant_id);
create index idx_pav_option on product_attribute_values(attribute_option_id);
```

### `0006_delivery.sql`

```sql
create table delivery_rates (
  id uuid primary key default gen_random_uuid(),
  wilaya_id int not null references wilayas(id),
  commune_id uuid references communes(id),
  home_price numeric(10,2),
  desk_price numeric(10,2),
  carrier text not null default 'yalidine',
  eta_days int,
  unique (wilaya_id, commune_id, carrier)
);
create index idx_delivery_wilaya on delivery_rates(wilaya_id);
```

### `0007_customers.sql`

```sql
create table customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  full_name text not null,
  email text,
  created_at timestamptz not null default now()
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  wilaya_id int not null references wilayas(id),
  commune_id uuid not null references communes(id),
  address_text text,
  delivery_type text not null check (delivery_type in ('home','desk'))
);
create index idx_addresses_customer on addresses(customer_id);
```

### `0008_orders.sql`

```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  address_id uuid not null references addresses(id),
  status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','returned','cancelled')),
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null,
  total numeric(10,2) not null,
  deposit_paid numeric(10,2) default 0,
  payment_type text not null default 'cod_full' check (payment_type in ('cod_full','deposit','installment')),
  notes text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index idx_orders_customer on orders(customer_id);
create index idx_orders_status on orders(status);
create index idx_orders_created on orders(created_at desc);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_variant_id uuid not null references product_variants(id),
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null  -- snapshot at order time, never recompute from current price
);
create index idx_order_items_order on order_items(order_id);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null,
  changed_by text not null default 'system',
  changed_at timestamptz not null default now()
);
create index idx_osh_order on order_status_history(order_id);
```

### `0009_reviews_wishlist_leads.sql`

```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  customer_id uuid references customers(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create index idx_reviews_product on reviews(product_id);

create table wishlist_items (
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (customer_id, product_id)
);

create table checkout_leads (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  product_id uuid references products(id),
  wilaya_id int references wilayas(id),
  created_at timestamptz not null default now(),
  contacted boolean not null default false
);
create index idx_leads_contacted on checkout_leads(contacted);
```

### `0010_rls_policies.sql` — apply LAST, after all tables above exist and are seeded with test data

```sql
-- Enable RLS on every table that holds customer or business data
alter table products enable row level security;
alter table product_translations enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table product_attribute_values enable row level security;
alter table brands enable row level security;
alter table categories enable row level security;
alter table category_translations enable row level security;
alter table attributes enable row level security;
alter table attribute_translations enable row level security;
alter table attribute_options enable row level security;
alter table attribute_option_translations enable row level security;
alter table category_attributes enable row level security;
alter table delivery_rates enable row level security;
alter table wilayas enable row level security;
alter table communes enable row level security;
alter table customers enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table reviews enable row level security;
alter table wishlist_items enable row level security;
alter table checkout_leads enable row level security;

-- PUBLIC READ: catalog data anyone can browse
create policy "public read active products" on products for select using (status = 'active');
create policy "public read product translations" on product_translations for select using (true);
create policy "public read product images" on product_images for select using (true);
create policy "public read variants" on product_variants for select using (true);
create policy "public read product attribute values" on product_attribute_values for select using (true);
create policy "public read brands" on brands for select using (true);
create policy "public read categories" on categories for select using (true);
create policy "public read category translations" on category_translations for select using (true);
create policy "public read attributes" on attributes for select using (true);
create policy "public read attribute translations" on attribute_translations for select using (true);
create policy "public read attribute options" on attribute_options for select using (true);
create policy "public read attribute option translations" on attribute_option_translations for select using (true);
create policy "public read category attributes" on category_attributes for select using (true);
create policy "public read delivery rates" on delivery_rates for select using (true);
create policy "public read wilayas" on wilayas for select using (true);
create policy "public read communes" on communes for select using (true);
create policy "public read approved reviews" on reviews for select using (status = 'approved');

-- NO public write policy exists on any catalog table.
-- All writes to catalog/orders tables happen ONLY through:
--   (a) the service_role key inside Edge Functions / API routes (never exposed to the browser), or
--   (b) an authenticated seller session checked against auth.uid() (see admin policies below)
-- This is why product_variants, orders, etc. have NO insert/update policy for anon/authenticated below —
-- the service_role key bypasses RLS entirely by design, and is only ever used server-side.

-- SELLER (admin) access: any row where the authenticated user is a seller (custom claim or a sellers table — pick one approach and stay consistent; simplest: a `is_admin` boolean on the Supabase auth user's app_metadata, checked via `(auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean`)
create policy "sellers manage products" on products for all
  using ((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true)
  with check ((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true);
-- Repeat the same "sellers manage X" pattern for: product_translations, product_images, product_variants,
-- product_attribute_values, brands, categories, category_translations, attributes, attribute_translations,
-- attribute_options, attribute_option_translations, category_attributes, delivery_rates, orders (update only,
-- for status changes), order_status_history (insert only), reviews (update for moderation), checkout_leads (select+update).

-- CUSTOMER access: none directly. Customers never query `orders`, `customers`, `addresses`, `order_items`,
-- `checkout_leads` directly from the browser. All customer-facing order operations go through the
-- `/api/orders` Edge Function using the service_role key, which validates and inserts server-side.
-- Do NOT create a public insert policy on `orders` or `customers` — this is a deliberate security boundary.
```

## 5. Environment Variables — Complete List

```
# Public (safe to expose to the browser — prefixed NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=

# Server-only — NEVER reference these in a "use client" component or expose in any client bundle
SUPABASE_SERVICE_ROLE_KEY=
MEILISEARCH_HOST=
MEILISEARCH_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
CALLMEBOT_PHONE=
CALLMEBOT_APIKEY=
# Yalidine credentials below are the DEFAULT/first carrier only — additional carriers'
# credentials (ZR Express, Maystro, NOEST, etc.) are stored per-seller in the
# `carrier_credentials` DB table (§11), not as static env vars, since a reseller
# copy of this app may configure a different courier per seller.
YALIDINE_API_ID=
YALIDINE_API_TOKEN=
ADMIN_SESSION_SECRET=
```

**Rule the agent must enforce:** grep the codebase before every commit for any of the server-only variable names appearing inside a file that has `"use client"` at the top, or inside anything under `src/app/[locale]/` (customer-facing pages). If found, that is a security bug — fix before continuing.

## 6. API / Edge Function Contracts

Every route below MUST validate its input with a Zod schema in `src/lib/validators/` before touching the database, and MUST return a consistent error shape: `{ error: string, code: string }` with an appropriate HTTP status. Never return raw database error messages to the client (information leak) — log the real error server-side, return a generic message to the client.

### `POST /api/orders` — the single order-capture path (§ critical path, see §13 for security rules)

Request body:
```typescript
{
  customer: { phone: string; full_name: string; email?: string };
  address: { wilaya_id: number; commune_id: string; address_text?: string; delivery_type: 'home' | 'desk' };
  items: Array<{ product_variant_id: string; quantity: number }>;
  payment_type: 'cod_full' | 'deposit';
  notes?: string;
}
```

Server logic, in this exact order, inside a single Postgres transaction:
1. Validate body against Zod schema. Reject with 400 on failure.
2. Rate-limit by phone + IP (see §13) — reject with 429 if exceeded.
3. Look up or create `customers` row by phone (upsert on `phone`).
4. Look up or create `addresses` row.
5. For each item: lock the `product_variants` row (`select ... for update`), verify `stock_qty >= quantity`. If any item fails, roll back the entire transaction and return 409 with which item(s) failed.
6. Compute `subtotal` from `unit_price` snapshotted from current variant price (not client-supplied price — never trust a price sent from the browser).
7. Look up `delivery_fee` from `delivery_rates` for the given wilaya/commune/delivery_type. If Yalidine live-rate integration (§11) is enabled, prefer that; fall back to the local `delivery_rates` table if the API call fails — never block order creation on a delivery-pricing API being down.
8. Insert `orders`, `order_items`, decrement `stock_qty` on each variant, insert `order_status_history` (status='pending', changed_by='system'). Commit transaction.
9. After commit (not inside the transaction): fire-and-forget calls to Telegram (§12) and, if configured, CallMeBot. A failure here must NOT fail the API response — the order is already safely committed.
10. Return `201` with `{ order_id, status: 'pending' }`.

Response (success): `{ order_id: string, status: 'pending' }` — 201
Response (validation error): `{ error: string, code: 'VALIDATION_ERROR' }` — 400
Response (stock conflict): `{ error: string, code: 'OUT_OF_STOCK', unavailable_items: string[] }` — 409
Response (rate limited): `{ error: string, code: 'RATE_LIMITED' }` — 429

### `POST /api/checkout-lead`

Fired client-side as soon as the phone field is valid and blurred (before final submit), to capture abandoned-checkout leads (§ growth feature, low priority — implement after order capture works).

Request: `{ phone: string; product_id?: string; wilaya_id?: number }`
Logic: insert into `checkout_leads`. No auth required, but apply the same rate limit as `/api/orders` to prevent spam.
Response: `{ ok: true }` — 201. Always return success even on internal failure (this is a non-critical background signal — never let it break the checkout UI).

### `GET /api/delivery-rates?wilaya_id=&commune_id=`

Returns `{ home_price: number | null, desk_price: number | null, eta_days: number | null, source: 'yalidine_live' | 'local_table' }`. See §11 for the live/fallback logic.

### `POST /api/yalidine-shipment` — admin-only, called from `/admin/commandes`

Requires an authenticated admin session (check via Supabase Auth server-side, reject 401 otherwise). Request: `{ order_id: string }`. Calls Yalidine's `createShipment`, stores the returned tracking reference on the order (add a `carrier_tracking_id` column if not already present — the agent should add this column via a new migration when implementing this task, not retrofit it into `0008_orders.sql`), inserts an `order_status_history` row.

### `POST /api/search-sync` — internal webhook, called after any product/variant/attribute-value write in the admin

Not customer-facing. Protect with a shared secret header (`X-Sync-Secret`, compared against an env var) since it is called server-to-server, not from a browser. Rebuilds the flattened Meilisearch document for the given `product_id` (see §10) and pushes it via the Meilisearch client.

## 7. Pages Spec

| Route | Renders | Data source |
|---|---|---|
| `/[locale]` | Homepage: hero, featured categories, featured products | Server Component, direct Supabase query |
| `/[locale]/produits` | Product grid + filters (category, brand, price, dynamic attributes) | Server Component reads query params → queries Meilisearch (§10) |
| `/[locale]/produits/[slug]` | Product detail: gallery, price, variant selector (built from `is_variant_defining` attributes), related products, reviews | Server Component, `generateMetadata` sets Open Graph tags (title, image, description, price) dynamically per product for share-preview cards |
| `/[locale]/categories/[slug]` | Category landing + its products | Server Component |
| `/[locale]/recherche` | Search results for a free-text query | Client Component (interactive), queries Meilisearch via `/api` proxy — never expose `MEILISEARCH_API_KEY` to the browser; proxy search requests through a server route using a search-only restricted API key |
| `/[locale]/commande/confirmation/[id]` | Order confirmation with order number | Server Component, reads the order by id (only the fields needed for confirmation — do not leak other customers' data; scope the query narrowly) |
| `/[locale]/mes-favoris` | Wishlist, identified by a browser-local customer token or phone lookup (no forced account) | Client Component |
| `/admin/*` | See §3 folder structure. Every page under `/admin` except `/admin/login` must check the session server-side in `admin/layout.tsx` and redirect to `/admin/login` if absent. |

## 8. i18n Rules

- Default locale `ar`, with `dir="rtl"` set on `<html>` in `src/app/[locale]/layout.tsx` when `locale === 'ar'`, `dir="ltr"` otherwise.
- Every hardcoded UI string goes into `src/i18n/{locale}.json` — the agent must not leave any hardcoded English/French/Arabic string directly in a `.tsx` file outside of these JSON files.
- Product/category/attribute content comes from the `*_translations` tables, not from the i18n JSON files (those are for UI chrome only: buttons, labels, nav).
- Layout mirroring: use Tailwind's logical properties (`ps-4` instead of `pl-4`, `me-2` instead of `mr-2`, etc.) throughout so RTL/LTR mirroring is automatic — do not hardcode `left`/`right` or `pl-`/`pr-` classes anywhere in shared components.

## 9. Search (Meilisearch) Configuration

Index name: `products`. One index shared across locales, with locale-specific fields (do NOT create 3 separate indexes — use field suffixes instead, it's simpler to keep in sync).

Document shape pushed by `/api/search-sync`:
```typescript
{
  id: string;               // product_id
  slug: string;
  status: 'active' | 'draft' | 'archived';
  name_ar: string; name_fr: string; name_en: string;
  description_ar: string; description_fr: string; description_en: string;
  category_id: string;
  brand_id: string | null;
  price: number;            // min price across variants
  compare_at_price: number | null;
  in_stock: boolean;        // true if any variant has stock_qty > 0
  attributes: Record<string, string[]>; // e.g. { "size": ["m","l"], "color": ["red"], "notes": ["vanilla","oud"] } — built from product_attribute_values joined to attribute_options.value_slug, grouped by attributes.slug
  rating_avg: number | null;
  created_at: string;       // ISO timestamp, for "newest" sort
}
```

Meilisearch index settings (set once via the client, not per-document):
- `searchableAttributes`: `["name_ar", "name_fr", "name_en", "description_ar", "description_fr", "description_en", "attributes"]`
- `filterableAttributes`: `["category_id", "brand_id", "price", "in_stock", "attributes", "status"]`
- `sortableAttributes`: `["price", "created_at", "rating_avg"]`
- Typo tolerance: leave default settings (Meilisearch's defaults are well-tuned; do not override `minWordSizeForTypos` unless testing shows a specific problem).

Query flow from `/produits` and `/recherche`: the page's Server Component reads URL query params (`?category=&brand=&min_price=&max_price=&attr_size=&attr_color=&sort=&q=`), builds a Meilisearch filter string, and queries directly from the server (Meilisearch host/key are server-only env vars) — the browser never talks to Meilisearch directly.

## 10. Zero-Cost Search Fallback (Postgres Full-Text Search)

For the low-cost reseller variant (§17), skip Meilisearch entirely and query Postgres directly using the indexes already created in `0004_products.sql`:

```sql
select p.*, pt.name, pt.description,
  similarity(pt.name, $1) as sim_score
from products p
join product_translations pt on pt.product_id = p.id and pt.locale = $2
where p.status = 'active'
  and (
    to_tsvector('simple', unaccent(pt.name || ' ' || coalesce(pt.description,''))) @@ plainto_tsquery('simple', unaccent($1))
    or similarity(pt.name, $1) > 0.2
  )
order by sim_score desc
limit 20;
```

This gives basic typo tolerance via `pg_trgm` similarity, without any external service. The agent should implement search as an interface (`src/lib/search.ts` exporting a `searchProducts()` function) so switching between the Meilisearch implementation and this Postgres implementation is a one-file change, not a rewrite of every page that calls search.

## 11. Delivery (Multi-Courier via dzship) Integration

Use **dzship** (`https://freeship.dzbuild.com`), a free public unified API by DZBuild, instead of integrating each courier's API separately. It normalizes Yalidine, ZR Express, Maystro, NOEST, and 30+ Ecotrack-platform couriers (DHD, Conexlog/UPS, etc.) into one request/response shape. No signup, no API key for dzship itself — the seller's own courier account credentials (e.g. `YALIDINE_API_ID`/`YALIDINE_API_TOKEN`) are passed per call and are not stored by dzship. This lets `/admin/parametres` offer a courier dropdown instead of being hardcoded to one provider, matching the already-generic `delivery_rates.carrier` column (§4).

`src/lib/delivery.ts` wraps two calls, parameterized by `carrier`:
- `getRates(carrier, credentials, wilaya_id, commune_id)`: POST to dzship's rates endpoint. Cache the response in the local `delivery_rates` table (upsert) so repeated lookups don't hit the external API every time — refresh on a schedule (a daily cron via Supabase Edge Function scheduled trigger, or a manual "sync rates" button in `/admin/parametres`), not on every single page load.
- `createShipment(carrier, credentials, order)`: POST to dzship with the order's address/customer/COD amount, called only from `/api/yalidine-shipment` (rename to `/api/create-shipment` since it is no longer Yalidine-specific) — admin-triggered, never automatic; the seller confirms by phone first, then clicks "create shipment".

Store which carrier's credentials belong to this seller in a new `carrier_credentials` table (`carrier text, api_id text, api_token text` — encrypt at rest or store only server-side, never expose to the client) added via a migration when implementing this task.

If the dzship call fails or times out, the site must degrade gracefully: `GET /api/delivery-rates` falls back to the local `delivery_rates` table (§ already described in the order-capture logic, step 7). Never let a third-party API outage block a customer from placing an order.

## 12. Notifications (Telegram + optional WhatsApp)

`src/lib/telegram.ts`: a single function `notifyNewOrder(order)` that POSTs to `https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage` with `chat_id=TELEGRAM_ADMIN_CHAT_ID` and a formatted message (order id, customer name/phone, items, total, wilaya). Called after the order transaction commits (§6, step 9) — never before, and never in a way that can roll back the order if it fails.

Optional CallMeBot call follows the same "fire after commit, never block or fail the request" rule. Both are seller-facing alerts only — no automated message is ever sent to the customer via WhatsApp (see the earlier decision: customer order confirmation is a human phone call the seller makes, not an automated message).

## 13. Security Requirements — MANDATORY, DO NOT SKIP ANY ITEM

This section is not optional polish. Treat every checkbox below as part of the definition of done for the relevant task, not a separate "security phase" to do later.

### 13.1 Secrets and keys
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is used ONLY inside files under `src/app/api/**/route.ts` and `src/lib/supabase/server.ts`. It must never appear in any file that ships to the browser. Verify with `grep -r "SERVICE_ROLE" src/app/[locale]` before every commit — it must return zero results.
- [ ] The browser-side Supabase client (`src/lib/supabase/client.ts`) uses only `NEXT_PUBLIC_SUPABASE_ANON_KEY`, which is safe to expose (it relies on RLS, not secrecy).
- [ ] `MEILISEARCH_API_KEY` used server-side for indexing must be a key scoped to **write-only on the `products` index**, generated via Meilisearch's key-management API — never the master key. A separate, **search-only** (read-only) key is used for the search proxy route.
- [ ] `YALIDINE_API_TOKEN`, any value from `carrier_credentials`, `TELEGRAM_BOT_TOKEN`, `CALLMEBOT_APIKEY` never appear in client bundles. Confirm by running a production build and grepping the generated `.next/static` output for these strings — must return zero matches.
- [ ] No secret is ever logged to console in production (`NODE_ENV === 'production'` guards around any debug logging that includes request bodies).

### 13.2 Database access control (Row-Level Security)
- [ ] RLS is enabled on every table listed in `0010_rls_policies.sql` (§4) before the app goes to production. During development it is acceptable to work with the service role only, but RLS must be verified working (test with the anon key directly, not just through the app) before launch.
- [ ] No table containing customer PII (`customers`, `addresses`, `orders`, `order_items`, `checkout_leads`) has a public `select`, `insert`, or `update` policy for the `anon` or unauthenticated `authenticated` role. All access to these tables goes through server-side code using the service role, which bypasses RLS by design and is the only path in.
- [ ] The admin `is_admin` check (`auth.jwt() -> 'app_metadata' ->> 'is_admin'`) is set via a server-side-only Supabase Admin API call when creating a seller account — never allow a user to self-elevate to admin via any client-writable field.

### 13.3 Input validation and injection prevention
- [ ] Every API route validates its input with a Zod schema before any database call. Reject early with 400 on validation failure — never pass unvalidated input into a query.
- [ ] All database queries go through the Supabase client's parameterized query builder (`.eq()`, `.insert()`, etc.) or parameterized raw SQL (`$1`, `$2` placeholders as shown in §10) — never string-concatenate user input into a SQL string.
- [ ] All user-generated text rendered back to other users (product reviews, comments) is rendered as plain text by React's default escaping — never use `dangerouslySetInnerHTML` on any field that originated from user input.

### 13.4 Rate limiting and abuse prevention (COD-specific)
- [ ] `/api/orders` and `/api/checkout-lead` are rate-limited by a combination of IP address and phone number (e.g., max 5 order attempts per phone per hour, max 20 per IP per hour) to prevent fake-order spam — a real, known problem for COD stores in this market. Implement via a simple counter table or Supabase Edge Function + a lightweight in-memory/Upstash-style limiter; do not skip this because it seems like a "growth feature" — it is a fraud-prevention requirement.
- [ ] Repeated failed stock-lock attempts from the same phone/IP in a short window are flagged (log only, no auto-ban) for the seller to review in `/admin/commandes`.

### 13.5 Transport and session security
- [ ] HTTPS is enforced everywhere in production (Vercel/Cloudflare Pages both do this by default — verify no `http://` hardcoded URL exists anywhere, including in the Yalidine/Telegram/Meilisearch base URLs).
- [ ] Admin session cookies are `httpOnly`, `secure`, `sameSite=lax` (Supabase Auth's SSR helpers handle this by default via `@supabase/ssr` — do not hand-roll session handling).
- [ ] `/admin/*` routes check the session server-side in the layout (§7), never rely on client-side-only route protection (a client-side redirect alone is not real protection — the API routes underneath must also check the session independently).

### 13.6 Third-party webhook/API security
- [ ] `/api/search-sync` requires the shared-secret header described in §6 — this endpoint must never be publicly callable without it, since it can be used to inject arbitrary content into search results otherwise.
- [ ] If Yalidine or any other provider later sends webhooks back to this app (e.g., shipment status updates), verify the webhook signature per that provider's documentation before trusting the payload — do not implement a webhook receiver that trusts an unauthenticated POST body.

### 13.7 Dependency and build hygiene
- [ ] Run `npm audit` before each deployment; do not ship with known high/critical severity vulnerabilities unresolved.
- [ ] Pin exact versions for security-sensitive packages (`@supabase/supabase-js`, `next`, `zod`) in `package.json` rather than loose ranges, to avoid an unreviewed transitive update changing behavior silently.

## 14. Coding Conventions — Follow Without Re-Deciding

- TypeScript strict mode everywhere. No `any` — use `unknown` and narrow, or generate/derive proper types from `src/types/database.ts`.
- Server Components by default. Add `"use client"` only when a file genuinely needs interactivity (state, effects, event handlers) — do not mark a whole page client-side just because one small piece of it is interactive; extract that piece into its own small client component instead.
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for utilities/lib files, `kebab-case` for route folders (Next.js convention).
- One component per file. No default-exported anonymous components — always name the function.
- Every Zod schema lives in `src/lib/validators/` and is imported both by the API route (server validation) and the corresponding form (client validation) — one schema, two uses, never duplicate validation logic.
- Commit messages: `type(scope): message` (e.g., `feat(orders): add stock-lock transaction`, `fix(admin): correct RLS policy for reviews`) — this keeps history scannable for later maintenance without re-reading every diff.
- Do not introduce a new npm dependency without checking §2 first — if something in §2 already covers the need, use it.

## 15. Task Backlog — Execute in This Order, One Ticket at a Time

Each ticket below is intentionally scoped small enough to complete and verify independently. Do not start ticket N+1 until ticket N's acceptance criteria (AC) pass. This ordering resolves all cross-ticket dependencies already — do not resequence.

**T1 — Project scaffold.** `create-next-app` per §2, install all packages in §2, create the folder structure in §3 (empty files/stubs are fine). AC: `npm run dev` serves a blank page with no errors.

**T2 — Supabase project + migrations 0001–0009.** Create the Supabase project, run migrations `0001` through `0009` from §4 (NOT `0010` yet). Seed `wilayas`/`communes`. AC: `supabase db push` succeeds with zero errors; querying `select count(*) from wilayas` returns 58.

**T3 — i18n scaffold.** Set up `next-intl` per §8, build `[locale]/layout.tsx` with correct `dir`/`lang` switching. AC: visiting `/ar` renders `<html dir="rtl" lang="ar">`, `/fr` renders `dir="ltr" lang="fr"`.

**T4 — `/admin/attributs` page.** Full CRUD for `attributes`, `attribute_options`, and their translations, plus assigning attributes to categories via `category_attributes`. AC: create an attribute "Size" (`is_variant_defining=true`) with options S/M/L, assign it to a test category, and see it reflected in the DB exactly as designed in §4.

**T5 — `/admin/produits` page.** Product create/edit form that dynamically renders fields based on the selected category's linked attributes (from T4). AC: switching category in the form changes which attribute fields appear, with zero page reload and zero hardcoded per-category logic in the component.

**T6 — `/admin/stock` page.** Stock list with `min_stock_threshold` low-stock highlighting. AC: a variant with `stock_qty < min_stock_threshold` is visually flagged.

**T7 — Storefront catalog pages.** `/produits`, `/produits/[slug]`, `/categories/[slug]` reading directly from Supabase (no search yet — plain queries). AC: a product created in T5 is visible and correctly rendered in all 3 locales.

**T8 — `generateMetadata` for Open Graph.** Dynamic OG tags per product page. AC: sharing a product URL in a link-preview testing tool shows the correct image/title/price.

**T9 — CSS 3D tilt on product cards.** AC: works on desktop hover and does not break touch scrolling on mobile.

**T10 — `/api/orders` (the critical path, §6).** Implement exactly as specified, including the transaction, stock-lock, and all error responses. AC: run the manual test from §16 (Q1) and confirm zero lost/duplicated orders under a simulated connection drop.

**T11 — Telegram notification (§12).** AC: a test order triggers a message in the configured chat within a few seconds.

**T12 — `/admin/commandes` page.** Order list, status filters, manual status update (writes to `order_status_history`), click-to-call/WhatsApp link. AC: changing an order's status from the UI is reflected in both `orders.status` and a new `order_status_history` row.

**T13 — Delivery rates + `/api/delivery-rates` (§11, local-table path only, no Yalidine yet).** AC: selecting a wilaya/commune in the order form shows the correct delivery fee from `delivery_rates`.

**T14 — Search integration (§9 or §10, per which variant is chosen — see §17).** AC: a deliberately misspelled query still returns the intended product.

**T15 — Filters UI on `/produits`.** Category, brand, price range, and dynamic attribute filters, wired to the search backend from T14. AC: combining 2+ filters narrows results correctly.

**T16 — Wishlist + related products.** AC: adding/removing a wishlist item persists across a page reload; a product page shows at least 3 related items from the same category.

**T17 — `checkout_leads` capture (§6).** AC: entering a phone number without completing checkout creates a row in `checkout_leads`.

**T18 — `/admin` dashboard home.** Summary cards + Recharts (sales trend, category distribution, wilaya distribution) + customer VIP/Gold/Silver tiering query. AC: numbers on the cards match a manual `count`/`sum` query against the same data.

**T19 — dzship multi-courier live integration (§11, `getRates` + `createShipment` via dzship).** AC: rates sync into `delivery_rates` for at least Yalidine; a test shipment creation returns a real tracking reference in sandbox/test mode; switching the configured carrier in `/admin/parametres` changes which courier is used without any code change.

**T20 — RLS policies (`0010_rls_policies.sql`).** Apply last. AC: attempting to read `orders` or `customers` directly with the anon key (e.g., via `curl` with the anon key) returns zero rows or a permission error; the app itself still works end-to-end afterward (i.e., confirm no legitimate app flow was accidentally broken by RLS).

**T21 — Full security pass (§13).** Go through every checkbox in §13 explicitly, one by one, and confirm each. AC: all boxes checked, `npm audit` clean of high/critical issues, secret-leak greps return zero matches.

**T22 — Performance pass.** Lighthouse mobile score check, image optimization audit, throttled-3G manual test. AC: Lighthouse mobile performance score ≥ 80 on the homepage and a product page.

**T23 — Deployment.** Per §16 deployment steps. AC: production URL passes the full manual test in §16 Q1 again, on the real deployed environment, not just locally.

## 16. Final QA Checklist and Deployment

Before marking T23 done, verify:
- [ ] Full order flow completes in all 3 locales with zero errors.
- [ ] Killing the network connection mid-order-submit never leaves a half-written order (either fully committed or fully absent — verified via the transaction in §6).
- [ ] Telegram alert arrives for every test order.
- [ ] Delivery fee is correct for at least 10 different wilaya/commune combinations, both `home` and `desk`.
- [ ] Search tolerates a deliberate typo in Arabic and French.
- [ ] Every filter works alone and combined with others.
- [ ] A shared product link shows a correct Open Graph preview card.
- [ ] `/admin/commandes` clearly shows which orders are awaiting phone confirmation.
- [ ] Low-stock flag fires correctly.
- [ ] Mobile layout is correct on a viewport under 375px wide, on a throttled 3G profile.
- [ ] RLS confirmed active per T20's AC.
- [ ] A manual database backup is taken before the production launch, independent of Supabase's automatic backups.

Deployment commands:
```bash
vercel link
vercel env pull .env.local
supabase db push
vercel --prod
```

## 17. Zero-Cost Variant (only if this build is for reselling to small sellers who cannot sustain recurring payments)

If this instance of the spec is being used to build a copy meant for resale to a small seller, apply these substitutions to §2 for that copy only:

- Search: use §10 (Postgres FTS) instead of Meilisearch — no VPS needed.
- Hosting: use Cloudflare Pages + `@cloudflare/next-on-pages` instead of Vercel (Vercel's free Hobby tier prohibits commercial use in its terms of service; Cloudflare Pages' free tier explicitly allows commercial use).
- Add a free scheduled GitHub Actions workflow that pings the Supabase project every few days to prevent the free-tier auto-pause after 7 days of inactivity.
- Each seller uses their own free Supabase/Cloudflare/Telegram accounts — do not share one backend across multiple sellers' independent stores under this model.

This does not change anything in §3–§8, §12–§15 — only the two substitutions above. The task backlog in §15 is followed identically either way; T14 simply implements §10 instead of §9.
