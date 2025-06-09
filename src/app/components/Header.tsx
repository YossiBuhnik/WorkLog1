'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="bg-[var(--primary)] shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-24">
          <div className="flex items-center space-x-4">
            <Logo />
            <LanguageSelector />
          </div>

          <div className="flex items-center space-x-4">
            {user.roles?.includes('manager') && (
              <Link href="/manager" className="nav-link">
                {t('manager.dashboard')}
              </Link>
            )}
            {user.roles?.includes('office') && (
              <Link href="/office" className="nav-link">
                {t('office.dashboard')}
              </Link>
            )}
            <Link href="/employee" className="nav-link">
              {t('my.requests')}
            </Link>
            <Link href="/profile" className="nav-link">
              {t('profile')}
            </Link>
            <button
              onClick={handleLogout}
              className="nav-link"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 