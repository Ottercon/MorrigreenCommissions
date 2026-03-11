/* --- PPP Currency Pricing --- */
const BASE_PRICES = {
  sketch: 10,
  colour: 25,
  full:   40,
  vtuber: 100,
};

// PPP multipliers by country code (relative to UK = 1.0)
// Lower = more affordable region = lower price charged
const PPP_MULTIPLIERS = {
  // Full price regions (1.0)
  GB: 1.0, US: 1.0, CA: 1.0, AU: 1.0, NZ: 1.0,
  CH: 1.0, NO: 1.0, DK: 1.0, SE: 1.0, IS: 1.0,
  SG: 1.0, JP: 0.95, KR: 0.9, HK: 1.0,
  // Slight discount (0.8)
  DE: 0.85, FR: 0.85, NL: 0.85, BE: 0.85, AT: 0.85,
  FI: 0.85, IE: 0.9,  IT: 0.8,  ES: 0.8,  PT: 0.75,
  // Medium discount (0.6–0.7)
  PL: 0.65, CZ: 0.65, HU: 0.6,  SK: 0.6,  RO: 0.55,
  HR: 0.6,  GR: 0.65, CY: 0.7,  MT: 0.75, SI: 0.7,
  EE: 0.65, LV: 0.6,  LT: 0.6,  BG: 0.5,
  // Larger discount (0.4–0.55)
  MX: 0.5,  BR: 0.45, AR: 0.4,  CL: 0.5,  CO: 0.4,
  PE: 0.4,  VE: 0.35, TR: 0.4,  ZA: 0.45, NG: 0.35,
  EG: 0.35, MA: 0.4,  KE: 0.38, GH: 0.35, TZ: 0.32,
  UA: 0.4,  RS: 0.45, BA: 0.4,  MK: 0.42, AL: 0.4,
  // Significant discount (0.25–0.4)
  PH: 0.35, TH: 0.4,  MY: 0.45, ID: 0.32, VN: 0.3,
  IN: 0.28, PK: 0.25, BD: 0.25, LK: 0.3,  NP: 0.25,
  MM: 0.28, KH: 0.28, LA: 0.28,
  // Deepest discount (0.2–0.25)
  ET: 0.22, UG: 0.22, MZ: 0.2,  MW: 0.2,  ZM: 0.25,
  ZW: 0.22, SD: 0.22, YE: 0.2,  AF: 0.2,  SY: 0.2,
};

async function applyLocalCurrency() {
  try {
    // 1. Detect country + currency
    const geoRes = await fetch('https://ipapi.co/json/');
    const geo = await geoRes.json();
    const currency = geo.currency || 'GBP';
    const country  = geo.country  || 'GB';

    // 2. Live GBP exchange rates
    const rateRes  = await fetch('https://open.er-api.com/v6/latest/GBP');
    const rateData = await rateRes.json();
    const rate     = rateData.rates[currency] || 1;

    // 3. PPP multiplier (default 1.0 for unknown countries)
    const ppp = PPP_MULTIPLIERS[country] ?? 1.0;

    // 4. Format currency
    const formatter = new Intl.NumberFormat(geo.languages?.split(',')[0] || 'en', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    });

    // 5. Calculate adjusted prices
    const priceMap = {
      sketch: formatter.format(Math.round(BASE_PRICES.sketch * rate * ppp)),
      colour: formatter.format(Math.round(BASE_PRICES.colour * rate * ppp)),
      full:   formatter.format(Math.round(BASE_PRICES.full   * rate * ppp)),
      vtuber: formatter.format(Math.round(BASE_PRICES.vtuber * rate * ppp)),
    };

    // 6. Update price cards
    document.querySelectorAll('.card-price').forEach((el, i) => {
      const keys = ['sketch', 'colour', 'full', 'vtuber'];
      const span = el.querySelector('span');
      el.childNodes[0].textContent = priceMap[keys[i]] + ' ';
      if (span) el.appendChild(span);
    });

    // 7. Update form dropdown
    const select = document.getElementById('typeField');
    if (select) {
      select.options[1].text = `Sketch (${priceMap.sketch})`;
      select.options[2].text = `Colour Illustration (${priceMap.colour})`;
      select.options[3].text = `Full Illustration (${priceMap.full})`;
      select.options[4].text = `VTuber Reference Sheet (${priceMap.vtuber})`;
    }

    // 8. Transparent note (remove this block if you want it quiet)
    const isDiscounted = ppp < 1.0;
    const note = document.createElement('p');
    note.style.cssText = 'font-size:0.75rem;color:var(--text-soft);text-align:center;margin-top:16px;opacity:0.8;';
    note.textContent = isDiscounted
      ? `Prices are adjusted for your region (${currency}) to be more accessible. Base prices are in GBP.`
      : `Prices shown in ${currency}. Base prices are in GBP.`;
    if (currency !== 'GBP') {
      document.querySelector('.cards-grid').after(note);
    }

  } catch (e) {
    console.log('Currency conversion unavailable, showing GBP.');
  }
}

