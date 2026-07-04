const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const requireRole = require('../middleware/requireRole');
const { notifyStudentStatusChange } = require('../utils/notify');

router.use(requireRole('grievance'));

// Grievance Dashboard – Show only complaints awaiting cell action
router.get('/dashboard', async (req, res) => {
  try {
    const complaints = await Complaint.find({
      status: { $in: ["Pending", "In Process"] }
    }).populate('student', 'name email').sort({ createdAt: -1 });

    res.render('grievance-dashboard', { complaints, role: 'grievance', active: 'dashboard' });
  } catch (err) {
    res.send("❌ Error loading grievance dashboard: " + err.message);
  }
});

// Mark as "In Process"
router.post('/review', async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.body.id, { status: "In Process", inProcessAt: new Date() });
    res.redirect('/grievance/dashboard');
  } catch (err) {
    res.send("❌ Error updating complaint: " + err.message);
  }
});

// Forward/escalate to the officer queue
router.post('/forward', async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.body.id,
      { status: "Escalated", escalatedAt: new Date() },
      { new: true }
    ).populate('student', 'email');

    if (complaint) {
      notifyStudentStatusChange(complaint, complaint.student?.email).catch(() => {});
    }

    res.redirect('/grievance/dashboard');
  } catch (err) {
    res.send("❌ Error updating complaint: " + err.message);
  }
});

module.exports = router;
