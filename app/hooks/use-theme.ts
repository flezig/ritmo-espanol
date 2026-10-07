'use client';

import { useEffect, useState } from 'react';

const themeStorageKey = 'ritmo-theme';

export function useTheme() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const restore = () => {
      try {
        const saved = localStorage.getItem(themeStorageKey);
        if (saved === 'light' || saved === 'dark') setDark(saved === 'dark');
      } catch {
        // Keep the theme usable when browser storage is unavailable.
      }
    };
    restore();
    const sync = (event: StorageEvent) => {
      if (event.key === themeStorageKey) restore();
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const changeTheme = (nextDark: boolean) => {
    setDark(nextDark);
    try {
      localStorage.setItem(themeStorageKey, nextDark ? 'dark' : 'light');
    } catch {
      // The current session can still use the selected theme.
    }
  };

  return [dark, changeTheme] as const;
}
