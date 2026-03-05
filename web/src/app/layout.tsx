import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    default: 'Tango Community — Global Tango Events & Community',
    template: '%s | Tango Community',
  },
  description:
    'Discover milongas, practicas, and festivals worldwide. Connect with tango dancers in your city and around the globe.',
  keywords: ['tango', 'milonga', 'practica', 'tango festival', 'tango community', 'dance'],
  authors: [{ name: 'Tango Community' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
  openGraph: {
    title: 'Tango Community',
    description: 'Discover milongas, practicas, and festivals worldwide.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Tango Community',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tango Community',
    description: 'Discover milongas, practicas, and festivals worldwide.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8B0000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('tango-theme');var p=s?JSON.parse(s):null;var t=p&&p.state?p.state.theme:'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})();`,
          }}
        />
        {/* Kakao JS SDK */}
        <script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          crossOrigin="anonymous"
          async
        />
        {/* Apple Sign-In JS */}
        <script
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
          async
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans+KR:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-warm-50 dark:bg-[#1A1410] text-warm-950 dark:text-warm-100 antialiased transition-colors duration-200">
        <AppProviders>
          <Header />
          <main className="min-h-[calc(100vh-64px)] pt-16">
            {children}
          </main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
