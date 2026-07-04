const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");

// Student Dashboard (Recent 5 complaints)
router.get("/", async (req, res) => {
    if (!req.session.user) return res.redirect("/");

    const complaints = await Complaint.find({ student: req.session.user.id })
        .sort({ createdAt: -1 })
        .limit(5);

    const totalCount = await Complaint.countDocuments({ student: req.session.user.id });
    const resolvedCount = await Complaint.countDocuments({ student: req.session.user.id, status: "Resolved" });
    const pendingCount = await Complaint.countDocuments({ student: req.session.user.id, status: { $in: ["Pending", "In Process", "Escalated"] } });

    res.render("student-dashboard", {
        complaints,
        totalCount,
        resolvedCount,
        pendingCount,
        user: req.session.user,
        role: "student",
        active: "dashboard"
    });
});

module.exports = router;
