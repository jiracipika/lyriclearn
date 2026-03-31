'use client';
import Link from 'next/link';

const FEATURES = [
  { label: 'Song Library', href: '/songs', icon: '🎵', desc: 'Browse songs in your target language', gradient: 'linear-gradient(135deg, #FF2D55, #FF6B81)' },
  { label: 'Learn Mode', href: '/songs', icon: '📝', desc: 'Tap any word for instant translation & pronunciation', gradient: 'linear-gradient(135deg, #AF52DE, #DA70D6)' },
  { label: 'My Progress', href: '/progress', icon: '📈', desc: 'Track vocabulary growth and listening streaks', gradient: 'linear-gradient(135deg, #5AC8FA, #007AFF)' },
  { label: 'Vocabulary', href: '/vocab', icon: '🧠', desc: 'Review and reinforce words from songs you love', gradient: 'linear-gradient(135deg, #34C759, #30D158)' },
];

export default function Landing() {
  return (
    <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #FF2D55 0%, #AF52DE 50%, #8B5CF6 100%)',
        padding: '120px 24px 80px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(175,82,222,0.15) 0%, transparent 40%)' }} />
        <div style={{ fontSize: 64, marginBottom: 20, position: 'relative', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>🎵</div>
        <h1 style={{ fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', position: 'relative', marginBottom: 12 }}>
          LyricLearn
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.8)', position: 'relative', maxWidth: 420, margin: '0 auto 32px', lineHeight: 1.6, fontWeight: 400 }}>
          Learn languages through the music you love. Tap any lyric, learn every word.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', position: 'relative' }}>
          <Link href="/songs" style={{
            height: 52, borderRadius: 16, padding: '0 32px',
            background: 'rgba(255,255,255,0.95)', color: '#1C1C1E', fontSize: 17, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}>
            Get Started
          </Link>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 20px' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.6px', marginBottom: 8, color: 'var(--ios-label)' }}>Features</h2>
        <p style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 32, lineHeight: 1.5 }}>Music-first language learning that actually sticks.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {FEATURES.map(f => (
            <Link key={f.label} href={f.href} className="ios-card" style={{
              padding: 24, borderRadius: 20, background: 'var(--ios-bg2)',
              boxShadow: 'var(--ios-shadow)',
              textDecoration: 'none',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: f.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, marginBottom: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              }}>{f.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 650, color: 'var(--ios-label)', marginBottom: 4, letterSpacing: '-0.3px' }}>{f.label}</div>
              <div style={{ fontSize: 14, color: 'var(--ios-label3)', lineHeight: 1.5 }}>{f.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}