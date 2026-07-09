'use client';

import React, { useState } from 'react';
import { signInAction } from '../actions';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await signInAction(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-sand">
      <div className="w-full max-w-md">
        {/* Editorial Logo/Mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 flex items-center justify-center border border-stone-300 bg-white mb-4">
            <ShieldCheck className="w-5 h-5 text-primary stroke-[1.25]" />
          </div>
          <h1 className="font-serif text-3xl font-light tracking-wide text-charcoal">
            Folio Vault
          </h1>
          <p className="font-sans text-xs tracking-widest uppercase text-stone-muted mt-2">
            Private Credential Archive
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-stone-200/80 px-8 py-10 shadow-[0_4px_24px_rgba(28,26,23,0.02)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block font-sans text-xs font-medium tracking-wider uppercase text-stone-600 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full bg-sand/50 border border-stone-200 px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-primary focus:bg-white transition-all font-sans rounded-none"
                placeholder="you@domain.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-sans text-xs font-medium tracking-wider uppercase text-stone-600 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full bg-sand/50 border border-stone-200 px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-primary focus:bg-white transition-all font-sans rounded-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50/50 border border-red-200/50 text-red-700 text-xs font-sans tracking-wide">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover text-white py-3.5 px-4 font-sans text-xs font-semibold tracking-widest uppercase transition-colors disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                {!loading && <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6">
          <p className="font-sans text-xs text-stone-muted">
            Access restricted to the system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
