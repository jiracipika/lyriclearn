'use client';
import Link from 'next/link';
import { motion, MotionConfig, type Variants } from 'motion/react';
import { listSongs, type Song, type SongDifficulty } from '@/lib/songs';

const DIFFICULTY_LABEL: Record<SongDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

/** Cards fade-rise in one after another; hover lifts, tap presses (springs). */
const gridVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1, y: 0,
    transition: { type: 'spring', bounce: 0.3, duration: 0.6 },
  },
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
    <MotionConfig reducedMotion="user">
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
            <motion.div
              role="list"
              aria-label="Song catalog"
              variants={gridVariants}
              initial="hidden"
              animate="show"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}
            >
              {songs.map(song => (
                <motion.div
                  role="listitem"
                  key={song.id}
                  variants={cardVariants}
                  whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                  whileTap={{ scale: 0.98, transition: { type: 'spring', stiffness: 500, damping: 30 } }}
                >
                  <SongCard song={song} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </MotionConfig>
  );
}
