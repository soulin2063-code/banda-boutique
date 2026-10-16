'use client';

import React, { useState, useEffect } from 'react';

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
        if (!res.ok) throw new Error('Failed to load customers');
        const data = await res.json();
        setCustomers(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading customers');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Base Clients</h1>
          <p className="mt-1 text-sm text-slate-500">
            {customers.length} client(s) enregistrés dans la base de données.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-emerald-600 focus:outline-none shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-base font-semibold text-slate-900">
            Clients ({filtered.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Chargement des clients...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-base font-medium text-slate-900">
              {search ? 'Aucun client trouvé pour cette recherche' : 'Aucun client enregistré'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Les clients s&apos;enregistrent automatiquement lors de leur première commande.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Téléphone</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Inscrit le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{c.full_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{c.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`tel:${c.phone}`}
                        className="text-emerald-700 font-semibold hover:underline"
                      >
                        {c.phone}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {c.email || <span className="italic text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {new Date(c.created_at).toLocaleDateString('fr-DZ', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
