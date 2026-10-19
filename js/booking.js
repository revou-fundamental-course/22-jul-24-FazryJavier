import { SITE } from './data/site.js';

const pad = (n) => String(n).padStart(2, '0');

/** Local-date YYYY-MM-DD (avoids the UTC shift of toISOString). */
export function toDateString(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function minTravelDate(today = new Date()) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + SITE.minLeadDays);
    return toDateString(d);
}

/** Collapse whitespace/control characters so single-line fields cannot inject extra lines into the message. */
export function cleanLine(value, max = 120) {
    return String(value ?? '').replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function cleanNotes(value) {
    return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, 500);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s().-]*$/;

/**
 * Validate booking values. Returns { field: errorCode } — empty object means valid.
 * Error codes map to locale keys `err.<code>`.
 */
export function validate(values, validPackageIds, today = new Date()) {
    const errors = {};
    const name = cleanLine(values.name, 200);
    if (!name) errors.name = 'required';
    else if (name.length < 2 || name.length > 80) errors.name = 'name';

    const email = cleanLine(values.email, 200);
    if (!email) errors.email = 'required';
    else if (!EMAIL_RE.test(email) || email.length > 120) errors.email = 'email';

    const phone = cleanLine(values.phone, 40);
    const digits = phone.replace(/\D/g, '');
    if (!phone) errors.phone = 'required';
    else if (!PHONE_RE.test(phone) || digits.length < 8 || digits.length > 15) errors.phone = 'phone';

    if (!values.destination) errors.destination = 'required';
    else if (!validPackageIds.includes(values.destination)) errors.destination = 'required';

    if (!values.date) errors.date = 'required';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || values.date < minTravelDate(today)) errors.date = 'date';

    const n = Number(values.travelers);
    if (values.travelers === '' || values.travelers == null) errors.travelers = 'required';
    else if (!Number.isInteger(n) || n < 1 || n > SITE.maxTravelers) errors.travelers = 'travelers';

    if (!values.consent) errors.consent = 'consent';
    return errors;
}

export function makeReference(date, suffix) {
    const yy = String(date.getFullYear()).slice(-2);
    return `WN-${yy}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${String(suffix).toUpperCase()}`;
}

/** Plain-text message for the sales team (always English, internal-facing). */
export function buildMessage({ reference, packageName, values, total, lang }) {
    return [
        `Hello ${SITE.brand}, I'd like to book a trip.`,
        `Ref: ${reference}`,
        `Package: ${cleanLine(packageName)}`,
        `Departure: ${cleanLine(values.date, 10)}`,
        `Travelers: ${Number(values.travelers)}`,
        `Estimated total: ${total}`,
        `Name: ${cleanLine(values.name, 80)}`,
        `Email: ${cleanLine(values.email, 120)}`,
        `WhatsApp: ${cleanLine(values.phone, 40)}`,
        `Language: ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}`,
        `Notes: ${cleanNotes(values.notes) || '-'}`,
    ].join('\n');
}

export function buildWhatsAppUrl(message, number = SITE.whatsapp) {
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
