const express = require("express");
const router = express.Router();
const path = require("path");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

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
  const { email, password } = req.body;

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
  const { email, password } = req.body;

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

  const { email, password } = req.body;

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
   ACCOUNT SETTINGS
------------------------------------------- */
router.get("/account", async (req, res) => {
  if (!req.session.user) return res.redirect("/student-login");

  const user = await User.findById(req.session.user.id || req.session.user._id);
  res.render("account", { user });
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
    const { name, roll, email, department, password } = req.body;

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
