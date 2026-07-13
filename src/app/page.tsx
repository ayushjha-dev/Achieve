import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { ShieldCheck, Award, GraduationCap, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'Achieve — Digital Credentials Archive',
  description: 'A private and secure professional directory for verified qualifications, training, and achievements.',
};

export default async function Home() {
  const supabase = await createClient();
  
  // Check if user is logged in to show a dashboard shortcut (subtle admin link)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-sand flex flex-col font-sans relative overflow-hidden">
      {/* Decorative background grid line or circle */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e5e0_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center border border-stone-300 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <ShieldCheck className="w-4.5 h-4.5 text-primary stroke-[1.25]" />
          </div>
          <span className="font-serif text-xl font-light tracking-wide text-charcoal">
            Achieve
          </span>
        </div>

        {user && (
          <Link
            href="/dashboard"
            className="text-xs font-mono tracking-widest uppercase text-stone-muted hover:text-charcoal transition-colors border-b border-dashed border-stone-300 hover:border-charcoal pb-0.5"
          >
            Dashboard
          </Link>
        )}
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="space-y-8 max-w-3xl">
          {/* Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-stone-200 bg-white/60 backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-stone-muted">
              Verified Professional Vault
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="font-serif text-5xl sm:text-7xl font-extralight text-charcoal tracking-tight leading-[1.1]">
              Every milestone, <br />
              <span className="font-serif italic font-normal text-primary">verifiably preserved.</span>
            </h1>
            <p className="font-sans text-stone-muted text-base sm:text-lg max-w-xl leading-relaxed">
              Welcome to my digital repository. A secure, curated registry of professional certifications, technical qualifications, and academic milestones.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/certifications"
              className="group flex items-center justify-center gap-3 bg-primary hover:bg-primary-hover text-white px-8 py-4 font-sans text-xs font-semibold tracking-widest uppercase transition-all shadow-[0_4px_12px_rgba(30,58,47,0.15)] hover:translate-y-[-1px]"
            >
              <span>Explore Certifications</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-stone-200 mt-20 pt-10">
          <div className="flex gap-4">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center border border-stone-200 bg-white">
              <Award className="w-4 h-4 text-accent stroke-[1.5]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-light text-charcoal mb-1">Authentic Credentials</h3>
              <p className="font-sans text-xs text-stone-muted leading-relaxed">
                Direct access to high-fidelity copies, original documents, and secure verification tags.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center border border-stone-200 bg-white">
              <GraduationCap className="w-4 h-4 text-primary stroke-[1.5]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-light text-charcoal mb-1">Structured Directory</h3>
              <p className="font-sans text-xs text-stone-muted leading-relaxed">
                Filter and sort achievements across categories including cloud engineering, training, and academics.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-stone-200 bg-white/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-sans text-[11px] tracking-wider text-stone-muted uppercase">
            Achieve — Secure Professional Archive. All rights reserved.
          </p>
          <span className="font-mono text-[9px] tracking-widest text-stone-300 uppercase">
            Built for integrity
          </span>
        </div>
      </footer>
    </div>
  );
}
