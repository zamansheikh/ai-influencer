import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const APP_NAME = 'AI Influencer Studio';
const APP_DESCRIPTION = 'Create hyper-consistent AI influencer characters with forensic-level analysis. Generate photos, videos, and sponsored content with perfect face consistency across every image. Multi-provider support for Gemini, OpenAI, Claude, and more.';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'AI influencer', 'AI character creator', 'AI content generation',
    'virtual influencer', 'AI image generation', 'face consistency',
    'AI sponsorship', 'Gemini', 'GPT-4', 'DALL-E', 'Stable Diffusion',
    'AI video generation', 'influencer marketing', 'AI portrait',
  ],
  authors: [{ name: 'AI Influencer Studio' }],
  creator: 'AI Influencer Studio',
  metadataBase: new URL('https://ai-influencer.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#a855f7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
