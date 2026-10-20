'use client';

import React from 'react';
import { useT } from '@/lib/useT';
import { FOCAL_POINT_COPY } from './SharedPanels.i18n';

// Lets a photo owner (tutor, institution, ...) click the point on their uploaded photo that
// should stay centered wherever the photo is shown as a cropped square/avatar (object-cover).
// Stored as percentages, matching CSS object-position directly — see Thumbnail's objectPosition
// prop. Shown only once a photo is uploaded; the click target is the full, uncropped image so a
// click always means "this point in the original photo," not a point in some other crop.
export default function PhotoFocalPointPicker({
  photoUrl,
  focalPoint,
  onChange,
}: {
  photoUrl: string;
  focalPoint?: { x: number; y: number };
  onChange: (point: { x: number; y: number }) => void;
}) {
  const t = useT(FOCAL_POINT_COPY);
  const point = focalPoint ?? { x: 50, y: 50 };

  const handlePick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onChange({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">
        {t('label')}
      </label>
      <p className="text-[11px] text-slate-500 mb-2">
        {t('hint')}
      </p>
      <div className="flex items-start gap-4">
        <div
          onClick={handlePick}
          className="relative w-40 shrink-0 cursor-crosshair select-none overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- full-size click target, must show the untouched image, not a next/image-optimized crop */}
          <img src={photoUrl} alt="" className="block w-full h-auto" draggable={false} />
          <span
            className="pointer-events-none absolute h-3.5 w-3.5 -ml-[7px] -mt-[7px] rounded-full border-2 border-white bg-blue-600 shadow"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          />
        </div>
        <div className="shrink-0">
          <p className="text-[10px] font-bold text-slate-500 mb-1">{t('preview')}</p>
          <div className="w-20 h-20 overflow-hidden rounded-lg border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element -- live crop preview, needs the exact objectPosition applied to a plain <img> */}
            <img
              src={photoUrl}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: `${point.x}% ${point.y}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
