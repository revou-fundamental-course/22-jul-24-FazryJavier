import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, minTravelDate, makeReference, buildMessage, buildWhatsAppUrl, cleanLine } from '../js/booking.js';

const TODAY = new Date(2026, 9, 19); // 19 Oct 2026
const IDS = ['japan', 'italy'];
const good = {
    name: 'Rina Putri', email: 'rina@example.com', phone: '+62 812 3456 7890',
    destination: 'japan', date: '2026-11-01', travelers: '2', notes: '', consent: true,
};

test('minTravelDate is today + 7 days (local)', () => {
    assert.equal(minTravelDate(TODAY), '2026-10-26');
    assert.equal(minTravelDate(new Date(2026, 11, 28)), '2027-01-04');
});

test('valid input passes', () => {
    assert.deepEqual(validate(good, IDS, TODAY), {});
});

test('empty input reports required for every field', () => {
    const e = validate({ name: '', email: '', phone: '', destination: '', date: '', travelers: '', consent: false }, IDS, TODAY);
    assert.deepEqual(Object.keys(e).sort(), ['consent', 'date', 'destination', 'email', 'name', 'phone', 'travelers']);
    assert.equal(e.name, 'required');
    assert.equal(e.consent, 'consent');
});

test('rejects bad email, phone, name length', () => {
    assert.equal(validate({ ...good, email: 'nope' }, IDS, TODAY).email, 'email');
    assert.equal(validate({ ...good, email: 'a@b' }, IDS, TODAY).email, 'email');
    assert.equal(validate({ ...good, phone: '12345' }, IDS, TODAY).phone, 'phone');
    assert.equal(validate({ ...good, phone: 'abc123456789' }, IDS, TODAY).phone, 'phone');
    assert.equal(validate({ ...good, name: 'A' }, IDS, TODAY).name, 'name');
    assert.equal(validate({ ...good, name: 'x'.repeat(81) }, IDS, TODAY).name, 'name');
});

test('date boundary: 6 days fails, 7 days passes, malformed fails', () => {
    assert.equal(validate({ ...good, date: '2026-10-25' }, IDS, TODAY).date, 'date');
    assert.equal(validate({ ...good, date: '2026-10-26' }, IDS, TODAY).date, undefined);
    assert.equal(validate({ ...good, date: '26/10/2026' }, IDS, TODAY).date, 'date');
});

test('travelers must be an integer 1..50', () => {
    for (const bad of ['0', '51', '1.5', '-2', 'abc']) {
        assert.equal(validate({ ...good, travelers: bad }, IDS, TODAY).travelers, 'travelers', bad);
    }
    assert.equal(validate({ ...good, travelers: '50' }, IDS, TODAY).travelers, undefined);
});

test('unknown package id is rejected', () => {
    assert.equal(validate({ ...good, destination: 'atlantis' }, IDS, TODAY).destination, 'required');
});

test('makeReference formats WN-YYMMDD-XXXX', () => {
    assert.equal(makeReference(new Date(2026, 0, 5), 'ab12'), 'WN-260105-AB12');
});

test('cleanLine strips newlines/control chars and truncates', () => {
    assert.equal(cleanLine('Rina\nEvil: x\r\n'), 'Rina Evil: x');
    assert.equal(cleanLine('a'.repeat(300), 10).length, 10);
});

test('message cannot be line-injected via single-line fields', () => {
    const msg = buildMessage({
        reference: 'WN-1', packageName: 'Japan Discovery', total: 'Rp 1',
        values: { ...good, name: 'Rina\nTotal: Rp 0', notes: 'line1\nline2' }, lang: 'id',
    });
    const lines = msg.split('\n');
    assert.equal(lines.filter((l) => l.startsWith('Total:')).length, 0);
    assert.ok(lines.includes('Name: Rina Total: Rp 0'));
    assert.ok(msg.includes('Language: Bahasa Indonesia'));
});

test('WhatsApp URL encodes the message and uses wa.me', () => {
    const url = buildWhatsAppUrl('Hi & <b>there</b>\nOK', '628123');
    assert.ok(url.startsWith('https://wa.me/628123?text='));
    assert.ok(!url.includes('<') && !url.includes(' ') && !url.includes('\n'));
    assert.equal(decodeURIComponent(url.split('text=')[1]), 'Hi & <b>there</b>\nOK');
});
