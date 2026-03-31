import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LyricLearn',
  description: 'Tap any word in a song lyric for instant translation and pronunciation. Sing along, absorb grammar naturally, make vocabulary stick through music.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', background: 'var(--ios-bg)', color: 'var(--ios-label)', transition: 'background 0.3s, color 0.3s' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
