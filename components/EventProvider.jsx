'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, errorMessage, TOKEN_KEY, PENDING_ORDER_KEY } from '@/lib/api';

const EventContext = createContext(null);
export default function EventProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState('');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PENDING_ORDER_KEY);
    setUser(null);
    setAuthError('');
  }, []);
  const refreshAuth = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    try {
      const account = token ? await api.getMe() : null;
      if (localStorage.getItem(TOKEN_KEY) === token) { setUser(account); setAuthError(''); }
    } catch (error) {
      if (localStorage.getItem(TOKEN_KEY) !== token) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else setAuthError(errorMessage(error));
    } finally { setAuthLoading(false); }
  }, [logout]);
  const refreshSettings = useCallback(async () => {
    try { setSettings(await api.getSettings()); setSettingsError(''); }
    catch (error) { setSettingsError(errorMessage(error)); }
    finally { setSettingsLoading(false); }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(refreshAuth);
    void Promise.resolve().then(refreshSettings);
    window.addEventListener('euphoria:unauthorized', logout);
    return () => window.removeEventListener('euphoria:unauthorized', logout);
  }, [refreshAuth, refreshSettings, logout]);
  function login(token, account) {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(account); setAuthError(''); setAuthLoading(false);
  }
  return <EventContext.Provider value={{ settings, settingsLoading, settingsError, refreshSettings, user, authLoading, authError, refreshAuth, login, logout }}>{children}</EventContext.Provider>;
}
export function useEvent() {
  const context = useContext(EventContext);
  if (!context) throw new Error('Event provider missing');
  return context;
}
export function useProtectedPage(returnTo) {
  const context = useEvent();
  const router = useRouter();
  useEffect(() => {
    if (!context.authLoading && !context.authError && !context.user)
      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [context.authLoading, context.authError, context.user, returnTo, router]);
  return context;
}
