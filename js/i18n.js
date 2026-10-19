import en from './locales/en.js';
import id from './locales/id.js';

export const LOCALES = { en, id };
export const DEFAULT_LOCALE = 'en';
export const STORAGE_KEY = 'wanderly.lang';

const INTL_TAG = { en: 'en-US', id: 'id-ID' };

/** Pick a supported locale: stored preference first, then browser language, then default. */
export function detectLocale(stored, navigatorLang) {
    if (stored && LOCALES[stored]) return stored;
    const short = String(navigatorLang || '').slice(0, 2).toLowerCase();
    return LOCALES[short] ? short : DEFAULT_LOCALE;
}

/** Translate `key`, falling back to the default locale, then to the key itself. {name} placeholders are interpolated. */
export function t(locale, key, vars = {}) {
    const raw = LOCALES[locale]?.[key] ?? LOCALES[DEFAULT_LOCALE][key] ?? key;
    return raw.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
}

export function formatPrice(amount, locale) {
    return new Intl.NumberFormat(INTL_TAG[locale] || INTL_TAG[DEFAULT_LOCALE], {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
}

/** Apply translations to every [data-i18n] / [data-i18n-attr="attr:key;attr2:key2"] node under `root`. */
export function applyTranslations(root, locale) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = t(locale, el.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
        el.dataset.i18nAttr.split(';').forEach((pair) => {
            const [attr, key] = pair.split(':').map((s) => s.trim());
            if (attr && key) el.setAttribute(attr, t(locale, key));
        });
    });
}
