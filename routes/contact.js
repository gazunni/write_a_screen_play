const express    = require('express');
const nodemailer = require('nodemailer');
const rateLimit  = require('express-rate-limit');
const https      = require('https');
const router     = express.Router();

// ── Rate limit: 5 submissions per IP per 15 min ───────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { ok: false, error: 'Too many messages sent. Please try again in 15 minutes.' }
});

// ── reCAPTCHA v3 verification ─────────────────────────────
function verifyRecaptcha(token) {
  return new Promise(function(resolve) {
    var secret = process.env.RECAPTCHA_SECRET_KEY || '';
    if (!secret || !token) { return resolve(true); } // skip if not configured

    var postData = 'secret=' + encodeURIComponent(secret) + '&response=' + encodeURIComponent(token);
    var options  = {
      hostname: 'www.google.com',
      path:     '/recaptcha/api/siteverify',
      method:   'POST',
      headers:  { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
    };

    var req = https.request(options, function(res) {
      var body = '';
      res.on('data', function(chunk) { body += chunk; });
      res.on('end',  function() {
        try {
          var parsed = JSON.parse(body);
          // Score >= 0.5 = likely human
          resolve(parsed.success && parsed.score >= 0.5);
        } catch(e) { resolve(false); }
      });
    });
    req.on('error', function() { resolve(true); }); // network error — allow through
    req.write(postData);
    req.end();
  });
}

// ── SMTP transporter ──────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ── POST /contact ─────────────────────────────────────────
router.post('/', limiter, async function(req, res) {
  var body = req.body;

  // ── Honeypot check ──────────────────────────────────────
  if (body.website && body.website !== '') {
    // Silently accept — bot thinks it worked
    return res.json({ ok: true, message: 'Your message has been sent!' });
  }

  // ── Basic validation ────────────────────────────────────
  var name    = (body.name    || '').trim();
  var email   = (body.email   || '').trim();
  var goal    = (body.goal    || '').trim();
  var courses = Array.isArray(body.courses) ? body.courses : (body.courses ? [body.courses] : []);

  if (!name || !email || !goal) {
    return res.status(400).json({ ok: false, error: 'Name, email, and goal are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
  }
  if (courses.length === 0) {
    return res.status(400).json({ ok: false, error: 'Please select at least one course.' });
  }

  // ── reCAPTCHA verification ──────────────────────────────
  var captchaOk = await verifyRecaptcha(body.recaptchaToken || '');
  if (!captchaOk) {
    return res.status(400).json({ ok: false, error: 'Spam check failed. Please try again.' });
  }

  // ── Build email ─────────────────────────────────────────
  var toAddress   = process.env.CONTACT_TO || 'gabriel.d.angi@gmail.com';
  var fromAddress = process.env.SMTP_USER;

  var courseList = courses.map(function(c) { return '• ' + c; }).join('<br>');

  var html = '\
<div style="font-family:Georgia,serif;max-width:620px;margin:0 auto;padding:2rem;background:#f5f0e8;color:#1a1a1a;">\
  <div style="border-top:4px solid #b01c1c;padding-top:1.5rem;margin-bottom:2rem;">\
    <h2 style="font-size:1.4rem;margin-bottom:.3rem;">New Course Inquiry</h2>\
    <p style="color:#7a7060;font-size:.85rem;font-family:monospace;letter-spacing:.08em;">CREATE A SCREENPLAY — CONTACT FORM</p>\
  </div>\
  <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;">\
    <tr><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;width:160px;color:#7a7060;font-size:.85rem;">Name</td><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;"><strong>' + name + '</strong></td></tr>\
    <tr><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;color:#7a7060;font-size:.85rem;">Email</td><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;"><a href="mailto:' + email + '">' + email + '</a></td></tr>\
    <tr><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;color:#7a7060;font-size:.85rem;">Phone</td><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;">' + (body.phone || '—') + '</td></tr>\
    <tr><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;color:#7a7060;font-size:.85rem;">Preferred Contact</td><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;">' + (body.preferred || 'Email') + '</td></tr>\
    <tr><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;color:#7a7060;font-size:.85rem;">In Industry?</td><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;">' + (body.inIndustry || '—') + '</td></tr>\
    <tr><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;color:#7a7060;font-size:.85rem;">Heard From</td><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;">' + (body.heardFrom || '—') + '</td></tr>\
  </table>\
  <div style="background:#fff;border-left:3px solid #b01c1c;padding:1rem 1.4rem;margin-bottom:1rem;">\
    <p style="font-size:.75rem;font-family:monospace;letter-spacing:.1em;text-transform:uppercase;color:#7a7060;margin-bottom:.4rem;">Courses of Interest</p>\
    <p style="margin:0;line-height:1.8;">' + courseList + '</p>\
  </div>\
  <div style="background:#fff;border-left:3px solid #b01c1c;padding:1rem 1.4rem;margin-bottom:1rem;">\
    <p style="font-size:.75rem;font-family:monospace;letter-spacing:.1em;text-transform:uppercase;color:#7a7060;margin-bottom:.4rem;">Their Goal</p>\
    <p style="margin:0;">' + goal + '</p>\
  </div>\
  ' + (body.message ? '<div style="background:#fff;border-left:3px solid #d8d0c0;padding:1rem 1.4rem;margin-bottom:1rem;"><p style="font-size:.75rem;font-family:monospace;letter-spacing:.1em;text-transform:uppercase;color:#7a7060;margin-bottom:.4rem;">Additional Notes</p><p style="margin:0;line-height:1.8;">' + body.message.replace(/\n/g,'<br>') + '</p></div>' : '') + '\
  <p style="font-size:.75rem;color:#7a7060;font-family:monospace;margin-top:1.5rem;">Sent via createascreenplay.com contact form</p>\
</div>';

  var mailOptions = {
    from:    '"Create A Screenplay" <' + fromAddress + '>',
    to:      toAddress,
    replyTo: email,
    subject: 'Course Inquiry — ' + courses.join(', ') + ' — ' + name,
    html:    html
  };

  try {
    var transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    res.json({ ok: true, message: 'Message sent! Gabriel will be in touch shortly.' });
  } catch(err) {
    console.error('Mail error:', err);
    res.status(500).json({ ok: false, error: 'Failed to send. Please email gabriel.d.angi@gmail.com directly.' });
  }
});

module.exports = router;
