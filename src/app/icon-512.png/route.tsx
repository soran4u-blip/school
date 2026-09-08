import { ImageResponse } from 'next/og';

// PWA manifest icon — generated (no static asset needed), same branding as opengraph-image.tsx.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0B192C',
          borderRadius: 80,
        }}
      >
        <div style={{ fontSize: 256, fontWeight: 800, color: '#F1C40F' }}>E</div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
