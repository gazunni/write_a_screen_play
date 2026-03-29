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

  // Fire WYS animation when story page is shown
  if (id === 'story') { setTimeout(buildWYS, 80); }

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
var wysInterval = null;

function buildWYS() {
  const stage = document.getElementById('wys-stage');
  if (!stage) return;

  // Already built — just ensure interval is running
  if (stage.children.length > 0) return;

  const words = [
    'WRITE', 'YOUR', 'STORY', 'CHARACTER', 'PLOT',
    'CONFLICT', 'DIALOGUE', 'STRUCTURE', 'ACT', 'SCENE',
    'SUBTEXT', 'TENSION', 'CLIMAX', 'VOICE', 'DRAFT',
    'REWRITE', 'TRUTH', 'CRAFT', 'VISION', 'FADE IN'
  ];
  const sizes = [11, 13, 15, 18, 22, 26, 14, 17, 20, 12];

  var placed = words.map(function(word, i) {
    var el = document.createElement('span');
    el.className   = 'wys-word';
    el.textContent = word;
    var fs = sizes[i % sizes.length];
    el.style.position   = 'absolute';
    el.style.fontSize   = fs + 'px';
    el.style.left       = (8  + Math.random() * 80) + '%';
    el.style.top        = (10 + Math.random() * 72) + '%';
    el.style.transform  = 'translate(-50%,-50%)';
    el.style.transition = 'font-size 0.55s cubic-bezier(0.34,1.56,0.64,1), color 0.4s ease, text-shadow 0.4s ease';
    el.style.zIndex     = '1';
    stage.appendChild(el);
    return { el: el, baseSize: fs };
  });

  function pulse() {
    var item = placed[Math.floor(Math.random() * placed.length)];
    var el   = item.el;
    el.style.fontSize   = (item.baseSize * 2.5) + 'px';
    el.style.color      = '#f5f0e8';
    el.style.textShadow = '0 0 22px rgba(176,28,28,0.7)';
    el.style.zIndex     = '10';
    setTimeout(function() {
      el.style.fontSize   = item.baseSize + 'px';
      el.style.color      = 'rgba(245,240,232,0.22)';
      el.style.textShadow = 'none';
      el.style.zIndex     = '1';
    }, 650);
  }

  // Stagger first wave
  placed.forEach(function(_, i) { setTimeout(pulse, i * 160); });
  // Keep cycling
  if (wysInterval) clearInterval(wysInterval);
  wysInterval = setInterval(pulse, 400);
}
