import { Rubik } from 'next/font/google';
import './globals.css';
import { NotificationProvider } from '@/lib/contexts/NotificationContext';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import PwaRegister from './components/PwaRegister';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';

// Rubik reads well in Hebrew, Arabic and English
const rubik = Rubik({ subsets: ['latin', 'hebrew', 'arabic'], variable: '--font-rubik' });

export const metadata = {
  title: 'TSK - יומן עבודה',
  description: 'Manage work shifts and requests for TSK construction company',
  icons: {
    icon: [
      { url: '/icons/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  // Installed on iPhone: opens full-screen like an app, named "TSK" under the icon
  appleWebApp: { capable: true, title: 'TSK', statusBarStyle: 'default' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#254E7B',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.variable} font-sans antialiased`}>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <div className="min-h-screen bg-[var(--background)]">
                <Header />
                <Toaster
                  position="top-center"
                  toastOptions={{
                    style: {
                      background: 'var(--primary)',
                      color: '#fff',
                      borderRadius: '14px',
                      fontFamily: 'var(--font-rubik)',
                    },
                    success: {
                      style: {
                        background: '#059669',
                      },
                    },
                    error: {
                      style: {
                        background: '#DC2626',
                      },
                    },
                  }}
                />
                {children}
                <BottomNav />
                <PwaRegister />
              </div>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
