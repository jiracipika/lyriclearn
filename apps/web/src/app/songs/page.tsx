'use client';
import Link from 'next/link';
import { placeholderSongCards } from '@/lib/songs';

const CARDS = placeholderSongCards('Song Library');

export default function SongLibraryPage() {
  return (
    <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 16px 40px' }}>
        <Link href="/" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 16, display: 'inline-block' }}>← Back</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)', marginBottom: 8 }}>Song Library</h1>
        <p style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>
          Song Library for Lyriclearn — coming soon with full functionality.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {CARDS.map(card => (
            <div key={card.id} style={{
              borderRadius: 16, overflow: 'hidden', background: 'var(--ios-bg2)',
              boxShadow: 'var(--ios-shadow)',
            }}>
              <div style={{ height: 120, background: card.gradient }} />
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', marginBottom: 4 }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ios-label3)' }}>
                  {card.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}