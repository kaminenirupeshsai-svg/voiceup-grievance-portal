const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");

// Officer Dashboard – Complaints forwarded from Grievance Officer
router.get("/dashboard", async (req, res) => {
  try {
    const complaints = await Complaint.find({
      status: "Escalated"
    }).sort({ createdAt: -1 });

    res.render("officer-dashboard", { complaints });
  } catch (error) {
    res.send("❌ Error loading officer dashboard: " + error.message);
  }
});

// Mark complaint as resolved
router.post("/resolve", async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.body.id, {
      status: "Resolved"
    });
    res.redirect("/officer/dashboard");
  } catch (error) {
    res.send("❌ Error resolving complaint: " + error.message);
  }
});

// Officer History Page
router.get("/history", async (req, res) => {
  try {
    const complaints = await Complaint.find({
      status: "Resolved"
    }).sort({ updatedAt: -1 });

    res.render("officer-history", { complaints });
  } catch (err) {
    res.send("❌ Error loading history: " + err.message);
  }
});

module.exports = router;
