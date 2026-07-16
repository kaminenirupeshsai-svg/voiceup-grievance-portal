const express = require("express");
const router = express.Router();
const path = require("path");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

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
   STUDENT LOGIN
------------------------------------------- */
router.post("/login-student", async (req, res) => {
  const { password } = req.body;
  const email = String(req.body.email || "").trim().toLowerCase();

  const user = await User.findOne({ email, role: "student" });
  if (!user) return res.send("❌ Student not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send("❌ Invalid password");

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
    const { name, roll, department, password, confirm_password } = req.body;
    const email = String(req.body.email || "").trim().toLowerCase();

    if (confirm_password !== undefined && password !== confirm_password) {
      return res.send("❌ Passwords do not match");
    }

    if (!isAllowedEmail(email)) {
      return res.send(
        "❌ Please register with your official college email (" +
        ALLOWED_EMAIL_DOMAINS.map(d => "@" + d).join(" or ") + ")"
      );
    }

    const exists = await User.findOne({ email });
    if (exists) return res.send("❌ User already exists");

    // Hash password
    const hashedPass = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      roll,
      email,
      department,
      password: hashedPass,
      role: "student"
    });

    await user.save();

    res.redirect("/auth/student-login");
  } catch (err) {
    res.send("❌ Registration error: " + err.message);
  }
});

module.exports = router;
