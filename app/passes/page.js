'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, errorMessage, PENDING_ORDER_KEY } from '@/lib/api';
import { bookingSteps, fieldError, money, quantityBounds } from '@/lib/booking';
import { onlineGateway } from '@/lib/paymentGateway';
import { useEvent } from '@/components/EventProvider';
import { BookingFrame, DynamicField, ErrorNotice, Loading, displayValue } from '@/components/BookingUI';
import AuthForm from '@/components/AuthForm';
import { EVENT } from '@/lib/event';

export default function PassesPage() {
  const router = useRouter();
  const { settings, settingsLoading, settingsError, refreshSettings, user, authLoading, authError, refreshAuth } = useEvent();
  const [catalog, setCatalog] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('browse');
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [attendees, setAttendees] = useState([]);
  const [additional, setAdditional] = useState({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [accepted, setAccepted] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const [success, setSuccess] = useState(null);
  const lock = useRef(false);
  const heading = useRef(null);
  const load = useCallback(async () => {
    try {
      const [passes, form] = await Promise.all([api.getPassTypes(), api.getFormConfig()]);
      if (!Array.isArray(passes) || !Array.isArray(form.steps)) throw new Error('Pass details are temporarily unavailable.');
      setCatalog([...passes].sort((a, b) => a.sortOrder - b.sortOrder));
      setConfig(form); setError('');
    } catch (error) { setError(errorMessage(error)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => {
    if (!user) return;
    const id = localStorage.getItem(PENDING_ORDER_KEY);
    let active = true;
    if (id) api.getOrder(id).then(order => {
      if (!active) return;
      if (order.paymentStatus === 'Paid') localStorage.removeItem(PENDING_ORDER_KEY);
      else setPending(order);
    }).catch(error => { if (active && error instanceof ApiError && [403, 404].includes(error.status)) localStorage.removeItem(PENDING_ORDER_KEY); });
    return () => { active = false; };
  }, [user]);
  useEffect(() => { heading.current?.focus(); }, [phase, step]);
  const steps = useMemo(() => config ? bookingSteps(config, quantity) : [], [config, quantity]);
  const current = steps[step];
  const bounds = selected ? quantityBounds(settings, selected) : { min: 1, max: 1, available: false };
  function choose(pass) {
    const next = quantityBounds(settings, pass);
    if (!next.available) return;
    setSelected(pass); setQuantity(next.min); setAttendees([]); setAdditional({});
    setErrors({}); setAccepted(false); setCheckoutError(''); setStep(0);
    setPhase(user ? 'quantity' : 'auth');
  }
  function startDetails() {
    setAttendees(Array.from({ length: quantity }, (_, index) => attendees[index] || {}));
    setStep(0); setPhase(steps.length ? 'details' : 'review');
  }
  function continueDetails(event) {
    event.preventDefault();
    const values = current.attendee === null ? additional : attendees[current.attendee] || {};
    const next = Object.fromEntries(current.step.fields.map(field => [field.key, fieldError(field, values[field.key])]).filter(([, error]) => error));
    setErrors(next);
    if (Object.keys(next).length) { requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus()); return; }
    if (step + 1 < steps.length) setStep(step + 1);
    else setPhase('review');
  }
  async function create(codes) {
    if (lock.current || !selected || !user || !bounds.available || (config.showTerms && !accepted)) return;
    lock.current = true; setBusy(true); setCheckoutError('');
    try {
      const fresh = (await api.getPassTypes()).find(pass => pass.name === selected.name);
      const freshBounds = fresh ? quantityBounds(settings, fresh) : null;
      if (!fresh || !freshBounds.available || quantity < freshBounds.min || quantity > freshBounds.max || fresh.price !== selected.price) {
        await load(); setSelected(null); setPhase('browse');
        throw new Error('Pass availability or price has changed. Please review the updated tiers.');
      }
      const clean = values => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
      const result = await api.createOrder({ tierName: selected.name, attendees: attendees.map(clean), additionalInfo: { ...clean(additional), agreeTerms: config.showTerms ? accepted : true }, ...codes });
      if (!result.orderId) throw new Error('The order could not be confirmed. Check My passes before trying again.');
      if (result.free && result.success) {
        localStorage.removeItem(PENDING_ORDER_KEY); setSuccess(result); setPhase('success'); return;
      }
      localStorage.setItem(PENDING_ORDER_KEY, result.orderId);
      const auto = !result.manual && ['cashfree', 'razorpay'].includes(onlineGateway(result));
      router.push(`/order/${encodeURIComponent(result.orderId)}${auto ? '?startPayment=1' : ''}`);
    } catch (error) { setCheckoutError(errorMessage(error)); }
    finally { setBusy(false); lock.current = false; }
  }
  return <BookingFrame title="Your spot in the stars." subtitle="Choose your pass. Bring your people. Make it a night.">
    {loading || settingsLoading || authLoading ? <Loading text="Finding passes and booking details…" /> : error || settingsError ? <ErrorNotice message={error || settingsError} onRetry={() => { void load(); void refreshSettings(); }} /> : !config || !settings ? <ErrorNotice message="Booking details are unavailable." /> : <>
      {phase === 'browse' ? <>
        {checkoutError && <ErrorNotice message={checkoutError} />}
        <div className="book-event-strip"><div><span>Event</span><strong>Euphoria <span className="collab-x">×</span> Oblivion</strong></div><div><span>Date</span><strong>{EVENT.date}</strong></div><div><span>Venue</span><strong>{EVENT.venue}, {EVENT.venueArea}</strong></div></div>
        {pending && user && <div className="book-card book-banner"><div><p className="eyebrow">Pick up where you left off</p><p>Order {pending.orderId} · {pending.paymentStatus}</p></div><Link className="btn btn-ghost" href={`/order/${encodeURIComponent(pending.orderId)}`}>Resume order →</Link></div>}
        {catalog.length ? <div className="book-pass-grid">{catalog.map(pass => {
          const available = quantityBounds(settings, pass);
          return <article className={`book-card book-pass ${pass.featured ? 'book-featured' : ''}`} key={pass.id || pass._id || pass.name}>
            <div className="book-pass-top"><p className="eyebrow">{pass.badge || pass.badgeLabel || 'Euphoria pass'}</p><span aria-hidden="true">✦</span></div>
            <h2>{pass.name}</h2><p className="book-muted">{pass.subtitle}</p>
            <p className="book-price">{money(pass.price, settings.currency, settings.currencySymbol)}{pass.originalPrice > pass.price && pass.price != null && <del>{money(pass.originalPrice, settings.currency, settings.currencySymbol)}</del>}</p>
            <ul>{(pass.perks || []).map(perk => <li key={perk}><span aria-hidden="true">✧</span>{perk}</li>)}</ul>
            {(pass.entryTime || settings.entryTime) && <p className="book-muted">Entry · {pass.entryTime || settings.entryTime}</p>}
            <p className="book-stock">{pass.status === 'On Sale' ? `${Math.max(0, pass.totalQuantity - pass.soldCount)} passes remaining` : pass.status}</p>
            <button className={`btn ${pass.featured ? 'btn-primary' : 'btn-ghost'}`} disabled={!available.available} onClick={() => choose(pass)}><span>{available.available ? 'Select pass' : pass.status === 'On Sale' ? 'Unavailable' : pass.status}</span>{available.available && <span aria-hidden="true">→</span>}</button>
          </article>;
        })}</div> : <div className="book-card book-state"><span className="book-spark">✦</span><h2>The night is taking shape.</h2><p>Passes haven’t been announced yet. Check back for official tiers and prices.</p><button className="btn btn-ghost" onClick={() => void load()}>Check availability</button></div>}
      </> : phase === 'success' ? <div className="book-card book-state"><span className="book-spark">✦</span><p className="eyebrow">You’re on the list</p><h2>Your night. Confirmed.</h2><p>Order {success.orderId}</p>{success.passes?.map(pass => <p key={pass.id}>{pass.buyerName} · {pass.passType}<br /><strong>{pass.ticketId || pass.id}</strong></p>)}<div className="book-actions"><Link className="btn btn-primary" href="/tickets">View my passes →</Link><Link className="btn btn-ghost" href={`/order/${encodeURIComponent(success.orderId)}`}>Order status</Link></div></div> : <div className="book-checkout-grid">
        <section className="book-card">
          <ol className="book-progress" aria-label="Booking progress">{['Account', 'Quantity', 'Details', 'Payment'].map((label, index) => <li key={label} aria-current={index === (!user || phase === 'auth' ? 0 : phase === 'quantity' ? 1 : phase === 'details' ? 2 : 3) ? 'step' : undefined}><b>{String(index + 1).padStart(2, '0')}</b><span>{label}</span></li>)}</ol>
          {!user || phase === 'auth' ? <>{authError ? <ErrorNotice message={authError} onRetry={refreshAuth} /> : <AuthForm onSuccess={() => setPhase('quantity')} />}<button className="book-text-button" onClick={() => setPhase('browse')}>← Back to passes</button></> : phase === 'quantity' ? <>
            <p className="eyebrow">Bring your people</p><h2 ref={heading} tabIndex={-1}>How many are coming?</h2><p className="book-muted">Choose {bounds.min}–{bounds.max} passes for {selected.name}.</p>
            <div className="book-quantity"><button aria-label="Decrease quantity" disabled={quantity <= bounds.min} onClick={() => setQuantity(quantity - 1)}>−</button><output aria-live="polite">{quantity}</output><button aria-label="Increase quantity" disabled={quantity >= bounds.max} onClick={() => setQuantity(quantity + 1)}>+</button></div>
            <div className="book-actions"><button className="btn btn-ghost" onClick={() => setPhase('browse')}>← Back</button><button className="btn btn-primary" disabled={!bounds.available} onClick={startDetails}>Attendee details →</button></div>
          </> : phase === 'details' && current ? <form className="book-form" noValidate onSubmit={continueDetails}>
            <p className="eyebrow">{current.attendee === null ? 'Booking details' : `Attendee ${current.attendee + 1} of ${quantity}`} · Step {step + 1}/{steps.length}</p><h2 ref={heading} tabIndex={-1}>{current.step.name}</h2>
            {current.step.fields.map(field => <DynamicField key={`${step}-${field.key}`} field={field} value={(current.attendee === null ? additional : attendees[current.attendee] || {})[field.key]} error={errors[field.key]} onChange={value => { if (current.attendee === null) setAdditional(previous => ({ ...previous, [field.key]: value })); else setAttendees(previous => previous.map((values, index) => index === current.attendee ? { ...values, [field.key]: value } : values)); setErrors(previous => ({ ...previous, [field.key]: '' })); }} />)}
            <div className="book-actions"><button type="button" className="btn btn-ghost" onClick={() => { setErrors({}); if (step > 0) setStep(step - 1); else setPhase('quantity'); }}>← Back</button><button className="btn btn-primary" type="submit">{step === steps.length - 1 ? 'Review booking' : 'Continue'} →</button></div>
          </form> : phase === 'review' ? <Review pass={selected} quantity={quantity} attendees={attendees} additional={additional} config={config} accepted={accepted} setAccepted={setAccepted} onCreate={create} busy={busy} error={checkoutError} onBack={() => { setStep(Math.max(0, steps.length - 1)); setPhase(steps.length ? 'details' : 'quantity'); }} /> : null}
        </section>
        <aside className="book-card book-summary"><p className="eyebrow">Your night</p><span className="book-brand">euphoria✦</span><p className="book-summary-event">Euphoria <span className="collab-x">×</span> Oblivion<span>{EVENT.date}</span><span>{EVENT.venue}, Jubilee Hills</span></p><h3>{selected.name}</h3><p className="book-muted">{quantity} {quantity === 1 ? 'pass' : 'passes'} · {money(selected.price, settings.currency, settings.currencySymbol)} each</p><div className="book-total-line"><span>Pass subtotal</span><strong>{money(selected.price * quantity, settings.currency, settings.currencySymbol)}</strong></div><p className="book-muted">Discounts and booking charges appear in the review. Your final amount is confirmed before payment.</p></aside>
      </div>}
    </>}
  </BookingFrame>;
}

function Review({ pass, quantity, attendees, additional, config, accepted, setAccepted, onCreate, busy, error, onBack }) {
  const { settings } = useEvent();
  const [codes, setCodes] = useState({ coupon: '', redeem: '', referral: '' });
  const [valid, setValid] = useState({});
  const [checking, setChecking] = useState('');
  const [codeError, setCodeError] = useState('');
  const subtotal = pass.price * quantity;
  async function apply(kind) {
    const code = codes[kind].trim();
    if (!code || checking) return;
    setChecking(kind); setCodeError('');
    try {
      const result = kind === 'coupon' ? await api.validateCoupon({ code, cartAmount: subtotal }) : kind === 'redeem' ? await api.validateRedeemCode({ code }) : await api.validateReferral({ code });
      if (!result.valid) throw new Error(result.error || 'This code is not valid.');
      if (kind === 'redeem' && (result.passType || result.redeem?.passType) !== pass.name) throw new Error('This redeem code is for a different pass tier.');
      const canonical = kind === 'coupon' ? result.coupon?.code : kind === 'redeem' ? result.redeem?.code : result.referral?.code;
      setCodes(previous => ({ ...previous, [kind]: canonical || code }));
      setValid(previous => ({ ...previous, [kind]: result }));
    } catch (error) { setValid(previous => ({ ...previous, [kind]: undefined })); setCodeError(errorMessage(error)); }
    finally { setChecking(''); }
  }
  const discount = Math.min(subtotal, Math.max(0, valid.coupon?.discount ?? 0));
  const freeCount = valid.redeem?.freePassCount ?? valid.redeem?.redeem?.freePassCount ?? 0;
  const redeemed = Math.min(quantity, freeCount) * pass.price;
  const net = Math.max(0, subtotal - discount - redeemed);
  const fee = settings.bookingChargePercent == null ? null : Number((net * settings.bookingChargePercent / 100).toFixed(2));
  const price = amount => money(amount, settings.currency, settings.currencySymbol);
  return <div className="book-review">
    <p className="eyebrow">One last look</p><h2>Ready to shine?</h2>
    {attendees.map((values, index) => <details className="book-details" key={index}><summary>{String(index + 1).padStart(2, '0')} / {values.name || `Attendee ${index + 1}`}</summary><dl>{Object.entries(values).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{displayValue(value)}</dd></div>)}</dl></details>)}
    {Object.keys(additional).length > 0 && <details className="book-details"><summary>Additional booking details</summary><dl>{Object.entries(additional).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{displayValue(value)}</dd></div>)}</dl></details>}
    <details className="book-details"><summary>Have a coupon, redeem, or referral code?</summary>{['coupon', 'redeem', 'referral'].map(kind => <div className="book-code-row" key={kind}><label className="book-field">{kind[0].toUpperCase() + kind.slice(1)} code<input disabled={busy || Boolean(checking)} value={codes[kind]} onChange={event => { setCodes(previous => ({ ...previous, [kind]: event.target.value })); setValid(previous => ({ ...previous, [kind]: undefined })); setCodeError(''); }} /></label><button className="btn btn-ghost" disabled={busy || Boolean(checking) || !codes[kind].trim()} onClick={() => void apply(kind)}>{checking === kind ? 'Checking…' : valid[kind] ? 'Applied ✓' : 'Apply'}</button>{valid[kind] && <p className="book-success" role="status">{kind === 'redeem' ? `${freeCount} free passes recognized` : kind === 'referral' ? `Referral recognized${valid.referral.referral?.ownerName ? `: ${valid.referral.referral.ownerName}` : ''}` : 'Coupon applied'}</p>}</div>)}{codeError && <ErrorNotice message={codeError} />}</details>
    <div className="book-totals"><div className="book-total-line"><span>Subtotal</span><strong>{price(subtotal)}</strong></div>{discount > 0 && <div className="book-total-line book-success"><span>Coupon discount</span><strong>−{price(discount)}</strong></div>}{redeemed > 0 && <div className="book-total-line book-success"><span>Redeemed passes</span><strong>−{price(redeemed)}</strong></div>}<div className="book-total-line"><span>Booking charges{fee != null ? ` (${settings.bookingChargePercent}%)` : ''}</span><strong>{fee == null ? 'Confirmed with your order' : price(fee)}</strong></div><div className="book-total-line book-grand-total"><span>Estimated total</span><strong>{price(net + (fee || 0))}</strong></div><p className="book-muted">The event service confirms the final amount before payment.</p></div>
    {config.showTerms && <><details className="book-details"><summary>Read event terms</summary><p className="book-legal">{settings.termsText || 'Please read the published terms before continuing.'}</p><Link href="/tos" target="_blank">Open terms ↗</Link></details><label className="book-check"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} />{config.termsLabel || 'I agree to the terms and conditions'}</label></>}
    {error && <ErrorNotice message={error} />}
    <div className="book-actions"><button className="btn btn-ghost" disabled={busy} onClick={onBack}>← Back</button><button className="btn btn-primary" disabled={busy || Boolean(checking) || (config.showTerms && !accepted)} onClick={() => onCreate({ couponCode: valid.coupon ? codes.coupon.trim() : undefined, redeemCode: valid.redeem ? codes.redeem.trim() : undefined, referralCode: valid.referral ? codes.referral.trim() : undefined })}>{busy ? 'Creating your order…' : 'Continue to payment'} →</button></div>
  </div>;
}
