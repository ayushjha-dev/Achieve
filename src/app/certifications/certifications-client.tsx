'use client';

import React, { useState, useMemo } from 'react';
import {
  getPublicDownloadUrlAction,
  saveThumbnailAction,
} from '../actions';
import {
  Search,
  FileText,
  Download,
  Eye,
  X,
  Calendar,
  Loader2,
  ExternalLink,
  Building2,
  SlidersHorizontal,
  Award,
} from 'lucide-react';

// ─────────────────────────────────────────────
// PDF Preview Hook
// ─────────────────────────────────────────────
function usePdfPreview(pdfUrl: string | null | undefined): {
  dataUrl: string | null;
  loading: boolean;
  error: boolean;
} {
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setDataUrl(null);

    (async () => {
      try {
        const CDN_JS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
        const CDN_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

        if (!(window as any).pdfjsLib) {
          await new Promise<void>((res, rej) => {
            const s = document.createElement('script');
            s.src = CDN_JS;
            s.onload = () => res();
            s.onerror = () => rej(new Error('PDF.js load failed'));
            document.head.appendChild(s);
          });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_WORKER;

        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const viewport0 = page.getViewport({ scale: 1.0 });
        const scale = 480 / viewport0.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No 2D context');

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;

        setDataUrl(canvas.toDataURL('image/jpeg', 0.88));
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [pdfUrl]);

  return { dataUrl, loading, error };
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Certificate {
  id: string;
  user_id: string;
  title: string;
  organization: string | null;
  category: string | null;
  issue_date: string | null;
  file_path: string;
  file_type: string;
  created_at: string;
  signedUrl?: string;
  thumbnailUrl?: string;
}

interface CertificationsClientProps {
  initialCertificates: Certificate[];
  availableCategories: string[];
}

// Category accent colors
const CATEGORY_COLORS: Record<string, string> = {
  cloud: '#4E9AF1',
  devops: '#7C6AF7',
  frontend: '#C85A32',
  backend: '#4EC9B0',
  academic: '#E6A817',
  security: '#E85D6B',
  data: '#56B87E',
};
function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? '#C85A32';
}

// ─────────────────────────────────────────────
// Main Client Component
// ─────────────────────────────────────────────
export default function CertificationsClient({
  initialCertificates,
  availableCategories,
}: CertificationsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    title: string;
    type: string;
  } | null>(null);
  const [busyCertificateIds, setBusyCertificateIds] = useState<Record<string, 'download' | boolean>>({});

  const filteredCertificates = useMemo(() => {
    return initialCertificates.filter((cert) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        cert.title.toLowerCase().includes(q) ||
        (cert.category && cert.category.toLowerCase().includes(q)) ||
        (cert.organization && cert.organization.toLowerCase().includes(q));
      const matchesCategory =
        !selectedCategory ||
        cert.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [initialCertificates, searchQuery, selectedCategory]);

  const handleDownload = async (cert: Certificate) => {
    setBusyCertificateIds((prev) => ({ ...prev, [cert.id]: 'download' }));
    try {
      const fileExt = cert.file_path.split('.').pop() || '';
      const formattedFilename = `${cert.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
      const res = await getPublicDownloadUrlAction(cert.file_path, formattedFilename);
      if (res.error) { alert(`Download failed: ${res.error}`); return; }
      if (res.signedUrl) {
        const a = document.createElement('a');
        a.href = res.signedUrl;
        a.download = formattedFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      console.error(err);
      alert('Could not download file.');
    } finally {
      setBusyCertificateIds((prev) => ({ ...prev, [cert.id]: false }));
    }
  };

  const handlePreview = (cert: Certificate) => {
    if (cert.signedUrl) {
      setPreviewFile({ url: cert.signedUrl, title: cert.title, type: cert.file_type });
    } else {
      alert('Preview URL not found.');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-8">

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
            <input
              id="cert-search"
              type="text"
              placeholder="Search by title, organization or tag…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-[#C85A32]/50 pl-11 pr-10 py-3 text-sm text-[#FAF9F5] placeholder:text-[#78716C]/60 focus:outline-none rounded-xl font-sans transition-all duration-300 focus:bg-white/[0.06]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#FAF9F5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Result count */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#78716C]" />
            <span className="font-mono text-xs tracking-widest text-[#78716C] uppercase">
              {filteredCertificates.length}{' '}
              {filteredCertificates.length === 1 ? 'credential' : 'credentials'}
            </span>
          </div>
        </div>

        {/* Category pills */}
        {availableCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="filter-all"
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full font-mono text-[10px] tracking-widest uppercase transition-all duration-300 cursor-pointer border ${
                selectedCategory === null
                  ? 'bg-[#C85A32] border-[#C85A32] text-white shadow-[0_0_16px_rgba(200,90,50,0.35)]'
                  : 'border-white/10 text-[#78716C] hover:border-white/20 hover:text-[#FAF9F5] bg-white/[0.03]'
              }`}
            >
              All Archive
            </button>
            {availableCategories.map((cat) => {
              const color = getCategoryColor(cat);
              const active = selectedCategory?.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  id={`filter-${cat.toLowerCase()}`}
                  onClick={() => setSelectedCategory(cat)}
                  className="px-4 py-1.5 rounded-full font-mono text-[10px] tracking-widest uppercase transition-all duration-300 cursor-pointer border"
                  style={
                    active
                      ? {
                          backgroundColor: `${color}20`,
                          borderColor: `${color}60`,
                          color: color,
                          boxShadow: `0 0 14px ${color}25`,
                        }
                      : {
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderColor: 'rgba(255,255,255,0.1)',
                          color: '#78716C',
                        }
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── Empty State ── */}
      {filteredCertificates.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 bg-white/[0.04] mb-6">
            <FileText className="w-7 h-7 text-[#78716C] stroke-[1.25]" />
          </div>
          <h3 className="font-serif text-2xl font-light text-[#FAF9F5] mb-2">No records found</h3>
          <p className="font-sans text-sm text-[#78716C] text-center max-w-sm leading-relaxed">
            No certificates match your search filters or selected category.
          </p>
        </div>
      ) : (
        /* ── Certificate Grid ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCertificates.map((cert, i) => (
            <PublicCertificateCard
              key={cert.id}
              cert={cert}
              busy={busyCertificateIds[cert.id] || false}
              onPreview={() => handlePreview(cert)}
              onDownload={() => handleDownload(cert)}
              index={i}
            />
          ))}
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-0 md:p-6"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-[#0D1F18] w-full h-full md:h-[90vh] md:max-w-5xl md:rounded-2xl border border-white/10 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-white/10 bg-[#0D1F18]/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-serif text-lg font-light text-[#FAF9F5] truncate">{previewFile.title}</h3>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#78716C] mt-0.5">
                  {previewFile.type.split('/')[1]}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-[#78716C] hover:text-[#FAF9F5] border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all duration-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#78716C] hover:text-[#FAF9F5] hover:bg-white/10 transition-all duration-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewer */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0A1A10]">
              {previewFile.type.startsWith('image/') ? (
                <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
                  <img
                    src={previewFile.url}
                    alt={previewFile.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
                  <iframe
                    src={`${previewFile.url}#toolbar=0`}
                    title={previewFile.title}
                    className="w-full flex-1 border-0 bg-white"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[#0D1F18]/90 border-t border-white/10 px-5 py-3">
                    <span className="text-[11px] text-[#78716C] font-sans">
                      PDF preview not loading in your browser?
                    </span>
                    <a
                      href={previewFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[#C85A32] hover:text-[#E07B55] text-xs font-mono tracking-wider uppercase transition-colors"
                    >
                      Open directly <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Card Component
// ─────────────────────────────────────────────
interface PublicCertificateCardProps {
  cert: Certificate;
  busy: 'download' | boolean;
  onPreview: () => void;
  onDownload: () => void;
  index: number;
}

function PublicCertificateCard({ cert, busy, onPreview, onDownload, index }: PublicCertificateCardProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(cert.thumbnailUrl || null);
  const [isThumbnail, setIsThumbnail] = useState(!!cert.thumbnailUrl);
  const [loadError, setLoadError] = useState(false);

  const isImage = cert.file_type.startsWith('image/');
  const isPdf = cert.file_type === 'application/pdf';
  const needsLivePdfPreview = isPdf && !cert.thumbnailUrl;

  const { dataUrl: livePdfDataUrl, loading: livePdfLoading, error: livePdfError } = usePdfPreview(
    needsLivePdfPreview ? (cert.signedUrl ?? null) : null
  );

  React.useEffect(() => {
    if (!livePdfDataUrl || livePdfError || !needsLivePdfPreview) return;
    saveThumbnailAction(cert.file_path, livePdfDataUrl).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePdfDataUrl]);

  const handleImageError = () => {
    if (isThumbnail && cert.signedUrl) {
      setIsThumbnail(false);
      setImgSrc(cert.signedUrl);
    } else {
      setLoadError(true);
    }
  };

  const formattedDate = cert.issue_date
    ? new Date(cert.issue_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : null;

  const categoryColor = cert.category ? getCategoryColor(cert.category) : '#C85A32';

  // ── Thumbnail area renderer ──
  const renderThumbnail = () => {
    // Image file
    if (isImage) {
      const src = imgSrc || cert.signedUrl;
      if (src && !loadError) {
        return (
          <img
            src={src}
            alt={cert.title}
            onError={() => setLoadError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
        );
      }
    }

    // PDF with stored thumbnail
    if (isThumbnail && imgSrc && !loadError) {
      return (
        <img
          src={imgSrc}
          alt={cert.title}
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
        />
      );
    }

    // PDF live render
    if (needsLivePdfPreview) {
      if (livePdfLoading) {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#1E3A2F]/30">
            <Loader2 className="w-5 h-5 text-[#C85A32] animate-spin" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#78716C]">Rendering…</span>
          </div>
        );
      }
      if (livePdfDataUrl && !livePdfError) {
        return (
          <img
            src={livePdfDataUrl}
            alt={cert.title}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
        );
      }
    }

    // Fallback document placeholder
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#1E3A2F]/40 to-[#0D1F18]">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center border"
          style={{ backgroundColor: `${categoryColor}15`, borderColor: `${categoryColor}30` }}
        >
          <Award className="w-6 h-6" style={{ color: categoryColor }} />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#78716C]">
          {cert.file_type.split('/')[1]?.toUpperCase() || 'Document'}
        </span>
      </div>
    );
  };

  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* ── Thumbnail ── */}
      <div
        onClick={onPreview}
        className="aspect-[4/3] bg-[#0D1F18] overflow-hidden relative cursor-pointer"
      >
        {renderThumbnail()}

        {/* Category badge */}
        {cert.category && (
          <span
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest z-10 border backdrop-blur-sm"
            style={{
              backgroundColor: `${categoryColor}18`,
              borderColor: `${categoryColor}40`,
              color: categoryColor,
            }}
          >
            {cert.category}
          </span>
        )}

        {/* Hover action overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1F18]/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-end justify-center pb-5 gap-3 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-[#FAF9F5] text-[11px] font-mono tracking-wider uppercase hover:bg-white/25 transition-all duration-200 cursor-pointer"
            title="Preview"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            disabled={busy !== false}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C85A32]/80 backdrop-blur-sm border border-[#C85A32]/50 text-white text-[11px] font-mono tracking-wider uppercase hover:bg-[#C85A32] transition-all duration-200 cursor-pointer disabled:opacity-50"
            title="Download"
          >
            {busy === 'download' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {busy === 'download' ? 'Saving…' : 'Download'}
          </button>
        </div>

        {/* Gradient edge fade */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0D1F18] to-transparent opacity-60 pointer-events-none" />
      </div>

      {/* ── Info ── */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div>
          <h4 className="font-serif text-base font-medium text-[#FAF9F5] leading-snug group-hover:text-[#E07B55] transition-colors duration-300 line-clamp-2">
            {cert.title}
          </h4>

          {cert.organization && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Building2 className="w-3 h-3 text-[#78716C] shrink-0" />
              <span className="text-[#78716C] text-xs truncate">{cert.organization}</span>
            </div>
          )}

          {formattedDate && (
            <div className="flex items-center gap-1.5 mt-1">
              <Calendar className="w-3 h-3 text-[#78716C] shrink-0" />
              <span className="text-[#78716C] text-xs">{formattedDate}</span>
            </div>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-auto">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#78716C]/60">
            {cert.file_type.split('/')[1]} · #{cert.id.substring(0, 5)}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              className="text-[#78716C] hover:text-[#C85A32] text-[11px] font-mono tracking-wider uppercase transition-colors duration-200 cursor-pointer"
            >
              Preview
            </button>
            <span className="text-white/10">|</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
              disabled={busy !== false}
              className="text-[#78716C] hover:text-[#C85A32] text-[11px] font-mono tracking-wider uppercase transition-colors duration-200 cursor-pointer disabled:opacity-40"
            >
              {busy === 'download' ? 'Saving…' : 'Download'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out"
        style={{ background: `linear-gradient(to right, ${categoryColor}80, transparent)` }}
      />
    </div>
  );
}
