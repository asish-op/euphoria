'use client';

import Link from 'next/link';
import { useEvent } from './EventProvider';
import { EVENT } from '@/lib/event';

export function BookingFrame({ title, subtitle, children }) {
  const { user, logout } = useEvent();
  return <>
    <header className="book-nav nav-frost">
      <Link className="book-brand" href="/">euphoria<span>✦</span><small className="collab-x"> × oblivion</small></Link>
      <nav aria-label="Booking navigation">
        {!EVENT.postponed && <Link href="/passes">Get tickets</Link>}
        <Link href="/tickets">My passes</Link>
        {user ? <button onClick={logout}>Sign out</button> : <Link href="/login">Sign in</Link>}
      </nav>
    </header>
    <main className="booking-page" data-scene="off">
      <div className="book-heading"><p className="eyebrow">Euphoria <span className="collab-x">×</span> Oblivion · {EVENT.dateShort} · Knox Club &amp; Kitchen, Jubilee Hills</p><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      {children}
    </main>
    <footer className="book-footer"><Link href="/">← Back to the night</Link><span>Powered by <a href="https://telugu.social" target="_blank" rel="noopener noreferrer">telugu.social</a></span></footer>
  </>;
}
export function Loading({ text = 'Loading your night…' }) { return <div className="book-card book-state" role="status"><span className="book-spark">✦</span><p>{text}</p></div>; }
export function ErrorNotice({ message, onRetry }) { return <div className="book-error" role="alert"><p>{message}</p>{onRetry && <button className="btn btn-ghost" onClick={onRetry}>Try again</button>}</div>; }
export const displayValue = value => Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value ?? '');
export function DynamicField({ field, value, onChange, error }) {
  const id = `field-${field.key}`;
  const props = { id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined, 'aria-required': Boolean(field.required) };
  let control;
  if (field.type === 'checkbox') control = <input {...props} type="checkbox" checked={value === true} onChange={event => onChange(event.target.checked)} />;
  else if (['radio', 'multiselect'].includes(field.type)) control = <div className="book-choices" role="group" aria-labelledby={`${id}-label`}>
    {(field.options || []).map((option, index) => <label key={option}><input id={`${id}-${index}`} name={id} aria-invalid={Boolean(error)} type={field.type === 'radio' ? 'radio' : 'checkbox'} checked={field.type === 'radio' ? value === option : Array.isArray(value) && value.includes(option)} onChange={event => { const selected = Array.isArray(value) ? value : []; onChange(field.type === 'radio' ? option : event.target.checked ? [...selected, option] : selected.filter(item => item !== option)); }} />{option}</label>)}
  </div>;
  else if (field.type === 'select') control = <select {...props} value={value ?? ''} onChange={event => onChange(event.target.value)}><option value="">Choose an option</option>{(field.options || []).map(option => <option key={option}>{option}</option>)}</select>;
  else if (field.type === 'textarea') control = <textarea {...props} rows={4} placeholder={field.placeholder} value={value ?? ''} onChange={event => onChange(event.target.value)} />;
  else control = <input {...props} type={field.type === 'phone' ? 'tel' : field.type} placeholder={field.placeholder} value={value ?? ''} min={field.validation?.min ?? undefined} max={field.validation?.max ?? undefined} step={field.type === 'number' ? 'any' : undefined} autoComplete={{ name: 'name', email: 'email', phone: 'tel' }[field.key] || 'off'} onChange={event => onChange(field.type === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value)} />;
  return <div className={`book-field ${field.type === 'checkbox' ? 'book-checkbox' : ''}`}><label id={`${id}-label`} htmlFor={id}>{field.label}{field.required && <span> *</span>}</label>{control}{error && <span className="book-field-error" id={`${id}-error`}>{error}</span>}</div>;
}
