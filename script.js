/* --- Dynamic Currency Conversion --- */
const BASE_PRICES = {
  sketch: 10,
  colour: 25,
  full: 40,
  vtuber: 100,
};

async function applyLocalCurrency() {
  try {
    const geoRes = await fetch('https://ipapi.co/json/');
    const geo = await geoRes.json();
    const currency = geo.currency || 'GBP';

    const rateRes = await fetch('https://open.er-api.com/v6/latest/GBP');
    const rateData = await rateRes.json();
    const rate = rateData.rates[currency] || 1;

    const formatter = new Intl.NumberFormat(geo.languages?.split(',')[0] || 'en', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    });

    const priceMap = {
      sketch: formatter.format(Math.round(BASE_PRICES.sketch * rate)),
      colour: formatter.format(Math.round(BASE_PRICES.colour * rate)),
      full:   formatter.format(Math.round(BASE_PRICES.full   * rate)),
      vtuber: formatter.format(Math.round(BASE_PRICES.vtuber * rate)),
    };

    document.querySelectorAll('.card-price').forEach((el, i) => {
      const keys = ['sketch', 'colour', 'full', 'vtuber'];
      const span = el.querySelector('span');
      el.childNodes[0].textContent = priceMap[keys[i]] + ' ';
      if (span) el.appendChild(span);
    });

    const select = document.getElementById('typeField');
    if (select) {
      select.options[1].text = `Sketch (${priceMap.sketch})`;
      select.options[2].text = `Colour Illustration (${priceMap.colour})`;
      select.options[3].text = `Full Illustration (${priceMap.full})`;
      select.options[4].text = `VTuber Reference Sheet (${priceMap.vtuber})`;
    }


    if (currency !== 'GBP') {
      const note = document.createElement('p');
      note.style.cssText = 'font-size:0.75rem;color:var(--text-soft);text-align:center;margin-top:16px;opacity:0.8;';
      note.textContent = `Prices shown in ${currency} — base prices are in GBP.`;
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
