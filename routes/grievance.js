const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');

// Grievance Dashboard – Show only relevant complaints
router.get('/dashboard', async (req, res) => {
  try {
    const complaints = await Complaint.find({
      status: { $in: ["Pending", "In Review", "Escalated"] }
    }).sort({ createdAt: -1 });

    res.render('grievance-dashboard', { complaints });
  } catch (err) {
    res.send("❌ Error loading grievance dashboard: " + err.message);
  }
});

// Mark as "In Review"
router.post('/review', async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.body.id, { status: "In Review" });
    res.redirect('/grievance/dashboard');
  } catch (err) {
    res.send("❌ Error updating complaint: " + err.message);
  }
});

// Forward to admin
router.post('/forward', async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.body.id, { status: "Escalated" });
    res.redirect('/grievance/dashboard');
  } catch (err) {
    res.send("❌ Error updating complaint: " + err.message);
  }
});

module.exports = router;
