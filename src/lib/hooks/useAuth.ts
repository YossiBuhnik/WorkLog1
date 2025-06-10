import { useState, useEffect } from 'react';
import { User as FirebaseUser, signInWithEmailAndPassword, signInWithPhoneNumber, signOut, RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { getUser } from '../firebase/firebaseUtils';
import { User, UserRole } from '../types';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

interface UseAuthReturn {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  hasRole: (role: UserRole) => boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('onAuthStateChanged:', firebaseUser);
      if (firebaseUser) {
        try {
          const userData = await getUser(firebaseUser.uid);
          console.log('Fetched userData:', userData);
          setUser(userData);
          setFirebaseUser(firebaseUser);
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Error fetching user data');
          setUser(null);
          setFirebaseUser(null);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const hasRole = (role: UserRole): boolean => {
    return user?.roles.includes(role) || false;
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await getUser(userCredential.user.uid);
      setUser(userData);
      setFirebaseUser(userCredential.user);
    } catch (err) {
      console.error('Error signing in with email:', err);
      setError('Invalid email or password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      setError(null);
      // Note: This requires additional setup with Firebase phone auth
      // and handling of verification code
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      // Handle confirmation result...
    } catch (err) {
      console.error('Error signing in with phone:', err);
      setError('Invalid phone number');
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Error signing out');
      throw err;
    }
  };

  return {
    user,
    firebaseUser,
    loading,
    error,
    hasRole,
    signInWithEmail,
    signInWithPhone,
    logout,
  };
};