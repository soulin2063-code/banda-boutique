'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Package, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function SellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data?.session) {
        setError('Identifiants invalides. Vérifiez votre email et mot de passe.');
        return;
      }

      // Accept admin or seller roles
      const role = data.user?.app_metadata?.role as string | undefined;
      if (role !== 'admin' && role !== 'seller') {
        await supabase.auth.signOut();
        setError("Accès refusé. Ce compte n'a pas les droits vendeur.");
        return;
      }

      // Store session token via API (same endpoint as admin)
      const sessionRes = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: data.session.access_token }),
      });

      if (!sessionRes.ok) {
        const errData = await sessionRes.json().catch(() => ({}));
        setError(errData.error || 'Erreur lors de la création de la session.');
        return;
      }

      // Admins go to full admin dashboard; sellers go to seller panel
      if (role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/seller';
      }
    } catch (err) {
      console.error('[SellerLogin] Error:', err);
      setError('Erreur de connexion. Réessayez dans quelques instants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-500 shadow-lg shadow-amber-900/40 mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ShopDZ Vendeur</h1>
          <p className="text-sm text-stone-400 mt-1">Espace de gestion des commandes</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-6">Connexion à l&apos;espace vendeur</h2>

          {error && (
            <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
              <strong>⚠️</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-2">
                Adresse email
              </label>
              <input
                id="seller-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendeur@boutique.dz"
                required
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="seller-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 pe-12 text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="seller-login-submit"
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-900/30 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Se connecter</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-[11px] text-stone-500 text-center">
              🔒 Connexion sécurisée via Supabase Auth (HTTPS).
              <br />
              Session chiffrée — httpOnly cookie.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-stone-600 mt-4">
          <a href="/ar" className="text-amber-400 hover:text-amber-300">
            ← Voir la boutique
          </a>
        </p>
      </div>
    </div>
  );
}
