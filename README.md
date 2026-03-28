# Create A Screenplay — Gabriel D. Angi

Screenplay writing guide, courses, and mentoring site.  
Built with Node.js / Express, deployed via GitHub → Railway.

---

## Project Structure

```
├── server.js            # Express entry point
├── package.json
├── .env.example         # Copy to .env and fill in values
├── routes/
│   └── contact.js       # Contact form POST handler (Nodemailer)
└── public/
    ├── index.html       # Main SPA
    ├── 404.html
    ├── sitemap.xml
    ├── robots.txt
    ├── css/
    │   └── main.css
    └── js/
        └── app.js
```

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your SMTP credentials

# 3. Start dev server (auto-restarts on change)
npm run dev

# 4. Open http://localhost:3000
```

---

## Environment Variables

Set these in Railway → your service → Variables:

| Variable         | Description                                      |
|-----------------|--------------------------------------------------|
| `PORT`          | Auto-set by Railway — don't set manually         |
| `SMTP_HOST`     | e.g. `smtp.gmail.com`                            |
| `SMTP_PORT`     | e.g. `587`                                       |
| `SMTP_SECURE`   | `false` for port 587, `true` for port 465        |
| `SMTP_USER`     | Your Gmail or SMTP username                      |
| `SMTP_PASS`     | Gmail App Password (not your account password)   |
| `CONTACT_TO`    | Where contact form emails are delivered          |
| `GA_MEASUREMENT_ID` | Google Analytics ID (e.g. `G-XXXXXXXXXX`)  |

### Gmail App Password Setup
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Create a new App Password for "Mail"
3. Use that 16-character password as `SMTP_PASS`

---

## Deploying to Railway

1. Push this repo to GitHub
2. In Railway: **New Project → Deploy from GitHub repo**
3. Add all environment variables under **Variables**
4. Railway auto-detects Node.js and runs `npm start`
5. Assign a custom domain under **Settings → Networking**

### Update Google Analytics
In `public/index.html`, replace both instances of `G-XXXXXXXXXX` with your real GA Measurement ID. Or set `GA_MEASUREMENT_ID` as an env var and inject it server-side if preferred.

---

## Contact Form

The contact form POSTs to `/contact` (rate-limited to 5 submissions per IP per 15 min).  
Emails arrive formatted with all fields: name, email, interest, experience level, and message.  
The reply-to is set to the sender's email so you can reply directly from your inbox.
