'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  addCertificateAction,
  deleteCertificateAction,
  getDownloadUrlAction,
  getViewUrlAction,
  updateCertificateAction,
  uploadCertificateFileAction,
} from '../actions';
import { User } from '@supabase/supabase-js';
import {
  Plus,
  Search,
  FileText,
  Download,
  Trash2,
  Eye,
  X,
  UploadCloud,
  Calendar,
  Tag,
  Loader2,
  ExternalLink,
  Building2,
  Pencil,
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

interface DashboardClientProps {
  user: User;
  initialCertificates: Certificate[];
  availableCategories: string[];
}

export default function DashboardClient({
  user,
  initialCertificates,
  availableCategories,
}: DashboardClientProps) {
  const router = useRouter();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modals and Alerts States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    title: string;
    type: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Upload Form States
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadOrganization, setUploadOrganization] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadIssueDate, setUploadIssueDate] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Edit Form States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editCertificate, setEditCertificate] = useState<Certificate | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editOrganization, setEditOrganization] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIssueDate, setEditIssueDate] = useState('');
  const [editUpdating, setEditUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Action Loading states per certificate card
  const [busyCertificateIds, setBusyCertificateIds] = useState<Record<string, 'download' | 'delete' | boolean>>({});

  // 1. Dynamic list of categories based on initial + new certificates
  const uniqueCategories = useMemo(() => {
    const cats = initialCertificates
      .map((c) => c.category?.trim())
      .filter((c): c is string => !!c);
    return Array.from(new Set(cats));
  }, [initialCertificates]);

  // 2. Search & filter calculations
  const filteredCertificates = useMemo(() => {
    return initialCertificates.filter((cert) => {
      const matchesSearch =
        cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cert.category &&
          cert.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        !selectedCategory ||
        cert.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [initialCertificates, searchQuery, selectedCategory]);

  // Handle direct client-to-Supabase Storage upload (supports up to 10MB)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!uploadFile) {
      setUploadError('Please select a file.');
      return;
    }

    if (!uploadTitle.trim()) {
      setUploadError('Please enter a certificate title.');
      return;
    }

    // Max file size 10MB (10 * 1024 * 1024 bytes)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (uploadFile.size > MAX_SIZE) {
      setUploadError('File exceeds the maximum size limit of 10MB.');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(uploadFile.type)) {
      setUploadError('Invalid file type. Only PDFs and JPG/PNG images are allowed.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      // Upload file via server action
      const uploadResult = await uploadCertificateFileAction(formData);

      if (uploadResult.error || !uploadResult.filePath || !uploadResult.fileType) {
        throw new Error(`Storage upload failed: ${uploadResult.error || 'Missing upload information'}`);
      }

      const { filePath, fileType } = uploadResult;

      // Add database entry via Server Action
      const dbResult = await addCertificateAction({
        title: uploadTitle,
        organization: uploadOrganization.trim() || undefined,
        category: uploadCategory.trim() || undefined,
        issueDate: uploadIssueDate || undefined,
        filePath,
        fileType,
      });

      if (dbResult.error) {
        // Attempt clean up of file if DB entry fails
        const supabase = createClient();
        await supabase.storage.from('certificates').remove([filePath]);
        throw new Error(dbResult.error);
      }

      // Reset form states
      setUploadTitle('');
      setUploadOrganization('');
      setUploadCategory('');
      setUploadIssueDate('');
      setUploadFile(null);
      setIsUploadOpen(false);
      
      // Refresh router to fetch updated certificate list
      router.refresh();
    } catch (err: any) {
      setUploadError(err?.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  // Direct download logic with original filenames
  const handleDownload = async (cert: Certificate) => {
    setBusyCertificateIds((prev) => ({ ...prev, [cert.id]: 'download' }));
    try {
      const fileExt = cert.file_path.split('.').pop() || '';
      const formattedFilename = `${cert.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
      const res = await getDownloadUrlAction(cert.file_path, formattedFilename);
      
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
      const res = await getViewUrlAction(cert.file_path);
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

  // Delete logic
  const handleDelete = async (cert: Certificate) => {
    if (!confirm(`Are you sure you want to permanently delete "${cert.title}"?`)) {
      return;
    }

    setBusyCertificateIds((prev) => ({ ...prev, [cert.id]: 'delete' }));
    try {
      const res = await deleteCertificateAction(cert.id, cert.file_path);
      if (res.error) {
        alert(`Deletion failed: ${res.error}`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      alert('Could not delete certificate.');
    } finally {
      setBusyCertificateIds((prev) => ({ ...prev, [cert.id]: false }));
    }
  };

  // Edit click handler to prefill and open modal
  const handleEditClick = (cert: Certificate) => {
    setEditCertificate(cert);
    setEditTitle(cert.title);
    setEditOrganization(cert.organization || '');
    setEditCategory(cert.category || '');
    setEditIssueDate(cert.issue_date || '');
    setEditError(null);
    setIsEditOpen(true);
  };

  // Submit edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editCertificate) return;

    if (!editTitle.trim()) {
      setEditError('Please enter a certificate title.');
      return;
    }

    setEditUpdating(true);
    try {
      const res = await updateCertificateAction(editCertificate.id, {
        title: editTitle,
        organization: editOrganization.trim() || undefined,
        category: editCategory.trim() || undefined,
        issueDate: editIssueDate || undefined,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      setIsEditOpen(false);
      setEditCertificate(null);
      router.refresh();
    } catch (err: any) {
      setEditError(err?.message || 'An error occurred while updating.');
    } finally {
      setEditUpdating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-8">
      
      {/* Search, Filter, and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        
        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-stone-400 stroke-[1.5]" />
          </span>
          <input
            type="text"
            placeholder="Search by title or category..."
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

        {/* Upload Trigger Button */}
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-3 font-sans text-xs font-semibold tracking-widest uppercase transition-colors rounded-none cursor-pointer w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Certificate
        </button>
      </div>

      {/* Category Tabs */}
      {uniqueCategories.length > 0 && (
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
          {uniqueCategories.map((cat) => (
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
          <p className="font-sans text-sm text-stone-muted text-center max-w-sm mb-8 leading-relaxed">
            {initialCertificates.length === 0
              ? "Your digital vault is empty. Deposit your first credential to start building your personal directory."
              : "No certificates match your search filters or selected category."}
          </p>
          {initialCertificates.length === 0 && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 border border-charcoal hover:bg-charcoal hover:text-white px-5 py-2.5 font-sans text-xs font-semibold tracking-widest uppercase transition-all rounded-none cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Certificate
            </button>
          )}
        </div>
      ) : (
        /* Certificate Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((cert) => (
            <CertificateCard
              key={cert.id}
              cert={cert}
              busy={busyCertificateIds[cert.id] || false}
              onPreview={() => handlePreview(cert)}
              onDownload={() => handleDownload(cert)}
              onDelete={() => handleDelete(cert)}
              onEdit={() => handleEditClick(cert)}
            />
          ))}
        </div>
      )}

      {/* --- UPLOAD DIALOG MODAL --- */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200/80 max-w-lg w-full p-8 shadow-xl relative animate-fade-in">
            <button
              onClick={() => {
                setIsUploadOpen(false);
                setUploadError(null);
                setUploadFile(null);
              }}
              className="absolute top-6 right-6 text-stone-400 hover:text-charcoal transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-2xl font-light tracking-wide text-charcoal mb-6 border-b border-stone-100 pb-3">
              Add New Certificate
            </h2>

            <form onSubmit={handleUploadSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block font-sans text-xs font-medium tracking-wider uppercase text-stone-600 mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-sand/50 border border-stone-200 px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primary transition-all font-sans rounded-none"
                />
              </div>

              {/* Organization */}
              <div>
                <label className="block font-sans text-xs font-medium tracking-wider uppercase text-stone-600 mb-2">
                  Organization / Issuer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Web Services, Stanford University"
                  value={uploadOrganization}
                  onChange={(e) => setUploadOrganization(e.target.value)}
                  className="w-full bg-sand/50 border border-stone-200 px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primary transition-all font-sans rounded-none"
                />
              </div>

              {/* Category / Tags */}
              <div>
                <label className="block font-sans text-xs font-medium tracking-wider uppercase text-stone-600 mb-2">
                  Category / Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cloud, Engineering, Academics"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-sand/50 border border-stone-200 px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primary transition-all font-sans rounded-none"
                />
                {/* Suggestions */}
                {availableCategories.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-sans text-stone-400 uppercase tracking-wide mr-1">
                      Suggestions:
                    </span>
                    {availableCategories.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setUploadCategory(cat)}
                        className="px-2 py-0.5 border border-stone-200 hover:border-stone-400 font-sans text-[10px] uppercase text-stone-600 transition-colors cursor-pointer"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Issue Date */}
              <div>
                <label className="block font-sans text-xs font-medium tracking-wider uppercase text-stone-600 mb-2">
                  Date of Issue (Optional)
                </label>
                <input
                  type="date"
                  value={uploadIssueDate}
                  onChange={(e) => setUploadIssueDate(e.target.value)}
                  className="w-full bg-sand/50 border border-stone-200 px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primary transition-all font-sans rounded-none"
                />
              </div>

              {/* File Dropzone / Selector */}
              <div>
                <label className="block font-sans text-xs font-medium tracking-wider uppercase text-stone-600 mb-2">
                  File Attachment (PDF, JPG, PNG — max 10MB)
                </label>
                <div className="border border-stone-200 border-dashed bg-sand/30 hover:bg-sand/65 transition-colors relative flex flex-col items-center justify-center p-6 text-center cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/jpg"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files[0]) {
                        setUploadFile(files[0]);
                        // Auto-fill title if empty
                        if (!uploadTitle.trim()) {
                          const baseName = files[0].name.substring(
                            0,
                            files[0].name.lastIndexOf('.')
                          ) || files[0].name;
                          // Clean up dashes/underscores
                          setUploadTitle(
                            baseName
                              .replace(/[-_]/g, ' ')
                              .replace(/\b\w/g, (c) => c.toUpperCase())
                          );
                        }
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <UploadCloud className="w-8 h-8 text-stone-400 mb-2 stroke-[1.25]" />
                  {uploadFile ? (
                    <div>
                      <p className="font-sans text-xs font-semibold text-charcoal truncate max-w-xs">
                        {uploadFile.name}
                      </p>
                      <p className="font-sans text-[10px] text-stone-muted mt-1">
                        {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB •{' '}
                        {uploadFile.type.split('/')[1].toUpperCase()}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-sans text-xs text-stone-700">
                        Drag and drop file here, or click to browse
                      </p>
                      <p className="font-sans text-[10px] text-stone-muted mt-1">
                        Accepts PDF, PNG, JPG, or JPEG
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50/50 border border-red-200/50 text-red-700 text-xs font-sans">
                  {uploadError}
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    setIsUploadOpen(false);
                    setUploadError(null);
                    setUploadFile(null);
                  }}
                  className="px-4 py-2.5 border border-stone-200 hover:border-stone-400 font-sans text-xs font-medium tracking-wider uppercase transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 font-sans text-xs font-semibold tracking-widest uppercase transition-colors disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Add Vault Deposit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT DIALOG MODAL --- */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200/80 max-w-lg w-full p-8 shadow-xl relative animate-fade-in">
            <button
              onClick={() => {
                setIsEditOpen(false);
                setEditError(null);
                setEditCertificate(null);
              }}
              className="absolute top-6 right-6 text-stone-400 hover:text-charcoal transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-2xl font-light tracking-wide text-charcoal mb-6 border-b border-stone-100 pb-3">
              Edit Certificate Details
            </h2>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block font-sans text-xs font-medium tracking-wider uppercase text-stone-600 mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-sand/50 border border-stone-200 px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primary transition-all font-sans rounded-none"
                />
              </div>

              {/* Organization */}
              <div>
                <label className="block font-sans text-xs font-medium tracking-wider uppercase text-stone-600 mb-2">
                  Organization / Issuer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Web Services, Stanford University"
                  value={editOrganization}
                  onChange={(e) => setEditOrganization(e.target.value)}
                  className="w-full bg-sand/50 border border-stone-200 px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primary transition-all font-sans rounded-none"
                />
              </div>

              {/* Category / Tags */}
              <div>
                <label className="block font-sans text-xs font-medium tracking-wider uppercase text-stone-600 mb-2">
                  Category / Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cloud, Engineering, Academics"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-sand/50 border border-stone-200 px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primary transition-all font-sans rounded-none"
                />
              </div>

              {/* Issue Date */}
              <div>
                <label className="block font-sans text-xs font-medium tracking-wider uppercase text-stone-600 mb-2">
                  Date of Issue
                </label>
                <input
                  type="date"
                  value={editIssueDate}
                  onChange={(e) => setEditIssueDate(e.target.value)}
                  className="w-full bg-sand/50 border border-stone-200 px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primary transition-all font-sans rounded-none"
                />
              </div>

              {editError && (
                <div className="p-3 bg-red-50/50 border border-red-200/50 text-red-700 text-xs font-sans">
                  {editError}
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  disabled={editUpdating}
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditError(null);
                    setEditCertificate(null);
                  }}
                  className="px-4 py-2.5 border border-stone-200 hover:border-stone-400 font-sans text-xs font-medium tracking-wider uppercase transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editUpdating}
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 font-sans text-xs font-semibold tracking-widest uppercase transition-colors disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {editUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
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
                // PDF Viewer using standard Browser PDF support in an iframe with fallback helpers
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

// Subcomponent: CertificateCard with Lazy Private Image/PDF URL loading
interface CertificateCardProps {
  cert: Certificate;
  busy: 'download' | 'delete' | boolean;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

function CertificateCard({
  cert,
  busy,
  onPreview,
  onDownload,
  onDelete,
  onEdit,
}: CertificateCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  // Lazy-load private image/PDF thumbnails on the client side
  useEffect(() => {
    let active = true;
    if (cert.file_type.startsWith('image/') || cert.file_type === 'application/pdf') {
      setLoadingImage(true);
      getViewUrlAction(cert.file_path)
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
          // PDF Thumbnail rendering using signed URL, falling back to static visual
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
              {/* Overlay transparent shield to prevent any interaction or cursor changes in iframe */}
              <div className="absolute inset-0 z-10 bg-transparent" />
            </div>
          ) : (
            // Elegant vector visual for PDF
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
            disabled={busy !== false}
            className="w-9 h-9 flex items-center justify-center bg-white hover:bg-sand text-charcoal border border-stone-200 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
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

        {/* Row actions */}
        <div className="flex items-center justify-between border-t border-stone-100 pt-3">
          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-muted">
            {cert.file_type.split('/')[1]} • {cert.id.substring(0, 5)}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              disabled={busy !== false}
              className="flex items-center gap-1 text-stone-muted hover:text-primary text-xs font-sans py-1 cursor-pointer transition-colors disabled:opacity-50"
              title="Edit Certificate"
            >
              <Pencil className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={busy !== false}
              className="flex items-center gap-1 text-stone-muted hover:text-red-700 text-xs font-sans py-1 cursor-pointer transition-colors disabled:opacity-50"
              title="Delete Certificate"
            >
              {busy === 'delete' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
