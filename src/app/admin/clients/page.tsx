'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  Search,
  UserCheck,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  phone: string;
  full_name: string;
  email: string | null;
  created_at: string;
}

export default function AdminClientsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/customers');
        if (!res.ok) throw new Error('فشل تحميل قائمة الزبائن');
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'خطأ في جلب بيانات الزبائن');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email || '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            قاعدة بيانات الزبائن
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            سجل العملاء والمشترين عبر المتجر مع معلومات الاتصال وسجل المشتريات.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 text-xs font-bold text-indigo-700 self-start sm:self-auto">
          <UserCheck className="h-4 w-4" />
          <span>{customers.length} زبون مسجل</span>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-800 border border-rose-200">
          {error}
        </div>
      )}

      {/* ── SEARCH INPUT ───────────────────────────────────────────── */}
      <div className="relative">
        <Search className="h-4 w-4 text-slate-400 absolute right-3.5 top-3" />
        <input
          type="text"
          placeholder="ابحث بالاسم، رقم الهاتف، أو البريد الإلكتروني..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[44px]"
        />
      </div>

      {/* ── CUSTOMERS LIST ─────────────────────────────────────────── */}
      <div className="bg-white shadow-xs rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/60 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-900">
            قائمة الزبائن ({filtered.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            يتم تسجيل بيانات العميل تلقائياً عند أول طلب
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-slate-100 animate-pulse w-full"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-900">
              {search ? 'لا يوجد زبون يطابق البحث' : 'لا يوجد زبائن مسجلون بعد'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              تظهر بيانات العملاء هنا فور قيامهم بالطلب من واجهة المتجر.
            </p>
          </div>
        ) : (
          <>
            {/* ── DESKTOP TABLE ────────────────────────────────────────── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">الزبون</th>
                    <th className="px-5 py-3.5">الهاتف والاتصال</th>
                    <th className="px-5 py-3.5">البريد الإلكتروني</th>
                    <th className="px-5 py-3.5">تاريخ التسجيل</th>
                    <th className="px-5 py-3.5 text-left">الطلبيات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.map((c) => {
                    const phoneClean = c.phone?.replace(/\D/g, '') || '';
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">{c.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            #{c.id.slice(0, 8)}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${c.phone}`}
                              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                              title="اتصال مباشر"
                            >
                              <Phone className="h-3 w-3 text-slate-500" />
                              <span>{c.phone}</span>
                            </a>
                            <a
                              href={`https://wa.me/213${phoneClean.slice(-9)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              title="مراسلة واتساب"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 font-mono text-slate-600">
                          {c.email || <span className="text-slate-300">—</span>}
                        </td>

                        <td className="px-5 py-3.5 text-slate-500 font-mono">
                          {new Date(c.created_at).toLocaleDateString('ar-DZ', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="px-5 py-3.5 text-left">
                          <Link
                            href={`/admin/commandes?search=${c.phone}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            <ShoppingBag className="h-3.5 w-3.5" />
                            <span>طلبات الزبون</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── MOBILE COMPACT CARDS ─────────────────────────────────── */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((c) => {
                const phoneClean = c.phone?.replace(/\D/g, '') || '';
                return (
                  <div key={c.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-sm">
                        {c.full_name}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(c.created_at).toLocaleDateString('ar-DZ', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {c.email && (
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                    )}

                    {/* Touch Action Buttons (>= 44px) */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${c.phone}`}
                        className="flex-1 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Phone className="h-4 w-4 text-slate-600" />
                        <span>{c.phone}</span>
                      </a>

                      <a
                        href={`https://wa.me/213${phoneClean.slice(-9)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] px-3.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        title="واتساب"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>

                      <Link
                        href={`/admin/commandes?search=${c.phone}`}
                        className="min-h-[44px] px-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold text-xs flex items-center justify-center gap-1"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>الطلبات</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
