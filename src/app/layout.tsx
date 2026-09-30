import { Rubik } from 'next/font/google';
import './globals.css';
import { NotificationProvider } from '@/lib/contexts/NotificationContext';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';

// Rubik reads well in Hebrew, Arabic and English
const rubik = Rubik({ subsets: ['latin', 'hebrew', 'arabic'], variable: '--font-rubik' });

export const metadata = {
  title: 'TSK - יומן עבודה',
  description: 'Manage work shifts and requests for TSK construction company',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#254E7B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="icon" href="/images/tsk-logo.png" />
      </head>
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
              </div>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