applyLocalCurrency();

/* --- Cursor --- */
const cursor = document.getElementById('cursor');
const trail = document.getElementById('cursorTrail');
let mx = 0, my = 0, tx = 0, ty = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
});

function animTrail() {
  tx += (mx - tx) * 0.15;
  ty += (my - ty) * 0.15;
  trail.style.left = tx + 'px';
  trail.style.top = ty + 'px';
  requestAnimationFrame(animTrail);
}
animTrail();

document.querySelectorAll('a, button, .faq-q, .commission-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '24px';
    cursor.style.height = '24px';
    trail.style.width = '55px';
    trail.style.height = '55px';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '16px';
    cursor.style.height = '16px';
    trail.style.width = '40px';
    trail.style.height = '40px';
  });
});

/* --- Nav scroll --- */
const nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

/* --- Scroll Reveal --- */
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      const siblings = [...e.target.parentElement.querySelectorAll('.reveal')];
      const idx = siblings.indexOf(e.target);
      setTimeout(() => e.target.classList.add('visible'), idx * 80);
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => observer.observe(el));

/* --- FAQ --- */
function toggleFaq(el) {
  const item = el.parentElement;
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

/* --- Pre-fill form from cards --- */
function fillForm(type) {
  const map = {
    'Sketch': 'Sketch (£10)',
    'Color Illustration': 'Colour Illustration (£25)',
    'Full Illustration': 'Full Illustration (£40)',
    'VTuber Reference Sheet': 'VTuber Reference Sheet (£100)',
  };
  document.getElementById('typeField').value = map[type] || '';
  document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
}

/* --- Form submit → Formspree --- */
async function handleSubmit() {
  const name = document.getElementById('nameField').value.trim();
  const contact = document.getElementById('contactField').value.trim();
  const type = document.getElementById('typeField').value;
  const btn = document.getElementById('submitBtn');

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
  const data = {
    "Name":                  form.querySelector('[name="name"]').value,
    "Contact / Handle":      form.querySelector('[name="contact"]').value,
    "Commission Type":       form.querySelector('[name="commission_type"]').value,
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
    } else {
      throw new Error('bad response');
    }
  } catch {
    btn.textContent = '✗ Something went wrong — try emailing me directly';
    btn.style.background = 'linear-gradient(135deg, #c96060, #a04040)';
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
  }
}

/* --- Parallax on orbs --- */
document.addEventListener('mousemove', e => {
  const x = (e.clientX / window.innerWidth - 0.5) * 10;
  const y = (e.clientY / window.innerHeight - 0.5) * 10;
  document.querySelectorAll('.dew-orb').forEach((orb, i) => {
    const d = (i + 1) * 0.4;
    orb.style.transform += ` translate(${x * d}px, ${y * d}px)`;
  });
});

/* --- Gallery Lightbox --- */
const galleryImages = [
  'gallery1.jpg','gallery2.jpg','gallery3.jpg',
  'gallery4.jpg','gallery5.jpg','gallery6.jpg',
  'gallery7.jpg','gallery8.jpg','gallery9.jpg',
];
let currentLightboxIndex = 0;

function openLightbox(src) {
  currentLightboxIndex = galleryImages.indexOf(src);
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}

function shiftLightbox(dir) {
  currentLightboxIndex = (currentLightboxIndex + dir + galleryImages.length) % galleryImages.length;
  const img = document.getElementById('lightboxImg');
  img.style.opacity = '0';
  setTimeout(() => {
    img.src = galleryImages[currentLightboxIndex];
    img.style.opacity = '1';
  }, 150);
}

// Close lightbox with Escape key, arrow keys to navigate
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('active')) return;
  if (e.key === 'Escape')    closeLightbox();
  if (e.key === 'ArrowLeft')  shiftLightbox(-1);
  if (e.key === 'ArrowRight') shiftLightbox(1);
});