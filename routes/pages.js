const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

router.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/about.html"));
});

router.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/contact.html"));
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

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
