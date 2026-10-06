'use client';
import Link from 'next/link';
import { listSongs, type Song, type SongDifficulty } from '@/lib/songs';

const DIFFICULTY_LABEL: Record<SongDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function SongCard({ song }: { song: Song }) {
  return (
    <Link
      href={`/songs/${song.id}`}
      aria-label={`Open ${song.title} by ${song.artist}`}
      style={{
        display: 'block', borderRadius: 16, overflow: 'hidden',
        background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
        padding: 14, textDecoration: 'none',
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', marginBottom: 4 }}>
        {song.title}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ios-label3)' }}>
        {song.artist} · {song.language.toUpperCase()}
        {song.difficulty !== undefined ? ` · ${DIFFICULTY_LABEL[song.difficulty]}` : ''}
      </div>
    </Link>
  );
}

export default function SongLibraryPage() {
  const songs = listSongs();

  return (
    <main style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 16px 40px' }}>
        <Link href="/" aria-label="Back to home" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 16, display: 'inline-block' }}>← Back</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)', marginBottom: 8 }}>Song Library</h1>
        <p style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>
          Every song in the catalog, ready to practice.
        </p>

        {songs.length === 0 ? (
          <div style={{
            borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
            padding: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, color: 'var(--ios-label)', marginBottom: 8 }}>
              No songs in the catalog yet.
            </div>
            <div style={{ fontSize: 13, color: 'var(--ios-label3)' }}>
              Songs will appear here as soon as the catalog has entries.
            </div>
          </div>
        ) : (
          <div role="list" aria-label="Song catalog" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {songs.map(song => (
              <div role="listitem" key={song.id}>
                <SongCard song={song} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
