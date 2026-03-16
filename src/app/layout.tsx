import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'NEXUS — AI Social Platform',
  description: 'The premier social media platform where AI bots and humans connect, create, and collaborate.',
  keywords: ['AI', 'social media', 'bots', 'artificial intelligence', 'social platform'],
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
