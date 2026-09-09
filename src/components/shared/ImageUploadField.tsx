'use client';

import React, { useState } from 'react';
import { uploadImage } from '@/core/firebase/storage';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export default function ImageUploadField({
  label,
  value,
  onChange,
  pathPrefix,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  pathPrefix: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
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
      onChange(url);
    } catch {
      setError('Upload failed. Are you signed in as superadmin?');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          // A freshly uploaded file is previewed from an arbitrary Storage download URL that
          // next/image would have to be configured for host by host, and this is a 56px preview,
          // so the optimiser buys nothing here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
        )}

        <label className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors shrink-0">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span>{uploading ? 'Uploading...' : 'Upload'}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="or paste image URL"
          className="flex-1 min-w-0 px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
        />
      </div>
      {error && <p className="text-[11px] font-bold text-rose-600 mt-1">{error}</p>}
    </div>
  );
}
