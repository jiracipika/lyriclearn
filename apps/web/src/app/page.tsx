'use client';
import Link from 'next/link';

const FEATURES = [
  { label: 'Song Library', href: '/songs', icon: '✨', desc: 'Song Library feature coming soon' },
  { label: 'Song Detail', href: '/songs', icon: '✨', desc: 'Song Detail feature coming soon' },
  { label: 'Learn Mode', href: '/songs', icon: '✨', desc: 'Learn Mode feature coming soon' },
  { label: 'My Progress', href: '/progress', icon: '✨', desc: 'My Progress feature coming soon' }
];

export default function Landing() {
  return (
    <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #FF2D55 0%, #AF52DE 100%)',
        padding: '100px 24px 60px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)' }} />
        <div style={{ fontSize: 56, marginBottom: 16, position: 'relative' }}>🎵</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#fff', letterSpacing: '-1px', position: 'relative', marginBottom: 8 }}>
          Lyriclearn
        </h1>
        <p style={{ fontSize: 16, color: '#fff99', position: 'relative', maxWidth: 400, margin: '0 auto 28px', lineHeight: 1.5 }}>
          Learn languages through lyrics
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', position: 'relative' }}>
          <Link href="/songs" style={{
            height: 48, borderRadius: 14, padding: '0 28px',
            background: '#fff', color: '#333', fontSize: 16, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          }}>
            Get Started
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 16px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 20, color: 'var(--ios-label)' }}>Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {FEATURES.map(f => (
            <Link key={f.href} href={f.href} style={{
              padding: 20, borderRadius: 16, background: 'var(--ios-bg2)',
              boxShadow: 'var(--ios-shadow)',
              textDecoration: 'none', transition: 'transform 0.2s ease',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ios-label)', marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 13, color: 'var(--ios-label3)', lineHeight: 1.4 }}>{f.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}