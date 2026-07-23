import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  GraduationCap,
  ChevronRight,
  GitBranch,
  Star,
  Layers,
  Lock,
  Sparkles,
} from 'lucide-react';

export const metadata = {
  title: 'Achieve — Digital Credentials Archive',
  description:
    'A private and secure professional directory for verified qualifications, training, and achievements.',
};

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#0D1F18] flex flex-col font-sans relative overflow-hidden">

      {/* ── Ambient glow blobs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[640px] h-[640px] rounded-full bg-[#1E3A2F] opacity-60 blur-[120px]" />
        <div className="absolute top-1/2 -right-60 w-[500px] h-[500px] rounded-full bg-[#C85A32] opacity-10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-[#1E3A2F] opacity-40 blur-[100px]" />
      </div>

      {/* ── Subtle grid overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#FAF9F5 1px, transparent 1px), linear-gradient(90deg, #FAF9F5 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Floating particles ── */}
      <div className="pointer-events-none absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#C85A32] animate-ping"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              top: `${5 + i * 4.5}%`,
              left: `${3 + i * 4.8}%`,
              opacity: 0.06 + (i % 5) * 0.015,
              animationDuration: `${3 + (i % 4)}s`,
              animationDelay: `${(i % 5) * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════ */}
      <header className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-xl border border-[#C85A32]/40 group-hover:border-[#C85A32]/80 transition-colors duration-500" />
            <div className="absolute inset-[3px] rounded-[10px] bg-gradient-to-br from-[#1E3A2F] to-[#0D1F18] border border-white/5" />
            <ShieldCheck className="relative w-5 h-5 text-[#C85A32] stroke-[1.5]" />
          </div>
          <div>
            <span className="font-serif text-xl font-light tracking-wide text-[#FAF9F5]">
              Achieve
            </span>
            <div className="h-px w-0 group-hover:w-full bg-gradient-to-r from-[#C85A32] to-transparent transition-all duration-500" />
          </div>
        </div>

        {/* Nav right */}
        <nav className="flex items-center gap-6">
          <Link
            href="/certifications"
            className="text-xs font-mono tracking-widest uppercase text-[#78716C] hover:text-[#FAF9F5] transition-colors duration-300"
          >
            Credentials
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-xs font-mono tracking-widest uppercase text-[#FAF9F5] hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Dashboard
            </Link>
          )}
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════ */}
      <main className="relative z-10 flex-1 flex flex-col">
        <section className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* ── Left: Copy ── */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#C85A32]/30 bg-[#C85A32]/10 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-[#C85A32]" />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#C85A32]">
                  Verified Professional Vault
                </span>
              </div>

              {/* Heading */}
              <div className="space-y-3">
                <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-extralight text-[#FAF9F5] tracking-tight leading-[1.05]">
                  Every
                  <br />
                  milestone,
                </h1>
                <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-light italic text-transparent bg-clip-text bg-gradient-to-r from-[#C85A32] via-[#E07B55] to-[#C85A32] leading-[1.05]">
                  preserved.
                </h1>
              </div>

              {/* Description */}
              <p className="text-[#78716C] text-base sm:text-lg leading-relaxed max-w-md">
                A secure, curated registry of professional certifications,
                technical qualifications, and academic milestones —
                <span className="text-[#FAF9F5]/70"> built for integrity.</span>
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  id="explore-cta"
                  href="/certifications"
                  className="group relative flex items-center justify-center gap-3 px-8 py-4 overflow-hidden rounded-xl font-sans text-xs font-semibold tracking-widest uppercase text-[#FAF9F5] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {/* Button background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A2F] to-[#2A5240] transition-all duration-300 group-hover:from-[#2A5240] group-hover:to-[#1E3A2F]" />
                  <div className="absolute inset-0 rounded-xl border border-[#C85A32]/30 group-hover:border-[#C85A32]/60 transition-colors duration-300" />
                  {/* Shimmer */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700" />
                  <span className="relative">Explore Credentials</span>
                  <ChevronRight className="relative w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <a
                  href="#features"
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-xs font-mono tracking-widest uppercase text-[#78716C] hover:text-[#FAF9F5] hover:border-white/20 hover:bg-white/5 transition-all duration-300"
                >
                  Learn more
                </a>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-8 pt-4 border-t border-white/5">
                <div>
                  <div className="font-serif text-3xl font-light text-[#FAF9F5]">50+</div>
                  <div className="font-mono text-[10px] tracking-widest text-[#78716C] uppercase mt-0.5">Certifications</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <div className="font-serif text-3xl font-light text-[#FAF9F5]">100%</div>
                  <div className="font-mono text-[10px] tracking-widest text-[#78716C] uppercase mt-0.5">Verified</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <div className="font-serif text-3xl font-light text-[#FAF9F5]">∞</div>
                  <div className="font-mono text-[10px] tracking-widest text-[#78716C] uppercase mt-0.5">Integrity</div>
                </div>
              </div>
            </div>

            {/* ── Right: Visual card ── */}
            <div className="relative hidden lg:flex items-center justify-center">
              {/* Outer glow ring */}
              <div className="absolute w-[420px] h-[420px] rounded-full border border-[#C85A32]/10 animate-spin" style={{ animationDuration: '20s' }} />
              <div className="absolute w-[340px] h-[340px] rounded-full border border-[#1E3A2F]/60 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />

              {/* Main card */}
              <div className="relative w-[300px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl shadow-[0_0_80px_rgba(30,58,47,0.4)] p-6 space-y-5">
                {/* Card header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#1E3A2F] border border-[#C85A32]/30 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-[#C85A32]" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#FAF9F5]">Credential Vault</div>
                      <div className="text-[10px] text-[#78716C]">Active & Verified</div>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Cert rows */}
                {[
                  { icon: Award, label: 'AWS Solutions Architect', tag: 'Cloud', color: '#C85A32' },
                  { icon: GitBranch, label: 'GitHub Actions CI/CD', tag: 'DevOps', color: '#4E7C5F' },
                  { icon: GraduationCap, label: 'B.Tech Computer Science', tag: 'Academic', color: '#C85A32' },
                  { icon: Layers, label: 'Google Cloud Professional', tag: 'Cloud', color: '#4E7C5F' },
                  { icon: Star, label: 'React Advanced Patterns', tag: 'Frontend', color: '#C85A32' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 group/row">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.color}20`, border: `1px solid ${item.color}30` }}
                    >
                      <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-[#FAF9F5] truncate">{item.label}</div>
                    </div>
                    <span
                      className="text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded"
                      style={{ color: item.color, backgroundColor: `${item.color}15` }}
                    >
                      {item.tag}
                    </span>
                  </div>
                ))}

                {/* Bottom */}
                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#78716C] font-mono tracking-wider">SECURED WITH</span>
                    <span className="flex items-center gap-1 text-[#FAF9F5]/50">
                      <Lock className="w-2.5 h-2.5" /> End-to-end
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating badge top-right */}
              <div className="absolute -top-4 -right-4 px-3 py-1.5 rounded-full bg-[#C85A32] text-[10px] font-mono tracking-widest uppercase text-white shadow-[0_4px_20px_rgba(200,90,50,0.4)]">
                React + Git
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            FEATURES SECTION
        ═══════════════════════════════════════════════ */}
        <section id="features" className="relative z-10 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
            {/* Section label */}
            <div className="flex items-center gap-4 mb-14">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#78716C]">Why Achieve</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Authentic Credentials',
                  description:
                    'Direct access to high-fidelity copies, original documents, and secure verification tags.',
                  accent: '#C85A32',
                },
                {
                  icon: Layers,
                  title: 'Structured Directory',
                  description:
                    'Filter and sort achievements across categories including cloud engineering, training, and academics.',
                  accent: '#4E7C5F',
                },
                {
                  icon: Lock,
                  title: 'Private & Secure',
                  description:
                    'Your credentials are hosted on a hardened platform. Only what you share is visible.',
                  accent: '#C85A32',
                },
                {
                  icon: GitBranch,
                  title: 'Git-Powered Workflow',
                  description:
                    'Version-controlled credential management. Every update is tracked with full history.',
                  accent: '#4E7C5F',
                },
                {
                  icon: Star,
                  title: 'Premium Presentation',
                  description:
                    'Beautifully formatted credential pages that impress recruiters and stakeholders.',
                  accent: '#C85A32',
                },
                {
                  icon: GraduationCap,
                  title: 'Multi-domain Coverage',
                  description:
                    'From cloud to frontend to academia — a single source of truth for your entire career.',
                  accent: '#4E7C5F',
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500 overflow-hidden"
                >
                  {/* Hover gradient */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at 0% 0%, ${feature.accent}08 0%, transparent 70%)`,
                    }}
                  />

                  {/* Icon */}
                  <div
                    className="relative w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${feature.accent}15`, border: `1px solid ${feature.accent}25` }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: feature.accent }} />
                  </div>

                  {/* Text */}
                  <h3 className="relative font-serif text-lg font-light text-[#FAF9F5] mb-2">
                    {feature.title}
                  </h3>
                  <p className="relative text-xs text-[#78716C] leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Bottom line */}
                  <div
                    className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-500"
                    style={{ background: `linear-gradient(to right, ${feature.accent}60, transparent)` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            CTA BANNER
        ═══════════════════════════════════════════════ */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pb-24">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#1E3A2F]/80 to-[#0D1F18]/80 backdrop-blur-xl p-12 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,90,50,0.08)_0%,transparent_70%)]" />
            <div className="relative space-y-6">
              <h2 className="font-serif text-4xl sm:text-5xl font-extralight text-[#FAF9F5]">
                Ready to explore?
              </h2>
              <p className="text-[#78716C] text-sm max-w-md mx-auto leading-relaxed">
                Browse the complete archive of verified credentials, certificates, and professional milestones.
              </p>
              <Link
                id="cta-bottom"
                href="/certifications"
                className="inline-flex items-center gap-3 px-10 py-4 rounded-xl bg-[#C85A32] hover:bg-[#B34A25] text-white text-xs font-semibold tracking-widest uppercase transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(200,90,50,0.35)] active:scale-[0.98]"
              >
                View All Credentials
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-[#1E3A2F] border border-[#C85A32]/30 flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-[#C85A32]" />
            </div>
            <p className="font-sans text-[11px] tracking-wider text-[#78716C] uppercase">
              Achieve — Secure Professional Archive
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-[#78716C]/60 uppercase">
              <GitBranch className="w-3 h-3" />
              Built for integrity
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
