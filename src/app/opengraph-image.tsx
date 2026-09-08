import { ImageResponse } from 'next/og';

export const alt = 'Eduraq';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Site-wide fallback social-preview image, used automatically by Next.js for any page whose
// generateMetadata doesn't set its own openGraph.images (e.g. a tutor with no photo, a job
// posting, a plain listing page) — without this, those links previewed blank in Slack/WhatsApp/
// Twitter instead of showing branding.
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0B192C',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 20,
            backgroundColor: '#1E3E62',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 800, color: '#F1C40F' }}>E</div>
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, color: 'white', letterSpacing: -1 }}>Eduraq</div>
        <div style={{ fontSize: 28, color: '#94A3B8', marginTop: 16 }}>
          Iraq&apos;s Education Discovery Platform
        </div>
      </div>
    ),
    { ...size }
  );
}
