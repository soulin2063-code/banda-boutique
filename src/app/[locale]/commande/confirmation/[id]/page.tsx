import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { setRequestLocale } from 'next-intl/server';
import { CheckCircle2, PhoneCall, Truck, MapPin, Package, ArrowRight, ArrowLeft } from 'lucide-react';

interface OrderConfirmationPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const { locale, id } = await params;

  if (!['ar', 'fr', 'en'].includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const isArabic = locale === 'ar';
  const currency = isArabic ? 'د.ج' : 'DA';

  // 1. Fetch order details scoped narrowly
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      status,
      subtotal,
      delivery_fee,
      total,
      created_at,
      payment_type,
      customers (
        full_name,
        phone
      ),
      addresses (
        wilaya_id,
        commune_id,
        address_text,
        delivery_type
      ),
      order_items (
        id,
        quantity,
        unit_price,
        product_variants (
          sku,
          products (
            slug,
            product_translations (
              locale,
              name
            )
          )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !order) {
    notFound();
  }

  // 2. Fetch Wilaya & Commune names
  const addr = order.addresses as {
    wilaya_id?: number;
    commune_id?: string;
    address_text?: string;
    delivery_type?: 'home' | 'desk';
  } | null;

  let wilayaName = `Wilaya ${addr?.wilaya_id || ''}`;
  let communeName = '';

  if (addr?.wilaya_id) {
    const { data: w } = await supabaseAdmin
      .from('wilayas')
      .select('name_ar, name_fr')
      .eq('id', addr.wilaya_id)
      .single();
    if (w) wilayaName = isArabic ? w.name_ar : w.name_fr;
  }

  if (addr?.commune_id) {
    const { data: c } = await supabaseAdmin
      .from('communes')
      .select('name_ar, name_fr')
      .eq('id', addr.commune_id)
      .single();
    if (c) communeName = isArabic ? c.name_ar : c.name_fr;
  }

  const cust = order.customers as { full_name?: string; phone?: string } | null;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Main Receipt Card */}
        <div className="rounded-xl bg-white p-6 sm:p-10 border border-slate-200 space-y-8">
          {/* Header Animation & Icon */}
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span>{isArabic ? 'تم تأكيد طلبك بنجاح' : 'Commande enregistrée avec succès'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-950">
              {isArabic ? 'شكراً لثقتكم بنا' : 'Merci pour votre commande'}
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              {isArabic
                ? `مرحباً بك ${cust?.full_name || ''}، تم تسجيل طلبك بنجاح وسيتصل بك أحد ممثلينا هاتفياً خلال ساعات لتأكيد العنوان وشحن الطرد.`
                : `Bonjour ${cust?.full_name || ''}, votre commande a bien été enregistrée. Notre équipe vous appellera sous peu pour confirmation.`}
            </p>
          </div>

          {/* Reference Banner */}
          <div className="rounded-xl bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
            <div>
              <span className="text-xs text-slate-400 block">
                {isArabic ? 'رقم تتبع الطلب :' : 'Numéro de référence :'}
              </span>
              <span className="font-mono text-lg sm:text-xl font-bold text-emerald-400">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300">
              <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isArabic ? 'في انتظار التأكيد الهاتفي' : 'En attente de confirmation'}</span>
            </div>
          </div>

          {/* Customer & Delivery Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-slate-200 p-4 space-y-2">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-emerald-600" />
                <span>{isArabic ? 'معلومات التوصيل' : 'Mode de livraison'}</span>
              </h3>
              <p className="font-semibold text-slate-800">
                {addr?.delivery_type === 'desk'
                  ? isArabic
                    ? 'استلام من المكتب (Stop Desk)'
                    : 'Récupération au Bureau (Stop Desk)'
                  : isArabic
                  ? 'توصيل لباب المنزل (Domicile)'
                  : 'Livraison à Domicile'}
              </p>
              <p className="text-slate-500 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  {wilayaName} {communeName ? `, ${communeName}` : ''}
                </span>
              </p>
              {addr?.address_text && <p className="text-slate-500">{addr.address_text}</p>}
            </div>

            <div className="rounded-xl border border-slate-200 p-4 space-y-2">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="h-4 w-4 text-emerald-600" />
                <span>{isArabic ? 'بيانات المستلم' : 'Destinataire'}</span>
              </h3>
              <p className="font-semibold text-slate-800">{cust?.full_name}</p>
              <p className="font-mono text-slate-600 font-semibold">{cust?.phone}</p>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                <span>{isArabic ? 'الدفع نقداً عند الاستلام' : 'Paiement à la livraison'}</span>
              </div>
            </div>
          </div>

          {/* Ordered Items List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {isArabic ? 'المنتجات المطلوبة :' : 'Articles commandés :'}
            </h3>
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50/50 p-2 sm:p-4">
              {order.order_items.map((item: any) => {
                const prod = item.product_variants?.products;
                const pName =
                  prod?.product_translations?.find((t: any) => t.locale === locale)?.name ||
                  prod?.product_translations?.find((t: any) => t.locale === 'fr')?.name ||
                  prod?.slug ||
                  'Article';

                return (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{pName}</span>
                      <div className="text-slate-500 mt-0.5">
                        {item.quantity} × {item.unit_price.toLocaleString()} {currency}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {(item.quantity * item.unit_price).toLocaleString()} {currency}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="rounded-2xl bg-slate-50 p-5 border border-slate-200 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>{isArabic ? 'المجموع الفرعي :' : 'Sous-total :'}</span>
              <span className="font-mono font-semibold">
                {order.subtotal.toLocaleString()} {currency}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{isArabic ? 'تكلفة التوصيل :' : 'Frais de livraison :'}</span>
              <span className="font-mono font-semibold">
                {order.delivery_fee.toLocaleString()} {currency}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline font-black">
              <span className="text-base text-slate-900">
                {isArabic ? 'المبلغ المستحق عند الاستلام :' : 'Total à régler à la livraison :'}
              </span>
              <span className="text-2xl text-emerald-700 font-mono">
                {order.total.toLocaleString()} {currency}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={`/${locale}/produits`}
              className="flex-1 rounded-xl bg-emerald-600 py-3.5 px-6 text-center text-sm font-semibold text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>{isArabic ? 'متابعة التسوق' : 'Continuer mes achats'}</span>
              {isArabic ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </Link>

            <Link
              href={`/${locale}`}
              className="rounded-xl border border-slate-300 py-3.5 px-6 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {isArabic ? 'العودة للرئيسية' : 'Retour à l’accueil'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
