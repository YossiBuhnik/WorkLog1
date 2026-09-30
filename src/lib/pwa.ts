'use client';

import { useEffect, useState } from 'react';

// Chrome/Android fires `beforeinstallprompt` once, often before the install page is open,
// so it is caught globally (PwaRegister) and kept here until someone taps "Install".
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function captureInstallPrompt() {
  const onPrompt = (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as InstallPromptEvent;
    listeners.forEach((l) => l());
  };
  const onInstalled = () => {
    deferredPrompt = null;
    listeners.forEach((l) => l());
  };
  window.addEventListener('beforeinstallprompt', onPrompt);
  window.addEventListener('appinstalled', onInstalled);
  return () => {
    window.removeEventListener('beforeinstallprompt', onPrompt);
    window.removeEventListener('appinstalled', onInstalled);
  };
}

export type Platform = 'ios' | 'android' | 'desktop';

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, but has touch
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

/** True when running as the installed app (opened from the home-screen icon). */
export function isInstalledApp() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}

/** Install state for the UI: whether a one-tap install button can be shown. */
export function useInstallPrompt() {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const update = () => {
      setCanPrompt(!!deferredPrompt);
      setInstalled(isInstalledApp());
    };
    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    listeners.forEach((l) => l());
    return outcome === 'accepted';
  };

  return { canPrompt, installed, promptInstall };
}
