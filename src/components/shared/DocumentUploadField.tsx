'use client';

import React, { useState } from 'react';
import { uploadImage } from '@/core/firebase/storage';
import { Upload, Loader2, FileText, X } from 'lucide-react';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/', 'application/pdf'];

// Like ImageUploadField, but for an append-only list of verification documents (ID/certificate
// photos or PDFs) rather than a single image — each upload adds to the array, never replaces it.
export default function DocumentUploadField({
  label,
  value,
  onChange,
  pathPrefix,
}: {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  pathPrefix: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.some((t) => file.type.startsWith(t))) {
      setError('Please select an image or PDF file');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Max file size is 5MB');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const path = `${pathPrefix}/${Date.now()}-${file.name}`;
      const url = await uploadImage(file, path);
      onChange([...value, url]);
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
      <div className="space-y-2">
        {value.map((url, idx) => (
          <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 truncate text-xs text-blue-700 hover:underline font-mono">
              Document {idx + 1}
            </a>
            <button type="button" onClick={() => removeAt(idx)} className="text-slate-400 hover:text-rose-600 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <label className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors w-fit">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      </div>
      {error && <p className="text-[11px] font-bold text-rose-600 mt-1">{error}</p>}
    </div>
  );
}
