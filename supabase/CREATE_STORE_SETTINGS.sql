-- =========================================================================
-- جدول إعدادات المتجر العامة (Store Settings Table)
-- =========================================================================

create table if not exists public.store_settings (
  id text primary key default 'default',
  store_name text not null default 'Banda Boutique | متجر باندا',
  store_tagline text default 'أرقى الحجابات والعبايات والأزياء المحتشمة في الجزائر',
  phone text default '0550123456',
  whatsapp text default '0550123456',
  instagram text default 'banda_boutique_dz',
  facebook text default '',
  tiktok text default '',
  free_shipping_threshold numeric(10,2) default 10000,
  free_shipping_enabled boolean default true,
  default_home_delivery_price numeric(10,2) default 600,
  default_desk_delivery_price numeric(10,2) default 400,
  checkout_notice text default 'الدفع عند الاستلام مع إمكانية فتح الطرد والمعاينة قبل الدفع.',
  announcement_bar text default '🌸 مرحباً بكم في متجرنا — شحن متوفر لكافة ولايات الجزائر 58 ولاية مع الدفع عند الاستلام',
  announcement_enabled boolean default true,
  updated_at timestamptz default now()
);

-- سياسات الأمان للقراءة والتحديث
alter table public.store_settings enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'store_settings' and policyname = 'Allow public read of store settings') then
    create policy "Allow public read of store settings" on public.store_settings for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'store_settings' and policyname = 'Allow all updates to store settings') then
    create policy "Allow all updates to store settings" on public.store_settings for all using (true) with check (true);
  end if;
end $$;

insert into public.store_settings (id) values ('default') on conflict (id) do nothing;
