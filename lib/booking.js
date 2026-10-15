const coreFields = [
  { key: 'name', label: 'Full name', type: 'text', required: true, enabled: true, sortOrder: 0 },
  { key: 'email', label: 'Email', type: 'email', required: true, enabled: true, sortOrder: 1 },
  { key: 'phone', label: 'Phone number', type: 'phone', required: true, enabled: true, sortOrder: 2 },
];

export function quantityBounds(settings, pass) {
  const min = Math.max(1, settings?.minPassesPerBooking ?? 1, pass.minPurchaseQuantity ?? 1);
  const max = Math.min(settings?.maxPassesPerBooking ?? 1, pass.maxPurchaseQuantity ?? Infinity, Math.max(0, pass.totalQuantity - pass.soldCount));
  return { min, max, available: max >= min && pass.status === 'On Sale' && pass.price != null && Number.isFinite(pass.price) && !['ended', 'cancelled'].includes(settings?.eventStatus) };
}

export function bookingSteps(config, quantity) {
  const sorted = [...config.steps].sort((a, b) => a.sortOrder - b.sortOrder).map(step => ({
    ...step,
    fields: (step.fields || []).filter(field => field.enabled).sort((a, b) => a.sortOrder - b.sortOrder).map(field => ({
      ...field, required: step.repeatPerAttendee && coreFields.some(core => core.key === field.key) ? true : field.required,
    })),
  }));
  const per = sorted.filter(step => step.repeatPerAttendee);
  const once = sorted.filter(step => !step.repeatPerAttendee);
  const missing = coreFields.filter(field => !per.some(step => step.fields.some(item => item.key === field.key)));
  if (missing.length) per.unshift({ name: 'Attendee details', fields: missing, repeatPerAttendee: true });
  return [
    ...Array.from({ length: quantity }, (_, attendee) => per.filter(step => step.fields.length).map(step => ({ step, attendee }))).flat(),
    ...once.filter(step => step.fields.length).map(step => ({ step, attendee: null })),
  ];
}

export function fieldError(field, value) {
  const empty = value == null || value === '' || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length) || (field.type === 'checkbox' && value !== true);
  if (empty) return field.required ? `${field.label} is required.` : null;
  const rules = field.validation || {};
  if (field.type === 'number') {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'Enter a valid number.';
    if (rules.min != null && number < rules.min) return `Must be at least ${rules.min}.`;
    if (rules.max != null && number > rules.max) return `Must be at most ${rules.max}.`;
  }
  if (typeof value === 'string') {
    if (rules.minLength != null && value.trim().length < rules.minLength) return `Use at least ${rules.minLength} characters.`;
    if (rules.maxLength != null && value.trim().length > rules.maxLength) return `Use at most ${rules.maxLength} characters.`;
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address.';
    if (field.type === 'phone' && !/^[+\d\s()\-]{7,20}$/.test(value.trim())) return 'Enter a valid phone number.';
    if (rules.pattern) {
      try { if (!new RegExp(rules.pattern).test(value.trim())) return `${field.label} has an invalid format.`; }
      catch { return 'This field’s validation is unavailable. Please contact the event team.'; }
    }
  }
  if (Array.isArray(value)) {
    if (rules.min != null && value.length < rules.min) return `Choose at least ${rules.min} options.`;
    if (rules.max != null && value.length > rules.max) return `Choose at most ${rules.max} options.`;
    if (value.some(option => !field.options?.includes(option))) return 'Choose an available option.';
  }
  if (['select', 'radio'].includes(field.type) && !field.options?.includes(String(value))) return 'Choose an available option.';
  return null;
}

export const money = (amount, currency = 'INR', symbol = '₹') => {
  if (amount == null) return 'Announcing soon';
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount); }
  catch { return `${symbol}${Number(amount).toFixed(2)}`; }
};
export function formatDate(value) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return 'Announcing soon';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(value));
}
export function attendeeDetails(pass) {
  const values = { name: pass.buyerName, email: pass.email, phone: pass.phone };
  for (const [key, value] of Object.entries(pass)) {
    if (/^attendee[A-Z]/.test(key) && value != null) {
      const field = key.slice(8);
      values[field[0].toLowerCase() + field.slice(1)] = value;
    }
  }
  return { ...values, ...pass.attendee };
}
