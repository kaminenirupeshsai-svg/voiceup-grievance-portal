const express = require("express");
const router = express.Router();
const path = require("path");
const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendMailStrict, isConfigured: mailerConfigured } = require("../utils/mailer");

/* -------------------------------------------
   OTP VERIFICATION HELPERS
   6-digit code, 10-minute expiry, 5 attempts,
   60s cooldown between resends. Delivered by
   email today; swap sendOtp() internals for an
   SMS gateway (Twilio/MSG91) to text the code
   to user.mobile instead.
------------------------------------------- */
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const hashOtp = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");

async function issueOtp(user) {
  const otp = crypto.randomInt(100000, 1000000).toString();
  user.otpHash = hashOtp(otp);
  user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  user.otpSentAt = new Date();
  await user.save();

  return sendMailStrict({
    to: user.email,
    subject: `Your VoiceUp verification code: ${otp}`,
    html: `
      <p>Hello ${user.name},</p>
      <p>Your VoiceUp verification code is:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px">${otp}</p>
      <p>It expires in 10 minutes. If you didn't register, ignore this email.</p>
    `
  });
}

/* -------------------------------------------
   GENUINE-STUDENT CHECK
   If ALLOWED_EMAIL_DOMAINS is set (comma-separated,
   e.g. "svce.ac.in,student.svce.ac.in"), registration
   is only allowed for emails on those domains.
   Left blank = any email accepted (dev mode).
------------------------------------------- */
const ALLOWED_EMAIL_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || "")
  .split(",")
  .map(d => d.trim().toLowerCase().replace(/^@/, ""))
  .filter(Boolean);

function isAllowedEmail(email) {
  if (ALLOWED_EMAIL_DOMAINS.length === 0) return true;
  const domain = String(email).split("@")[1]?.toLowerCase();
  return !!domain && ALLOWED_EMAIL_DOMAINS.includes(domain);
}

/* -------------------------------------------
   TEST ROUTE
------------------------------------------- */
router.post("/test", (req, res) => {
  res.send("Grievance Test Route Working");
});

/* -------------------------------------------
   LOGIN / REGISTER PAGES
   Canonical routes live in routes/pages.js;
   kept here only for the /auth/* aliases used
   by older links.
------------------------------------------- */

// Student Login Page
router.get("/student-login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/student-login.html"));
});

// Student Register Page
router.get("/student-register", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/register.html"));
});

/* -------------------------------------------
   STUDENT LOGIN (roll number + password)
------------------------------------------- */
router.post("/login-student", async (req, res) => {
  const { password } = req.body;
  const roll = String(req.body.roll || "").trim().toUpperCase();

  const user = await User.findOne({ roll, role: "student" });
  if (!user) return res.send("❌ No student found with that roll number");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send("❌ Invalid password");

  // Registered but never confirmed the OTP → send back to verification
  if (user.verified === false) {
    return res.redirect(
      "/auth/verify-otp?roll=" + encodeURIComponent(roll) +
      "&error=" + encodeURIComponent("Please verify your account first — enter the code sent to your email.")
    );
  }

  // Save session
  req.session.user = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role
  };

  res.redirect("/dashboard");
});

