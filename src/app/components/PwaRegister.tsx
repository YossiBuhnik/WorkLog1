'use client';

import { useEffect } from 'react';
import { captureInstallPrompt } from '@/lib/pwa';

/** Registers the service worker and keeps the "install app" prompt for later. Renders nothing. */
export default function PwaRegister() {
  useEffect(() => {
    const stop = captureInstallPrompt();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => console.error('Service worker registration failed:', error));
    }
    return stop;
  }, []);
  return null;
}
