'use client';
import Link from 'next/link';

export default function SongDetailPage() {
  return (
    <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 16px 40px' }}>
        <Link href="/" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 16, display: 'inline-block' }}>← Back</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)', marginBottom: 8 }}>Song Detail</h1>
        <p style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>
          Song Detail for Lyriclearn — coming soon with full functionality.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{
              borderRadius: 16, overflow: 'hidden', background: 'var(--ios-bg2)',
              boxShadow: 'var(--ios-shadow)',
            }}>
              <div style={{ height: 120, background: 'linear-gradient(135deg, hsl(' + (i * 51) + ', 40%, 85%) 0%, hsl(' + ((i * 51) + 30) + ', 45%, 80%) 100%)' }} />
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', marginBottom: 4 }}>
                  Song Detail Item {i}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ios-label3)' }}>
                  Added {i}d ago
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}