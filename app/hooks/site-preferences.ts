'use client';

import { useEffect, useState } from 'react';
import type { SitePreferences } from '../types/learning';

const preferenceStorageKey = 'ritmo-site-preferences',
  defaultSitePreferences: SitePreferences = {
    animations: true,
    sounds: true,
    autoSpeak: true,
    reviewNotifications: false,
  };

export const readSitePreferences = (): SitePreferences => {
  if (typeof window === 'undefined') return defaultSitePreferences;
  try {
    return {
      ...defaultSitePreferences,
      ...JSON.parse(localStorage.getItem(preferenceStorageKey) || '{}'),
    };
  } catch {
    return defaultSitePreferences;
  }
};

export function useSitePreferences() {
  const [preferences, setPreferences] = useState<SitePreferences>(
    defaultSitePreferences,
  );
  useEffect(() => {
    const refresh = () => setPreferences(readSitePreferences());
    refresh();
    window.addEventListener('ritmo-preferences', refresh);
    return () => window.removeEventListener('ritmo-preferences', refresh);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle(
      'ritmo-motion-off',
      !preferences.animations,
    );
  }, [preferences.animations]);
  const updatePreferences = (patch: Partial<SitePreferences>) => {
    const next = { ...readSitePreferences(), ...patch };
    localStorage.setItem(preferenceStorageKey, JSON.stringify(next));
    setPreferences(next);
    window.dispatchEvent(new Event('ritmo-preferences'));
  };
  return { preferences, updatePreferences };
}
