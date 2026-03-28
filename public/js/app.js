/* ── PAGE NAVIGATION ─────────────────────────────────────── */
function go(id) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.nb').forEach(b => b.classList.remove('on'));

  const pg = document.getElementById('pg-' + id);
  if (pg) { pg.classList.add('on'); pg.scrollTop = 0; }

  const bt = document.querySelector('[data-p="' + id + '"]');
  if (bt) bt.classList.add('on');

  // Close mobile menu if open
  document.getElementById('nav-links').classList.remove('open');

  // Update browser URL hash without reload
  history.pushState(null, '', '#' + id);

  // Track page view in GA if available
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', { page_title: id, page_path: '/#' + id });
  }
}

/* ── TAB SWITCHING ───────────────────────────────────────── */
function switchTab(e, id) {
  const pg = e.target.closest('.pg');
  pg.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  pg.querySelectorAll('.tb').forEach(t => t.classList.remove('on'));
  e.target.classList.add('on');
  document.getElementById(id).classList.add('on');
}

/* ── HAMBURGER MENU ──────────────────────────────────────── */
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('nav-links').classList.toggle('open');
});

/* ── HASH ROUTING ON LOAD ────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.replace('#', '');
  const valid = ['home', 'story', 'craft', 'principles', 'about', 'courses'];
  if (hash && valid.includes(hash)) {
    go(hash);
  }
});

/* ── CONTACT FORM ────────────────────────────────────────── */
const form       = document.getElementById('contact-form');
const submitBtn  = document.getElementById('submit-btn');
const statusEl   = document.getElementById('form-status');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name    = form.name.value.trim();
    const email   = form.email.value.trim();
    const message = form.message.value.trim();

    // Client-side validation
    if (!name || !email || !message) {
      setStatus('Please fill in all required fields.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('Please enter a valid email address.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    setStatus('', '');

    try {
      const res = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          interest:   form.interest.value,
          experience: form.experience.value,
          message
        })
      });

      const data = await res.json();

      if (data.ok) {
        setStatus(data.message, 'success');
        form.reset();
      } else {
        setStatus(data.error || 'Something went wrong. Please try again.', 'error');
      }
    } catch (err) {
      setStatus('Network error. Please email gabriel.d.angi@gmail.com directly.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
}

function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = 'form-status' + (type ? ' ' + type : '');
}

/* ── WYS ANIMATED WORD STAGE ─────────────────────────────── */
(function () {
  const words = [
    'WRITE', 'YOUR', 'STORY', 'CHARACTER', 'PLOT',
    'CONFLICT', 'DIALOGUE', 'STRUCTURE', 'ACT', 'SCENE',
    'SUBTEXT', 'TENSION', 'CLIMAX', 'VOICE', 'DRAFT',
    'REWRITE', 'TRUTH', 'CRAFT', 'VISION', 'FADE IN'
  ];

  // Font sizes cycling through small → medium → large
  const sizes = [11, 13, 15, 18, 22, 26, 14, 17, 20, 12];

  function initWYS() {
    const stage = document.getElementById('wys-stage');
    if (!stage) return;

    const W = stage.offsetWidth;
    const H = stage.offsetHeight;

    // Place each word at a stable random position
    const placed = words.map((word, i) => {
      const el = document.createElement('span');
      el.className = 'wys-word';
      el.textContent = word;
      const fontSize = sizes[i % sizes.length];
      el.style.fontSize = fontSize + 'px';

      // Random position — keep away from edges
      const x = 6 + Math.random() * 82; // % across
      const y = 8 + Math.random() * 78; // % down
      el.style.left = x + '%';
      el.style.top  = y + '%';
      el.style.transform = 'translate(-50%, -50%) scale(1)';

      stage.appendChild(el);
      return { el, baseSize: fontSize };
    });

    // Animate: randomly pick a word, scale it up then back down
    function pulse() {
      const item = placed[Math.floor(Math.random() * placed.length)];
      const el = item.el;
      const big = item.baseSize * 2.4;

      // Rise
      el.classList.add('pulse');
      el.style.transition = 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), color 0.4s ease, text-shadow 0.4s ease, font-size 0.55s ease, z-index 0s';
      el.style.fontSize = big + 'px';
      el.style.zIndex = '10';

      // Fall
      setTimeout(() => {
        el.style.transition = 'transform 0.6s ease, color 0.5s ease, text-shadow 0.5s ease, font-size 0.6s ease';
        el.style.fontSize = item.baseSize + 'px';
        el.classList.remove('pulse');
        el.style.zIndex = '1';
      }, 700);
    }

    // Stagger the first wave so they don't all fire at once
    placed.forEach((_, i) => {
      setTimeout(() => pulse(), i * 180);
    });

    // Then keep cycling — random word every 420ms
    setInterval(pulse, 420);
  }

  // Init on load, and re-init when Story page is shown
  // (stage may not be visible/sized until the page is active)
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initWYS, 300);
  });

  // Re-run if user navigates to story after first load
  const _go = window.go;
  window.go = function(id) {
    _go(id);
    if (id === 'story') {
      const stage = document.getElementById('wys-stage');
      if (stage && stage.children.length === 0) setTimeout(initWYS, 100);
    }
  };
})();
