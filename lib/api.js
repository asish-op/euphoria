export const TOKEN_KEY = 'hydhigh_token';
export const PENDING_ORDER_KEY = 'pending_order_id';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function apiBaseUrl(value) {
  const configured = value?.trim().replace(/\/+$/, '');
  if (!configured) throw new ApiError('The event service is not configured yet. Please check back soon.', 0);
  try {
    const url = new URL(configured);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Invalid URL');
    if (url.pathname === '/') url.pathname = '/api';
    return url.toString().replace(/\/+$/, '');
  } catch {
    throw new ApiError('The event service URL is invalid. Please contact the event team.', 0);
  }
}

export async function fetchApi(path, { authenticated = false, ...options } = {}) {
  const base = apiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  const token = authenticated && typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  let response;
  try {
    response = await fetch(`${base}${path}`, { ...options, headers, cache: 'no-store', signal: options.signal ?? AbortSignal.timeout(20000) });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError('We couldn’t reach the event service. Please try again.', 0);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token && localStorage.getItem(TOKEN_KEY) === token)
      window.dispatchEvent(new Event('euphoria:unauthorized'));
    throw new ApiError(data?.error || data?.message || `Request failed (${response.status}). Please try again.`, response.status);
  }
  if (data == null) throw new ApiError('The event service returned an unreadable response. Please try again.', response.status);
  return data;
}

const post = (path, data, authenticated = false) => fetchApi(path, { method: 'POST', body: JSON.stringify(data), authenticated });
const list = async path => {
  const data = await fetchApi(path, { authenticated: true });
  if (!Array.isArray(data)) throw new ApiError('Your booking details could not be read. Please try again.', 200);
  return data;
};

export const api = {
  register: data => post('/auth/register', data),
  login: data => post('/auth/login', data),
  getMe: () => fetchApi('/auth/me', { authenticated: true }),
  getSettings: () => fetchApi('/settings'),
  getFormConfig: () => fetchApi('/form-config'),
  getPassTypes: () => fetchApi('/pass-types'),
  createOrder: data => post('/bookings/create-order', data, true),
  verifyPayment: data => post('/bookings/verify-payment', data, true),
  submitManualProof: data => post('/bookings/manual-proof', data, true),
  getOrder: id => fetchApi(`/bookings/order/${encodeURIComponent(id)}`, { authenticated: true }),
  getPendingOrders: () => list('/bookings/pending'),
  getMyBookings: () => list('/bookings/my'),
  validateCoupon: data => post('/coupons/validate', data),
  validateRedeemCode: data => post('/redeem-codes/validate', data),
  validateReferral: data => post('/referrals/validate', data),
};

export const errorMessage = error => error instanceof Error ? error.message : 'Something went wrong. Please try again.';
