import React from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

// A fixed-size logo/photo/cover with a fallback for the empty case.
//
// Institutions and tutors are provisioned by /api/applications/[id]/approve with `logoUrl: ''`,
// `coverImageUrl: ''` and `photoUrl: ''`, filled in later by the owner from their dashboard. Every
// call site passed those straight to next/image, which warns on an empty `src` and re-requests the
// whole page as the resolved URL — visible as a wall of "An empty string was passed to the src
// attribute" in the server log on any page listing a freshly-approved profile.
//
// Not a Client Component: it renders no interactivity, so it can be used from server and client
// components alike.

export default function Thumbnail({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackClassName = '',
  sizes,
  fill = false,
  priority = false,
  objectPosition,
}: {
  src: string | undefined | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackClassName?: string;
  sizes?: string;
  fill?: boolean;
  priority?: boolean;
  // CSS object-position, e.g. '30% 20%' — for a subject-provided focal point on a cropped
  // (object-cover) thumbnail. Only meaningful alongside object-cover in `className`.
  objectPosition?: string;
}) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-300 ${className} ${fallbackClassName}`}
        aria-label={alt}
        role="img"
      >
        <ImageIcon className="w-1/3 h-1/3" />
      </div>
    );
  }

  const style = objectPosition ? { objectPosition } : undefined;

  if (fill) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} style={style} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 40}
      height={height ?? 40}
      sizes={sizes}
      priority={priority}
      className={className}
      style={style}
    />
  );
}
