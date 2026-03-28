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
