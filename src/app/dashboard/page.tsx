import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';
import { LogOut, ShieldCheck } from 'lucide-react';
import { signOutAction } from '../actions';
import { getThumbnailPath } from '@/utils/thumbnail';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch certificates sorted by created_at descending
  const { data: certificates, error } = await supabase
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching certificates:', error.message);
  }

  // Pre-sign URLs for all certificates in bulk
  let certificatesWithUrls = certificates || [];
  if (certificates && certificates.length > 0) {
    const pathsToSign = certificates.flatMap((c) => [
      c.file_path,
      getThumbnailPath(c.file_path),
    ]);

    // Sign for 3600 seconds (1 hour)
    const { data: signedData, error: signError } = await supabase.storage
      .from('certificates')
      .createSignedUrls(pathsToSign, 3600);

    if (signError) {
      console.error('Error bulk signing private certificate URLs:', signError.message);
    } else if (signedData) {
      const urlMap = new Map<string, string>();
      signedData.forEach((item) => {
        if (item.path && item.signedUrl) {
          urlMap.set(item.path, item.signedUrl);
        }
      });

      certificatesWithUrls = certificates.map((c) => ({
        ...c,
        signedUrl: urlMap.get(c.file_path) || undefined,
        thumbnailUrl: urlMap.get(getThumbnailPath(c.file_path)) || undefined,
      }));
    }
  }

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
              <span className="hidden sm:inline-block ml-3 px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase border border-stone-200 text-stone-muted">
                Private Archive
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="hidden md:inline-block font-sans text-xs tracking-wide text-stone-muted">
              Archivist: <span className="text-stone-700 font-medium">{user.email}</span>
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex items-center gap-2 border border-stone-200 hover:border-stone-400 px-3.5 py-2 font-sans text-xs font-medium tracking-wider uppercase transition-colors cursor-pointer text-stone-700 hover:text-charcoal bg-white"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col">
        <DashboardClient
          user={user}
          initialCertificates={certificatesWithUrls}
          availableCategories={allCategories}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/50 py-6 text-center">
        <p className="font-sans text-[11px] tracking-wider text-stone-muted uppercase">
          Achieve — Secure, Single-User Archival System. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
