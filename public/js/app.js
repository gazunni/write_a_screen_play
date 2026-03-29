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
  var stage = document.getElementById('wys-stage');
  if (!stage) return;
  if (stage.children.length > 0) return;

  var words = [
    'WRITE', 'YOUR', 'STORY', 'CHARACTER', 'PLOT',
    'CONFLICT', 'DIALOGUE', 'STRUCTURE', 'ACT', 'SCENE',
    'SUBTEXT', 'TENSION', 'CLIMAX', 'VOICE', 'DRAFT',
    'REWRITE', 'TRUTH', 'CRAFT', 'VISION', 'FADE IN'
  ];

  // Wide size range — tiny whispers to bold statements
  var sizes = [9, 11, 14, 10, 20, 13, 24, 11, 17, 9, 22, 12, 16, 10, 26, 13, 19, 11, 15, 10];

  // Distinct resting colour per word — muted tones on dark bg
  var restColors = [
    'rgba(180,140,100,0.35)',  // warm tan
    'rgba(140,170,160,0.35)',  // sage
    'rgba(180,100,100,0.40)',  // dusty red
    'rgba(130,150,180,0.35)',  // slate blue
    'rgba(170,160,120,0.35)',  // khaki
    'rgba(160,120,160,0.35)',  // mauve
    'rgba(120,170,140,0.35)',  // mint
    'rgba(190,150,90,0.35)',   // gold
    'rgba(150,130,170,0.35)',  // lavender
    'rgba(170,130,110,0.35)',  // terracotta
    'rgba(110,160,170,0.35)',  // teal
    'rgba(175,145,125,0.35)',  // blush
    'rgba(140,175,140,0.35)',  // soft green
    'rgba(165,135,165,0.35)',  // thistle
    'rgba(185,155,95,0.35)',   // amber
    'rgba(125,155,175,0.35)',  // steel blue
    'rgba(170,120,120,0.35)',  // rose
    'rgba(145,170,145,0.35)',  // moss
    'rgba(190,160,100,0.35)',  // harvest
    'rgba(135,145,165,0.35)'   // periwinkle
  ];

  // Pulse colours — vivid, each word gets its own highlight colour
  var pulseColors = [
    '#e8c97a',  // gold
    '#7ec8a0',  // mint green
    '#e87a7a',  // coral red
    '#7aaee8',  // sky blue
    '#d4a86a',  // amber
    '#c87ab0',  // pink
    '#7ac8b8',  // teal
    '#e8b060',  // orange gold
    '#a07ae8',  // purple
    '#e89070',  // salmon
    '#60c8d0',  // cyan
    '#e8a090',  // peach
    '#80c880',  // green
    '#b090e0',  // violet
    '#e8c050',  // yellow gold
    '#70b0e0',  // cornflower
    '#e87090',  // hot pink
    '#90d090',  // light green
    '#e0a050',  // ochre
    '#90a8d0'   // periwinkle
  ];

  var placed = words.map(function(word, i) {
    var el = document.createElement('span');
    el.className    = 'wys-word';
    el.textContent  = word;
    var fs = sizes[i % sizes.length];
    el.style.position   = 'absolute';
    el.style.fontSize   = fs + 'px';
    el.style.color      = restColors[i % restColors.length];
    el.style.left       = (6 + Math.random() * 82) + '%';
    el.style.top        = (8 + Math.random() * 76) + '%';
    el.style.transform  = 'translate(-50%,-50%)';
    el.style.transition = 'font-size 1.1s cubic-bezier(0.34,1.4,0.64,1), color 0.8s ease, text-shadow 0.8s ease';
    el.style.zIndex     = '1';
    stage.appendChild(el);
    return { el: el, baseSize: fs, restColor: restColors[i % restColors.length], pulseColor: pulseColors[i % pulseColors.length] };
  });

  function pulse() {
    var item = placed[Math.floor(Math.random() * placed.length)];
    var el   = item.el;
    // Grow and glow with the word's own colour
    el.style.fontSize   = (item.baseSize * 2.8) + 'px';
    el.style.color      = item.pulseColor;
    el.style.textShadow = '0 0 28px ' + item.pulseColor;
    el.style.zIndex     = '10';
    // Retreat slowly back to rest state
    setTimeout(function() {
      el.style.fontSize   = item.baseSize + 'px';
      el.style.color      = item.restColor;
      el.style.textShadow = 'none';
      el.style.zIndex     = '1';
    }, 1800);
  }

  // Stagger first wave generously
  placed.forEach(function(_, i) { setTimeout(pulse, i * 400); });

  // Cycle — one word pulses every 1.4 seconds
  if (wysInterval) clearInterval(wysInterval);
  wysInterval = setInterval(pulse, 1400);
}
