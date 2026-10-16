'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ShoppingBag, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function CartDrawer({ isOpen, onClose, locale }: CartDrawerProps) {
  const isArabic = locale === 'ar';
  const currency = isArabic ? 'د.ج' : 'DA';
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const read = () => {
      try {
        const stored = localStorage.getItem('shopdz_wishlist');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setItems(parsed.slice(0, 4));
          }
        }
      } catch {
        setItems([]);
      }
    };
    if (isOpen) {
      read();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + (item.price || 0), 0);
  const deliveryEstimate = 600;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 end-0 max-w-full flex">
        <div className="w-screen max-w-md bg-[#F7F3EE] p-6 sm:p-8 flex flex-col justify-between shadow-2xl border-s border-[#E8E1D7]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E8E1D7] pb-4">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#141414] hover:bg-[#EFE8DE] transition-colors border border-[#E8E1D7]"
              aria-label="Close"
            >
              {isArabic ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
            </button>

            <h2 className="font-serif text-xl font-bold text-[#141414]">
              {isArabic ? 'سلة الطلبات' : 'Your Cart'}
            </h2>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#141414] border border-[#E8E1D7]">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto py-6 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <ShoppingBag className="mx-auto h-12 w-12 text-[#8A8275]/50" />
                <p className="text-sm font-semibold text-[#8A8275]">
                  {isArabic ? 'السلة فارغة حالياً' : 'Your cart is empty'}
                </p>
                <Link
                  href={`/${locale}/produits`}
                  onClick={onClose}
                  className="inline-block mt-2 rounded-full bg-[#141414] px-5 py-2 text-xs font-bold text-white hover:bg-[#B89368] transition-colors"
                >
                  {isArabic ? 'تصفح المنتجات' : 'Browse Products'}
                </Link>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 bg-white p-3.5 rounded-[20px] border border-[#E8E1D7]"
                >
                  <div className="relative h-20 w-16 flex-shrink-0 rounded-[14px] overflow-hidden bg-[#FAF7F2]">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1608228088998-57828365d486?w=400&q=80'}
                      alt={item.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-sm font-bold text-[#141414] truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#8A8275] mt-0.5">
                      {item.category || (isArabic ? 'حجابات' : 'Hijabs')}
                    </p>
                    <p className="text-sm font-extrabold text-[#141414] mt-1">
                      {(item.price || 0).toLocaleString()} {currency}
                    </p>
                  </div>

                  {/* Quantity Controller Pill (Matches Banda screenshot) */}
                  <div className="flex flex-col items-center bg-[#F7F3EE] rounded-full p-1 border border-[#E8E1D7]">
                    <button
                      type="button"
                      className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white text-[#141414]"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-bold text-[#141414] my-1">1</span>
                    <button
                      type="button"
                      className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white text-[#141414]"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          <div className="border-t border-[#E8E1D7] pt-5 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#8A8275]">
                <span>{isArabic ? 'المجموع الفرعي :' : 'Subtotal :'}</span>
                <span className="font-bold text-[#141414]">
                  {subtotal.toLocaleString()} {currency}
                </span>
              </div>
              <div className="flex justify-between text-[#8A8275]">
                <span>{isArabic ? 'توصيل لـ 58 ولاية :' : 'Delivery (58 Wilayas) :'}</span>
                <span className="font-bold text-[#141414]">
                  {deliveryEstimate.toLocaleString()} {currency}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-[#141414] pt-2 border-t border-[#E8E1D7]">
                <span>{isArabic ? 'المجموع الكلي :' : 'Total :'}</span>
                <span>{(subtotal + (items.length > 0 ? deliveryEstimate : 0)).toLocaleString()} {currency}</span>
              </div>
            </div>

            <Link
              href={`/${locale}/commande`}
              onClick={onClose}
              className="flex w-full items-center justify-center rounded-full bg-[#141414] py-4 px-6 text-sm font-bold text-white transition-all duration-200 hover:bg-[#B89368] shadow-lg"
            >
              {isArabic ? 'إتمام الطلب (الدفع عند الاستلام)' : 'Check Out (Cash on Delivery)'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
