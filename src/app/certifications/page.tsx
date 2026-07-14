import { createAdminClient } from '@/utils/supabase/server';
import CertificationsClient from './certifications-client';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { getThumbnailPath } from '@/utils/thumbnail';

export const metadata = {
  title: 'Certifications | Achieve',
  description: 'Verified professional certifications and credentials.',
};

export default async function CertificationsPage() {
  const supabase = await createAdminClient();

  // Fetch certificates sorted by created_at descending
  const { data: certificates, error } = await supabase
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching public certificates:', error.message);
  }

  // Group certificates by user_id to query storage contents in bulk
  const uniqueUserIds = Array.from(new Set((certificates || []).map(c => c.user_id)));
  
  // Fetch file list for each unique user folder to check if thumbnails actually exist in storage
  const storageFilesMap = new Map<string, Set<string>>();
  for (const uid of uniqueUserIds) {
    const { data: files } = await supabase.storage.from('certificates').list(uid, { limit: 1000 });
    if (files) {
      storageFilesMap.set(uid, new Set(files.map(f => f.name)));
    }
  }

  // Generate public URLs for all certificates (synchronous & fast)
  const certificatesWithUrls = (certificates || []).map((c) => {
    const fileUrl = supabase.storage.from('certificates').getPublicUrl(c.file_path).data.publicUrl;
    
    // Check if the thumbnail file actually exists in storage
    const thumbFilename = getThumbnailPath(c.file_path).split('/').pop() || '';
    const userFilesSet = storageFilesMap.get(c.user_id);
    const hasThumbnail = userFilesSet ? userFilesSet.has(thumbFilename) : false;

    const thumbnailUrl = hasThumbnail
      ? supabase.storage.from('certificates').getPublicUrl(getThumbnailPath(c.file_path)).data.publicUrl
      : undefined;

    return {
      ...c,
      signedUrl: fileUrl,
      thumbnailUrl,
    };
  });

  // Extract unique categories (filtering out nulls/empty strings)
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
    <div className="min-h-screen bg-sand flex flex-col font-sans">
      {/* Editorial Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center border border-stone-300 bg-sand">
              <ShieldCheck className="w-4 h-4 text-primary stroke-[1.25]" />
            </div>
            <div>
              <span className="font-serif text-xl font-light tracking-wide text-charcoal">
                Achieve
              </span>
              <span className="ml-3 px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase border border-stone-200 text-stone-muted">
                Public Directory
              </span>
            </div>
          </div>

          <div>
            <Link
              href="/login"
              className="text-xs font-sans font-medium tracking-wider uppercase text-stone-muted hover:text-charcoal transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col">
        <div className="mb-10 pb-6 border-b border-stone-200">
          <h1 className="font-serif text-4xl sm:text-5xl font-extralight text-charcoal tracking-tight mb-3">
            Professional Credentials
          </h1>
          <p className="font-sans text-stone-muted text-sm sm:text-base max-w-2xl leading-relaxed">
            A verified collection of professional qualifications, training achievements, and academic credentials.
          </p>
        </div>

        <CertificationsClient
          initialCertificates={certificatesWithUrls}
          availableCategories={allCategories}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/50 py-6 text-center">
        <p className="font-sans text-[11px] tracking-wider text-stone-muted uppercase">
          Achieve — Professional Archival Directory. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
