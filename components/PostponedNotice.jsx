import { EVENT } from '@/lib/event';

// Shown wherever tickets used to be sold while the event is postponed.
export default function PostponedNotice({ className = '', body = EVENT.postponedBody }) {
  return (
    <div className={`postponed-notice ${className}`} role="status">
      <p className="eyebrow !text-orchid">Event update</p>
      <h2>{EVENT.postponedTitle}</h2>
      <p>{body}</p>
      <p>Questions about your refund? Reach out to us.</p>
      <a className="btn btn-primary" href={EVENT.contact.url} target="_blank" rel="noopener noreferrer">
        {EVENT.contact.label} · {EVENT.contact.handle} <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
