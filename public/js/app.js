/* ── MOBILE DETECTION ────────────────────────────────────── */
function isMobile() {
  return window.innerWidth <= 768;
}

function setMobileClass() {
  if (isMobile()) {
    document.body.classList.add('is-mobile');
  } else {
    document.body.classList.remove('is-mobile');
  }
}

window.addEventListener('resize', setMobileClass);
setMobileClass();

/* ── PAGE NAVIGATION ─────────────────────────────────────── */
function go(id) {
  // Hide all pages
  document.querySelectorAll('.pg').forEach(function(p) {
    p.classList.remove('on');
  });
  // Deactivate all nav buttons
  document.querySelectorAll('.nb').forEach(function(b) {
    b.classList.remove('on');
  });

  // Show target page
  var pg = document.getElementById('pg-' + id);
  if (pg) {
    pg.classList.add('on');
    // On mobile scroll to top of page, on desktop scroll the panel
    if (isMobile()) {
      window.scrollTo(0, 0);
    } else {
      pg.scrollTop = 0;
    }
  }

  // Activate nav button
  var bt = document.querySelector('[data-p="' + id + '"]');
  if (bt) bt.classList.add('on');

  // Close mobile menu
  var navLinks = document.getElementById('nav-links');
  if (navLinks) navLinks.classList.remove('open');

  // Update URL hash
  history.pushState(null, '', '#' + id);

  // Page-specific init
  if (id === 'story')   setTimeout(buildWYS, 80);
  if (id === 'contact') setTimeout(initMathChallenge, 50);

  // GA tracking
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
var hamburger = document.getElementById('hamburger');
if (hamburger) {
  hamburger.addEventListener('click', function(e) {
    e.stopPropagation();
    var navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.classList.toggle('open');
  });
}

// Close menu if user taps outside it
document.addEventListener('click', function(e) {
  var navLinks = document.getElementById('nav-links');
  var hamburgerEl = document.getElementById('hamburger');
  if (navLinks && navLinks.classList.contains('open')) {
    if (!navLinks.contains(e.target) && e.target !== hamburgerEl) {
      navLinks.classList.remove('open');
    }
  }
});

/* ── HASH ROUTING ON LOAD ────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.replace('#', '');
  const valid = ['home', 'story', 'craft', 'principles', 'about', 'courses', 'contact'];
  if (hash && valid.includes(hash)) {
    go(hash);
  }
});

/* ── CONTACT FORM ────────────────────────────────────────── */
var form      = document.getElementById('contact-form');
var submitBtn = document.getElementById('submit-btn');
var statusEl  = document.getElementById('form-status');

// ── Math challenge — set when Contact page loads ──────────
var mathAnswer = 0;

function initMathChallenge() {
  var a = Math.floor(Math.random() * 9) + 1;
  var b = Math.floor(Math.random() * 9) + 1;
  mathAnswer = a + b;
  var label = document.getElementById('math-label');
  if (label) label.textContent = 'What is ' + a + ' + ' + b + '? *';
  var input = document.getElementById('cf-math');
  if (input) input.value = '';
}

// ── Form load timestamp ───────────────────────────────────
var formLoadTime = Date.now();

if (form) {
  // Reset timer whenever contact page becomes active
  form.addEventListener('focusin', function() {
    if (formLoadTime === 0) formLoadTime = Date.now();
  }, { once: true });

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // ── Honeypot ──────────────────────────────────────────
    var honeypot = form.querySelector('#website');
    if (honeypot && honeypot.value !== '') {
      setStatus('Your message has been sent!', 'success');
      return;
    }

    // ── Time trap — under 4 seconds = bot ─────────────────
    var elapsed = (Date.now() - formLoadTime) / 1000;
    if (elapsed < 4) {
      setStatus('Please take a moment to fill in the form.', 'error');
      return;
    }

    // ── Math challenge ────────────────────────────────────
    var mathInput = parseInt((form.querySelector('#cf-math').value || '').trim(), 10);
    if (isNaN(mathInput) || mathInput !== mathAnswer) {
      setStatus('Incorrect answer to the maths question — please try again.', 'error');
      initMathChallenge();
      return;
    }

    // ── Collect fields ────────────────────────────────────
    var name    = (form.querySelector('#cf-name').value    || '').trim();
    var email   = (form.querySelector('#cf-email').value   || '').trim();
    var phone   = (form.querySelector('#cf-phone').value   || '').trim();
    var goal    = (form.querySelector('#cf-goal').value    || '').trim();
    var message = (form.querySelector('#cf-message').value || '').trim();
    var heard   = (form.querySelector('#cf-heard').value   || '').trim();

    var courseBoxes = form.querySelectorAll('input[name="courses"]:checked');
    var courses     = Array.prototype.map.call(courseBoxes, function(cb) { return cb.value; });

    var industryEl = form.querySelector('input[name="in_industry"]:checked');
    var preferEl   = form.querySelector('input[name="preferred_contact"]:checked');
    var inIndustry = industryEl ? industryEl.value : '';
    var preferred  = preferEl  ? preferEl.value   : 'Email';

    // ── Client validation ─────────────────────────────────
    if (!name || !email || !goal) {
      setStatus('Please fill in all required fields (name, email, goal).', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('Please enter a valid email address.', 'error');
      return;
    }
    if (courses.length === 0) {
      setStatus('Please select at least one course you are interested in.', 'error');
      return;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Sending…';
    setStatus('', '');

    fetch('/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:       name,
        email:      email,
        phone:      phone,
        goal:       goal,
        message:    message,
        courses:    courses,
        inIndustry: inIndustry,
        preferred:  preferred,
        heardFrom:  heard
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.ok) {
        setStatus(data.message, 'success');
        form.reset();
        initMathChallenge();
        formLoadTime = 0;
      } else {
        setStatus(data.error || 'Something went wrong. Please try again.', 'error');
      }
    })
    .catch(function() {
      setStatus('Network error. Please email gabriel.d.angi@gmail.com directly.', 'error');
    })
    .finally(function() {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Send Message';
    });
  });
}

function setStatus(msg, type) {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.className   = 'form-status' + (type ? ' ' + type : '');
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
