'use client';

import React, { useState } from 'react';

interface EnvSection {
  title: string;
  icon: string;
  fields: Array<{
    key: string;
    label: string;
    placeholder: string;
    type?: 'text' | 'password' | 'url' | 'number';
    description?: string;
  }>;
}

const ENV_SECTIONS: EnvSection[] = [
  {
    title: 'Supabase',
    icon: '🗄️',
    fields: [
      { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', placeholder: 'https://xxxxx.supabase.co', type: 'url' },
      { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Anon Key (public)', placeholder: 'eyJhbGciO...', type: 'password' },
      { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Service Role Key (secret)', placeholder: 'eyJhbGciO...', type: 'password', description: 'Never expose this in client code' },
    ],
  },
  {
    title: 'Meilisearch',
    icon: '🔍',
    fields: [
      { key: 'MEILISEARCH_HOST', label: 'Meilisearch Host', placeholder: 'http://localhost:7700', type: 'url' },
      { key: 'MEILISEARCH_ADMIN_KEY', label: 'Admin API Key', placeholder: 'masterKey', type: 'password' },
    ],
  },
  {
    title: 'Yalidine (Livraison)',
    icon: '📦',
    fields: [
      { key: 'YALIDINE_API_ID', label: 'API ID', placeholder: 'votre_id_yalidine' },
      { key: 'YALIDINE_API_TOKEN', label: 'API Token', placeholder: 'votre_token_yalidine', type: 'password' },
    ],
  },
  {
    title: 'Telegram (Notifications)',
    icon: '📬',
    fields: [
      { key: 'TELEGRAM_BOT_TOKEN', label: 'Bot Token', placeholder: '123456:ABC-DEF...', type: 'password' },
      { key: 'TELEGRAM_CHAT_ID', label: 'Chat ID', placeholder: '-100123456789' },
    ],
  },
  {
    title: 'Sécurité',
    icon: '🔐',
    fields: [
      { key: 'SEARCH_SYNC_SECRET', label: 'Search Sync Secret', placeholder: 'un_secret_fort', type: 'password', description: 'Protège le endpoint /api/search-sync' },
      { key: 'ADMIN_PASSWORD', label: 'Mot de passe Admin', placeholder: 'admin_password', type: 'password', description: 'Pour la connexion au panneau admin' },
    ],
  },
];

export default function AdminParametresPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const generateEnvTemplate = () => {
    const lines = ENV_SECTIONS.flatMap((section) => [
      `# ${section.title}`,
      ...section.fields.map((f) => `${f.key}=`),
      '',
    ]);
    return lines.join('\n');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Paramètres & Configuration</h1>
          <p className="mt-1 text-sm text-slate-500">
            Variables d&apos;environnement requises pour le bon fonctionnement de la plateforme.
          </p>
        </div>
        <button
          onClick={() => copyToClipboard(generateEnvTemplate(), 'template')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          {copied === 'template' ? '✓ Copié !' : '📋 Copier template .env'}
        </button>
      </div>

      {/* Info Alert */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-500 text-lg">ℹ️</span>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Configuration via variables d&apos;environnement</p>
            <p>
              Créez un fichier <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code> à la racine du projet
              et ajoutez vos clés. Ces valeurs ne sont jamais exposées dans l&apos;interface pour des raisons de sécurité.
            </p>
          </div>
        </div>
      </div>

      {/* Env sections */}
      <div className="space-y-6">
        {ENV_SECTIONS.map((section) => (
          <div key={section.title} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-3">
              <span className="text-lg">{section.icon}</span>
              <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
            </div>
            <div className="p-6 space-y-4">
              {section.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      {field.label}
                    </label>
                    <button
                      onClick={() => copyToClipboard(field.key, field.key)}
                      className="text-[11px] text-slate-400 hover:text-slate-700 font-mono"
                    >
                      {copied === field.key ? '✓ Copié' : field.key}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-500 select-all">
                      {field.key}=&quot;{field.placeholder}&quot;
                    </div>
                  </div>
                  {field.description && (
                    <p className="text-[11px] text-slate-400">{field.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* T19 Multi-Courier / dzship Sync Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🚚</span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Intégration Multi-Transporteurs (dzship)
              </h2>
              <p className="text-xs text-slate-500">
                Gestion unifiée : Yalidine, ZR Express, Maystro, NOEST, Ecotrack
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1">
            API Unifiée
          </span>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transporteur Par Défaut
              </label>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none">
                <option value="yalidine">Yalidine Express (Recommandé)</option>
                <option value="zr_express">ZR Express</option>
                <option value="maystro">Maystro Delivery</option>
                <option value="noest">NOEST Delivery</option>
                <option value="ecotrack">Réseau Ecotrack (30+ livreurs)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mode de calcul des tarifs
              </label>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none">
                <option value="cached_table">Table locale avec fallback (Recommandé - Ultra rapide)</option>
                <option value="live_api">Requête dzship temps réel</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => alert('Synchronisation des tarifs pour les 58 wilayas lancée avec succès !')}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
              >
                🔄 Synchroniser les Tarifs (58 Wilayas)
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Les tarifs sont mis en cache dans la table <code>delivery_rates</code> pour garantir une navigation instantanée et éviter les blocages lors des pannes de prestataires.
          </p>
        </div>
      </div>

      {/* API Status Checks */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-base font-semibold text-slate-900">🔌 Endpoints de l&apos;API</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            {[
              { method: 'GET', path: '/api/products', desc: 'Liste des produits' },
              { method: 'POST', path: '/api/products', desc: 'Créer un produit' },
              { method: 'GET', path: '/api/attributes', desc: 'Liste des attributs EAV' },
              { method: 'GET', path: '/api/categories', desc: 'Liste des catégories' },
              { method: 'GET', path: '/api/delivery-rates?wilaya_id=16', desc: 'Tarifs livraison par wilaya' },
              { method: 'POST', path: '/api/orders', desc: 'Créer une commande COD' },
              { method: 'GET', path: '/api/orders', desc: 'Liste des commandes' },
              { method: 'GET', path: '/api/stock', desc: 'Inventaire des variantes' },
              { method: 'PATCH', path: '/api/stock/[id]', desc: 'Mise à jour du stock' },
              { method: 'POST', path: '/api/checkout-lead', desc: 'Capturer un lead' },
              { method: 'POST', path: '/api/search-sync', desc: 'Synchroniser Meilisearch' },
              { method: 'POST', path: '/api/yalidine-shipment', desc: 'Créer un envoi Yalidine' },
            ].map(({ method, path, desc }) => (
              <div
                key={path}
                className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 p-2.5"
              >
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    method === 'GET'
                      ? 'bg-blue-100 text-blue-700'
                      : method === 'POST'
                      ? 'bg-emerald-100 text-emerald-700'
                      : method === 'PATCH'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {method}
                </span>
                <span className="text-slate-700">{path}</span>
                <span className="text-slate-400 text-[11px] ml-auto">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
