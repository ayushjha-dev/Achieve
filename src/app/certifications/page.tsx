import { createAdminClient } from '@/utils/supabase/server';
import CertificationsClient from './certifications-client';
import { ShieldCheck, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { getThumbnailPath } from '@/utils/thumbnail';

export const metadata = {
  title: 'Certifications | Achieve',
  description: 'Verified professional certifications and credentials.',
};

export default async function CertificationsPage() {
  const supabase = await createAdminClient();

  const { data: certificates, error } = await supabase
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching public certificates:', error.message);
  }

  const uniqueUserIds = Array.from(new Set((certificates || []).map((c) => c.user_id)));

  const storageFilesMap = new Map<string, Set<string>>();
  for (const uid of uniqueUserIds) {
    const { data: files } = await supabase.storage.from('certificates').list(uid, { limit: 1000 });
    if (files) {
      storageFilesMap.set(uid, new Set(files.map((f) => f.name)));
    }
  }

  const certificatesWithUrls = (certificates || []).map((c) => {
    const fileUrl = supabase.storage.from('certificates').getPublicUrl(c.file_path).data.publicUrl;
    const thumbFilename = getThumbnailPath(c.file_path).split('/').pop() || '';
    const userFilesSet = storageFilesMap.get(c.user_id);
    const hasThumbnail = userFilesSet ? userFilesSet.has(thumbFilename) : false;
    const thumbnailUrl = hasThumbnail
      ? supabase.storage.from('certificates').getPublicUrl(getThumbnailPath(c.file_path)).data.publicUrl
      : undefined;
    return { ...c, signedUrl: fileUrl, thumbnailUrl };
  });

  const allCategories = certificatesWithUrls
    ? Array.from(
        new Set(
          certificatesWithUrls
            .map((c) => c.category?.trim())
            .filter((c): c is string => !!c)
        )
      )
    : [];

  return (
    <div className="min-h-screen bg-[#0D1F18] flex flex-col font-sans relative overflow-hidden">

      {/* ── Ambient glows ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-60 w-[600px] h-[600px] rounded-full bg-[#1E3A2F] opacity-50 blur-[130px]" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-[#C85A32] opacity-[0.07] blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] rounded-full bg-[#1E3A2F] opacity-30 blur-[100px]" />
      </div>

      {/* ── Grid ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(#FAF9F5 1px, transparent 1px), linear-gradient(90deg, #FAF9F5 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Header ── */}
      <header className="relative z-20 border-b border-white/5 bg-[#0D1F18]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-xl border border-[#C85A32]/40 group-hover:border-[#C85A32]/70 transition-colors duration-500" />
              <div className="absolute inset-[3px] rounded-[10px] bg-gradient-to-br from-[#1E3A2F] to-[#0D1F18] border border-white/5" />
              <ShieldCheck className="relative w-5 h-5 text-[#C85A32] stroke-[1.5]" />
            </div>
            <div>
              <span className="font-serif text-xl font-light tracking-wide text-[#FAF9F5]">Achieve</span>
              <div className="h-px w-0 group-hover:w-full bg-gradient-to-r from-[#C85A32] to-transparent transition-all duration-500" />
            </div>
          </Link>

          <div className="flex items-center gap-5">
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#C85A32]/25 bg-[#C85A32]/10 font-mono text-[10px] tracking-[0.18em] uppercase text-[#C85A32]">
              Public Directory
            </span>
            <Link
              href="/login"
              className="text-xs font-mono tracking-widest uppercase text-[#78716C] hover:text-[#FAF9F5] transition-colors duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 lg:px-10 py-14 flex flex-col gap-10">

        {/* Page heading */}
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04]">
            <GitBranch className="w-3 h-3 text-[#C85A32]" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#78716C]">
              Verified Archive
            </span>
          </div>

          <div>
            <h1 className="font-serif text-5xl sm:text-6xl font-extralight text-[#FAF9F5] tracking-tight leading-[1.08]">
              Professional
              <span className="font-serif italic font-light text-transparent bg-clip-text bg-gradient-to-r from-[#C85A32] to-[#E07B55]">
                {' '}Credentials
              </span>
            </h1>
            <p className="mt-4 font-sans text-[#78716C] text-sm sm:text-base max-w-2xl leading-relaxed">
              A verified collection of professional qualifications, training achievements, and academic credentials — all in one secure archive.
            </p>
          </div>

          {/* Stats strip */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#78716C]">Live & Updated</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#78716C]">
              {certificatesWithUrls.length} Credentials
            </span>
          </div>
        </div>

        {/* Client component */}
        <CertificationsClient
          initialCertificates={certificatesWithUrls}
          availableCategories={allCategories}
        />
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-[#1E3A2F] border border-[#C85A32]/30 flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-[#C85A32]" />
            </div>
            <p className="font-sans text-[11px] tracking-wider text-[#78716C] uppercase">
              Achieve — Professional Archival Directory
            </p>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-[#78716C]/50 uppercase">
            <GitBranch className="w-3 h-3" />
            Built for integrity
          </div>
        </div>
      </footer>
    </div>
  );
}
