import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LyricLearn',
  description: 'Tap any word in a song lyric for instant translation and pronunciation. Sing along, absorb grammar naturally, make vocabulary stick through music.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
