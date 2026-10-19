import { DEFAULT_LOCALE, STORAGE_KEY, LOCALES, detectLocale, t, formatPrice, applyTranslations } from './i18n.js';
import { PACKAGES } from './data/packages.js';
import { SITE } from './data/site.js';
import { validate, minTravelDate, makeReference, buildMessage, buildWhatsAppUrl } from './booking.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function safeStorage(action, key, value) {
    try {
        return action === 'get' ? localStorage.getItem(key) : localStorage.setItem(key, value);
    } catch {
        return null; // storage can be blocked (private mode) — the page works without it
    }
}

let locale = DEFAULT_LOCALE;
let activeRegion = 'all';

/* ---------- Language ---------- */
function setLocale(next) {
    locale = LOCALES[next] ? next : DEFAULT_LOCALE;
    safeStorage('set', STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    document.title = t(locale, 'meta.title');
    $('meta[name="description"]').setAttribute('content', t(locale, 'meta.description'));
    applyTranslations(document, locale);
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === locale)));
    renderPackages();
    renderDestinationOptions();
    buildDots();
    clearErrors();
    updateEstimate();
}

/* ---------- Header / nav ---------- */
function initHeader() {
    const header = $('#header');
    const nav = $('#nav');
    const toggle = $('#menuToggle');

    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const setMenu = (open) => {
        nav.classList.toggle('is-open', open);
        header.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setMenu(false); toggle.focus(); } });

    // Scroll-spy
    const links = $$('.nav__link');
    const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                links.forEach((a) => {
                    const on = a.getAttribute('href') === `#${entry.target.id}`;
                    a.classList.toggle('is-active', on);
                    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach((s) => spy.observe(s));
    }

    $$('.lang button').forEach((b) => b.addEventListener('click', () => setLocale(b.dataset.lang)));
}

/* ---------- Hero slider ---------- */
let slideIndex = 0;
let slideTimer = null;
const slides = () => $$('#heroSlides img');

function showSlide(i) {
    const list = slides();
    slideIndex = (i + list.length) % list.length;
    list.forEach((img, n) => img.classList.toggle('is-active', n === slideIndex));
    $$('#heroDots button').forEach((d, n) => d.setAttribute('aria-current', String(n === slideIndex)));
}

function buildDots() {
    const wrap = $('#heroDots');
    wrap.innerHTML = '';
    slides().forEach((_, n) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', t(locale, 'hero.slide', { n: n + 1 }));
        b.addEventListener('click', () => { showSlide(n); restartAuto(); });
        wrap.appendChild(b);
    });
    showSlide(slideIndex);
}

function restartAuto() {
    clearInterval(slideTimer);
    if (reducedMotion) return;
    slideTimer = setInterval(() => showSlide(slideIndex + 1), 7000);
}

function initSlider() {
    $('#heroPrev').addEventListener('click', () => { showSlide(slideIndex - 1); restartAuto(); });
    $('#heroNext').addEventListener('click', () => { showSlide(slideIndex + 1); restartAuto(); });
    const hero = $('#home');
    hero.addEventListener('mouseenter', () => clearInterval(slideTimer));
    hero.addEventListener('mouseleave', restartAuto);
    document.addEventListener('visibilitychange', () => (document.hidden ? clearInterval(slideTimer) : restartAuto()));

    let startX = null;
    hero.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', (e) => {
        if (startX === null) return;
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 50) { showSlide(slideIndex + (dx < 0 ? 1 : -1)); restartAuto(); }
        startX = null;
    });
    restartAuto();
}

/* ---------- Packages ---------- */
function renderPackages() {
    const grid = $('#packagesGrid');
    const list = PACKAGES.filter((p) => activeRegion === 'all' || p.region === activeRegion);
    // All interpolated strings come from our own static locale/data files (no user input).
    grid.innerHTML = list.map((p) => {
        const name = t(locale, `pkg.${p.id}.name`);
        const highlights = t(locale, `pkg.${p.id}.highlights`).split('|').map((h) => `<li>${h}</li>`).join('');
        const badge = p.badge ? `<span class="badge badge--${p.badge}">${t(locale, `badge.${p.badge}`)}</span>` : '';
        return `
        <article class="pkg">
            <div class="pkg__media">
                <img src="${p.image}" alt="${name}" loading="lazy">
                ${badge}
                <span class="pkg__region">${t(locale, `region.${p.region}`)}</span>
            </div>
            <div class="pkg__body">
                <div class="pkg__meta">
                    <span><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${t(locale, 'pkg.days', { n: p.days })}</span>
                    <span class="pkg__rating"><i class="fa-solid fa-star" aria-hidden="true"></i>${p.rating.toFixed(1)} ${t(locale, 'pkg.reviews', { n: p.reviews })}</span>
                </div>
                <h3>${name}</h3>
                <p class="pkg__desc">${t(locale, `pkg.${p.id}.desc`)}</p>
                <ul class="pkg__list">${highlights}</ul>
                <div class="pkg__foot">
                    <div class="pkg__price"><small>${t(locale, 'pkg.from')} · ${t(locale, 'pkg.perPerson')}</small><strong>${formatPrice(p.price, locale)}</strong></div>
                    <button type="button" class="btn btn--primary btn--sm" data-book="${p.id}">${t(locale, 'pkg.book')}</button>
                </div>
            </div>
        </article>`;
    }).join('');
}

