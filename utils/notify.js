const User = require('../models/User');
const { sendMail } = require('./mailer');

async function notifyAdminsNewComplaint(complaint) {
  const admins = await User.find({ role: 'admin' }).select('email').lean();
  const subject = `New grievance filed: ${complaint.referenceId}`;
  const html = `
    <p>A new grievance has been submitted.</p>
    <p><b>Reference:</b> ${complaint.referenceId}<br>
    <b>Title:</b> ${complaint.title}<br>
    <b>Category:</b> ${complaint.category}<br>
    <b>Priority:</b> ${complaint.priority}</p>
  `;
  await Promise.all(admins.map(a => sendMail({ to: a.email, subject, html })));
}

async function notifyStudentStatusChange(complaint, studentEmail) {
  if (!studentEmail) return;
  const subject = `Your grievance ${complaint.referenceId} is now ${complaint.status}`;
  const html = `
    <p>Hello,</p>
    <p>Your grievance <b>${complaint.referenceId}</b> — "${complaint.title}" — has been updated to status: <b>${complaint.status}</b>.</p>
    <p>Log in to your dashboard to view the details.</p>
  `;
  await sendMail({ to: studentEmail, subject, html });
}

module.exports = { notifyAdminsNewComplaint, notifyStudentStatusChange };
