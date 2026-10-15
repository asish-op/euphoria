'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { api, errorMessage, PENDING_ORDER_KEY } from '@/lib/api';
import { money } from '@/lib/booking';
import { onlineGateway, startGatewayPayment } from '@/lib/paymentGateway';
import { useProtectedPage } from '@/components/EventProvider';
import { BookingFrame, ErrorNotice, Loading } from '@/components/BookingUI';

export default function OrderStatus({ orderId }) {
  const search = useSearchParams();
  const returnTo = `/order/${encodeURIComponent(orderId)}${search.get('startPayment') === '1' ? '?startPayment=1' : ''}`;
  const { user, authLoading, authError, refreshAuth } = useProtectedPage(returnTo);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payError, setPayError] = useState('');
  const [paying, setPaying] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [utr, setUtr] = useState('');
  const [proof, setProof] = useState('');
  const [proofError, setProofError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const paymentLock = useRef(false);
  const proofLock = useRef(false);
  const autoStarted = useRef(false);
  const fileVersion = useRef(0);
  const load = useCallback(async () => {
    try {
      const result = await api.getOrder(orderId);
      setOrder(result); setError(''); setUtr(result.manualUtr || '');
      if (result.paymentStatus === 'Paid' && localStorage.getItem(PENDING_ORDER_KEY) === orderId) localStorage.removeItem(PENDING_ORDER_KEY);
    } catch (error) { setOrder(null); setError(errorMessage(error)); }
    finally { setLoading(false); }
  }, [orderId]);
  useEffect(() => { if (user) void Promise.resolve().then(load); }, [user, load]);
  useEffect(() => {
    let active = true;
    if (user && order?.paymentStatus === 'Paid') api.getMyBookings().then(passes => { if (active) setTickets(passes.filter(pass => pass.orderId === orderId)); }).catch(() => {});
    return () => { active = false; };
  }, [user, order?.paymentStatus, orderId]);
  const resume = useCallback(async () => {
    if (paymentLock.current || !user) return;
    paymentLock.current = true; setPaying(true); setPayError('');
    try {
      const latest = await api.getOrder(orderId);
      setOrder(latest);
      if (latest.paymentStatus === 'Paid') { await load(); return; }
      const result = await startGatewayPayment(latest);
      const verified = await api.verifyPayment({
        orderId, attendees: latest.attendees || [], additionalInfo: latest.additionalInfo || {},
        ...(result.gateway === 'razorpay' ? { razorpayPaymentId: result.razorpayPaymentId, razorpayOrderId: result.razorpayOrderId, razorpaySignature: result.razorpaySignature } : {}),
      });
      if (!verified.success) throw new Error('Payment is not yet verified. Refresh your order status before paying again.');
      await load();
    } catch (error) { setPayError(errorMessage(error)); await load(); }
    finally { setPaying(false); paymentLock.current = false; }
  }, [user, orderId, load]);
  useEffect(() => {
    if (search.get('startPayment') === '1' && order && user && !autoStarted.current && order.paymentStatus !== 'Paid' && !order.manual && order.paymentMethod !== 'Manual UPI' && ['cashfree', 'razorpay'].includes(onlineGateway(order))) {
      autoStarted.current = true;
      void resume();
    }
  }, [search, order, user, resume]);
  function handleFile(file) {
    const version = ++fileVersion.current;
    setProof(''); setProofError('');
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1.8 * 1024 * 1024) { setProofError('Choose a PNG, JPEG, or WebP screenshot smaller than 1.8 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { if (fileVersion.current === version) setProof(String(reader.result || '')); };
    reader.onerror = () => { if (fileVersion.current === version) setProofError('This image could not be read. Please choose it again.'); };
    reader.readAsDataURL(file);
  }
  async function submitProof(event) {
    event.preventDefault();
    if (proofLock.current) return;
    if (!utr.trim() || !proof) { setProofError('Enter your transaction reference and upload a payment screenshot.'); return; }
    proofLock.current = true; setSubmitting(true); setProofError('');
    try {
      const result = await api.submitManualProof({ orderId, manualUtr: utr.trim(), paymentProofDataUrl: proof });
      if (!result.success) throw new Error('Your proof was not accepted. Please try again.');
      setSubmitted(true); setProof(''); await load();
    } catch (error) { setProofError(errorMessage(error)); }
    finally { setSubmitting(false); proofLock.current = false; }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(`${location.origin}/order/${encodeURIComponent(orderId)}`); setCopied(true); }
    catch { setPayError('Your browser couldn’t copy the link. You can copy this page’s address.'); }
  }
  const paid = order?.paymentStatus === 'Paid';
  const manual = order?.manual || order?.paymentMethod === 'Manual UPI';
  const upi = order?.upiPaymentUrl?.startsWith('upi://pay') ? order.upiPaymentUrl : null;
  return <BookingFrame title={paid ? 'Your night is confirmed.' : 'Your night is waiting.'} subtitle={`Secure order · ${orderId}`}>
    {authError ? <ErrorNotice message={authError} onRetry={refreshAuth} /> : authLoading || !user || (loading && !order) ? <Loading text="Checking your account and order…" /> : error ? <ErrorNotice message={error} onRetry={() => void load()} /> : order && <section className="book-card book-order">
      <div className="book-banner"><p className="eyebrow">Only you can view this order</p><span className={`book-status ${paid ? 'book-paid' : order.paymentStatus === 'Failed' ? 'book-failed' : ''}`}>{order.paymentStatus}</span></div>
      <dl className="book-order-facts">{[['Pass', order.passType], ['Quantity', order.quantity], ['Payment method', order.paymentMethod], ['Order total', money(order.amount, order.currency)], ['Booking charges', order.bookingChargeAmount == null ? null : money(order.bookingChargeAmount, order.currency)], ['Payment reference', order.cfPaymentId || order.rzpPaymentId]].filter(([, value]) => value != null).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      {(order.paymentFailureReason || order.adminReviewNote) && <div className="book-notice" role="status"><p>{order.paymentFailureReason}</p>{order.adminReviewNote !== order.paymentFailureReason && <p>{order.adminReviewNote}</p>}</div>}
      {paid ? <div className="book-state"><span className="book-spark">✦</span><h2>See you under the stars.</h2><p>Your payment is confirmed by the event service.</p>{tickets.map(ticket => <p key={ticket.id}>{ticket.buyerName} · {ticket.passType}<br /><strong>{ticket.ticketId || ticket.id}</strong></p>)}<Link href="/tickets" className="btn btn-primary">View my passes & QR codes →</Link></div> : manual ? <div className="book-manual"><h2>Pay with UPI.</h2><p className="book-muted">Pay the exact total, then submit your transaction reference and screenshot for review.</p><div className="book-upi-layout">{upi && <div><div className="book-qr"><QRCodeSVG value={upi} size={180} level="M" /></div><a className="btn btn-primary" href={upi}>Open UPI app →</a></div>}<div><p className="eyebrow">UPI ID</p><strong className="book-upi-id">{order.manualUpiId || order.upiId || 'Temporarily unavailable'}</strong><p className="eyebrow">Amount</p><strong>{money(order.amount, order.currency)}</strong><p className="eyebrow">Payment note</p><p>{order.manualPaymentNote || order.paymentNote || orderId}</p></div></div>
        {order.manualProofSubmitted || order.paymentProofSubmitted || submitted ? <p className="book-notice book-success" role="status">Payment proof received. Your order remains pending until the event team approves it. Refresh the status here for updates.</p> : order.paymentStatus === 'Pending' && <form className="book-form" onSubmit={submitProof}><label className="book-field">UTR / transaction reference<input value={utr} onChange={event => setUtr(event.target.value)} maxLength={100} required /></label><label className="book-field">Payment screenshot · PNG, JPEG or WebP, under 1.8 MB<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => handleFile(event.target.files?.[0])} /></label>{proof && <Image className="book-proof-preview" src={proof} alt="Your payment screenshot preview" width={600} height={400} unoptimized />}{proofError && <ErrorNotice message={proofError} />}<button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit payment proof'}</button></form>}
      </div> : <div className="book-payment"><p className="book-muted">Complete your payment to confirm your passes. Your order is saved so you can return at any time.</p>{['cashfree', 'razorpay'].includes(onlineGateway(order)) && <button className="btn btn-primary" disabled={paying} onClick={() => void resume()}>{paying ? 'Opening checkout…' : 'Continue payment'} →</button>}</div>}
      {payError && <ErrorNotice message={payError} />}
      <div className="book-actions"><button className="btn btn-ghost" disabled={paying || submitting} onClick={() => void load()}>Refresh status</button><button className="btn btn-ghost" onClick={() => void copyLink()}>{copied ? 'Link copied' : 'Copy secure link'}</button><Link href="/tickets" className="book-text-button">My passes →</Link></div>
    </section>}
  </BookingFrame>;
}
