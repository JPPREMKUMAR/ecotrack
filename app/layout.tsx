import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EcoTrack — Personal Sustainability Dashboard',
  description: 'Track everyday sustainability actions, set goals, and learn from illustrative environmental impact estimates.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7faf7',
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
