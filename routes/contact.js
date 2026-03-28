const express    = require('express');
const nodemailer = require('nodemailer');
const rateLimit  = require('express-rate-limit');
const router     = express.Router();

// Rate limit: max 5 submissions per IP per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { ok: false, error: 'Too many messages sent. Please try again in 15 minutes.' }
});

// ── Transporter ───────────────────────────────────────────
// Uses SMTP env vars — works with Gmail, Mailgun, Postmark, etc.
// For Gmail: enable App Passwords and set SMTP_USER + SMTP_PASS
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
router.post('/', limiter, async (req, res) => {
  const { name, email, interest, experience, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Name, email, and message are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
  }

  const toAddress   = process.env.CONTACT_TO   || 'gabriel.d.angi@gmail.com';
  const fromAddress = process.env.SMTP_USER;

  const mailOptions = {
    from:    `"Create A Screenplay" <${fromAddress}>`,
    to:      toAddress,
    replyTo: email,
    subject: `New Inquiry — ${interest || 'General'} — ${name}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:2rem;background:#f5f0e8;color:#1a1a1a;">
        <div style="border-top:4px solid #b01c1c;padding-top:1.5rem;margin-bottom:2rem;">
          <h2 style="font-size:1.4rem;margin-bottom:.3rem;">New Website Inquiry</h2>
          <p style="color:#7a7060;font-size:.85rem;font-family:monospace;letter-spacing:.08em;">CREATE A SCREENPLAY</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;">
          <tr><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;width:140px;color:#7a7060;font-size:.85rem;">Name</td><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;"><strong>${name}</strong></td></tr>
          <tr><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;color:#7a7060;font-size:.85rem;">Email</td><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;color:#7a7060;font-size:.85rem;">Interest</td><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;">${interest || '—'}</td></tr>
          <tr><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;color:#7a7060;font-size:.85rem;">Experience</td><td style="padding:.5rem 0;border-bottom:1px solid #d8d0c0;">${experience || '—'}</td></tr>
        </table>
        <div style="background:#fff;border-left:3px solid #b01c1c;padding:1.2rem 1.5rem;margin-bottom:1.5rem;">
          <p style="margin:0;line-height:1.8;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        <p style="font-size:.78rem;color:#7a7060;font-family:monospace;">Sent via createascreenplay.com contact form</p>
      </div>
    `,
  };

  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    res.json({ ok: true, message: 'Your message has been sent! Gabriel will be in touch shortly.' });
  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({ ok: false, error: 'Failed to send message. Please email gabriel.d.angi@gmail.com directly.' });
  }
});

module.exports = router;
