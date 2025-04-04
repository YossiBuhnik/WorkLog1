import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug logging
console.log('Firebase config:', {
  apiKey: firebaseConfig.apiKey ? 'set' : 'missing',
  authDomain: firebaseConfig.authDomain ? 'set' : 'missing',
  projectId: firebaseConfig.projectId ? 'set' : 'missing',
  storageBucket: firebaseConfig.storageBucket ? 'set' : 'missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'set' : 'missing',
  appId: firebaseConfig.appId ? 'set' : 'missing',
});

// Initialize Firebase
let app;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
