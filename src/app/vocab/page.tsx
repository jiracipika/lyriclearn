'use client';
import Link from 'next/link';

export default function VocabularyPage() {
  return (
    <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 20px 40px' }}>
        <Link href="/" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
          <span style={{ fontSize: 16 }}>←</span> Back
        </Link>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: 'var(--ios-label)', marginBottom: 6 }}>Vocabulary</h1>
        <p style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 32, lineHeight: 1.5 }}>
          Review and reinforce words from songs you love.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="ios-card" style={{
              borderRadius: 20, overflow: 'hidden', background: 'var(--ios-bg2)',
              boxShadow: 'var(--ios-shadow)',
            }}>
              <div style={{ height: 120, background: `linear-gradient(135deg, hsl(${i * 51}, 40%, 87%) 0%, hsl(${(i * 51) + 30}, 45%, 82%) 100%)` }} />
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', marginBottom: 4, letterSpacing: '-0.2px' }}>
                  Word #{i}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ios-label3)' }}>
                  Learned {i}d ago
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