function initPackages() {
    $('#filters').addEventListener('click', (e) => {
        const chip = e.target.closest('[data-region]');
        if (!chip) return;
        activeRegion = chip.dataset.region;
        $$('#filters .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        renderPackages();
    });
    $('#packagesGrid').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-book]');
        if (!btn) return;
        const select = $('#f-destination');
        select.value = btn.dataset.book;
        updateEstimate();
        $('#contact').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
        setTimeout(() => select.focus({ preventScroll: true }), reducedMotion ? 0 : 600);
    });
}

/* ---------- Booking form ---------- */
const FIELDS = ['name', 'email', 'phone', 'destination', 'date', 'travelers', 'consent'];
const form = () => $('#bookingForm');

function renderDestinationOptions() {
    const select = $('#f-destination');
    const current = select.value;
    select.innerHTML = `<option value="" disabled selected>${t(locale, 'form.destination.ph')}</option>` +
        PACKAGES.map((p) => `<option value="${p.id}">${t(locale, `pkg.${p.id}.name`)} — ${formatPrice(p.price, locale)}</option>`).join('');
    select.value = current || '';
}

function readValues() {
    const f = form();
    return {
        name: f.name.value,
        email: f.email.value,
        phone: f.phone.value,
        destination: f.destination.value,
        date: f.date.value,
        travelers: f.travelers.value,
        notes: f.notes.value,
        consent: f.consent.checked,
    };
}

function estimateTotal(values) {
    const pkg = PACKAGES.find((p) => p.id === values.destination);
    const n = Number(values.travelers);
    return pkg && Number.isInteger(n) && n > 0 ? pkg.price * n : null;
}

function updateEstimate() {
    const total = estimateTotal(readValues());
    $('#estimate').textContent = total === null ? '—' : formatPrice(total, locale);
}

function clearErrors() {
    FIELDS.forEach((name) => {
        const err = $(`#err-${name}`);
        if (err) err.textContent = '';
        const input = form()[name];
        if (input) input.removeAttribute('aria-invalid');
    });
}

function showErrors(errors) {
    clearErrors();
    let first = null;
    FIELDS.forEach((name) => {
        if (!errors[name]) return;
        $(`#err-${name}`).textContent = t(locale, `err.${errors[name]}`, { n: SITE.minLeadDays, max: SITE.maxTravelers });
        const input = form()[name];
        input.setAttribute('aria-invalid', 'true');
        first = first || input;
    });
    if (first) first.focus();
}

function randomSuffix() {
    const bytes = crypto.getRandomValues(new Uint8Array(3));
    return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 4);
}

function initBooking() {
    const f = form();
    const dateInput = $('#f-date');
    dateInput.min = minTravelDate();

    ['destination', 'travelers'].forEach((n) => f[n].addEventListener('input', updateEstimate));
    f.addEventListener('input', (e) => {
        const name = e.target.name;
        if (e.target.getAttribute('aria-invalid') && $(`#err-${name}`)) {
            e.target.removeAttribute('aria-invalid');
            $(`#err-${name}`).textContent = '';
        }
    });

    f.addEventListener('submit', (e) => {
        e.preventDefault();
        const values = readValues();

        // Honeypot: bots fill hidden fields. Pretend success, send nothing.
        if (f.website.value) { f.reset(); return; }

        const errors = validate(values, PACKAGES.map((p) => p.id));
        if (Object.keys(errors).length) { showErrors(errors); return; }
        clearErrors();

        const submitBtn = $('#submitBtn');
        submitBtn.disabled = true;
        setTimeout(() => { submitBtn.disabled = false; }, 3000); // throttle repeated sends

        const total = estimateTotal(values);
        const reference = makeReference(new Date(), randomSuffix());
        const message = buildMessage({
            reference,
            packageName: t('en', `pkg.${values.destination}.name`),
            values,
            total: formatPrice(total, 'id'),
            lang: locale,
        });
        const url = buildWhatsAppUrl(message);

        $('#refCode').textContent = reference;
        $('#waLink').href = url;
        f.hidden = true;
        const success = $('#bookingSuccess');
        success.hidden = false;
        success.focus();
        window.open(url, '_blank', 'noopener');
    });

    $('#bookAgain').addEventListener('click', () => {
        f.reset();
        $('#f-travelers').value = 2;
        updateEstimate();
        $('#bookingSuccess').hidden = true;
        f.hidden = false;
        $('#f-name').focus();
    });
}

/* ---------- Motion: reveal + counters ---------- */
function initReveal() {
    const items = $$('.reveal');
    if (reducedMotion || !('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('is-visible'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
        });
    }, { threshold: 0.12 });
    items.forEach((el) => io.observe(el));
}

function initCounters() {
    const counters = $$('[data-count]');
    if (reducedMotion || !('IntersectionObserver' in window)) return; // static text already shows final values
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            io.unobserve(entry.target);
            const el = entry.target;
            const end = Number(el.dataset.count);
            const decimals = Number(el.dataset.decimals || 0);
            const suffix = el.dataset.suffix || '';
            const start = performance.now();
            const tick = (now) => {
                const p = Math.min((now - start) / 1400, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = (end * eased).toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', {
                    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
                }) + suffix;
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    }, { threshold: 0.6 });
    counters.forEach((el) => io.observe(el));
}

/* ---------- Boot ---------- */
locale = detectLocale(safeStorage('get', STORAGE_KEY), navigator.language);
initHeader();
initSlider();
initPackages();
initBooking();
setLocale(locale);
initReveal();
initCounters();
