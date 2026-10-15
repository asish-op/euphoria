import { Suspense } from 'react';
import { Loading } from '@/components/BookingUI';
import OrderStatus from './status-client';

export default async function OrderPage({ params }) {
  const { orderId } = await params;
  return <Suspense fallback={<Loading />}><OrderStatus key={orderId} orderId={orderId} /></Suspense>;
}
