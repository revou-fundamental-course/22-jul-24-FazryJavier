import { test } from 'node:test';
import assert from 'node:assert/strict';
import en from '../js/locales/en.js';
import id from '../js/locales/id.js';
import { detectLocale, t, formatPrice } from '../js/i18n.js';
import { PACKAGES, REGIONS } from '../js/data/packages.js';
import { readFileSync } from 'node:fs';

test('EN and ID define exactly the same keys', () => {
    assert.deepEqual(Object.keys(id).sort(), Object.keys(en).sort());
});

test('no translation is empty and placeholders match across locales', () => {
    const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
    for (const key of Object.keys(en)) {
        assert.ok(en[key].trim() && id[key].trim(), `empty value for ${key}`);
        assert.equal(ph(id[key]), ph(en[key]), `placeholder mismatch in ${key}`);
    }
});

test('every package has name, desc, highlights and region/badge keys in both locales', () => {
    for (const p of PACKAGES) {
        for (const loc of [en, id]) {
            for (const k of ['name', 'desc', 'highlights']) assert.ok(loc[`pkg.${p.id}.${k}`], `${p.id}.${k}`);
            assert.ok(loc[`region.${p.region}`]);
            if (p.badge) assert.ok(loc[`badge.${p.badge}`]);
        }
        assert.ok(REGIONS.includes(p.region));
        assert.ok(p.price > 0 && p.days > 0);
    }
    assert.equal(new Set(PACKAGES.map((p) => p.id)).size, PACKAGES.length, 'duplicate package ids');
});

test('every data-i18n key used in index.html exists', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const keys = new Set();
    for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) keys.add(m[1]);
    for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) m[1].split(';').forEach((p) => keys.add(p.split(':')[1].trim()));
    for (const k of keys) assert.ok(k in en, `missing key ${k}`);
});

test('every package image file exists', () => {
    for (const p of PACKAGES) readFileSync(new URL(`../${p.image}`, import.meta.url));
});

test('detectLocale prefers stored, then browser, then default', () => {
    assert.equal(detectLocale('id', 'en-US'), 'id');
    assert.equal(detectLocale(null, 'id-ID'), 'id');
    assert.equal(detectLocale(null, 'fr-FR'), 'en');
    assert.equal(detectLocale('xx', undefined), 'en');
});

test('t interpolates, falls back and returns key when missing', () => {
    assert.equal(t('en', 'pkg.days', { n: 7 }), '7 days');
    assert.equal(t('id', 'pkg.days', { n: 7 }), '7 hari');
    assert.equal(t('xx', 'nav.home'), 'Home');
    assert.equal(t('en', 'does.not.exist'), 'does.not.exist');
});

test('formatPrice renders IDR without decimals', () => {
    assert.match(formatPrice(18500000, 'id'), /18\.500\.000/);
    assert.match(formatPrice(18500000, 'en'), /18,500,000/);
});
