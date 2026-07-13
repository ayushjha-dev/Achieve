'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getPublicDownloadUrlAction,
  getPublicViewUrlAction,
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
} from 'lucide-react';

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
}

interface CertificationsClientProps {
  initialCertificates: Certificate[];
  availableCategories: string[];
}

export default function CertificationsClient({
  initialCertificates,
  availableCategories,
}: CertificationsClientProps) {
  const router = useRouter();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Preview Modal State
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    title: string;
    type: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Action Loading states per certificate card
  const [busyCertificateIds, setBusyCertificateIds] = useState<Record<string, 'download' | boolean>>({});

  // Search & filter calculations
  const filteredCertificates = useMemo(() => {
    return initialCertificates.filter((cert) => {
      const matchesSearch =
        cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cert.category &&
          cert.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cert.organization &&
          cert.organization.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        !selectedCategory ||
        cert.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [initialCertificates, searchQuery, selectedCategory]);

  // Download logic
  const handleDownload = async (cert: Certificate) => {
    setBusyCertificateIds((prev) => ({ ...prev, [cert.id]: 'download' }));
    try {
      const fileExt = cert.file_path.split('.').pop() || '';
      const formattedFilename = `${cert.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
      const res = await getPublicDownloadUrlAction(cert.file_path, formattedFilename);
      
      if (res.error) {
        alert(`Download failed: ${res.error}`);
        return;
      }

      if (res.signedUrl) {
        // Trigger download programmatically
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

  // Preview logic
  const handlePreview = async (cert: Certificate) => {
    setPreviewLoading(true);
    try {
      const res = await getPublicViewUrlAction(cert.file_path);
      if (res.error) {
        alert(`Unable to preview: ${res.error}`);
        return;
      }
      if (res.signedUrl) {
        setPreviewFile({
          url: res.signedUrl,
          title: cert.title,
          type: cert.file_type,
        });
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred opening the preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-8">
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-stone-400 stroke-[1.5]" />
          </span>
          <input
            type="text"
            placeholder="Search by title, organization or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 pl-10 pr-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-stone-400 font-sans transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-charcoal"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Counter */}
        <span className="font-mono text-xs tracking-widest text-stone-muted uppercase self-center md:self-end">
          Showing {filteredCertificates.length} {filteredCertificates.length === 1 ? 'Credential' : 'Credentials'}
        </span>
      </div>

      {/* Category Tabs */}
      {availableCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 font-sans text-[11px] uppercase tracking-wider transition-colors border cursor-pointer ${
              selectedCategory === null
                ? 'border-charcoal bg-charcoal text-white'
                : 'border-stone-200 text-stone-muted hover:border-stone-400 bg-white'
            }`}
          >
            All Archive
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 font-sans text-[11px] uppercase tracking-wider transition-colors border cursor-pointer ${
                selectedCategory?.toLowerCase() === cat.toLowerCase()
                  ? 'border-charcoal bg-charcoal text-white'
                  : 'border-stone-200 text-stone-muted hover:border-stone-400 bg-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredCertificates.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-stone-200 border-dashed py-20 px-4 bg-white/50">
          <div className="w-16 h-16 flex items-center justify-center border border-stone-300 bg-sand mb-6">
            <FileText className="w-6 h-6 text-stone-400 stroke-[1.25]" />
          </div>
          <h3 className="font-serif text-2xl font-light text-charcoal mb-2">
            No records found
          </h3>
          <p className="font-sans text-sm text-stone-muted text-center max-w-sm mb-4 leading-relaxed">
            No certificates match your search filters or selected category.
          </p>
        </div>
      ) : (
        /* Certificate Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((cert) => (
            <PublicCertificateCard
              key={cert.id}
              cert={cert}
              busy={busyCertificateIds[cert.id] || false}
              onPreview={() => handlePreview(cert)}
              onDownload={() => handleDownload(cert)}
            />
          ))}
        </div>
      )}

      {/* --- PREVIEW SYSTEM DIALOG MODAL --- */}
      {previewFile && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-0 md:p-6 animate-fade-in">
          <div className="bg-stone-900 w-full h-full md:h-5/6 md:max-w-5xl md:border md:border-stone-800 flex flex-col shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="bg-stone-950 border-b border-stone-800 px-6 py-4 flex items-center justify-between text-white">
              <div className="truncate pr-4">
                <h3 className="font-serif text-lg font-light tracking-wide text-stone-200 truncate">
                  {previewFile.title}
                </h3>
                <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400 mt-1">
                  Type: {previewFile.type.split('/')[1]}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors border border-stone-800 px-3 py-1.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in Tab</span>
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="text-stone-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Pane */}
            <div className="flex-1 bg-stone-800 flex flex-col p-4 overflow-hidden">
              {previewFile.type.startsWith('image/') ? (
                // Image viewer
                <div className="flex-1 flex items-center justify-center overflow-auto">
                  <img
                    src={previewFile.url}
                    alt={previewFile.title}
                    className="max-w-full max-h-full object-contain border border-stone-950 shadow-lg"
                  />
                </div>
              ) : (
                // PDF Viewer using standard Browser PDF support in an iframe
                <div className="flex-1 flex flex-col h-full w-full">
                  <iframe
                    src={`${previewFile.url}#toolbar=0`}
                    title={previewFile.title}
                    className="w-full flex-1 border border-stone-950 bg-white"
                  />
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-stone-950/60 border border-stone-800/80 px-4 py-3 text-stone-300">
                    <span className="text-[11px] font-sans">
                      PDF preview blank or not loading in your browser?
                    </span>
                    <a
                      href={previewFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-500 hover:text-amber-400 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 self-start"
                    >
                      <span>Open Document Directly</span>
                      <ExternalLink className="w-3.5 h-3.5" />
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

// Subcomponent: PublicCertificateCard with Lazy Public Image/PDF URL loading
interface PublicCertificateCardProps {
  cert: Certificate;
  busy: 'download' | boolean;
  onPreview: () => void;
  onDownload: () => void;
}

function PublicCertificateCard({
  cert,
  busy,
  onPreview,
  onDownload,
}: PublicCertificateCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  // Lazy-load public image/PDF thumbnails on the client side
  useEffect(() => {
    let active = true;
    if (cert.file_type.startsWith('image/') || cert.file_type === 'application/pdf') {
      setLoadingImage(true);
      getPublicViewUrlAction(cert.file_path)
        .then((res) => {
          if (active && res.signedUrl) {
            setImageUrl(res.signedUrl);
          }
        })
        .catch(console.error)
        .finally(() => {
          if (active) setLoadingImage(false);
        });
    }
    return () => {
      active = false;
    };
  }, [cert.file_path, cert.file_type]);

  const isImage = cert.file_type.startsWith('image/');
  const formattedDate = cert.issue_date
    ? new Date(cert.issue_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : null;

  return (
    <div className="bg-white border border-stone-200/80 hover:border-stone-400 group transition-all duration-300 flex flex-col shadow-[0_2px_8px_rgba(28,26,23,0.01)] relative overflow-hidden">
      {/* Thumbnail area */}
      <div 
        onClick={onPreview}
        className="aspect-[4/3] bg-sand border-b border-stone-100 flex items-center justify-center overflow-hidden relative cursor-pointer"
      >
        {isImage ? (
          loadingImage ? (
            <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={cert.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          ) : (
            <span className="text-stone-400 text-xs font-sans">Error loading thumbnail</span>
          )
        ) : (
          loadingImage ? (
            <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
          ) : imageUrl ? (
            <div className="w-full h-full relative overflow-hidden pointer-events-none">
              <iframe
                src={`${imageUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-none pointer-events-none select-none"
                scrolling="no"
                title={`Preview of ${cert.title}`}
              />
              <div className="absolute inset-0 z-10 bg-transparent" />
            </div>
          ) : (
            // PDF fallback card
            <div className="w-full h-full p-6 flex flex-col justify-between border-2 border-stone-200 border-double m-3 bg-white">
              <div className="flex justify-between items-start">
                <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">
                  Official Document
                </span>
                <FileText className="w-4 h-4 text-stone-400 stroke-[1.25]" />
              </div>
              <div className="text-center py-4">
                <span className="font-serif text-5xl italic font-semibold text-stone-300">
                  PDF
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-[8px] tracking-wider uppercase text-stone-400">
                  Secure Archive
                </span>
              </div>
            </div>
          )
        )}

        {/* Absolute visual overlay category badge */}
        {cert.category && (
          <span className="absolute top-4 left-4 bg-charcoal text-white px-2 py-0.5 font-sans text-[9px] uppercase tracking-wider z-20">
            {cert.category}
          </span>
        )}

        {/* Hover overlay quick controls */}
        <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="w-9 h-9 flex items-center justify-center bg-white hover:bg-sand text-charcoal border border-stone-200 shadow-sm cursor-pointer transition-colors"
            title="Preview Certificate"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            disabled={busy !== false}
            className="w-9 h-9 flex items-center justify-center bg-white hover:bg-sand text-charcoal border border-stone-200 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
            title="Download Original"
          >
            {busy === 'download' ? (
              <Loader2 className="w-4 h-4 animate-spin text-charcoal" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Info details */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <h4 className="font-serif text-lg font-medium text-charcoal tracking-wide leading-snug truncate group-hover:text-primary transition-colors">
            {cert.title}
          </h4>
          {cert.organization && (
            <div className="flex items-center gap-1.5 text-stone-700 text-xs font-medium mt-1 truncate">
              <Building2 className="w-3.5 h-3.5 text-stone-400 stroke-[1.25]" />
              <span>{cert.organization}</span>
            </div>
          )}
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-stone-muted text-xs font-sans mt-2">
              <Calendar className="w-3.5 h-3.5 stroke-[1.25]" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* Footer info (file type / ID prefix) */}
        <div className="flex items-center justify-between border-t border-stone-100 pt-3">
          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-muted">
            {cert.file_type.split('/')[1]} • {cert.id.substring(0, 5)}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className="text-stone-muted hover:text-primary text-xs font-sans py-1 cursor-pointer transition-colors"
            >
              Preview
            </button>
            <span className="text-stone-200">|</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              disabled={busy !== false}
              className="text-stone-muted hover:text-primary text-xs font-sans py-1 cursor-pointer transition-colors disabled:opacity-50"
            >
              {busy === 'download' ? 'Downloading...' : 'Download'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
