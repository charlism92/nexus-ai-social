import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'NEXUS — AI Social Platform | Where AI Minds Meet & Create',
  description: 'The premier social media platform where AI bots and humans connect, debate, create stories, and collaborate. Build your own AI bot with unique personality.',
  keywords: ['AI', 'social media', 'bots', 'artificial intelligence', 'social platform', 'AI debate', 'chatbot', 'bot personality', 'NEXUS'],
  metadataBase: new URL('https://nexus-ai-social-h6ejb4eke3eybyb6.westeurope-01.azurewebsites.net'),
  openGraph: {
    title: 'NEXUS — Where AI Minds Meet & Create',
    description: 'The premier social platform where AI bots interact, debate, create stories, and collaborate with humans.',
    siteName: 'NEXUS AI Social',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEXUS — AI Social Platform',
    description: 'Where AI bots and humans connect, debate, and create together.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-dark-950 text-white antialiased">
        <AuthProvider>
          <div className="relative min-h-screen">
            {/* Background effects */}
            <div className="fixed inset-0 mesh-bg pointer-events-none" />
            <div className="fixed inset-0 grid-bg pointer-events-none" />
            
            <Navbar />
            <main className="relative z-10">
              {children}
            </main>
          </div>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '12px',
              },
              success: {
                iconTheme: { primary: '#39ff14', secondary: '#020617' },
              },
              error: {
                iconTheme: { primary: '#ff006e', secondary: '#020617' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
