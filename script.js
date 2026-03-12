/* =====================
   CURSOR
===================== */
const cursor      = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursorTrail');
let mx = 0, my = 0, tx = 0, ty = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});

(function animateTrail() {
  tx += (mx - tx) * 0.18;
  ty += (my - ty) * 0.18;
  cursorTrail.style.left = tx + 'px';
  cursorTrail.style.top  = ty + 'px';
  requestAnimationFrame(animateTrail);
})();

/* =====================
   NAV SCROLL
===================== */
window.addEventListener('scroll', () => {
  document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 30);
});

/* =====================
   SCROLL REVEAL
===================== */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* =====================
   FAQ
===================== */
function toggleFaq(el) {
  el.parentElement.classList.toggle('open');
}

/* =====================
   FORM FILL
===================== */
function fillForm(type) {
  const keyMap = {
    'Sketch':                 'sketch',
    'Colour Illustration':    'colour',
    'Full Illustration':      'full',
    'VTuber Reference Sheet': 'vtuber',
  };
  const sel = document.getElementById('typeField');
  const key = keyMap[type];
  if (sel && key) sel.value = key;
  document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
}

/* =====================
   FORM SUBMIT
===================== */
async function handleSubmit() {
  const name    = document.getElementById('nameField').value.trim();
  const contact = document.getElementById('contactField').value.trim();
  const type    = document.getElementById('typeField').value;
  const btn     = document.getElementById('submitBtn');

  if (!name || !contact || !type) {
    btn.textContent = '⚠ Please fill in Name, Contact, and Commission Type';
    btn.style.background = 'linear-gradient(135deg, #c9904e, #a06830)';
    setTimeout(() => {
      btn.textContent = 'Send Commission Request 🌿';
      btn.style.background = '';
    }, 2500);
    return;
  }

  const form = btn.closest('.order-form');
  const selectedOption = form.querySelector('[name="commission_type"] option:checked');
  document.getElementById('regionPrice').value = selectedOption ? selectedOption.text : type;

  const data = {
    "Name":                  form.querySelector('[name="name"]').value,
    "Contact / Handle":      form.querySelector('[name="contact"]').value,
    "Commission Type":       selectedOption ? selectedOption.text : type,
    "Currency":              form.querySelector('[name="region_currency"]').value,
    "Quoted Price":          form.querySelector('[name="region_price"]').value,
    "Characters":            form.querySelector('[name="characters"]').value,
    "Deadline":              form.querySelector('[name="deadline"]').value,
    "Character Description": form.querySelector('[name="character_description"]').value,
    "Reference Links":       form.querySelector('[name="reference_links"]').value,
    "Additional Notes":      form.querySelector('[name="additional_notes"]').value,
  };

  btn.textContent = 'Sending… 🌿';
  btn.style.pointerEvents = 'none';
  btn.style.opacity = '0.8';

  try {
    const res = await fetch('https://formspree.io/f/xaqpnnbp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      btn.textContent = "✓ Request Sent! I'll be in touch soon 🌿";
      btn.style.background = 'linear-gradient(135deg, #6aad55, #4d8038)';
      btn.style.opacity = '1';
      form.querySelectorAll('input, textarea').forEach(el => el.value = '');
      form.querySelectorAll('select').forEach(el => el.selectedIndex = 0);
    } else { throw new Error('bad response'); }
  } catch {
    btn.textContent = '✗ Something went wrong — try emailing me directly';
    btn.style.background = 'linear-gradient(135deg, #c96060, #a04040)';
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
  }
}

/* =====================
   LIGHTBOX
===================== */
let lightboxImages = [];
let lightboxIndex  = 0;

function openLightbox(src, index) {
  // Collect all images from the same tier gallery
  const item = [...document.querySelectorAll('.tg-item')].find(el => {
    return el.querySelector('img')?.src.includes(src.replace(/.*\//, ''));
  });
  if (item) {
    const tier = item.closest('.tier-gallery');
    lightboxImages = [...tier.querySelectorAll('img')].map(img => img.src);
    lightboxIndex  = index;
  } else {
    lightboxImages = [src];
    lightboxIndex  = 0;
  }
  document.getElementById('lightboxImg').src = lightboxImages[lightboxIndex];
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}

function shiftLightbox(dir) {
  lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
  const img = document.getElementById('lightboxImg');
  img.style.opacity = '0';
  setTimeout(() => {
    img.src = lightboxImages[lightboxIndex];
    img.style.opacity = '1';
  }, 140);
}

document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('active')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  shiftLightbox(-1);
  if (e.key === 'ArrowRight') shiftLightbox(1);
});

/* =====================
   PPP CURRENCY PRICING
===================== */
const BASE_PRICES = {
  sketch:  10,
  colour:  25,
  full:    40,
  vtuber: 100,
};

