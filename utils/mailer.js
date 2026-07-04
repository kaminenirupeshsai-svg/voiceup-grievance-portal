const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else {
  console.log('✉️  SMTP not configured — email notifications are disabled (set SMTP_HOST/SMTP_USER/SMTP_PASS in .env to enable).');
}

// Fire-and-forget: never throws, never blocks the calling route.
async function sendMail({ to, subject, html }) {
  if (!transporter || !to) return;
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error('✉️  Email send failed:', err.message);
  }
}

module.exports = { sendMail };
