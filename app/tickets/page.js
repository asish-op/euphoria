'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { api, ApiError, errorMessage, PENDING_ORDER_KEY } from '@/lib/api';
import { attendeeDetails, formatDate, money } from '@/lib/booking';
import { useProtectedPage } from '@/components/EventProvider';
import { BookingFrame, ErrorNotice, Loading, displayValue } from '@/components/BookingUI';

export default function TicketsPage() {
  const { user, authLoading, authError, refreshAuth, settings } = useProtectedPage('/tickets');
  const [tickets, setTickets] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [downloading, setDownloading] = useState('');
  const [copied, setCopied] = useState('');
  const load = useCallback(async () => {
    const [bookings, orders] = await Promise.allSettled([api.getMyBookings(), api.getPendingOrders()]);
    if (bookings.status === 'fulfilled') { setTickets(bookings.value); setError(''); }
    else setError(errorMessage(bookings.reason));
    if (orders.status === 'fulfilled') setPending(orders.value);
    else {
      setPending([]);
      const id = localStorage.getItem(PENDING_ORDER_KEY);
      if (id) {
        try { const order = await api.getOrder(id); if (order.paymentStatus === 'Paid') localStorage.removeItem(PENDING_ORDER_KEY); else setPending([order]); }
        catch (error) {
          if (error instanceof ApiError && [403, 404].includes(error.status)) localStorage.removeItem(PENDING_ORDER_KEY);
          else setNotice('Pending orders could not be refreshed. Reopen a saved order link to check its status.');
        }
      }
    }
    setLoading(false);
  }, []);
  useEffect(() => { if (user) void Promise.resolve().then(load); }, [user, load]);
  const history = useMemo(() => {
    const grouped = new Map();
    for (const ticket of tickets) {
      if (!ticket.orderId) continue;
      let order = grouped.get(ticket.orderId);
      if (!order) { order = { id: ticket.orderId, status: ticket.paymentStatus || (['Valid', 'Inside', 'Used'].includes(ticket.status) ? 'Paid' : ticket.status), method: ticket.paymentMethod || 'See order', amount: ticket.orderAmount ?? 0, quantity: ticket.orderQuantity ?? 0, date: ticket.purchaseDate, tiers: new Set() }; grouped.set(order.id, order); }
      if (ticket.orderAmount == null) order.amount += ticket.price || 0;
      if (ticket.orderQuantity == null) order.quantity++;
      order.tiers.add(ticket.passType);
    }
    for (const order of pending) if (!grouped.has(order.orderId)) grouped.set(order.orderId, { id: order.orderId, status: order.paymentStatus || 'Pending', method: order.paymentMethod || 'See order', amount: order.amount, quantity: order.quantity || 0, date: order.updatedAt || order.createdAt, tiers: new Set([order.passType || 'Pass']) });
    return [...grouped.values()].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [tickets, pending]);
  async function copyId(id) {
    try { await navigator.clipboard.writeText(id); setCopied(id); }
    catch { setNotice('Your browser couldn’t copy the ticket ID. You can select and copy it from your pass.'); }
  }
  async function invoice(ticket) {
    setDownloading(ticket.id); setNotice('');
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      pdf.setFillColor(11, 6, 22); pdf.rect(0, 0, 210, 297, 'F');
      pdf.setTextColor(196, 181, 253); pdf.setFontSize(24); pdf.text('Euphoria / Pass invoice', 20, 25);
      pdf.setFontSize(11);
      let y = 48;
      const rows = [['Event', settings?.eventName || 'Euphoria'], ['Pass', ticket.passType], ['Ticket ID', ticket.ticketId || ticket.id], ['Order ID', ticket.orderId || ''], ['Attendee', ticket.buyerName], ['Email', ticket.email || ticket.buyerEmail || ''], ['Amount paid', `${settings?.currency || 'INR'} ${Number(ticket.price).toFixed(2)}`], ['Purchased', formatDate(ticket.purchaseDate)], ['Payment method', ticket.paymentMethod || 'See order'], ['Status', ticket.status], ['Event date', formatDate(settings?.eventDate)], ['Entry', settings?.entryTime || 'Announcing soon'], ['Venue', settings?.venueName || 'Announcing soon']];
      for (const [label, value] of rows) { const lines = pdf.splitTextToSize(String(value), 110); pdf.text(label, 20, y); pdf.setTextColor(245, 243, 255); pdf.text(lines, 75, y); pdf.setTextColor(196, 181, 253); y += Math.max(13, lines.length * 5 + 6); }
      pdf.save(`Euphoria-${(ticket.ticketId || ticket.id).replace(/[^a-zA-Z0-9-]/g, '')}.pdf`);
    } catch { setNotice('Your invoice could not be downloaded. Please try again.'); }
    finally { setDownloading(''); }
  }
  return <BookingFrame title="Your night. Your passes." subtitle={user ? `Welcome, ${user.name}. Everything you need for the door.` : 'Keep your night close.'}>
    {authError ? <ErrorNotice message={authError} onRetry={refreshAuth} /> : authLoading || !user || loading ? <Loading text="Finding your passes…" /> : error ? <ErrorNotice message={error} onRetry={() => void load()} /> : <>
      {notice && <p className="book-notice" role="status">{notice}</p>}
      {history.length > 0 && <section className="book-card book-history"><div className="book-banner"><h2>Order history</h2><button className="book-text-button" onClick={() => void load()}>Refresh ↗</button></div>{history.map(order => <div className="book-history-row" key={order.id}><div><strong>{order.id}</strong><p className="book-muted">{[...order.tiers].join(', ')} · {order.quantity} {order.quantity === 1 ? 'pass' : 'passes'}</p></div><span>{order.method}</span><strong>{money(order.amount, settings?.currency, settings?.currencySymbol)}</strong><span className={`book-status ${order.status === 'Paid' ? 'book-paid' : order.status === 'Failed' ? 'book-failed' : ''}`}>{order.status}</span><Link className="book-text-button" href={`/order/${encodeURIComponent(order.id)}`}>View order →</Link></div>)}</section>}
      {tickets.length === 0 ? <div className="book-card book-state"><span className="book-spark">✦</span><h2>Your night is still unwritten.</h2><p>Your confirmed passes will live here.</p><Link className="btn btn-primary" href="/passes">Explore passes →</Link></div> : <div className="book-ticket-grid">{tickets.map(ticket => {
        const ticketId = ticket.ticketId || ticket.id;
        return <article className="book-card book-ticket" key={ticket.id}><div><p className="eyebrow">{settings?.eventName || 'Euphoria'} · Your way in</p><div className="book-banner"><h2>{ticket.passType}</h2><span className={`book-status ${['Valid', 'Inside'].includes(ticket.status) ? 'book-paid' : ''}`}>{ticket.status}</span></div><p className="book-muted">Attendee</p><h3>{ticket.buyerName}</h3><p>{formatDate(settings?.eventDate)} · {settings?.entryTime || 'Time announcing soon'}</p><p className="book-muted">{settings?.venueName || 'Venue announcing soon'}</p>{ticket.entryTime && <p className="book-muted">Entered: {new Date(ticket.entryTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>}{ticket.exitTime && <p className="book-muted">Exited: {new Date(ticket.exitTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>}<details className="book-details"><summary>Attendee details</summary>{Object.entries(attendeeDetails(ticket)).filter(([, value]) => value != null).map(([key, value]) => <p key={key}>{key}: {displayValue(value)}</p>)}</details><div className="book-actions"><button className="btn btn-ghost" disabled={downloading === ticket.id} onClick={() => void invoice(ticket)}>{downloading === ticket.id ? 'Saving…' : 'Download invoice'}</button><button className="book-text-button" onClick={() => void copyId(ticketId)}>{copied === ticketId ? 'ID copied' : 'Copy ID'}</button></div></div><div className="book-ticket-code">{['Valid', 'Inside', 'Used'].includes(ticket.status) && <div className="book-qr"><QRCodeSVG value={ticketId} size={144} level="H" title={`Entry QR for ${ticket.buyerName}`} /></div>}<code>{ticketId}</code><p className="eyebrow">{ticket.status === 'Valid' ? 'Your way in' : ticket.status}</p></div></article>;
      })}</div>}
    </>}
  </BookingFrame>;
}
