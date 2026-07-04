const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');

// middleware: must be logged in
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/student-login');
  next();
}

// Create complaint
router.post('/create', requireLogin, async (req, res) => {
  try {
    const { title, description, category, priority, anonymous } = req.body;

    await Complaint.create({
      title,
      description,
      category,
      priority,
      anonymous: !!anonymous,
      student: req.session.user.id
    });

    res.redirect('/complaint/history');

  } catch (err) {
    res.send("❌ Error: " + err.message);
  }
});

// Complaint History Page
router.get('/history', requireLogin, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      student: req.session.user.id
    }).sort({ createdAt: -1 });

    res.render('history', { complaints });
  } catch (err) {
    res.send("❌ Error: " + err.message);
  }
});

// Delete complaint
router.get('/delete/:id', requireLogin, async (req, res) => {
  try {
    await Complaint.findOneAndDelete({
      _id: req.params.id,
      student: req.session.user.id
    });

    res.redirect('/complaint/history');
  } catch (err) {
    res.send("❌ Error deleting complaint: " + err.message);
  }
});

// Quick Search
router.post('/quick', requireLogin, async (req, res) => {
  try {
    let query = req.body.query?.trim();

    if (!query) return res.send("❌ Please enter a valid search text.");

    const complaints = await Complaint.find({
      student: req.session.user.id,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } }
      ]
    }).sort({ createdAt: -1 });

    res.render('history', { complaints });

  } catch (err) {
    res.send("❌ Quick Search Error: " + err.message);
  }
});

// Quick Lodge
router.post('/quick-lodge', requireLogin, async (req, res) => {
  try {
    const { short } = req.body;

    if (!short || !short.trim()) {
      return res.send("❌ Complaint text cannot be empty.");
    }

    await Complaint.create({
      title: short.substring(0, 40),
      description: short,
      category: "General",
      priority: "Medium",
      anonymous: true,
      student: req.session.user.id
    });

    res.redirect('/complaint/history');

  } catch (err) {
    res.send("❌ Quick Lodge Error: " + err.message);
  }
});

module.exports = router;