/* -------------------------------------------
   ADMIN LOGIN
------------------------------------------- */
router.post("/login-admin", async (req, res) => {
  const { password } = req.body;
  const email = String(req.body.email || "").trim().toLowerCase();

  const user = await User.findOne({ email, role: "admin" });
  if (!user) return res.send("❌ Admin not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send("❌ Invalid password");

  req.session.user = user;

  res.redirect("/admin/dashboard");
});

/* -------------------------------------------
   GRIEVANCE LOGIN
------------------------------------------- */
router.post("/login-grievance", async (req, res) => {
  console.log("📌 Grievance Login Hit:", req.body);

  const { password } = req.body;
  const email = String(req.body.email || "").trim().toLowerCase();

  const user = await User.findOne({ email, role: "grievance" });
  if (!user) return res.send("❌ Grievance Officer not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send("❌ Invalid password");

  req.session.user = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  res.redirect("/grievance/dashboard");
});

/* -------------------------------------------
   GRIEVANCE OFFICER LOGIN
------------------------------------------- */
router.post("/login-officer", async (req, res) => {
  const { password } = req.body;
  const email = String(req.body.email || "").trim().toLowerCase();

  const user = await User.findOne({ email, role: "officer" });
  if (!user) return res.send("❌ Officer not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send("❌ Invalid password");

  req.session.user = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  res.redirect("/officer/dashboard");
});

/* -------------------------------------------
   ACCOUNT SETTINGS
------------------------------------------- */
router.get("/account", async (req, res) => {
  if (!req.session.user) return res.redirect("/student-login");

  const user = await User.findById(req.session.user.id || req.session.user._id);
  res.render("account", { user, role: "student", active: "account" });
});

router.post("/update-profile", async (req, res) => {
  if (!req.session.user) return res.redirect("/student-login");

  try {
    const { name, department, email, password } = req.body;
    const update = { name, department, email };

    if (password && password.trim()) {
      update.password = await bcrypt.hash(password, 10);
    }

    const userId = req.session.user.id || req.session.user._id;
    const user = await User.findByIdAndUpdate(userId, update, { new: true });

    req.session.user.name = user.name;
    req.session.user.email = user.email;

    res.redirect("/auth/account");
  } catch (err) {
    res.send("❌ Error updating profile: " + err.message);
  }
});

/* -------------------------------------------
   STUDENT REGISTRATION
------------------------------------------- */
router.post("/register", async (req, res) => {
  try {
    const { name, department, password, confirm_password } = req.body;
    const email = String(req.body.email || "").trim().toLowerCase();
    const roll = String(req.body.roll || "").trim().toUpperCase();
    const mobile = String(req.body.mobile || "").trim();

    if (!roll) return res.send("❌ Roll number is required");

    if (confirm_password !== undefined && password !== confirm_password) {
      return res.send("❌ Passwords do not match");
    }

    if (!isAllowedEmail(email)) {
      return res.send(
        "❌ Please register with your official college email (" +
        ALLOWED_EMAIL_DOMAINS.map(d => "@" + d).join(" or ") + ")"
      );
    }

    const emailTaken = await User.findOne({ email });
    if (emailTaken) return res.send("❌ An account with this email already exists");

    const rollTaken = await User.findOne({ roll, role: "student" });
    if (rollTaken) return res.send("❌ An account with this roll number already exists");

    const hashedPass = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      roll,
      email,
      mobile,
      department,
      password: hashedPass,
      role: "student",
      // With no mailer configured (local dev), skip OTP so registration still works.
      verified: mailerConfigured ? false : true
    });

    await user.save();

    if (!mailerConfigured) {
      return res.redirect("/student-login?verified=1");
    }

    const sent = await issueOtp(user);
    res.redirect(
      "/auth/verify-otp?roll=" + encodeURIComponent(roll) +
      (sent ? "&sent=1" : "&error=" + encodeURIComponent("Could not send the code — use Resend."))
    );
  } catch (err) {
    res.send("❌ Registration error: " + err.message);
  }
});

/* -------------------------------------------
   OTP VERIFICATION (page + submit + resend)
------------------------------------------- */
router.get("/verify-otp", (req, res) => {
  res.render("verify-otp", {
    roll: String(req.query.roll || ""),
    sent: req.query.sent === "1",
    error: req.query.error || null
  });
});

router.post("/verify-otp", async (req, res) => {
  const roll = String(req.body.roll || "").trim().toUpperCase();
  const otp = String(req.body.otp || "").trim();
  const back = (msg) =>
    res.redirect("/auth/verify-otp?roll=" + encodeURIComponent(roll) + "&error=" + encodeURIComponent(msg));

  try {
    const user = await User.findOne({ roll, role: "student" });
    if (!user) return back("No account found for that roll number.");
    if (user.verified !== false) return res.redirect("/student-login?verified=1");

    if (!user.otpHash || !user.otpExpires || user.otpExpires < new Date()) {
      return back("Code expired — use Resend to get a new one.");
    }
    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      return back("Too many wrong attempts — use Resend to get a new code.");
    }

    if (hashOtp(otp) !== user.otpHash) {
      user.otpAttempts += 1;
      await user.save();
      return back(`Wrong code (${OTP_MAX_ATTEMPTS - user.otpAttempts} attempts left).`);
    }

    user.verified = true;
    user.otpHash = null;
    user.otpExpires = null;
    user.otpAttempts = 0;
    await user.save();

    res.redirect("/student-login?verified=1");
  } catch (err) {
    back("Error: " + err.message);
  }
});

router.post("/resend-otp", async (req, res) => {
  const roll = String(req.body.roll || "").trim().toUpperCase();
  const back = (qs) =>
    res.redirect("/auth/verify-otp?roll=" + encodeURIComponent(roll) + "&" + qs);

  try {
    const user = await User.findOne({ roll, role: "student" });
    if (!user) return back("error=" + encodeURIComponent("No account found for that roll number."));
    if (user.verified !== false) return res.redirect("/student-login?verified=1");

    if (user.otpSentAt && Date.now() - user.otpSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - user.otpSentAt.getTime())) / 1000);
      return back("error=" + encodeURIComponent(`Please wait ${wait}s before requesting another code.`));
    }

    const sent = await issueOtp(user);
    back(sent ? "sent=1" : "error=" + encodeURIComponent("Could not send the code — try again shortly."));
  } catch (err) {
    back("error=" + encodeURIComponent(err.message));
  }
});

module.exports = router;