const PPP_MULTIPLIERS = {
  GB: 1.0, US: 1.0, CA: 1.0, AU: 1.0, NZ: 1.0,
  CH: 1.0, NO: 1.0, DK: 1.0, SE: 1.0, IS: 1.0,
  SG: 1.0, JP: 0.95, KR: 0.9, HK: 1.0,
  DE: 0.85, FR: 0.85, NL: 0.85, BE: 0.85, AT: 0.85,
  FI: 0.85, IE: 0.9,  IT: 0.8,  ES: 0.8,  PT: 0.75,
  PL: 0.65, CZ: 0.65, HU: 0.6,  SK: 0.6,  RO: 0.55,
  HR: 0.6,  GR: 0.65, CY: 0.7,  MT: 0.75, SI: 0.7,
  EE: 0.65, LV: 0.6,  LT: 0.6,  BG: 0.5,
  MX: 0.5,  BR: 0.45, AR: 0.4,  CL: 0.5,  CO: 0.4,
  PE: 0.4,  VE: 0.35, TR: 0.4,  ZA: 0.45, NG: 0.35,
  EG: 0.35, MA: 0.4,  KE: 0.38, GH: 0.35, TZ: 0.32,
  UA: 0.4,  RS: 0.45, BA: 0.4,  MK: 0.42, AL: 0.4,
  PH: 0.35, TH: 0.4,  MY: 0.45, ID: 0.32, VN: 0.3,
  IN: 0.28, PK: 0.25, BD: 0.25, LK: 0.3,  NP: 0.25,
  MM: 0.28, KH: 0.28, LA: 0.28,
  ET: 0.22, UG: 0.22, MZ: 0.2,  MW: 0.2,  ZM: 0.25,
  ZW: 0.22, SD: 0.22, YE: 0.2,  AF: 0.2,  SY: 0.2,
};

async function detectGeo() {
  const apis = [
    async () => {
      const r = await fetch('https://ipwho.is/');
      const d = await r.json();
      if (!d.success || !d.country_code) throw new Error();
      return { country: d.country_code, currency: d.currency?.code };
    },
    async () => {
      const r = await fetch('https://ipapi.co/json/');
      const d = await r.json();
      if (!d.country) throw new Error();
      return { country: d.country, currency: d.currency };
    },
    async () => {
      const r = await fetch('https://api.country.is/');
      const d = await r.json();
      if (!d.country) throw new Error();
      const currencyByCountry = { US:'USD',CA:'CAD',AU:'AUD',NZ:'NZD',JP:'JPY',KR:'KRW',SG:'SGD',HK:'HKD',CH:'CHF',NO:'NOK',SE:'SEK',DK:'DKK',IN:'INR',BR:'BRL',MX:'MXN',ZA:'ZAR',TR:'TRY',PL:'PLN',CZ:'CZK',HU:'HUF',RO:'RON',UA:'UAH',NG:'NGN',KE:'KES',EG:'EGP',PH:'PHP',TH:'THB',MY:'MYR',ID:'IDR',VN:'VND',PK:'PKR',BD:'BDT',AR:'ARS',CL:'CLP',CO:'COP' };
      const euCountries = ['DE','FR','NL','BE','AT','FI','IE','IT','ES','PT','GR','CY','MT','SI','EE','LV','LT','SK','HR','BG'];
      const currency = currencyByCountry[d.country] ?? (euCountries.includes(d.country) ? 'EUR' : null);
      return { country: d.country, currency };
    },
  ];
  for (const attempt of apis) {
    try { const r = await attempt(); if (r.country) return r; } catch {}
  }
  return null;
}

async function applyLocalCurrency() {
  try {
    const geo = await detectGeo();
    if (!geo) return;

    const currency = geo.currency || 'GBP';
    const country  = geo.country  || 'GB';

    const rateRes  = await fetch('https://open.er-api.com/v6/latest/GBP');
    const rateData = await rateRes.json();
    const rate     = rateData.rates[currency] ?? 1;
    const ppp      = PPP_MULTIPLIERS[country] ?? 1.0;

    const formatter = new Intl.NumberFormat(navigator.language || 'en',
      { style: 'currency', currency, maximumFractionDigits: 0 }
    );
    const convert = (base) => formatter.format(Math.round(base * rate * ppp));

    // Store currency for form submission
    document.getElementById('regionCurrency').value = currency;

    // Update every price cell
    document.querySelectorAll('.price-cell').forEach(el => {
      const base = parseFloat(el.dataset.base);
      if (!isNaN(base)) el.textContent = convert(base);
    });

    // Update form dropdown
    const sel = document.getElementById('typeField');
    if (sel) {
      const names = ['Sketch','Colour Illustration','Full Illustration','VTuber Reference Sheet'];
      const bases = [10, 25, 40, 100];
      [1,2,3,4].forEach((i, idx) => {
        sel.options[i].text = `${names[idx]} (${convert(bases[idx])})`;
      });
    }

    // Currency note
    const note = document.getElementById('currency-note');
    if (note && currency !== 'GBP') {
      note.textContent = ppp < 1.0
        ? `Prices adjusted for your region (${currency}) to be more accessible. Base prices are in GBP.`
        : `Prices shown in ${currency}. Base prices are in GBP.`;
    } else if (note) {
      note.style.display = 'none';
    }

  } catch (e) {
    console.log('Currency conversion unavailable, showing GBP.');
    const note = document.getElementById('currency-note');
    if (note) note.style.display = 'none';
  }
}

applyLocalCurrency();
