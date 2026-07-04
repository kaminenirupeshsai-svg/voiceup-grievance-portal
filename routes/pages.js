const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

router.get("/student-login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/student-login.html"));
});

router.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin-login.html"));
});

router.get("/grievance-login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/grievance-login.html"));
});

module.exports = router;
