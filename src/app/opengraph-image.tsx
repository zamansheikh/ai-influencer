import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AI Influencer Studio — Create hyper-consistent AI characters';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #050507 0%, #1a1025 50%, #0f0f14 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow circles */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', display: 'flex' }} />

        {/* Icon */}
        <div style={{
          width: 88, height: 88, borderRadius: 22,
          background: 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          <div style={{ color: 'white', fontSize: 44, fontWeight: 800, display: 'flex' }}>✦</div>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 56, fontWeight: 800, letterSpacing: -2,
          background: 'linear-gradient(135deg, #a855f7, #6366f1, #ec4899)',
          backgroundClip: 'text',
          color: 'transparent',
          display: 'flex',
        }}>
          AI Influencer Studio
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 24, color: '#a1a1aa', marginTop: 16, display: 'flex' }}>
          Create hyper-consistent AI characters for content generation
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          {['Forensic Analysis', 'Image & Video Gen', 'Multi-Provider', 'Sponsorship Ready'].map((f) => (
            <div key={f} style={{
              padding: '8px 20px', borderRadius: 99,
              border: '1px solid rgba(168,85,247,0.3)',
              background: 'rgba(168,85,247,0.08)',
              color: '#c084fc', fontSize: 16, fontWeight: 600,
              display: 'flex',
            }}>
              {f}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
