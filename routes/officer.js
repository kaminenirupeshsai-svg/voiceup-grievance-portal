const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");
const requireRole = require("../middleware/requireRole");
const { notifyStudentStatusChange } = require("../utils/notify");

router.use(requireRole("officer"));

// Officer Dashboard – Complaints forwarded from Grievance Officer
router.get("/dashboard", async (req, res) => {
  try {
    const complaints = await Complaint.find({
      status: "Escalated"
    }).populate("student", "name email").sort({ createdAt: -1 });

    res.render("officer-dashboard", { complaints, role: "officer", active: "dashboard" });
  } catch (error) {
    res.send("❌ Error loading officer dashboard: " + error.message);
  }
});

// Complaint details (used by the dashboard's "View" modal)
router.get("/details/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("student", "name email")
      .lean();
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add officer remark
router.post("/remark", async (req, res) => {
  try {
    const { id, remark } = req.body;
    if (!remark || !remark.trim()) return res.redirect("/officer/dashboard");

    const by = req.session.user?.name || "Officer";
    await Complaint.findByIdAndUpdate(id, {
      $push: {
        remarks: { by, role: "Officer", text: remark, at: new Date() },
        history: { by, action: "Remark", note: remark, at: new Date() }
      }
    });
    res.redirect("/officer/dashboard");
  } catch (err) {
    res.send("❌ Error adding remark: " + err.message);
  }
});

// Mark complaint as resolved
router.post("/resolve", async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.body.id,
      { status: "Resolved", resolvedAt: new Date() },
      { new: true }
    ).populate("student", "email");

    if (complaint) {
      notifyStudentStatusChange(complaint, complaint.student?.email).catch(() => {});
    }

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
    }).populate("student", "name email").sort({ updatedAt: -1 });

    res.render("officer-history", { complaints, role: "officer", active: "history" });
  } catch (err) {
    res.send("❌ Error loading history: " + err.message);
  }
});

module.exports = router;
