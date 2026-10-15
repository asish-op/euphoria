const scripts = new Map();
function loadScript(src, ready) {
  if (ready()) return Promise.resolve();
  if (scripts.has(src)) return scripts.get(src);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(fail, 20000);
    function cleanup() { clearTimeout(timer); script.onload = null; script.onerror = null; }
    function fail() {
      cleanup(); script.remove(); scripts.delete(src);
      reject(new Error('The payment service could not load. Please try again.'));
    }
    script.src = src;
    script.async = true;
    script.onload = () => { if (ready()) { cleanup(); resolve(); } else fail(); };
    script.onerror = fail;
    document.body.appendChild(script);
  });
  scripts.set(src, promise);
  return promise;
}
export const onlineGateway = order => (order.gateway || order.paymentMethod || '').toLowerCase();
export async function startGatewayPayment(order) {
  const gateway = onlineGateway(order);
  if (gateway === 'cashfree') {
    if (!order.paymentSessionId) throw new Error('Payment session unavailable. Please refresh your order.');
    await loadScript('https://sdk.cashfree.com/js/v3/cashfree.js', () => Boolean(window.Cashfree));
    const result = await window.Cashfree({ mode: order.cashfreeMode || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') }).checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: '_modal' });
    if (result?.error) throw new Error(result.error.message || 'Payment was not completed. Your order is saved.');
    return { gateway: 'cashfree' };
  }
  if (gateway === 'razorpay') {
    const gatewayOrder = order.rzpOrderId || order.razorpayOrderId;
    if (!gatewayOrder || !order.razorpayKeyId) throw new Error('Checkout details unavailable. Please refresh your order.');
    await loadScript('https://checkout.razorpay.com/v1/checkout.js', () => Boolean(window.Razorpay));
    return new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: order.razorpayKeyId, order_id: gatewayOrder,
        amount: order.amountInSubunits ?? Math.round(order.amount * 100), currency: order.currency || 'INR',
        name: order.eventName || 'Euphoria', description: `${order.passType || 'Pass'} × ${order.quantity || 1}`,
        prefill: { name: order.attendees?.[0]?.name || order.userName || '', email: order.attendees?.[0]?.email || order.email || '', contact: order.attendees?.[0]?.phone || '' },
        notes: { orderId: order.orderId }, theme: { color: '#c084fc' },
        handler: response => {
          if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) return reject(new Error('Payment confirmation is incomplete. Refresh your order status.'));
          resolve({ gateway: 'razorpay', razorpayPaymentId: response.razorpay_payment_id, razorpayOrderId: response.razorpay_order_id, razorpaySignature: response.razorpay_signature });
        },
        modal: { ondismiss: () => reject(new Error('Checkout was closed. Your order is saved so you can try again.')) },
      });
      checkout.on('payment.failed', response => reject(new Error(response.error?.description || 'Payment failed. Please try again.')));
      checkout.open();
    });
  }
  throw new Error('This order does not support online payment.');
}
