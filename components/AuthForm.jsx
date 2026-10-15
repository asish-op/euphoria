'use client';
import { useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { useEvent } from './EventProvider';
import { ErrorNotice } from './BookingUI';

export default function AuthForm({ onSuccess }) {
  const { login } = useEvent();
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const credentials = { email: String(form.get('email')).trim(), password: String(form.get('password')) };
      const result = register ? await api.register({ ...credentials, name: String(form.get('name')).trim() }) : await api.login(credentials);
      if (!result.token || !result.user) throw new Error('Your account could not be confirmed. Please try again.');
      login(result.token, result.user);
      onSuccess();
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <div className="book-auth">
    <div className="book-tabs" role="group" aria-label="Account mode"><button aria-pressed={!register} onClick={() => { setRegister(false); setError(''); }}>Sign in</button><button aria-pressed={register} onClick={() => { setRegister(true); setError(''); }}>Create account</button></div>
    <h2>{register ? 'Your night starts here.' : 'Welcome back.'}</h2>
    <p className="book-muted">Keep your tickets, payment updates, and memories in one place.</p>
    <form onSubmit={submit} className="book-form">
      {register && <label className="book-field">Full name<input name="name" autoComplete="name" minLength={2} maxLength={120} required /></label>}
      <label className="book-field">Email address<input name="email" type="email" autoComplete="email" required /></label>
      <label className="book-field">Password<input name="password" type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined} maxLength={128} required /></label>
      <label className="book-check"><input type="checkbox" checked={showPassword} onChange={event => setShowPassword(event.target.checked)} />Show password</label>
      {error && <ErrorNotice message={error} />}
      <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Connecting…' : register ? 'Create account' : 'Sign in'} <span aria-hidden="true">→</span></button>
    </form>
  </div>;
}
