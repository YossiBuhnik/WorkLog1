'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithEmail } from '@/lib/firebase/firebaseUtils';
import { createUser } from '@/lib/firebase/firebaseUtils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error(t('register.error.mismatch'));
      return;
    }

    setLoading(true);
    
    try {
      // Create Firebase Auth user
      const firebaseUser = await signUpWithEmail(email, password, name);
      
      // Wait a brief moment to ensure auth state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create user document in Firestore with the same ID as Auth user
      await createUser({
        displayName: name,
        email: firebaseUser.email || email,
        photoURL: null,
        roles: ['employee'],
      });

      toast.success(t('register.success'));
      router.push('/employee');
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMessage = t('register.error.generic');
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = t('register.error.in.use');
      } else if (err.code === 'auth/weak-password') {
        errorMessage = t('register.error.weak');
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = t('register.error.email');
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const field = (id: string, label: string, value: string, set: (v: string) => void, type = 'text', auto?: string, ltr = false) => (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input
        id={id}
        type={type}
        autoComplete={auto}
        dir={ltr ? 'ltr' : undefined}
        required
        className="field-input"
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-[var(--background)]">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/images/tsk-logo-crop.png" alt="TSK הנדסה אזרחית" width={1510} height={1160} className="h-20 w-auto" priority />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{t('register.title')}</h1>
        <p className="mt-1.5 text-slate-500">{t('register.subtitle')}</p>

        <form className="mt-8 space-y-4" onSubmit={handleRegister}>
          {field('name', t('profile.name'), name, setName)}
          {field('email-address', t('login.email'), email, setEmail, 'email', 'email', true)}
          {field('password', t('login.password'), password, setPassword, 'password', 'new-password', true)}
          {field('confirm-password', t('register.confirm.password'), confirmPassword, setConfirmPassword, 'password', 'new-password', true)}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-navy px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-brand-navy/20 hover:bg-brand-navy-dark disabled:opacity-60"
          >
            {loading ? t('register.creating') : t('register.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t('register.have.account')}{' '}
          <Link href="/auth/login" className="font-medium text-brand-blue hover:text-brand-navy">{t('login.submit')}</Link>
        </p>
      </div>
    </div>
  );
}
