'use client';
import { useEvent } from '@/components/EventProvider';
import { BookingFrame, ErrorNotice, Loading } from '@/components/BookingUI';
export default function TermsPage() {
  const { settings, settingsLoading, settingsError, refreshSettings } = useEvent();
  return <BookingFrame title="Before the night." subtitle="Event terms and conditions.">{settingsLoading ? <Loading /> : settingsError ? <ErrorNotice message={settingsError} onRetry={refreshSettings} /> : <div className="book-card book-legal">{settings?.termsText || 'Event terms have not been published yet.'}</div>}</BookingFrame>;
}
