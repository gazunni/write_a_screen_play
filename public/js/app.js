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
  const sizes = [11, 13, 15, 18, 22, 26, 14, 17, 20, 12];

  let interval = null;
  let placed   = [];

  function buildWYS() {
    const stage = document.getElementById('wys-stage');
    if (!stage) return;

    // Clear any previous run
    stage.innerHTML = '';
    placed = [];
    if (interval) { clearInterval(interval); interval = null; }

    // Use hardcoded fallback dimensions if stage has no size yet
    const W = stage.offsetWidth  || 420;
    const H = stage.offsetHeight || 170;

    placed = words.map((word, i) => {
      const el = document.createElement('span');
      el.className  = 'wys-word';
      el.textContent = word;
      const fs = sizes[i % sizes.length];
      el.style.cssText = [
        'position:absolute',
        'font-size:' + fs + 'px',
        'left:'  + (8  + Math.random() * 80) + '%',
        'top:'   + (10 + Math.random() * 72) + '%',
        'transform:translate(-50%,-50%)',
        'transition:font-size 0.55s cubic-bezier(0.34,1.56,0.64,1), color 0.4s ease, text-shadow 0.4s ease',
        'z-index:1'
      ].join(';');
      stage.appendChild(el);
      return { el, baseSize: fs };
    });

    function pulse() {
      const item = placed[Math.floor(Math.random() * placed.length)];
      const el   = item.el;
      // Grow + highlight
      el.style.fontSize   = (item.baseSize * 2.5) + 'px';
      el.style.color      = '#f5f0e8';
      el.style.textShadow = '0 0 22px rgba(176,28,28,0.7)';
      el.style.zIndex     = '10';
      // Shrink back
      setTimeout(() => {
        el.style.fontSize   = item.baseSize + 'px';
        el.style.color      = 'rgba(245,240,232,0.22)';
        el.style.textShadow = 'none';
        el.style.zIndex     = '1';
      }, 650);
    }

    // Stagger startup
    placed.forEach((_, i) => setTimeout(pulse, i * 160));
    // Keep cycling
    interval = setInterval(pulse, 400);
  }

  // Called every time the story page becomes active
  function onStoryVisible() {
    // Small delay so the page transition (opacity) completes first
    setTimeout(buildWYS, 50);
  }

  // Patch the global go() so we know when story is navigated to
  document.addEventListener('DOMContentLoaded', () => {
    const original = window.go;
    window.go = function (id) {
      original(id);
      if (id === 'story') onStoryVisible();
    };
    // Also fire if the page loads directly on #story
    if (window.location.hash === '#story') onStoryVisible();
  });
})();
