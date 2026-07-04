const express = require("express");
const router = express.Router();
const path = require("path");
const { sendMail } = require("../utils/mailer");

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

router.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/about.html"));
});

router.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/contact.html"));
});

router.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  await sendMail({
    to: process.env.FROM_EMAIL,
    subject: `New contact form message from ${name}`,
    html: `<p><b>From:</b> ${name} (${email})</p><p>${message}</p>`
  }).catch(() => {});
  res.redirect("/contact?sent=1");
});

router.get("/student-login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/student-login.html"));
});

router.get("/admin-login", (req, res) => {
  res.render("admin-login");
});

router.get("/grievance-login", (req, res) => {
  res.render("grievance-login");
});

router.get("/officer-login", (req, res) => {
  res.render("officer-login");
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
