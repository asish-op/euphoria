'use client';

import { useSyncExternalStore } from 'react';

// Subscribes to a CSS media query. `server` is what the first (server / hydration) render assumes.
export function useMedia(query, server = false) {
  return useSyncExternalStore(
    callback => {
      const list = window.matchMedia(query);
      list.addEventListener('change', callback);
      return () => list.removeEventListener('change', callback);
    },
    () => window.matchMedia(query).matches,
    () => server
  );
}
