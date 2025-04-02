import { Inter } from 'next/font/google';
import './globals.css';
import { NotificationProvider } from '@/lib/contexts/NotificationContext';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TSK - Work Shift Management',
  description: 'Manage work shifts and requests for TSK construction company',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/tsk-logo.png" />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <div className="min-h-screen bg-[var(--background)]">
                <Header />
                <Toaster 
                  position="top-right" 
                  toastOptions={{
                    style: {
                      background: 'var(--primary)',
                      color: '#fff',
                    },
                    success: {
                      style: {
                        background: '#10B981',
                      },
                    },
                    error: {
                      style: {
                        background: '#EF4444',
                      },
                    },
                  }}
                />
                {children}
              </div>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
