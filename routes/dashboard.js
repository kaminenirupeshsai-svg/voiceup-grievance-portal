const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");

// Student Dashboard (Recent 5 complaints)
router.get("/", async (req, res) => {
    if (!req.session.user) return res.redirect("/index.html");

    const complaints = await Complaint.find({ student: req.session.user._id })
        .sort({ createdAt: -1 })
        .limit(5);

    res.render("student-dashboard", { complaints });
});

module.exports = router;
