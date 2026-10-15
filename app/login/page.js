'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { BookingFrame, Loading } from '@/components/BookingUI';

function LoginContent() {
  const router = useRouter();
  const search = useSearchParams();
  const requested = search.get('returnTo') || '/tickets';
  const target = /^\/(?!\/)/.test(requested) && !/[\\\r\n]/.test(requested) ? requested : '/tickets';
  return <BookingFrame title="Step into the glow." subtitle="Your account. Your way in."><div className="book-card book-auth-card"><AuthForm onSuccess={() => router.replace(target)} /></div></BookingFrame>;
}
export default function LoginPage() { return <Suspense fallback={<Loading />}><LoginContent /></Suspense>; }
